import { Atom, Boxes, Braces, Brain, Code, Database, Globe, Terminal, Triangle, Type } from "lucide-react";
import type { DeckColor, DeckIcon as IconName } from "../lib/types";

export const ICONS: Record<IconName, typeof Atom> = {
  braces: Braces,
  type: Type,
  atom: Atom,
  boxes: Boxes,
  database: Database,
  triangle: Triangle,
  code: Code,
  brain: Brain,
  globe: Globe,
  terminal: Terminal,
};

type Props = { icon: IconName; color?: DeckColor; size?: "sm" | "md" | "lg"; className?: string };

const SIZES = {
  sm: { box: "size-8 rounded-lg", icon: 16 },
  md: { box: "size-10 rounded-[0.625rem]", icon: 20 },
  lg: { box: "size-14 rounded-xl", icon: 26 },
};

export default function DeckIcon({ icon, size = "md", className = "" }: Props) {
  const Icon = ICONS[icon] ?? Code;
  return (
    <span className={`grid shrink-0 place-items-center bg-surface-2 text-text ${SIZES[size].box} ${className}`}>
      <Icon size={SIZES[size].icon} strokeWidth={1.75} />
    </span>
  );
}
