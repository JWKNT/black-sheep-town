(() => {
  "use strict";

  const storageKey = "bst-reader-theme";
  const darkMedia = window.matchMedia("(prefers-color-scheme: dark)");
  const root = document.documentElement;
  let followsSystem = true;

  function storedTheme() {
    try {
      const value = localStorage.getItem(storageKey);
      return value === "dark" || value === "light" ? value : "";
    } catch {
      return "";
    }
  }

  function updateControls(theme) {
    for (const button of document.querySelectorAll("[data-theme-toggle]")) {
      const isDark = theme === "dark";
      const label = isDark ? "Use light theme" : "Use dark theme";
      button.textContent = isDark ? "☀" : "☾";
      button.setAttribute("aria-pressed", String(isDark));
      button.setAttribute("aria-label", label);
      button.title = label;
    }
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = theme === "dark" ? "#121416" : "#ffffff";
    updateControls(theme);
  }

  const savedTheme = storedTheme();
  followsSystem = !savedTheme;
  applyTheme(savedTheme || (darkMedia.matches ? "dark" : "light"));

  function setupControls() {
    updateControls(root.dataset.theme);
    for (const button of document.querySelectorAll("[data-theme-toggle]")) {
      button.addEventListener("click", () => {
        const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
        followsSystem = false;
        try {
          localStorage.setItem(storageKey, nextTheme);
        } catch {
          // A private or restricted browsing context may deny storage.
        }
        applyTheme(nextTheme);
      });
    }
  }

  const followSystemChange = (event) => {
    if (followsSystem) applyTheme(event.matches ? "dark" : "light");
  };
  if (typeof darkMedia.addEventListener === "function") {
    darkMedia.addEventListener("change", followSystemChange);
  } else if (typeof darkMedia.addListener === "function") {
    darkMedia.addListener(followSystemChange);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupControls, { once: true });
  } else {
    setupControls();
  }
})();
