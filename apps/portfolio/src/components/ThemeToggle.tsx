"use client";

import { useSyncExternalStore } from "react";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}

const getSnapshot = () => document.documentElement.classList.contains("dark");
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:text-fg"
    >
      {dark ? "Light" : "Dark"}
    </button>
  );
}
