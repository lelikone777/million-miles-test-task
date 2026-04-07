const themeInitScript = `
(() => {
  try {
    const key = "mm-theme";
    const saved = localStorage.getItem(key);
    const valid = saved === "light" || saved === "dark" || saved === "system";
    const theme = valid ? saved : "system";
    document.documentElement.setAttribute("data-theme", theme);
  } catch {}
})();
`;

export function ThemeInitScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />;
}

