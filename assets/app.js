(() => {
  "use strict";

  const MAX_ALL_RESULTS = 500;
  const state = {
    index: null,
    chapter: null,
    scope: "chapter",
    query: "",
    cache: new Map(),
    searchToken: 0,
  };

  const elements = {
    chapterCount: document.querySelector("#chapter-count"),
    lineCount: document.querySelector("#line-count"),
    updatedAt: document.querySelector("#updated-at"),
    chapterSelect: document.querySelector("#chapter-select"),
    previousChapter: document.querySelector("#previous-chapter"),
    nextChapter: document.querySelector("#next-chapter"),
    search: document.querySelector("#script-search"),
    clearSearch: document.querySelector("#clear-search"),
    chapterTitle: document.querySelector("#chapter-title"),
    chapterProgress: document.querySelector("#chapter-progress"),
    resultStatus: document.querySelector("#result-status"),
    scriptLines: document.querySelector("#script-lines"),
    emptyState: document.querySelector("#empty-state"),
    lineTemplate: document.querySelector("#line-template"),
  };

  const number = new Intl.NumberFormat("en-US");

  function cleanText(value) {
    return String(value || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/^\u3000/, "");
  }

  function searchableText(line) {
    return [line.id, line.sj, line.se, line.jp, line.en]
      .map(cleanText)
      .join("\n")
      .toLocaleLowerCase();
  }

  function queryTerms() {
    return state.query
      .trim()
      .toLocaleLowerCase()
      .split(/\s+/)
      .filter(Boolean);
  }

  function matches(line, terms) {
    if (!terms.length) return true;
    const haystack = searchableText(line);
    return terms.every((term) => haystack.includes(term));
  }

  function appendHighlighted(element, text, terms) {
    const value = cleanText(text);
    if (!terms.length) {
      element.textContent = value;
      return;
    }

    const escaped = [...new Set(terms)]
      .sort((a, b) => b.length - a.length)
      .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const expression = new RegExp(`(${escaped.join("|")})`, "giu");
    let cursor = 0;

    for (const match of value.matchAll(expression)) {
      element.append(document.createTextNode(value.slice(cursor, match.index)));
      const mark = document.createElement("mark");
      mark.textContent = match[0];
      element.append(mark);
      cursor = match.index + match[0].length;
    }
    element.append(document.createTextNode(value.slice(cursor)));
  }

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Could not load ${path}`);
    return response.json();
  }

  async function loadChapter(slug) {
    if (!state.cache.has(slug)) {
      state.cache.set(slug, fetchJson(`data/chapters/${encodeURIComponent(slug)}.json`));
    }
    return state.cache.get(slug);
  }

  function chapterMeta(slug) {
    return state.index.chapters.find((chapter) => chapter.slug === slug);
  }

  function updateUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set("chapter", state.chapter);
    if (state.query) url.searchParams.set("q", state.query);
    else url.searchParams.delete("q");
    if (state.scope === "all") url.searchParams.set("scope", "all");
    else url.searchParams.delete("scope");
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function updateChapterControls() {
    const position = state.index.chapters.findIndex((chapter) => chapter.slug === state.chapter);
    elements.chapterSelect.value = state.chapter;
    elements.previousChapter.disabled = position <= 0;
    elements.nextChapter.disabled = position >= state.index.chapters.length - 1;
  }

  function setChapterHeading(meta) {
    const complete = meta.translatedLines === meta.totalLines;
    elements.chapterTitle.textContent = `Chapter ${meta.title}`;
    elements.chapterProgress.textContent = complete
      ? `${number.format(meta.translatedLines)} translated lines`
      : `${number.format(meta.translatedLines)} of ${number.format(meta.totalLines)} lines translated`;
  }

  function makeLineArticle(line, meta, terms, includeChapter) {
    const article = elements.lineTemplate.content.firstElementChild.cloneNode(true);
    const anchorId = `line-${line.id.replace(":", "-")}`;
    article.id = anchorId;
    article.dataset.chapter = meta.slug;

    const lineNumber = article.querySelector(".line-number");
    lineNumber.href = `?chapter=${encodeURIComponent(meta.slug)}#${anchorId}`;
    lineNumber.textContent = includeChapter ? `${meta.title} · ${line.i}` : String(line.i);
    lineNumber.setAttribute("aria-label", `Link to ${line.id}`);

    const jp = article.querySelector(".japanese");
    appendHighlighted(jp.querySelector(".speaker"), line.sj, terms);
    appendHighlighted(jp.querySelector(".line-text"), line.jp, terms);

    const en = article.querySelector(".english");
    appendHighlighted(en.querySelector(".speaker"), line.se, terms);
    appendHighlighted(en.querySelector(".line-text"), line.en, terms);
    return article;
  }

  function makeChapterDivider(meta, count) {
    const divider = document.createElement("div");
    divider.className = "chapter-divider";
    const title = document.createElement("h3");
    title.textContent = `Chapter ${meta.title}`;
    const detail = document.createElement("span");
    detail.textContent = `${number.format(count)} ${count === 1 ? "match" : "matches"}`;
    divider.append(title, detail);
    return divider;
  }

  function renderGroups(groups, terms, allScope) {
    const fragment = document.createDocumentFragment();
    let shown = 0;
    let total = 0;

    for (const group of groups) {
      total += group.lines.length;
      if (!group.lines.length || shown >= MAX_ALL_RESULTS) continue;
      const remaining = allScope ? MAX_ALL_RESULTS - shown : group.lines.length;
      const visibleLines = group.lines.slice(0, remaining);
      if (allScope) fragment.append(makeChapterDivider(group.meta, group.lines.length));
      for (const line of visibleLines) {
        fragment.append(makeLineArticle(line, group.meta, terms, allScope));
      }
      shown += visibleLines.length;
    }

    elements.scriptLines.replaceChildren(fragment);
    elements.emptyState.hidden = total !== 0;
    elements.scriptLines.hidden = total === 0;
    elements.resultStatus.textContent = total > shown
      ? `${number.format(total)} matches · first ${number.format(shown)} shown`
      : `${number.format(total)} ${total === 1 ? "line" : "lines"}`;
  }

  async function render() {
    const token = ++state.searchToken;
    const terms = queryTerms();
    const allScope = state.scope === "all" && terms.length > 0;
    elements.resultStatus.textContent = allScope ? "Searching all chapters…" : "Loading script…";
    elements.clearSearch.hidden = !state.query;
    elements.search.placeholder = state.scope === "all" ? "Search all chapters" : "Search this chapter";
    updateUrl();

    try {
      if (allScope) {
        const chapters = await Promise.all(state.index.chapters.map(async (meta) => ({
          meta,
          data: await loadChapter(meta.slug),
        })));
        if (token !== state.searchToken) return;
        const groups = chapters.map(({ meta, data }) => ({
          meta,
          lines: data.lines.filter((line) => matches(line, terms)),
        }));
        renderGroups(groups, terms, true);
      } else {
        const meta = chapterMeta(state.chapter);
        const data = await loadChapter(state.chapter);
        if (token !== state.searchToken) return;
        renderGroups([{ meta, lines: data.lines.filter((line) => matches(line, terms)) }], terms, false);
      }

      if (window.location.hash) {
        requestAnimationFrame(() => document.querySelector(window.location.hash)?.scrollIntoView());
      }
    } catch (error) {
      elements.resultStatus.textContent = "Could not load the script.";
      elements.scriptLines.replaceChildren();
      elements.emptyState.hidden = false;
      elements.emptyState.querySelector("h2").textContent = "The script could not be loaded";
      elements.emptyState.querySelector("p").textContent = "Refresh the page to try again.";
      console.error(error);
    }
  }

  async function changeChapter(slug, { scroll = true } = {}) {
    state.chapter = slug;
    const meta = chapterMeta(slug);
    updateChapterControls();
    setChapterHeading(meta);
    await render();
    if (scroll) document.querySelector("#reader-controls").scrollIntoView();
  }

  function populateChapterSelect() {
    const groups = new Map();
    for (const chapter of state.index.chapters) {
      if (!groups.has(chapter.part)) groups.set(chapter.part, []);
      groups.get(chapter.part).push(chapter);
    }

    const fragment = document.createDocumentFragment();
    for (const [part, chapters] of groups) {
      const optgroup = document.createElement("optgroup");
      optgroup.label = `Part ${part}`;
      for (const chapter of chapters) {
        const option = document.createElement("option");
        const incomplete = chapter.translatedLines < chapter.totalLines ? " · in progress" : "";
        option.value = chapter.slug;
        option.textContent = `${chapter.title} · ${number.format(chapter.translatedLines)} lines${incomplete}`;
        optgroup.append(option);
      }
      fragment.append(optgroup);
    }
    elements.chapterSelect.append(fragment);
  }

  function bindEvents() {
    elements.chapterSelect.addEventListener("change", () => changeChapter(elements.chapterSelect.value));
    elements.previousChapter.addEventListener("click", () => {
      const position = state.index.chapters.findIndex((chapter) => chapter.slug === state.chapter);
      if (position > 0) changeChapter(state.index.chapters[position - 1].slug);
    });
    elements.nextChapter.addEventListener("click", () => {
      const position = state.index.chapters.findIndex((chapter) => chapter.slug === state.chapter);
      if (position < state.index.chapters.length - 1) changeChapter(state.index.chapters[position + 1].slug);
    });

    let debounce;
    elements.search.addEventListener("input", () => {
      clearTimeout(debounce);
      state.query = elements.search.value;
      elements.clearSearch.hidden = !state.query;
      debounce = setTimeout(render, 140);
    });
    elements.clearSearch.addEventListener("click", () => {
      elements.search.value = "";
      state.query = "";
      elements.search.focus();
      render();
    });
    document.querySelectorAll('input[name="search-scope"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        state.scope = radio.value;
        render();
      });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "/" && document.activeElement !== elements.search) {
        event.preventDefault();
        elements.search.focus();
      }
    });
  }

  async function init() {
    try {
      state.index = await fetchJson("data/index.json");
      const params = new URLSearchParams(window.location.search);
      const requestedChapter = params.get("chapter");
      state.chapter = chapterMeta(requestedChapter) ? requestedChapter : state.index.chapters[0].slug;
      state.query = params.get("q") || "";
      state.scope = params.get("scope") === "all" ? "all" : "chapter";

      elements.search.value = state.query;
      document.querySelector(`input[name="search-scope"][value="${state.scope}"]`).checked = true;
      elements.chapterCount.textContent = number.format(state.index.chapters.length);
      elements.lineCount.textContent = number.format(state.index.translatedLines);
      elements.updatedAt.textContent = state.index.updated;
      populateChapterSelect();
      bindEvents();
      await changeChapter(state.chapter, { scroll: false });
    } catch (error) {
      elements.chapterTitle.textContent = "Script unavailable";
      elements.resultStatus.textContent = "Could not load the data index.";
      console.error(error);
    }
  }

  init();
})();
