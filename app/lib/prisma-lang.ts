import type { LanguageFn } from "highlight.js";

const prisma: LanguageFn = (hljs) => ({
  name: "Prisma",
  keywords: {
    keyword: "model enum datasource generator type view",
    type: "String Int BigInt Float Decimal Boolean DateTime Json Bytes Unsupported",
    literal: "true false null",
  },
  contains: [
    hljs.C_LINE_COMMENT_MODE,
    hljs.QUOTE_STRING_MODE,
    hljs.NUMBER_MODE,
    { scope: "meta", match: /@@?[\w.]+/ },
    {
      begin: [/\b(?:model|enum|datasource|generator|type|view)/, /\s+/, /\w+/],
      beginScope: { 1: "keyword", 3: "title.class" },
    },
  ],
});

export default prisma;
