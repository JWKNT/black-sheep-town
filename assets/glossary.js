(() => {
  "use strict";

  const state = {
    index: null,
    glossary: null,
    progression: null,
    chapter: null,
    query: "",
    order: "vn",
  };

  const elements = {
    chapterPicker: document.querySelector("#glossary-chapter-picker"),
    chapterButton: document.querySelector("#glossary-chapter-button"),
    chapterValue: document.querySelector("#glossary-chapter-value"),
    chapterMenu: document.querySelector("#glossary-chapter-menu"),
    chapterOptions: document.querySelector("#glossary-chapter-options"),
    vnOrder: document.querySelector("#glossary-vn-order"),
    groupOrder: document.querySelector("#glossary-group-order"),
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

  function currentChapterOrder() {
    if (state.order === "group") return state.index.chapters;
    const bySlug = new Map(state.index.chapters.map((chapter) => [chapter.slug, chapter]));
    const ordered = state.progression.vnOrder.map((slug) => bySlug.get(slug)).filter(Boolean);
    const included = new Set(ordered.map((chapter) => chapter.slug));
    return ordered.concat(state.index.chapters.filter((chapter) => !included.has(chapter.slug)));
  }

  function completedChapters(chapterSlug) {
    const completed = new Set();
    const visit = (slug) => {
      const normalized = String(slug || "").toUpperCase();
      if (!normalized || completed.has(normalized)) return;
      completed.add(normalized);
      for (const required of state.progression.chapters[normalized] || []) visit(required);
    };
    visit(chapterSlug);
    return completed;
  }

  function recordIsUnlocked(record) {
    const completed = completedChapters(state.chapter);
    const results = record.requires.map((slug) => completed.has(slug.toUpperCase()));
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
      ? entry.record.pronunciation
      : "";
    article.querySelector(".glossary-jp-description").textContent = entry.record.jpDescription;
    article.querySelector(".glossary-en-description").textContent = entry.record.enDescription;
    article.querySelector(".glossary-unlock").textContent = unlockLabel(entry.record);
    const backLink = article.querySelector(".glossary-back-link");
    const orderQuery = state.order === "group" ? "&order=group" : "";
    backLink.href = `./?chapter=${encodeURIComponent(state.chapter)}&mode=en${orderQuery}`;
    return article;
  }

  function updateUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set("chapter", state.chapter);
    if (state.query) url.searchParams.set("q", state.query);
    else url.searchParams.delete("q");
    if (state.order === "group") url.searchParams.set("order", "group");
    else url.searchParams.delete("order");
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
    return [...elements.chapterOptions.querySelectorAll(".chapter-menu-option")];
  }

  function updateChapterPicker() {
    const chapter = state.index.chapters.find((candidate) => candidate.slug === state.chapter);
    elements.chapterValue.textContent = `Chapter ${chapter.title}`;
    chapterOptions().forEach((option) => {
      option.setAttribute("aria-selected", String(option.dataset.slug === state.chapter));
    });
    elements.vnOrder.setAttribute("aria-pressed", String(state.order === "vn"));
    elements.groupOrder.setAttribute("aria-pressed", String(state.order === "group"));
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

  function makeChapterGroup(label, chapters, id) {
    const group = document.createElement("section");
    group.className = "chapter-menu-group";
    group.setAttribute("role", "group");
    const heading = document.createElement("h3");
    heading.className = "chapter-menu-heading";
    heading.id = id;
    heading.textContent = label;
    group.setAttribute("aria-labelledby", id);
    group.append(heading);
    for (const chapter of chapters) {
      const option = document.createElement("button");
      option.className = "chapter-menu-option";
      option.type = "button";
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", String(chapter.slug === state.chapter));
      option.dataset.slug = chapter.slug;
      option.textContent = `Chapter ${chapter.title}`;
      group.append(option);
    }
    return group;
  }

  function populateChapters() {
    const fragment = document.createDocumentFragment();
    if (state.order === "vn") {
      const chapters = currentChapterOrder();
      const groupSize = Math.ceil(chapters.length / 3);
      for (let start = 0; start < chapters.length; start += groupSize) {
        const end = Math.min(start + groupSize, chapters.length);
        fragment.append(makeChapterGroup(
          `VN order · ${start + 1}–${end}`,
          chapters.slice(start, end),
          `glossary-vn-${start + 1}`,
        ));
      }
      elements.chapterOptions.replaceChildren(fragment);
      updateChapterPicker();
      return;
    }

    const groups = new Map();
    for (const chapter of state.index.chapters) {
      if (!groups.has(chapter.part)) groups.set(chapter.part, []);
      groups.get(chapter.part).push(chapter);
    }
    for (const [part, chapters] of groups) {
      fragment.append(makeChapterGroup(`Part ${part}`, chapters, `glossary-part-${part}`));
    }
    elements.chapterOptions.replaceChildren(fragment);
    updateChapterPicker();
  }

  function setChapterOrder(order) {
    state.order = order;
    populateChapters();
    updateUrl();
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
    elements.chapterOptions.addEventListener("click", (event) => {
      const option = event.target.closest(".chapter-menu-option");
      if (!option) return;
      state.chapter = option.dataset.slug;
      closeChapterMenu({ restoreFocus: true });
      render();
    });
    elements.chapterOptions.addEventListener("keydown", (event) => {
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
    elements.vnOrder.addEventListener("click", () => setChapterOrder("vn"));
    elements.groupOrder.addEventListener("click", () => setChapterOrder("group"));
    let debounce;
    elements.search.addEventListener("input", () => {
      clearTimeout(debounce);
      state.query = elements.search.value;
      debounce = setTimeout(render, 120);
    });
  }

  async function init() {
    try {
      [state.index, state.glossary, state.progression] = await Promise.all([
        fetchJson(`data/index.json?v=${Date.now()}`),
        fetchJson(`data/glossary.json?v=${Date.now()}`),
        fetchJson(`data/scenario-progression.json?v=${Date.now()}`),
      ]);
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("chapter");
      state.order = params.get("order") === "group" ? "group" : "vn";
      state.chapter = chapterPosition(requested) >= 0
        ? requested
        : currentChapterOrder().at(-1).slug;
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
