"use client";

import { useEffect, useId, useState } from "react";
import mermaid from "mermaid";

type MermaidDiagramProps = {
  chart: string;
};

mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  securityLevel: "loose",
});

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const id = useId().replaceAll(":", "");
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        const { svg: rendered } = await mermaid.render(`diagram-${id}`, chart);

        if (!cancelled) {
          setSvg(rendered);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <pre className="diagram-fallback overflow-x-auto rounded-2xl border px-4 py-3 text-sm">
        {chart}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="diagram-shell flex min-h-40 items-center justify-center rounded-2xl border">
        Rendering diagram...
      </div>
    );
  }

  return (
    <div
      className="diagram-shell overflow-x-auto rounded-2xl border p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
