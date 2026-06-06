#!/usr/bin/env python3
"""
MCP Server for AI/Data Engineering Blog.

Exposes blog posts as a knowledge base that AI assistants can query —
list posts by category, retrieve full content, search by keyword,
and extract code examples from any post.
"""

import json
import re
from pathlib import Path
from typing import Optional

import frontmatter
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, ConfigDict, Field

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

POSTS_DIR = Path(__file__).parent.parent / "posts"
CHARACTER_LIMIT = 25_000


# ---------------------------------------------------------------------------
# FastMCP server
# ---------------------------------------------------------------------------

mcp = FastMCP("blog_mcp")


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _load_post(path: Path) -> dict:
    """Parse a single markdown file and return frontmatter + content."""
    post = frontmatter.load(str(path))
    return {
        "title":    str(post.get("title", "")),
        "date":     str(post.get("date", "")),
        "slug":     str(post.get("slug", path.stem)),
        "summary":  str(post.get("summary", "")),
        "category": str(post.get("category", path.parent.name)),
        "content":  post.content,
        "file_path": str(path.relative_to(POSTS_DIR.parent)),
    }


def _all_posts() -> list[dict]:
    """Load every post from the posts directory tree."""
    posts = []
    for md_file in sorted(POSTS_DIR.rglob("*.md")):
        try:
            posts.append(_load_post(md_file))
        except Exception:
            pass  # skip malformed files
    return posts


def _extract_code_blocks(content: str) -> list[dict]:
    """Return all fenced code blocks with language tag and line number."""
    pattern = re.compile(r"^```(\w*)\n(.*?)^```", re.MULTILINE | re.DOTALL)
    blocks = []
    for i, match in enumerate(pattern.finditer(content)):
        line_number = content[: match.start()].count("\n") + 1
        blocks.append({
            "index":       i,
            "language":    match.group(1) or "text",
            "code":        match.group(2).rstrip(),
            "line_number": line_number,
        })
    return blocks


def _format_post_summary(p: dict) -> str:
    return (
        f"### {p['title']}\n"
        f"- **Slug**: `{p['slug']}`\n"
        f"- **Category**: {p['category']}\n"
        f"- **Date**: {p['date']}\n"
        f"- **Summary**: {p['summary']}\n"
    )


# ---------------------------------------------------------------------------
# Input models
# ---------------------------------------------------------------------------

class ListPostsInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    category: Optional[str] = Field(
        default=None,
        description=(
            "Filter by category name (case-insensitive). "
            "Leave empty to list all posts. "
            "Examples: 'AI Engineering', 'Data Engineering', 'Agents'"
        ),
    )
    limit: int = Field(default=20, ge=1, le=100, description="Maximum number of posts to return.")
    offset: int = Field(default=0, ge=0, description="Number of posts to skip for pagination.")


class GetPostInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    slug: str = Field(
        ...,
        min_length=1,
        description="Post slug as found in the frontmatter (e.g. 'llm-determinism-temperature-explained').",
    )


class SearchPostsInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    query: str = Field(
        ...,
        min_length=2,
        max_length=200,
        description="Keyword or phrase to search for in post titles, summaries, and body content.",
    )
    limit: int = Field(default=10, ge=1, le=50, description="Maximum number of results to return.")


class GetCodeExamplesInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    slug: str = Field(
        ...,
        min_length=1,
        description="Post slug to extract code examples from.",
    )
    language: Optional[str] = Field(
        default=None,
        description="Filter by language tag (e.g. 'python', 'bash', 'javascript'). Leave empty for all languages.",
    )


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

