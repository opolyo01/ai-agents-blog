import Link from "next/link";
import { getAllPosts, type PostMeta } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

export default function HomePage() {
  const posts = getAllPosts();
  const postsByCategory = groupPostsByCategory(posts);
  const categoryEntries = Object.entries(postsByCategory);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
        Engineering Systems Notes
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">By {siteConfig.author}</p>
      <p className="mt-3 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-300 sm:text-lg sm:leading-8">
        Notes on AI agents, trading systems, MCP, developer tooling, and distributed architecture.
      </p>

      <section className="mt-12">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">
          Browse by Topic
        </p>
        <h2 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight sm:text-3xl">
          Pick a track and explore inside it
        </h2>

        <div className="mt-6 flex gap-3 overflow-x-auto pb-2 md:hidden">
          {categoryEntries.map(([category, categoryPosts]) => (
            <a
              key={category}
              href={`#${toAnchorId(category)}`}
              className="shrink-0 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
            >
              {category}
              {" · "}
              {categoryPosts.length}
            </a>
          ))}
        </div>

        <div className="mt-6 space-y-4 md:hidden">
          {categoryEntries.map(([category, categoryPosts], index) => {
            const meta = getCategoryMeta(category);

            return (
              <details
                key={category}
                id={toAnchorId(category)}
                open={index === 0}
                className={`topic-disclosure rounded-3xl border p-5 ${meta.cardClass}`}
              >
                <summary className="cursor-pointer">
                  <p className={`text-xs font-medium uppercase tracking-[0.24em] ${meta.labelClass}`}>
                    {meta.label}
                  </p>
                  <div className="mt-3 flex items-start justify-between gap-4">
                    <div>
                      <h3 className={`text-2xl font-semibold tracking-tight ${meta.titleClass}`}>
                        {category}
                      </h3>
                      <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">
                        {meta.description}
                      </p>
                    </div>
                    <span className={`mt-1 shrink-0 rounded-full px-3 py-1 text-sm ${meta.countClass}`}>
                      {categoryPosts.length}
                    </span>
                  </div>
                </summary>

                <div className={`mt-5 space-y-4 border-t pt-5 ${meta.dividerClass}`}>
                  {categoryPosts.map((post) => (
                    <article
                      key={`${post.category}-${post.slug}`}
                      className={`border-b pb-4 last:border-b-0 last:pb-0 ${meta.dividerClass}`}
                    >
                      <p className="text-sm text-gray-500 dark:text-gray-400">{post.date}</p>
                      <h4 className="mt-2 text-lg font-semibold tracking-tight leading-tight">
                        <Link
                          href={`/posts/${post.slug}`}
                          className={`group inline-flex items-center gap-2 transition-colors ${meta.linkClass}`}
                        >
                          <span>{post.title}</span>
                          <span
                            aria-hidden="true"
                            className={`text-base transition-colors ${meta.arrowClass}`}
                          >
                            ↗
                          </span>
                        </Link>
                      </h4>
                    </article>
                  ))}
                </div>
              </details>
            );
          })}
        </div>

        <div className="mt-6 hidden gap-4 md:grid md:grid-cols-3">
          {categoryEntries.map(([category, categoryPosts]) => {
            const meta = getCategoryMeta(category);

            return (
              <section
                key={category}
                id={toAnchorId(category)}
                className={`rounded-3xl border p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition-transform hover:-translate-y-0.5 ${meta.cardClass}`}
              >
                <p className={`text-sm font-medium uppercase tracking-[0.24em] ${meta.labelClass}`}>
                  {meta.label}
                </p>
                <h3 className={`mt-3 text-2xl font-semibold tracking-tight ${meta.titleClass}`}>
                  {category}
                </h3>
                <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">
                  {meta.description}
                </p>
                <p className={`mt-6 inline-flex rounded-full px-3 py-1 text-sm ${meta.countClass}`}>
                  {categoryPosts.length} post{categoryPosts.length === 1 ? "" : "s"}
                </p>
                <div className={`mt-6 space-y-5 border-t pt-5 ${meta.dividerClass}`}>
                  {categoryPosts.map((post) => (
                    <article
                      key={`${post.category}-${post.slug}`}
                      className={`border-b pb-5 last:border-b-0 last:pb-0 ${meta.dividerClass}`}
                    >
                      <p className="text-sm text-gray-500 dark:text-gray-400">{post.date}</p>
                      <h4 className="mt-2 text-xl font-semibold tracking-tight leading-tight">
                        <Link
                          href={`/posts/${post.slug}`}
                          className={`group inline-flex items-center gap-2 transition-colors ${meta.linkClass}`}
                        >
                          <span>{post.title}</span>
                          <span
                            aria-hidden="true"
                            className={`text-base transition-colors ${meta.arrowClass}`}
                          >
                            ↗
                          </span>
                        </Link>
                      </h4>
                      <p className="mt-2 text-base leading-7 text-gray-700 dark:text-gray-200">
                        {post.summary}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function groupPostsByCategory(posts: PostMeta[]) {
  const preferredOrder = ["Agents", "Messaging Systems", "Health Tech", "Other"];
  const grouped = posts.reduce<Record<string, PostMeta[]>>((acc, post) => {
    if (!acc[post.category]) {
      acc[post.category] = [];
    }

    acc[post.category].push(post);
    return acc;
  }, {});

  return Object.fromEntries(
    Object.entries(grouped).sort(([left], [right]) => {
      const leftIndex = preferredOrder.indexOf(left);
      const rightIndex = preferredOrder.indexOf(right);

      if (leftIndex === -1 && rightIndex === -1) {
        return left.localeCompare(right);
      }

      if (leftIndex === -1) {
        return 1;
      }

      if (rightIndex === -1) {
        return -1;
      }

      return leftIndex - rightIndex;
    }),
  );
}

function getCategoryMeta(category: string) {
  const categoryMeta: Record<
    string,
    {
      label: string;
      description: string;
      cardClass: string;
      labelClass: string;
      titleClass: string;
      countClass: string;
      dividerClass: string;
      linkClass: string;
      arrowClass: string;
    }
  > = {
    Agents: {
      label: "AI Systems",
      description:
        "Agent architecture, skills, MCP, model routing, and the infrastructure around practical AI systems.",
      cardClass:
        "border-sky-200 bg-[linear-gradient(180deg,#f3fbff_0%,#ffffff_62%)] dark:border-sky-500/25 dark:bg-[linear-gradient(180deg,rgba(8,47,73,0.45)_0%,rgba(255,255,255,0.03)_70%)]",
      labelClass: "text-sky-700 dark:text-sky-300",
      titleClass: "text-slate-950 dark:text-white",
      countClass: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200",
      dividerClass: "border-sky-100 dark:border-sky-400/15",
      linkClass: "hover:text-sky-700 dark:hover:text-sky-300",
      arrowClass: "text-sky-300 group-hover:text-sky-700 dark:text-sky-500/70 dark:group-hover:text-sky-300",
    },
    "Messaging Systems": {
      label: "Realtime Infrastructure",
      description:
        "Kafka, Solace, AMPS, trading UI distribution, and the backend patterns that make live systems behave.",
      cardClass:
        "border-amber-200 bg-[linear-gradient(180deg,#fff8ec_0%,#ffffff_62%)] dark:border-amber-500/25 dark:bg-[linear-gradient(180deg,rgba(120,53,15,0.40)_0%,rgba(255,255,255,0.03)_70%)]",
      labelClass: "text-amber-700 dark:text-amber-300",
      titleClass: "text-slate-950 dark:text-white",
      countClass: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
      dividerClass: "border-amber-100 dark:border-amber-400/15",
      linkClass: "hover:text-amber-700 dark:hover:text-amber-300",
      arrowClass: "text-amber-300 group-hover:text-amber-700 dark:text-amber-500/70 dark:group-hover:text-amber-300",
    },
    "Health Tech": {
      label: "Majors and Careers",
      description:
        "Health tech, college majors, curriculum strategy, and how technical leverage meets real-world healthcare work.",
      cardClass:
        "border-emerald-200 bg-[linear-gradient(180deg,#f1fbf5_0%,#ffffff_62%)] dark:border-emerald-500/25 dark:bg-[linear-gradient(180deg,rgba(6,78,59,0.42)_0%,rgba(255,255,255,0.03)_70%)]",
      labelClass: "text-emerald-700 dark:text-emerald-300",
      titleClass: "text-slate-950 dark:text-white",
      countClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
      dividerClass: "border-emerald-100 dark:border-emerald-400/15",
      linkClass: "hover:text-emerald-700 dark:hover:text-emerald-300",
      arrowClass: "text-emerald-300 group-hover:text-emerald-700 dark:text-emerald-500/70 dark:group-hover:text-emerald-300",
    },
    Other: {
      label: "Other Notes",
      description: "Additional essays and technical notes that do not fit a primary track yet.",
      cardClass:
        "border-zinc-200 bg-[linear-gradient(180deg,#fafafa_0%,#ffffff_62%)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_70%)]",
      labelClass: "text-zinc-600 dark:text-zinc-300",
      titleClass: "text-slate-950 dark:text-white",
      countClass: "bg-zinc-100 text-zinc-800 dark:bg-white/10 dark:text-zinc-200",
      dividerClass: "border-zinc-100 dark:border-white/10",
      linkClass: "hover:text-zinc-700 dark:hover:text-zinc-100",
      arrowClass: "text-zinc-300 group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-zinc-100",
    },
  };

  return categoryMeta[category] ?? categoryMeta.Other;
}

function toAnchorId(category: string) {
  return category.toLowerCase().replaceAll(" ", "-");
}
