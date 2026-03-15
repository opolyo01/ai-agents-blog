import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import MermaidDiagram from "@/components/MermaidDiagram";

type MarkdownProps = {
  content: string;
};

export default function Markdown({ content }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        pre({ children }) {
          return <>{children}</>;
        },
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const language = match?.[1];
          const code = String(children).replace(/\n$/, "");

          if (!language) {
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }

          if (language === "mermaid") {
            return <MermaidDiagram chart={code} />;
          }

          return (
            <div className="code-block my-6 overflow-hidden rounded-2xl border">
              <div className="code-block-header px-4 py-2 text-xs font-medium uppercase tracking-[0.24em]">
                {language}
              </div>
              <SyntaxHighlighter
                language={language}
                style={oneLight}
                customStyle={{
                  margin: 0,
                  padding: "1rem",
                  background: "transparent",
                  fontSize: "0.95rem",
                }}
                wrapLongLines
              >
                {code}
              </SyntaxHighlighter>
            </div>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
