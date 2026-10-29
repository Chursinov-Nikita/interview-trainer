import ReactMarkdown from "react-markdown";
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

// Только нужные языки: весь highlight.js весит в разы больше
const highlight: HighlightOptions = {
  languages: { bash, css, javascript, json, sql, typescript, xml, prisma },
  aliases: { typescript: ["ts", "tsx"], javascript: ["js", "jsx"], bash: ["sh"], xml: ["html"] },
  detect: false,
};

export default function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`md ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeHighlight, highlight]]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
