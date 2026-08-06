(() => {
  "use strict";

  const state = {
    index: null,
    glossary: null,
    chapter: null,
    query: "",
  };

  const elements = {
    chapterPicker: document.querySelector("#glossary-chapter-picker"),
    chapterButton: document.querySelector("#glossary-chapter-button"),
    chapterValue: document.querySelector("#glossary-chapter-value"),
    chapterMenu: document.querySelector("#glossary-chapter-menu"),
    search: document.querySelector("#glossary-search"),
    count: document.querySelector("#glossary-count"),
    list: document.querySelector("#glossary-list"),
    empty: document.querySelector("#glossary-empty"),
    template: document.querySelector("#glossary-entry-template"),
  };

  const number = new Intl.NumberFormat("en-US");

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Could not load ${path}`);
    return response.json();
  }

  function chapterPosition(slug) {
    return state.index.chapters.findIndex((chapter) => chapter.slug === slug);
  }

  function recordIsUnlocked(record) {
    const current = chapterPosition(state.chapter);
    const results = record.requires.map((slug) => {
      const required = chapterPosition(slug);
      return required >= 0 && required <= current;
    });
    return record.requireAll ? results.every(Boolean) : results.some(Boolean);
  }

  function activeEntry(group) {
    const record = [...group.records]
      .filter(recordIsUnlocked)
      .sort((a, b) => b.priority - a.priority)[0];
    return record ? { ...group, record } : null;
  }

  function unlockedEntries() {
    return state.glossary.groups.map(activeEntry).filter(Boolean);
  }

  function unlockLabel(record) {
    const joiner = record.requireAll ? " + " : " or ";
    return `Unlocked by ${record.requires.join(joiner)}`;
  }

  function matches(entry) {
    const query = state.query.trim().toLocaleLowerCase();
    if (!query) return true;
    return [
      entry.id,
      entry.enTitle,
      entry.record.jpTitle,
      entry.record.pronunciation,
      entry.record.jpDescription,
      entry.record.enDescription,
    ].some((value) => String(value || "").toLocaleLowerCase().includes(query));
  }

  function makeEntry(entry) {
    const article = elements.template.content.firstElementChild.cloneNode(true);
    article.id = `tip-${entry.id}`;
    article.querySelector(".glossary-id").textContent = String(entry.id).padStart(2, "0");
    article.querySelector(".glossary-en-title").textContent = entry.enTitle;
    article.querySelector(".glossary-jp-title").textContent = entry.record.jpTitle;
    article.querySelector(".glossary-reading").textContent = entry.record.pronunciation
      ? ` · ${entry.record.pronunciation}`
      : "";
    const description = article.querySelector(".glossary-description");
    description.textContent = entry.record.enDescription || entry.record.jpDescription;
    description.lang = entry.record.enDescription ? "en" : "ja";
    article.querySelector(".glossary-unlock").textContent = unlockLabel(entry.record);
    const backLink = article.querySelector(".glossary-back-link");
    backLink.href = `./?chapter=${encodeURIComponent(state.chapter)}&mode=en`;
    return article;
  }

  function updateUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set("chapter", state.chapter);
    if (state.query) url.searchParams.set("q", state.query);
    else url.searchParams.delete("q");
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function render() {
    const unlocked = unlockedEntries();
    const visible = unlocked.filter(matches);
    const fragment = document.createDocumentFragment();
    for (const entry of visible) fragment.append(makeEntry(entry));
    elements.list.replaceChildren(fragment);
    elements.list.hidden = visible.length === 0;
    elements.empty.hidden = visible.length !== 0;
    elements.count.textContent = `${number.format(visible.length)} of ${number.format(unlocked.length)} unlocked entries`;
    updateChapterPicker();
    updateUrl();
    if (window.location.hash) {
      requestAnimationFrame(() => document.querySelector(window.location.hash)?.scrollIntoView());
    }
  }

  function chapterOptions() {
    return [...elements.chapterMenu.querySelectorAll(".chapter-menu-option")];
  }

  function updateChapterPicker() {
    const chapter = state.index.chapters.find((candidate) => candidate.slug === state.chapter);
    elements.chapterValue.textContent = `Chapter ${chapter.title}`;
    chapterOptions().forEach((option) => {
      option.setAttribute("aria-selected", String(option.dataset.slug === state.chapter));
    });
  }

  function closeChapterMenu({ restoreFocus = false } = {}) {
    elements.chapterMenu.hidden = true;
    elements.chapterButton.setAttribute("aria-expanded", "false");
    if (restoreFocus) elements.chapterButton.focus();
  }

  function openChapterMenu({ focus = true } = {}) {
    elements.chapterMenu.hidden = false;
    elements.chapterButton.setAttribute("aria-expanded", "true");
    if (focus) {
      const options = chapterOptions();
      (options.find((option) => option.dataset.slug === state.chapter) || options[0])?.focus();
    }
  }

  function populateChapters() {
    const groups = new Map();
    for (const chapter of state.index.chapters) {
      if (!groups.has(chapter.part)) groups.set(chapter.part, []);
      groups.get(chapter.part).push(chapter);
    }
    const fragment = document.createDocumentFragment();
    for (const [part, chapters] of groups) {
      const group = document.createElement("section");
      group.className = "chapter-menu-group";
      group.setAttribute("role", "group");
      const heading = document.createElement("h3");
      const headingId = `glossary-part-${part}`;
      heading.className = "chapter-menu-heading";
      heading.id = headingId;
      heading.textContent = `Part ${part}`;
      group.setAttribute("aria-labelledby", headingId);
      group.append(heading);
      for (const chapter of chapters) {
        const option = document.createElement("button");
        option.className = "chapter-menu-option";
        option.type = "button";
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", "false");
        option.dataset.slug = chapter.slug;
        option.textContent = `Chapter ${chapter.title}`;
        group.append(option);
      }
      fragment.append(group);
    }
    elements.chapterMenu.append(fragment);
    updateChapterPicker();
  }

  function bindEvents() {
    elements.chapterButton.addEventListener("click", () => {
      if (elements.chapterMenu.hidden) openChapterMenu();
      else closeChapterMenu();
    });
    elements.chapterButton.addEventListener("keydown", (event) => {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key) && elements.chapterMenu.hidden) {
        event.preventDefault();
        openChapterMenu();
      }
    });
    elements.chapterMenu.addEventListener("click", (event) => {
      const option = event.target.closest(".chapter-menu-option");
      if (!option) return;
      state.chapter = option.dataset.slug;
      closeChapterMenu({ restoreFocus: true });
      render();
    });
    elements.chapterMenu.addEventListener("keydown", (event) => {
      const options = chapterOptions();
      const position = options.indexOf(document.activeElement);
      if (event.key === "Escape") {
        event.preventDefault();
        closeChapterMenu({ restoreFocus: true });
      } else if (["ArrowDown", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        options[(position + 1) % options.length]?.focus();
      } else if (["ArrowUp", "ArrowLeft"].includes(event.key)) {
        event.preventDefault();
        options[(position - 1 + options.length) % options.length]?.focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        options[0]?.focus();
      } else if (event.key === "End") {
        event.preventDefault();
        options.at(-1)?.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (!elements.chapterPicker.contains(event.target)) closeChapterMenu();
    });
    let debounce;
    elements.search.addEventListener("input", () => {
      clearTimeout(debounce);
      state.query = elements.search.value;
      debounce = setTimeout(render, 120);
    });
  }

  async function init() {
    try {
      [state.index, state.glossary] = await Promise.all([
        fetchJson(`data/index.json?v=${Date.now()}`),
        fetchJson(`data/glossary.json?v=${Date.now()}`),
      ]);
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("chapter");
      state.chapter = chapterPosition(requested) >= 0
        ? requested
        : state.index.chapters.at(-1).slug;
      state.query = params.get("q") || "";
      elements.search.value = state.query;
      populateChapters();
      bindEvents();
      render();
    } catch (error) {
      elements.count.textContent = "Glossary unavailable";
      elements.empty.hidden = false;
      elements.empty.querySelector("h2").textContent = "The glossary could not be loaded";
      elements.empty.querySelector("p").textContent = "Refresh the page to try again.";
      console.error(error);
    }
  }

  init();
})();
