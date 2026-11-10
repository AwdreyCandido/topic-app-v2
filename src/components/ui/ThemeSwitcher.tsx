"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { HiSun, HiMoon } from "react-icons/hi2";
export default function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      className="group/theme relative inline-flex h-[3rem] w-14 shrink-0 items-center rounded-full border border-border-strong bg-surface-hover p-[0.3rem] transition-colors duration-300"
      role="switch"
      aria-label="Modo escuro"
      aria-checked={mounted && isDark}
      disabled={!mounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span className="relative grid size-[2.2rem] shrink-0 place-items-center rounded-full bg-surface text-foreground shadow-sm transition-transform duration-300 group-aria-checked/theme:translate-x-[2.6rem]">
        <HiSun
          className="absolute size-[1.4rem] text-warning transition-opacity group-aria-checked/theme:opacity-0"
          aria-hidden="true"
        />
        <HiMoon
          className="absolute size-[1.4rem] text-primary-ink opacity-0 transition-opacity group-aria-checked/theme:opacity-100"
          aria-hidden="true"
        />
      </span>
    </button>
  );
}
