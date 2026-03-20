import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type PostMeta = {
  title: string;
  date: string;
  slug: string;
  summary: string;
  category: string;
};

const postsDirectory = path.join(process.cwd(), "posts");

export function postExists(slug: string) {
  return findPostPathBySlug(slug) !== null;
}

export function getAllPosts(): PostMeta[] {
  const filePaths = getPostFilePaths(postsDirectory);

  const posts = filePaths.map((fullPath) => {
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(fileContents);
    const category = path.relative(postsDirectory, fullPath).split(path.sep)[0] || "other";

    return {
      title: data.title,
      date: data.date,
      slug: data.slug,
      summary: data.summary,
      category: formatCategory(category),
    } as PostMeta;
  });

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string) {
  const fullPath = findPostPathBySlug(slug);

  if (!fullPath) {
    throw new Error(`Post not found for slug: ${slug}`);
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);
  const category = path.relative(postsDirectory, fullPath).split(path.sep)[0] || "other";
  const meta = {
    ...(data as Omit<PostMeta, "category">),
    category: formatCategory(category),
  } as PostMeta;

  return {
    meta,
    content: stripDuplicateTitleHeading(content, meta.title),
  };
}

function getPostFilePaths(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return getPostFilePaths(fullPath);
    }

    return entry.name.endsWith(".md") ? [fullPath] : [];
  });
}

function findPostPathBySlug(slug: string) {
  const filePaths = getPostFilePaths(postsDirectory);

  for (const fullPath of filePaths) {
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(fileContents);

    if (data.slug === slug) {
      return fullPath;
    }
  }

  return null;
}

function formatCategory(category: string) {
  return category
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function stripDuplicateTitleHeading(content: string, title: string) {
  const normalizedTitle = title.trim();
  const lines = content.split("\n");
  const firstContentLineIndex = lines.findIndex((line) => line.trim().length > 0);

  if (firstContentLineIndex !== -1 && lines[firstContentLineIndex]?.trim() === `# ${normalizedTitle}`) {
    return lines.slice(firstContentLineIndex + 1).join("\n").replace(/^\n+/, "");
  }

  return content;
}
