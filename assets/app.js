(() => {
  "use strict";

  const MAX_ALL_RESULTS = 500;
  const state = {
    index: null,
    chapter: null,
    scope: "chapter",
    query: "",
    mode: "parallel",
    order: "vn",
    glossary: null,
    progression: null,
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
    chapterMenuOptions: document.querySelector("#chapter-menu-options"),
    vnOrder: document.querySelector("#vn-order"),
    groupOrder: document.querySelector("#group-order"),
    previousChapter: document.querySelector("#previous-chapter"),
    nextChapter: document.querySelector("#next-chapter"),
    endNextChapter: document.querySelector("#end-next-chapter"),
    endOrderLabel: document.querySelector("#end-order-label"),
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
    portraitStage: document.querySelector("#reader-portrait-stage"),
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
      element.append(document.createTextNode(value));
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

  function recordIsUnlocked(record, chapterSlug) {
    const completed = completedChapters(chapterSlug);
    const results = record.requires.map((slug) => completed.has(slug.toUpperCase()));
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

    const term = document.createElement("span");
    term.className = "glossary-term";
    const link = document.createElement("a");
    link.className = "glossary-term-link";
    const orderQuery = state.order === "group" ? "&order=group" : "";
    link.href = `glossary.html?chapter=${encodeURIComponent(meta.slug)}${orderQuery}#tip-${entry.id}`;
    const tooltipId = `tip-preview-${meta.slug}-${entry.id}-${++state.tooltipCounter}`;
    link.setAttribute("aria-describedby", tooltipId);
    appendHighlighted(link, visibleText, terms);

    const popover = document.createElement("span");
    popover.className = "glossary-popover";
    popover.id = tooltipId;
    popover.setAttribute("role", "tooltip");

    const title = document.createElement("strong");
    title.textContent = entry.enTitle;
    const description = document.createElement("span");
    description.className = "glossary-popover-description";
    description.lang = "en";
    description.textContent = shortened(entry.record.enDescription);
    const close = document.createElement("button");
    close.className = "glossary-popover-close";
    close.type = "button";
    close.setAttribute("aria-label", "Close glossary definition");
    close.textContent = "×";
    close.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      term.classList.add("is-dismissed");
      close.blur();
      link.blur();
    });
    link.addEventListener("focus", () => term.classList.remove("is-dismissed"));
    popover.append(close, title, description);
    term.append(link, popover);
    return term;
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

  function currentChapterOrder() {
    if (state.order === "group") return state.index.chapters;
    const ordered = state.progression.vnOrder
      .map(chapterMeta)
      .filter(Boolean);
    const included = new Set(ordered.map((chapter) => chapter.slug));
    return ordered.concat(state.index.chapters.filter((chapter) => !included.has(chapter.slug)));
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
    if (state.order === "group") url.searchParams.set("order", "group");
    else url.searchParams.delete("order");
    const glossaryOrder = state.order === "group" ? "&order=group" : "";
    elements.glossaryLink.href = `glossary.html?chapter=${encodeURIComponent(state.chapter)}${glossaryOrder}`;
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function updateReadingMode() {
    document.body.classList.toggle("english-reader-mode", state.mode === "english");
    elements.parallelMode.setAttribute("aria-pressed", String(state.mode === "parallel"));
    elements.englishMode.setAttribute("aria-pressed", String(state.mode === "english"));
    schedulePortraitUpdate();
  }

  function updateChapterControls() {
    const chapters = currentChapterOrder();
    const position = chapters.findIndex((chapter) => chapter.slug === state.chapter);
    const meta = chapters[position];
    const previous = chapters[position - 1];
    const next = chapters[position + 1];
    const incomplete = meta.translatedLines < meta.totalLines ? " · in progress" : "";
    elements.chapterValue.textContent = `${meta.title} · ${number.format(meta.translatedLines)} lines${incomplete}`;
    elements.chapterMenu.querySelectorAll(".chapter-menu-option").forEach((option) => {
      option.setAttribute("aria-selected", String(option.dataset.slug === state.chapter));
    });
    elements.previousChapter.disabled = !previous;
    elements.previousChapter.setAttribute(
      "aria-label",
      previous ? `Previous chapter: ${previous.title}` : "No previous chapter",
    );
    elements.nextChapter.disabled = !next;
    elements.nextChapter.setAttribute(
      "aria-label",
      next ? `Next chapter: ${next.title}` : "No next chapter",
    );
    elements.endNextChapter.disabled = !next;
    elements.endNextChapter.textContent = next
      ? `Next: Chapter ${next.title} →`
      : "End of available translation";
    elements.endOrderLabel.textContent = state.order === "vn" ? "VN order" : "Chapter groups";
    elements.vnOrder.setAttribute("aria-pressed", String(state.order === "vn"));
    elements.groupOrder.setAttribute("aria-pressed", String(state.order === "group"));
  }

  function chapterOptions() {
    return [...elements.chapterMenuOptions.querySelectorAll(".chapter-menu-option")];
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
    elements.chapterTitle.textContent = meta.title;
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

  function makeBackgroundFigure(source, lineId) {
    const figure = document.createElement("figure");
    figure.className = "reader-background";
    const image = document.createElement("img");
    image.src = source;
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.width = 1600;
    image.height = 900;
    figure.dataset.beforeLine = lineId;
    figure.append(image);
    return figure;
  }

  function portraitKey(portrait) {
    return `${portrait.u}|${portrait.x}|${portrait.y}`;
  }

  function changedPortraits(current, previous) {
    const prior = new Set(previous.map(portraitKey));
    return current.filter((portrait) => !prior.has(portraitKey(portrait)));
  }

  function makePortraitCard(portrait, lineId) {
    const card = document.createElement("figure");
    card.className = "reader-portrait-card";
    card.dataset.anchorLine = lineId;
    card.dataset.preferredSide = portrait.s || "c";
    card.dataset.gameX = portrait.x || "c";
    card.dataset.gameY = portrait.y || "m";

    const image = document.createElement("img");
    image.src = portrait.u;
    image.alt = "";
    image.decoding = "async";
    image.loading = "lazy";
    image.width = 720;
    image.height = 900;
    card.append(image);
    return card;
  }

  function makeMobilePortraitStrip(portraits) {
    const strip = document.createElement("div");
    strip.className = "reader-mobile-portraits";
    strip.dataset.portraitCount = String(portraits.length);
    if (portraits.length === 1) strip.dataset.portraitSide = portraits[0].s || "c";
    strip.setAttribute("aria-hidden", "true");

    for (const portrait of portraits) {
      const card = document.createElement("figure");
      card.className = "reader-mobile-portrait";
      card.dataset.preferredSide = portrait.s || "c";
      card.dataset.gameX = portrait.x || "c";
      card.dataset.gameY = portrait.y || "m";
      const image = document.createElement("img");
      image.src = portrait.u;
      image.alt = "";
      image.decoding = "async";
      image.loading = "lazy";
      image.width = 720;
      image.height = 900;
      card.append(image);
      strip.append(card);
    }
    return strip;
  }

  function nearestOpenTop(desired, size, limit, occupied) {
    const gap = 18;
    const clamped = Math.max(0, Math.min(desired, limit));
    const candidates = [clamped];
    for (const interval of occupied) {
      candidates.push(interval.top - size - gap, interval.bottom + gap);
    }
    const open = candidates
      .filter((top) => top >= 0 && top <= limit)
      .filter((top) => occupied.every((interval) => (
        top + size + gap <= interval.top || top >= interval.bottom + gap
      )))
      .sort((a, b) => Math.abs(a - desired) - Math.abs(b - desired));
    return open.length ? open[0] : clamped;
  }

  let portraitFrame = 0;

  function layoutPortraitStage() {
    portraitFrame = 0;
    if (state.mode !== "english" || elements.scriptLines.hidden) return;
    const cards = [...elements.portraitStage.querySelectorAll(".reader-portrait-card")];
    if (!cards.length || !cards[0].offsetWidth) return;

    const shellRect = elements.portraitStage.parentElement.getBoundingClientRect();
    const stageHeight = elements.portraitStage.parentElement.scrollHeight;
    const occupied = { l: [], r: [] };
    for (const card of cards) {
      const anchor = document.getElementById(card.dataset.anchorLine);
      if (!anchor) continue;
      const size = card.offsetWidth;
      const limit = Math.max(0, stageHeight - size);
      const verticalBias = card.dataset.gameY === "t"
        ? -size * 0.25
        : card.dataset.gameY === "b" ? size * 0.25 : 0;
      const desired = anchor.getBoundingClientRect().top - shellRect.top + verticalBias;
      const preferred = card.dataset.preferredSide;
      const sides = preferred === "c" ? ["l", "r"] : [preferred === "r" ? "r" : "l"];
      const choices = sides.map((side) => {
        const top = nearestOpenTop(desired, size, limit, occupied[side]);
        return { side, top, distance: Math.abs(top - desired) };
      }).sort((a, b) => a.distance - b.distance || occupied[a.side].length - occupied[b.side].length);
      const choice = choices[0];
      card.classList.toggle("reader-portrait-left", choice.side === "l");
      card.classList.toggle("reader-portrait-right", choice.side === "r");
      card.style.top = `${choice.top}px`;
      occupied[choice.side].push({ top: choice.top, bottom: choice.top + size });
    }
  }

  function schedulePortraitUpdate() {
    if (portraitFrame) return;
    portraitFrame = requestAnimationFrame(layoutPortraitStage);
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
    const portraitFragment = document.createDocumentFragment();
    let shown = 0;
    let total = 0;

    for (const group of groups) {
      total += group.lines.length;
      if (!group.lines.length || shown >= MAX_ALL_RESULTS) continue;
      const remaining = allScope ? MAX_ALL_RESULTS - shown : group.lines.length;
      const visibleLines = group.lines.slice(0, remaining);
      let previousPortraits = [];
      if (allScope) fragment.append(makeChapterDivider(group.meta, group.lines.length));
      for (const line of visibleLines) {
        if (line.bg) fragment.append(makeBackgroundFigure(line.bg, line.id));
        const currentPortraits = Array.isArray(line.p) ? line.p : [];
        const enteringPortraits = changedPortraits(currentPortraits, previousPortraits);
        if (enteringPortraits.length) fragment.append(makeMobilePortraitStrip(enteringPortraits));
        fragment.append(makeLineArticle(line, group.meta, terms, allScope));
        for (const portrait of enteringPortraits) {
          portraitFragment.append(makePortraitCard(portrait, `line-${line.id.replace(":", "-")}`));
        }
        previousPortraits = currentPortraits;
      }
      shown += visibleLines.length;
    }

    elements.scriptLines.replaceChildren(fragment);
    elements.portraitStage.replaceChildren(portraitFragment);
    elements.emptyState.hidden = total !== 0;
    elements.scriptLines.hidden = total === 0;
    elements.resultStatus.textContent = total > shown
      ? `${number.format(total)} matches · first ${number.format(shown)} shown`
      : `${number.format(total)} ${total === 1 ? "line" : "lines"}`;
    schedulePortraitUpdate();
  }

  async function render() {
    const token = ++state.searchToken;
    const terms = queryTerms();
    const allScope = state.scope === "all" && terms.length > 0;
    elements.resultStatus.hidden = terms.length === 0;
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
      elements.resultStatus.hidden = false;
      elements.resultStatus.textContent = "Could not load the script.";
      elements.scriptLines.replaceChildren();
      elements.emptyState.hidden = false;
      elements.emptyState.querySelector("h2").textContent = "The script could not be loaded";
      elements.emptyState.querySelector("p").textContent = "Refresh the page to try again.";
      console.error(error);
    }
  }

  async function changeChapter(slug, { scrollTo = "#reader-controls" } = {}) {
    state.chapter = slug;
    const meta = chapterMeta(slug);
    updateChapterControls();
    setChapterHeading(meta);
    await render();
    if (scrollTo) document.querySelector(scrollTo).scrollIntoView();
  }

  function makeChapterMenuGroup(label, chapters, id) {
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
      const incomplete = chapter.translatedLines < chapter.totalLines ? " · in progress" : "";
      option.className = "chapter-menu-option";
      option.type = "button";
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", String(chapter.slug === state.chapter));
      option.dataset.slug = chapter.slug;
      option.textContent = `${chapter.title} · ${number.format(chapter.translatedLines)} lines${incomplete}`;
      group.append(option);
    }
    return group;
  }

  function populateChapterMenu() {
    const fragment = document.createDocumentFragment();
    if (state.order === "vn") {
      const chapters = currentChapterOrder();
      const groupSize = Math.ceil(chapters.length / 3);
      for (let start = 0; start < chapters.length; start += groupSize) {
        const end = Math.min(start + groupSize, chapters.length);
        fragment.append(makeChapterMenuGroup(
          `VN order · ${start + 1}–${end}`,
          chapters.slice(start, end),
          `chapter-vn-${start + 1}`,
        ));
      }
      elements.chapterMenuOptions.replaceChildren(fragment);
      return;
    }

    const groups = new Map();
    for (const chapter of state.index.chapters) {
      if (!groups.has(chapter.part)) groups.set(chapter.part, []);
      groups.get(chapter.part).push(chapter);
    }

    for (const [part, chapters] of groups) {
      fragment.append(makeChapterMenuGroup(`Part ${part}`, chapters, `chapter-part-${part}`));
    }
    elements.chapterMenuOptions.replaceChildren(fragment);
  }

  function setChapterOrder(order) {
    state.order = order;
    populateChapterMenu();
    updateChapterControls();
    updateUrl();
  }

  function changeChapterBy(offset, options) {
    const chapters = currentChapterOrder();
    const position = chapters.findIndex((chapter) => chapter.slug === state.chapter);
    const target = chapters[position + offset];
    if (target) changeChapter(target.slug, options);
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
    elements.chapterMenuOptions.addEventListener("click", (event) => {
      const option = event.target.closest(".chapter-menu-option");
      if (!option) return;
      closeChapterMenu({ restoreFocus: true });
      changeChapter(option.dataset.slug);
    });
    elements.chapterMenuOptions.addEventListener("keydown", (event) => {
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
    elements.previousChapter.addEventListener("click", () => changeChapterBy(-1));
    elements.nextChapter.addEventListener("click", () => changeChapterBy(1));
    elements.endNextChapter.addEventListener("click", () => {
      changeChapterBy(1, { scrollTo: ".script-heading" });
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
    window.addEventListener("resize", schedulePortraitUpdate);
  }

  async function init() {
    try {
      [state.index, state.glossary, state.progression] = await Promise.all([
        fetchJson(`data/index.json?v=${Date.now()}`),
        fetchJson(`data/glossary.json?v=${Date.now()}`),
        fetchJson(`data/scenario-progression.json?v=${Date.now()}`),
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
      state.order = params.get("order") === "group" ? "group" : "vn";
      if (!chapterMeta(requestedChapter)) state.chapter = currentChapterOrder()[0].slug;

      elements.search.value = state.query;
      document.querySelector(`input[name="search-scope"][value="${state.scope}"]`).checked = true;
      elements.chapterCount.textContent = number.format(state.index.chapters.length);
      elements.lineCount.textContent = number.format(state.index.translatedLines);
      elements.updatedAt.textContent = state.index.updated;
      updateReadingMode();
      populateChapterMenu();
      bindEvents();
      await changeChapter(state.chapter, { scrollTo: null });
    } catch (error) {
      elements.chapterTitle.textContent = "Script unavailable";
      elements.resultStatus.textContent = "Could not load the data index.";
      console.error(error);
    }
  }

  init();
})();
