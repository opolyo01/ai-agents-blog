export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">About</h1>
      <p className="mt-3 text-sm text-gray-500">
        Oleg Polyakov
        {" · "}
        <a
          href="https://www.linkedin.com/in/opolyakov/"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-gray-300 underline-offset-4 transition-colors hover:text-gray-900"
        >
          LinkedIn
        </a>
      </p>
      <div className="mt-6 space-y-5 text-lg leading-8 text-gray-700">
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
    </main>
  );
}
