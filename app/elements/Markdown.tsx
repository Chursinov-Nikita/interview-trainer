import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight, { type Options as HighlightOptions } from "rehype-highlight";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import prisma from "../lib/prisma-lang";

const highlight: HighlightOptions = {
  languages: { bash, css, javascript, json, sql, typescript, xml, prisma },
  aliases: { typescript: ["ts", "tsx"], javascript: ["js", "jsx"], bash: ["sh"], xml: ["html"] },
  detect: false,
};

const components: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

export default function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`md ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeHighlight, highlight]]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
