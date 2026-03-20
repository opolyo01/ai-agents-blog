import Link from "next/link";
import { getAllPosts, type PostMeta } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

export default function HomePage() {
  const posts = getAllPosts();
  const postsByCategory = groupPostsByCategory(posts);
  const categoryEntries = Object.entries(postsByCategory);

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">Engineering Systems Notes</h1>
      <p className="mt-2 text-sm text-gray-500">By {siteConfig.author}</p>
      <p className="mt-3 text-lg text-gray-600">
        Notes on AI agents, trading systems, MCP, developer tooling, and distributed architecture.
      </p>

      <section className="mt-12">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-gray-500">
          Browse by Topic
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Pick a track and explore inside it
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {categoryEntries.map(([category, categoryPosts]) => {
            const meta = getCategoryMeta(category);

            return (
              <section
                key={category}
                className={`rounded-3xl border p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition-transform hover:-translate-y-0.5 ${meta.cardClass}`}
              >
                <p className={`text-sm font-medium uppercase tracking-[0.24em] ${meta.labelClass}`}>
                  {meta.label}
                </p>
                <h3 className={`mt-3 text-2xl font-semibold tracking-tight ${meta.titleClass}`}>
                  {category}
                </h3>
                <p className="mt-3 text-base leading-7 text-gray-600">{meta.description}</p>
                <p className={`mt-6 inline-flex rounded-full px-3 py-1 text-sm ${meta.countClass}`}>
                  {categoryPosts.length} post{categoryPosts.length === 1 ? "" : "s"}
                </p>
                <div className={`mt-6 space-y-5 border-t pt-5 ${meta.dividerClass}`}>
                  {categoryPosts.map((post) => (
                    <article
                      key={`${post.category}-${post.slug}`}
                      className={`border-b pb-5 last:border-b-0 last:pb-0 ${meta.dividerClass}`}
                    >
                      <p className="text-sm text-gray-500">{post.date}</p>
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
                      <p className="mt-2 text-base leading-7 text-gray-700">{post.summary}</p>
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
        "border-sky-200 bg-[linear-gradient(180deg,#f3fbff_0%,#ffffff_62%)]",
      labelClass: "text-sky-700",
      titleClass: "text-slate-950",
      countClass: "bg-sky-100 text-sky-800",
      dividerClass: "border-sky-100",
      linkClass: "hover:text-sky-700",
      arrowClass: "text-sky-300 group-hover:text-sky-700",
    },
    "Messaging Systems": {
      label: "Realtime Infrastructure",
      description:
        "Kafka, Solace, AMPS, trading UI distribution, and the backend patterns that make live systems behave.",
      cardClass:
        "border-amber-200 bg-[linear-gradient(180deg,#fff8ec_0%,#ffffff_62%)]",
      labelClass: "text-amber-700",
      titleClass: "text-slate-950",
      countClass: "bg-amber-100 text-amber-800",
      dividerClass: "border-amber-100",
      linkClass: "hover:text-amber-700",
      arrowClass: "text-amber-300 group-hover:text-amber-700",
    },
    "Health Tech": {
      label: "Majors and Careers",
      description:
        "Health tech, college majors, curriculum strategy, and how technical leverage meets real-world healthcare work.",
      cardClass:
        "border-emerald-200 bg-[linear-gradient(180deg,#f1fbf5_0%,#ffffff_62%)]",
      labelClass: "text-emerald-700",
      titleClass: "text-slate-950",
      countClass: "bg-emerald-100 text-emerald-800",
      dividerClass: "border-emerald-100",
      linkClass: "hover:text-emerald-700",
      arrowClass: "text-emerald-300 group-hover:text-emerald-700",
    },
    Other: {
      label: "Other Notes",
      description: "Additional essays and technical notes that do not fit a primary track yet.",
      cardClass:
        "border-zinc-200 bg-[linear-gradient(180deg,#fafafa_0%,#ffffff_62%)]",
      labelClass: "text-zinc-600",
      titleClass: "text-slate-950",
      countClass: "bg-zinc-100 text-zinc-800",
      dividerClass: "border-zinc-100",
      linkClass: "hover:text-zinc-700",
      arrowClass: "text-zinc-300 group-hover:text-zinc-700",
    },
  };

  return categoryMeta[category] ?? categoryMeta.Other;
}
