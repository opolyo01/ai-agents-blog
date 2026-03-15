import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function HomePage() {
  const posts = getAllPosts();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">Agent Engineering Notes</h1>
      <p className="mt-3 text-lg text-gray-600">
        Notes on AI agents, MCP, context files, skills, and developer tooling.
      </p>

      <div className="mt-10 space-y-6">
        {posts.map((post) => (
          <article key={post.slug} className="border-b pb-6">
            <h2 className="text-2xl font-semibold">
              <Link href={`/posts/${post.slug}`}>{post.title}</Link>
            </h2>
            <p className="mt-1 text-sm text-gray-500">{post.date}</p>
            <p className="mt-2 text-gray-700">{post.summary}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
