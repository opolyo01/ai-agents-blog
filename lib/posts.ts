import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type PostMeta = {
  title: string;
  date: string;
  slug: string;
  summary: string;
};

const postsDirectory = path.join(process.cwd(), "posts");

export function postExists(slug: string) {
  return fs.existsSync(path.join(postsDirectory, `${slug}.md`));
}

export function getAllPosts(): PostMeta[] {
  const fileNames = fs.readdirSync(postsDirectory).filter((fileName) => fileName.endsWith(".md"));

  const posts = fileNames.map((fileName) => {
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(fileContents);

    return {
      title: data.title,
      date: data.date,
      slug: data.slug,
      summary: data.summary,
    } as PostMeta;
  });

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string) {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);
  const meta = data as PostMeta;

  return {
    meta,
    content: stripDuplicateTitleHeading(content, meta.title),
  };
}

function stripDuplicateTitleHeading(content: string, title: string) {
  const normalizedTitle = title.trim();
  const lines = content.split("\n");

  if (lines[0]?.trim() === `# ${normalizedTitle}`) {
    return lines.slice(1).join("\n").replace(/^\n+/, "");
  }

  return content;
}