@mcp.tool(
    name="blog_list_categories",
    annotations={
        "title": "List Blog Categories",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def blog_list_categories() -> str:
    """List all available post categories with post counts.

    Returns a markdown summary of every category folder found under the posts
    directory, along with how many posts each category contains.

    Returns:
        str: Markdown-formatted list of categories and their post counts.

    Example output:
        ## Blog Categories

        | Category | Posts |
        |---|---|
        | AI Engineering | 1 |
        | Data Engineering | 1 |
        | Agents | 5 |
    """
    counts: dict[str, int] = {}
    for md_file in POSTS_DIR.rglob("*.md"):
        cat = md_file.parent.name
        counts[cat] = counts.get(cat, 0) + 1

    if not counts:
        return "No posts found. Check that the posts directory exists."

    lines = ["## Blog Categories", "", "| Category | Posts |", "|---|---|"]
    for cat, count in sorted(counts.items()):
        lines.append(f"| {cat} | {count} |")

    return "\n".join(lines)


@mcp.tool(
    name="blog_list_posts",
    annotations={
        "title": "List Blog Posts",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def blog_list_posts(params: ListPostsInput) -> str:
    """List blog posts with optional category filter and pagination.

    Returns post metadata (title, slug, category, date, summary) for each
    matching post. Does NOT return full post content — use blog_get_post for that.

    Args:
        params (ListPostsInput):
            - category (Optional[str]): Filter by category name (case-insensitive).
            - limit (int): Max posts to return, 1–100 (default 20).
            - offset (int): Posts to skip for pagination (default 0).

    Returns:
        str: Markdown-formatted list of posts with pagination info.

        Schema when converted to JSON:
        {
            "total": int,
            "count": int,
            "offset": int,
            "has_more": bool,
            "next_offset": int | null,
            "posts": [{"title", "slug", "category", "date", "summary"}]
        }

    Examples:
        - List all posts: params with category=None
        - List AI Engineering posts: params with category="AI Engineering"
        - Page 2: params with offset=20
    """
    all_posts = _all_posts()

    if params.category:
        filtered = [
            p for p in all_posts
            if p["category"].lower() == params.category.lower()
        ]
    else:
        filtered = all_posts

    total = len(filtered)
    page = filtered[params.offset : params.offset + params.limit]

    if not page:
        msg = f"No posts found"
        if params.category:
            msg += f" in category '{params.category}'"
        if params.offset:
            msg += f" at offset {params.offset}"
        return msg

    has_more = total > params.offset + len(page)
    next_offset = params.offset + len(page) if has_more else None

    lines = [
        f"## Posts{' — ' + params.category if params.category else ''}",
        f"Showing {len(page)} of {total} posts (offset {params.offset})",
        "",
    ]
    for p in page:
        lines.append(_format_post_summary(p))

    if has_more:
        lines.append(f"> **More posts available** — use `offset={next_offset}` to continue.")

    return "\n".join(lines)


@mcp.tool(
    name="blog_get_post",
    annotations={
        "title": "Get Full Blog Post",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def blog_get_post(params: GetPostInput) -> str:
    """Get the full content of a blog post by its slug.

    Returns the complete markdown content of the post including all sections,
    code examples, and explanations. Use blog_list_posts first to find slugs.

    Args:
        params (GetPostInput):
            - slug (str): Post slug from frontmatter (e.g. 'llm-determinism-temperature-explained').

    Returns:
        str: Full post content as markdown, prefixed with frontmatter metadata.
             Returns an error string if no post with that slug is found.

    Examples:
        - Get Spark post: params with slug='spark-for-full-stack-engineers'
        - Get LLM post: params with slug='llm-determinism-temperature-explained'

    Error Handling:
        - Returns "Error: Post not found" with available slugs if slug doesn't match.
    """
    all_posts = _all_posts()
    match = next((p for p in all_posts if p["slug"] == params.slug), None)

    if not match:
        available = ", ".join(f"`{p['slug']}`" for p in all_posts)
        return (
            f"Error: Post not found with slug '{params.slug}'.\n\n"
            f"Available slugs: {available}"
        )

    header = (
        f"# {match['title']}\n"
        f"**Category**: {match['category']} | **Date**: {match['date']}\n\n"
        f"> {match['summary']}\n\n---\n\n"
    )
    full = header + match["content"]

    if len(full) > CHARACTER_LIMIT:
        full = full[:CHARACTER_LIMIT] + (
            f"\n\n> ⚠️ Content truncated at {CHARACTER_LIMIT} characters. "
            "Use blog_get_code_examples to retrieve code blocks separately."
        )

    return full


@mcp.tool(
    name="blog_search_posts",
    annotations={
        "title": "Search Blog Posts",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def blog_search_posts(params: SearchPostsInput) -> str:
    """Search blog posts by keyword across titles, summaries, and body content.

    Case-insensitive full-text search. Returns matching post metadata and a
    snippet showing where the keyword was found. Does NOT return full content —
    use blog_get_post for that.

    Args:
        params (SearchPostsInput):
            - query (str): Keyword or phrase to search for (min 2 chars).
            - limit (int): Max results to return, 1–50 (default 10).

    Returns:
        str: Markdown list of matching posts with match location and snippet.
             Returns "No posts found" if nothing matches.

    Examples:
        - Search for Spark: params with query='spark'
        - Search for temperature: params with query='temperature'
        - Search for code pattern: params with query='VectorAssembler'
    """
    query_lower = params.query.lower()
    all_posts = _all_posts()

    results = []
    for p in all_posts:
        searchable = f"{p['title']} {p['summary']} {p['content']}".lower()
        if query_lower in searchable:
            # Find a short snippet around the first match in content
            idx = p["content"].lower().find(query_lower)
            if idx >= 0:
                start = max(0, idx - 60)
                end = min(len(p["content"]), idx + len(params.query) + 60)
                snippet = "..." + p["content"][start:end].replace("\n", " ") + "..."
            else:
                snippet = p["summary"]
            results.append({**p, "snippet": snippet})

    results = results[: params.limit]

    if not results:
        return f"No posts found matching '{params.query}'."

    lines = [f"## Search Results for '{params.query}'", f"Found {len(results)} post(s)", ""]
    for r in results:
        lines.append(f"### {r['title']}")
        lines.append(f"- **Slug**: `{r['slug']}` | **Category**: {r['category']}")
        lines.append(f"- **Match**: _{r['snippet']}_")
        lines.append("")

    return "\n".join(lines)


@mcp.tool(
    name="blog_get_code_examples",
    annotations={
        "title": "Get Code Examples from Post",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def blog_get_code_examples(params: GetCodeExamplesInput) -> str:
    """Extract all fenced code blocks from a blog post by slug.

    Useful for getting runnable code without loading the entire post.
    Optionally filter by programming language tag.

    Args:
        params (GetCodeExamplesInput):
            - slug (str): Post slug to extract code from.
            - language (Optional[str]): Language tag filter, e.g. 'python', 'bash', 'javascript'.
              Leave empty to return all languages.

    Returns:
        str: JSON array of code blocks, each with:
        [
            {
                "index": int,        # Block number (0-based)
                "language": str,     # Language tag (e.g. "python", "bash")
                "code": str,         # The code content
                "line_number": int   # Approx line number in source file
            }
        ]
        Returns an error string if the post slug is not found.

    Examples:
        - All code from Spark post: slug='spark-for-full-stack-engineers'
        - Python only: slug='llm-determinism-temperature-explained', language='python'
        - Bash commands: slug='spark-for-full-stack-engineers', language='bash'
    """
    all_posts = _all_posts()
    match = next((p for p in all_posts if p["slug"] == params.slug), None)

    if not match:
        available = ", ".join(f"`{p['slug']}`" for p in all_posts)
        return (
            f"Error: Post not found with slug '{params.slug}'.\n\n"
            f"Available slugs: {available}"
        )

    blocks = _extract_code_blocks(match["content"])

    if params.language:
        blocks = [b for b in blocks if b["language"].lower() == params.language.lower()]

    if not blocks:
        msg = f"No code blocks found in '{params.slug}'"
        if params.language:
            msg += f" with language '{params.language}'"
        return msg

    return json.dumps(blocks, indent=2)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    mcp.run()
