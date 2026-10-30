"use client";
import { Moon, Sun } from "lucide-react";

/**
 * Both icons are always rendered; CSS shows the right one from html[data-theme],
 * so server and client markup match (no hydration mismatch, no flash).
 */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    const apply = () => {
      root.dataset.theme = next;
      try {
        localStorage.setItem("lt_theme", next);
      } catch {}
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (document.startViewTransition && !reduce) document.startViewTransition(apply);
    else apply();
  }
  return (
    <button type="button" className="icon-btn theme-toggle" onClick={toggle} aria-label="Toggle dark mode">
      <Sun size={19} className="theme-toggle__sun" aria-hidden="true" />
      <Moon size={18} className="theme-toggle__moon" aria-hidden="true" />
    </button>
  );
}
