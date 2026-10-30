export type Theme = "dark" | "light" | "auto";

const KEY = "kesh:theme";
const LIGHT_QUERY = "(prefers-color-scheme: light)";

export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${KEY}");if(t==="auto")t=matchMedia("${LIGHT_QUERY}").matches?"light":"dark";document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){}})()`;

const listeners = new Set<() => void>();

export const getTheme = (): Theme => {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "auto" ? t : "dark";
  } catch {
    return "dark";
  }
};

export const getServerTheme = (): Theme => "dark";

const apply = (theme: Theme) => {
  const resolved = theme === "auto" ? (matchMedia(LIGHT_QUERY).matches ? "light" : "dark") : theme;
  document.documentElement.dataset.theme = resolved;
};

export const subscribeTheme = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const setTheme = (theme: Theme) => {
  try {
    localStorage.setItem(KEY, theme);
  } catch {}
  apply(theme);
  listeners.forEach((listener) => listener());
};

if (typeof window !== "undefined") {
  matchMedia(LIGHT_QUERY).addEventListener("change", () => {
    if (getTheme() === "auto") apply("auto");
  });
}
