import PostsBrowser from "@/components/PostsBrowser";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

export default function HomePage() {
  const posts = getAllPosts();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
        Engineering Systems Notes
      </h1>
      <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        By {siteConfig.author}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Available for consulting
        </span>
      </p>
      <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300 sm:text-lg sm:leading-8">
        Notes on AI agents, trading systems, MCP, developer tooling, and distributed architecture.
      </p>

      <PostsBrowser posts={posts} />
    </main>
  );
}
