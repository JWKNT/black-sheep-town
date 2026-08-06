(() => {
  "use strict";

  const MAX_ALL_RESULTS = 500;
  const state = {
    index: null,
    chapter: null,
    scope: "chapter",
    query: "",
    mode: "parallel",
    glossary: null,
    glossaryById: new Map(),
    tooltipCounter: 0,
    cache: new Map(),
    searchToken: 0,
  };

  const elements = {
    chapterCount: document.querySelector("#chapter-count"),
    lineCount: document.querySelector("#line-count"),
    updatedAt: document.querySelector("#updated-at"),
    chapterPicker: document.querySelector("#chapter-picker"),
    chapterButton: document.querySelector("#chapter-menu-button"),
    chapterValue: document.querySelector("#chapter-menu-value"),
    chapterMenu: document.querySelector("#chapter-menu"),
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
    parallelMode: document.querySelector("#parallel-mode"),
    englishMode: document.querySelector("#english-mode"),
    glossaryLink: document.querySelector("#glossary-link"),
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

  function recordIsUnlocked(record, chapterSlug) {
    const chapterPosition = state.index.chapters.findIndex(
      (chapter) => chapter.slug === chapterSlug,
    );
    if (chapterPosition < 0) return false;
    const results = record.requires.map((slug) => {
      const position = state.index.chapters.findIndex((chapter) => chapter.slug === slug);
      return position >= 0 && position <= chapterPosition;
    });
    return record.requireAll ? results.every(Boolean) : results.some(Boolean);
  }

  function glossaryEntry(tipsId, chapterSlug) {
    const group = state.glossaryById.get(Number(tipsId));
    if (!group) return null;
    const record = [...group.records]
      .filter((candidate) => recordIsUnlocked(candidate, chapterSlug))
      .sort((a, b) => b.priority - a.priority)[0];
    return record ? { ...group, record } : null;
  }

  function shortened(value, limit = 220) {
    const text = cleanText(value).replace(/\s+/g, " ").trim();
    return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
  }

  function makeGlossaryTerm(tipsId, visibleText, meta, terms) {
    const entry = glossaryEntry(tipsId, meta.slug);
    if (!entry) {
      const fragment = document.createDocumentFragment();
      appendHighlighted(fragment, visibleText, terms);
      return fragment;
    }

    const link = document.createElement("a");
    link.className = "glossary-term";
    link.href = `glossary.html?chapter=${encodeURIComponent(meta.slug)}#tip-${entry.id}`;
    const tooltipId = `tip-preview-${meta.slug}-${entry.id}-${++state.tooltipCounter}`;
    link.setAttribute("aria-describedby", tooltipId);
    appendHighlighted(link, visibleText, terms);

    const popover = document.createElement("span");
    popover.className = "glossary-popover";
    popover.id = tooltipId;
    popover.setAttribute("role", "tooltip");

    const title = document.createElement("strong");
    title.textContent = entry.enTitle;
    const japanese = document.createElement("span");
    japanese.className = "glossary-popover-japanese";
    japanese.lang = "ja";
    japanese.textContent = `${entry.record.jpTitle}${entry.record.pronunciation ? ` · ${entry.record.pronunciation}` : ""}`;
    const description = document.createElement("span");
    description.className = "glossary-popover-description";
    description.lang = entry.record.enDescription ? "en" : "ja";
    description.textContent = shortened(
      entry.record.enDescription || entry.record.jpDescription,
    );
    const action = document.createElement("span");
    action.className = "glossary-popover-action";
    action.textContent = "Open full glossary entry →";
    popover.append(title, japanese, description, action);
    link.append(popover);
    return link;
  }

  function appendRichText(element, text, terms, meta) {
    const source = String(text || "").replace(/<br\s*\/?>/gi, "\n");
    const tipsPattern = /<tips=(\d+)>([\s\S]*?)<\/tips>/giu;
    let cursor = 0;
    for (const match of source.matchAll(tipsPattern)) {
      appendHighlighted(element, source.slice(cursor, match.index), terms);
      element.append(makeGlossaryTerm(match[1], cleanText(match[2]), meta, terms));
      cursor = match.index + match[0].length;
    }
    appendHighlighted(element, source.slice(cursor), terms);
  }

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Could not load ${path}`);
    return response.json();
  }

  async function loadChapter(slug) {
    if (!state.cache.has(slug)) {
      state.cache.set(
        slug,
        fetchJson(
          `data/chapters/${encodeURIComponent(slug)}.json?v=${encodeURIComponent(state.index.generatedAt)}`,
        ),
      );
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
    if (state.mode === "english") url.searchParams.set("mode", "en");
    else url.searchParams.delete("mode");
    elements.glossaryLink.href = `glossary.html?chapter=${encodeURIComponent(state.chapter)}`;
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function updateReadingMode() {
    document.body.classList.toggle("english-reader-mode", state.mode === "english");
    elements.parallelMode.setAttribute("aria-pressed", String(state.mode === "parallel"));
    elements.englishMode.setAttribute("aria-pressed", String(state.mode === "english"));
  }

  function updateChapterControls() {
    const position = state.index.chapters.findIndex((chapter) => chapter.slug === state.chapter);
    const meta = state.index.chapters[position];
    const incomplete = meta.translatedLines < meta.totalLines ? " · in progress" : "";
    elements.chapterValue.textContent = `${meta.title} · ${number.format(meta.translatedLines)} lines${incomplete}`;
    elements.chapterMenu.querySelectorAll(".chapter-menu-option").forEach((option) => {
      option.setAttribute("aria-selected", String(option.dataset.slug === state.chapter));
    });
    elements.previousChapter.disabled = position <= 0;
    elements.nextChapter.disabled = position >= state.index.chapters.length - 1;
  }

  function chapterOptions() {
    return [...elements.chapterMenu.querySelectorAll(".chapter-menu-option")];
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
    appendRichText(jp.querySelector(".line-text"), line.jp, terms, meta);

    const en = article.querySelector(".english");
    appendHighlighted(en.querySelector(".speaker"), line.se, terms);
    appendRichText(en.querySelector(".line-text"), line.en, terms, meta);
    article.classList.toggle("has-speaker", Boolean(cleanText(line.se)));
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

  function populateChapterMenu() {
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
      const headingId = `chapter-part-${part}`;
      heading.className = "chapter-menu-heading";
      heading.id = headingId;
      heading.textContent = `Part ${part}`;
      group.setAttribute("aria-labelledby", headingId);
      group.append(heading);
      for (const chapter of chapters) {
        const option = document.createElement("button");
        const incomplete = chapter.translatedLines < chapter.totalLines ? " · in progress" : "";
        option.className = "chapter-menu-option";
        option.type = "button";
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", "false");
        option.dataset.slug = chapter.slug;
        option.textContent = `${chapter.title} · ${number.format(chapter.translatedLines)} lines${incomplete}`;
        group.append(option);
      }
      fragment.append(group);
    }
    elements.chapterMenu.append(fragment);
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
      closeChapterMenu({ restoreFocus: true });
      changeChapter(option.dataset.slug);
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
    elements.parallelMode.addEventListener("click", () => {
      state.mode = "parallel";
      updateReadingMode();
      updateUrl();
    });
    elements.englishMode.addEventListener("click", () => {
      state.mode = "english";
      updateReadingMode();
      updateUrl();
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
      [state.index, state.glossary] = await Promise.all([
        fetchJson(`data/index.json?v=${Date.now()}`),
        fetchJson(`data/glossary.json?v=${Date.now()}`),
      ]);
      state.glossaryById = new Map(
        state.glossary.groups.map((group) => [group.id, group]),
      );
      const params = new URLSearchParams(window.location.search);
      const requestedChapter = params.get("chapter");
      state.chapter = chapterMeta(requestedChapter) ? requestedChapter : state.index.chapters[0].slug;
      state.query = params.get("q") || "";
      state.scope = params.get("scope") === "all" ? "all" : "chapter";
      state.mode = params.get("mode") === "en" ? "english" : "parallel";

      elements.search.value = state.query;
      document.querySelector(`input[name="search-scope"][value="${state.scope}"]`).checked = true;
      elements.chapterCount.textContent = number.format(state.index.chapters.length);
      elements.lineCount.textContent = number.format(state.index.translatedLines);
      elements.updatedAt.textContent = state.index.updated;
      updateReadingMode();
      populateChapterMenu();
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
