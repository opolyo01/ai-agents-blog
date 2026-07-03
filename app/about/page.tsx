export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">About</h1>
      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
        Oleg Polyakov
        {" · "}
        <a
          href="https://www.linkedin.com/in/opolyakov/"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-gray-300 underline-offset-4 transition-colors hover:text-gray-900 dark:decoration-white/20 dark:hover:text-white"
        >
          LinkedIn
        </a>
      </p>
      <div className="mt-6 space-y-5 text-base leading-8 text-gray-700 dark:text-gray-200 sm:text-lg">
        <p>
          Welcome. This blog is where I write about building real AI systems:
          agents, MCP platforms, context architecture, developer tooling, and the
          infrastructure that makes them work in production.
        </p>
        <p>
          I&apos;ve spent 15+ years building large-scale platforms across fintech,
          trading, and internal engineering systems. Lately, my focus has shifted
          to enterprise AI: reusable skills, model orchestration, workflow
          automation, and practical agent design.
        </p>
        <p>
          If you&apos;re interested in how AI moves from demos to durable systems
          inside real companies, you&apos;ll feel at home here.
        </p>
      </div>

      <section className="mt-10 rounded-3xl border border-gray-200 bg-[linear-gradient(180deg,#fafafa_0%,#ffffff_100%)] px-5 py-6 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">
            Consulting
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Open for work
          </span>
        </div>
        <p className="mt-3 text-base leading-7 text-gray-700 dark:text-gray-200 sm:text-lg sm:leading-8">
          I take on a small number of engagements at a time. I&apos;m most useful to teams building:
        </p>
        <ul className="mt-4 space-y-2 text-base leading-7 text-gray-700 dark:text-gray-200">
          <li>— Enterprise AI systems: agent orchestration, MCP platforms, context architecture</li>
          <li>— Fintech and payments infrastructure: platform design, ledger systems, payment rails</li>
          <li>— Trading and real-time systems: market data, event streaming, low-latency backends</li>
          <li>— Engineering platform strategy: developer tooling, internal platforms, technical roadmaps</li>
        </ul>
        <p className="mt-5 text-base leading-7 text-gray-700 dark:text-gray-200">
          <a
            href="https://www.linkedin.com/in/opolyakov/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-[#9a3412] underline decoration-gray-300 underline-offset-4 transition-colors hover:text-[#7c2d12] dark:text-orange-300 dark:decoration-white/20 dark:hover:text-orange-200"
          >
            Connect on LinkedIn
          </a>
          {" "}to start a conversation.
        </p>
      </section>
    </main>
  );
}
