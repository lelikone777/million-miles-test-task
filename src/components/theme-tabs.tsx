"use client";

import type { ReactElement } from "react";
import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "mm-theme";
const THEMES: ThemeMode[] = ["light", "dark", "system"];

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 2.5V5.2" />
        <path d="M12 18.8V21.5" />
        <path d="M2.5 12H5.2" />
        <path d="M18.8 12H21.5" />
        <path d="M5.4 5.4L7.3 7.3" />
        <path d="M16.7 16.7L18.6 18.6" />
        <path d="M18.6 5.4L16.7 7.3" />
        <path d="M7.3 16.7L5.4 18.6" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M15.7 3.6C11.8 4.5 9 8 9 12.1c0 4.7 3.8 8.5 8.5 8.5 2.2 0 4.2-.8 5.7-2.2-1.1.3-2.2.4-3.3.2-4.5-.6-7.8-4.4-7.8-8.9 0-2.3.9-4.4 2.6-6.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="12" rx="2.5" stroke="currentColor" fill="none" />
      <path d="M9 20h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 16.5v3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const themeLabels: Record<ThemeMode, string> = {
  light: "Светлая тема",
  dark: "Темная тема",
  system: "Системная тема",
};

const themeIcons: Record<ThemeMode, ReactElement> = {
  light: <SunIcon />,
  dark: <MoonIcon />,
  system: <SystemIcon />,
};

function getThemeFromDom(): ThemeMode {
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" || attr === "dark" || attr === "system" ? attr : "system";
}

function applyTheme(nextTheme: ThemeMode) {
  document.documentElement.setAttribute("data-theme", nextTheme);
  try {
    localStorage.setItem(STORAGE_KEY, nextTheme);
  } catch {}
}

export function ThemeTabs() {
  const [theme, setTheme] = useState<ThemeMode>("system");

  useEffect(() => {
    let nextTheme: ThemeMode = "system";
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") {
        nextTheme = stored;
      } else {
        nextTheme = getThemeFromDom();
      }
    } catch {
      nextTheme = getThemeFromDom();
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  function onSelect(nextTheme: ThemeMode) {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <div className="theme-switcher" role="tablist" aria-label="Тема оформления">
      {THEMES.map((mode) => {
        const active = mode === theme;
        return (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={themeLabels[mode]}
            title={themeLabels[mode]}
            onClick={() => onSelect(mode)}
            className={`theme-tab ${active ? "is-active" : ""}`}
          >
            {themeIcons[mode]}
          </button>
        );
      })}
    </div>
  );
}
