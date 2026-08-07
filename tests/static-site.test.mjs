import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../", import.meta.url);

test("reader HTML exposes the required controls and regions", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  for (const id of [
    "chapter-menu-button",
    "chapter-menu",
    "chapter-menu-value",
    "chapter-menu-options",
    "vn-order",
    "group-order",
    "previous-chapter",
    "next-chapter",
    "end-next-chapter",
    "script-search",
    "script-lines",
    "line-template",
    "parallel-mode",
    "english-mode",
    "glossary-link",
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /lang="ja"/);
  assert.match(html, /lang="en"/);
  assert.match(html, /assets\/app\.js\?v=/);
});

test("glossary HTML exposes progress, search, and entry regions", async () => {
  const html = await readFile(new URL("glossary.html", root), "utf8");
  for (const id of [
    "glossary-chapter-button",
    "glossary-chapter-menu",
    "glossary-chapter-options",
    "glossary-chapter-value",
    "glossary-vn-order",
    "glossary-group-order",
    "glossary-search",
    "glossary-list",
    "glossary-entry-template",
    "glossary-empty",
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /assets\/glossary\.js\?v=/);
  assert.match(html, /class="glossary-jp-description" lang="ja"/);
  assert.match(html, /class="glossary-en-description" lang="en"/);
  assert.doesNotMatch(html, /class="glossary-id"/);
  assert.doesNotMatch(html, /glossary-entry-footer|glossary-unlock|glossary-back-link/);
});

test("generated chapter index agrees with its chapter files", async () => {
  const dataRoot = new URL("data/", root);
  const index = JSON.parse(await readFile(new URL("index.json", dataRoot), "utf8"));
  const files = await readdir(new URL("chapters/", dataRoot));

  assert.equal(index.chapters.length, 63);
  assert.equal(files.filter((name) => name.endsWith(".json")).length, index.chapters.length);

  let translatedLines = 0;
  const seenIds = new Set();
  for (const chapter of index.chapters) {
    const payload = JSON.parse(
      await readFile(new URL(`chapters/${chapter.slug}.json`, dataRoot), "utf8"),
    );
    assert.deepEqual(payload.chapter, chapter);
    assert.equal(payload.lines.length, chapter.translatedLines);
    assert.equal(chapter.translatedLines, chapter.totalLines);
    for (const [position, line] of payload.lines.entries()) {
      assert.equal(typeof line.id, "string");
      assert.equal(line.i, position + 1);
      assert.equal(typeof line.n, "number");
      assert.equal(typeof line.jp, "string");
      assert.equal(typeof line.en, "string");
      assert.ok(line.jp.length > 0);
      assert.ok(line.en.length > 0);
      for (const field of ["jp", "en"]) {
        const openingTips = line[field].match(/<tips=\d+>/g) || [];
        const closingTips = line[field].match(/<\/tips>/g) || [];
        assert.equal(
          openingTips.length,
          closingTips.length,
          `unbalanced glossary markup in ${line.id} ${field}`,
        );
        if (openingTips.length > 0) {
          assert.ok(
            line[field].replace(/<\/?tips(?:=\d+)?>/g, "").trim().length > 0,
            `empty glossary-marked text in ${line.id} ${field}`,
          );
        }
      }
      assert.ok(!seenIds.has(line.id), `duplicate line ID: ${line.id}`);
      seenIds.add(line.id);
    }
    translatedLines += payload.lines.length;
  }
  assert.equal(translatedLines, index.translatedLines);

  const lineById = new Map();
  for (const chapter of index.chapters) {
    const payload = JSON.parse(
      await readFile(new URL(`chapters/${chapter.slug}.json`, dataRoot), "utf8"),
    );
    for (const line of payload.lines) lineById.set(line.id, line);
  }
  assert.equal(lineById.get("A1:0090")?.se, "");
  assert.equal(lineById.get("A1:0111")?.se, "");
  assert.equal(lineById.get("A1:0232")?.se, "");
  assert.equal(lineById.get("A1:0254")?.se, "");
  assert.equal(lineById.get("A1:0258")?.se, "Michio Mido");
  assert.equal(lineById.get("A6:0801")?.se, "Wong Tianxiang");
  assert.equal(lineById.get("A6:0802")?.se, "Wong Tianming");
  assert.equal(lineById.get("F1:0312")?.se, "Sashen'ka");
});

test("repository JSON is pretty-printed for review", async () => {
  const jsonFiles = [
    new URL("package.json", root),
    new URL("data/index.json", root),
    new URL("data/glossary.json", root),
    new URL("data/scenario-progression.json", root),
  ];
  const chapterFiles = await readdir(new URL("data/chapters/", root));
  jsonFiles.push(...chapterFiles
    .filter((name) => name.endsWith(".json"))
    .map((name) => new URL(`data/chapters/${name}`, root)));

  for (const file of jsonFiles) {
    const source = await readFile(file, "utf8");
    assert.ok(source.split("\n").length > 2, `${file.pathname} is not pretty-printed`);
    assert.match(source, /^\{\n {2}"/);
    assert.doesNotThrow(() => JSON.parse(source));
  }
});

test("generated glossary contains every evolving game record", async () => {
  const dataRoot = new URL("data/", root);
  const index = JSON.parse(await readFile(new URL("index.json", dataRoot), "utf8"));
  const glossary = JSON.parse(await readFile(new URL("glossary.json", dataRoot), "utf8"));
  assert.equal(glossary.groups.length, 98);
  assert.equal(index.glossaryGroups, glossary.groups.length);
  assert.equal(
    glossary.groups.reduce((total, group) => total + group.records.length, 0),
    211,
  );
  for (const group of glossary.groups) {
    assert.equal(typeof group.id, "number");
    assert.ok(group.enTitle.length > 0);
    assert.ok(group.records.length > 0);
    for (const record of group.records) {
      assert.ok(record.requires.length > 0);
      assert.ok(record.jpTitle.length > 0);
      assert.ok(record.jpDescription.length > 0);
      assert.ok(record.enTitle.length > 0);
      assert.ok(record.enDescription.length > 0);
    }
  }

  const greatHoleManju = glossary.groups.find((group) => group.id === 71);
  assert.equal(greatHoleManju.enTitle, "Great Hole Manju");
  assert.equal(greatHoleManju.records.length, 1);
  assert.deepEqual(greatHoleManju.records[0].requires, ["A1"]);
  assert.equal(glossary.groups.find((group) => group.id === 1).enTitle, "Xie Liang");
  assert.equal(glossary.groups.find((group) => group.id === 3).enTitle, "Chris Xie");
});

test("glossary versions follow the game's scenario dependency graph", async () => {
  const dataRoot = new URL("data/", root);
  const index = JSON.parse(await readFile(new URL("index.json", dataRoot), "utf8"));
  const glossary = JSON.parse(await readFile(new URL("glossary.json", dataRoot), "utf8"));
  const progression = JSON.parse(
    await readFile(new URL("scenario-progression.json", dataRoot), "utf8"),
  );

  for (const chapter of index.chapters) {
    assert.ok(chapter.slug in progression.chapters, `missing progression for ${chapter.slug}`);
  }
  for (const [chapter, requirements] of Object.entries(progression.chapters)) {
    for (const required of requirements) {
      assert.ok(required in progression.chapters, `${chapter} requires unknown ${required}`);
    }
  }
  assert.equal(progression.vnOrder.length, Object.keys(progression.chapters).length);
  assert.equal(new Set(progression.vnOrder).size, progression.vnOrder.length);
  assert.deepEqual(progression.vnOrder.slice(0, 5), ["X1", "A1", "B1", "A2-1", "A2-2"]);
  const orderPosition = new Map(progression.vnOrder.map((chapter, position) => [chapter, position]));
  for (const [chapter, requirements] of Object.entries(progression.chapters)) {
    for (const required of requirements) {
      assert.ok(orderPosition.get(required) < orderPosition.get(chapter));
    }
  }

  const completedChapters = (chapter) => {
    const completed = new Set();
    const visit = (slug) => {
      if (completed.has(slug)) return;
      completed.add(slug);
      for (const required of progression.chapters[slug] || []) visit(required);
    };
    visit(chapter);
    return completed;
  };
  const activeRecord = (groupId, chapter) => {
    const completed = completedChapters(chapter);
    return glossary.groups.find((group) => group.id === groupId).records
      .filter((record) => {
        const unlocked = record.requires.map((slug) => completed.has(slug));
        return record.requireAll ? unlocked.every(Boolean) : unlocked.some(Boolean);
      })
      .sort((a, b) => b.priority - a.priority)[0];
  };

  assert.equal(activeRecord(1, "E3").priority, 1);
  assert.equal(activeRecord(1, "A6").priority, 3);
  assert.equal(activeRecord(71, "A1").recordId, 156);
});

test("client rendering treats script text as text, not HTML", async () => {
  const app = await readFile(new URL("assets/app.js", root), "utf8");
  const appendHighlighted = app.slice(
    app.indexOf("function appendHighlighted"),
    app.indexOf("function recordIsUnlocked"),
  );
  assert.match(appendHighlighted, /element\.append\(document\.createTextNode\(value\)\)/);
  assert.doesNotMatch(appendHighlighted, /element\.textContent\s*=\s*value/);
  assert.match(app, /data\/index\.json\?v=/);
  assert.match(app, /data\/glossary\.json\?v=/);
  assert.match(app, /data\/scenario-progression\.json\?v=/);
  assert.match(app, /makeGlossaryTerm/);
  assert.match(app, /description\.textContent = shortened\(entry\.record\.enDescription\)/);
  assert.doesNotMatch(app, /glossary-popover-action/);
  assert.doesNotMatch(app, /glossary-popover-japanese/);
  assert.match(app, /function currentChapterOrder/);
  assert.match(app, /elements\.endNextChapter\.addEventListener/);
  assert.doesNotMatch(app, /innerHTML\s*=/);

  const glossary = await readFile(new URL("assets/glossary.js", root), "utf8");
  assert.match(glossary, /function currentChapterOrder/);
  assert.match(glossary, /\.glossary-jp-description/);
  assert.match(glossary, /\.glossary-en-description/);
  assert.doesNotMatch(glossary, /\.glossary-id/);
  assert.doesNotMatch(glossary, /unlockLabel|glossary-unlock|glossary-back-link/);
  assert.doesNotMatch(glossary, /innerHTML\s*=/);
});

test("data builder synchronizes the editorial VN order", async () => {
  const builder = await readFile(new URL("tools/build_data.py", root), "utf8");
  assert.match(builder, /chapter_unlock_and_editorial_reading_order\.md/);
  assert.match(builder, /def sync_scenario_progression/);
  assert.match(builder, /positions\[requirement\] >= positions\[chapter\]/);
});

test("plain script segments append without erasing glossary terms", async () => {
  const app = await readFile(new URL("assets/app.js", root), "utf8");
  const functionSource = app.slice(
    app.indexOf("function appendHighlighted"),
    app.indexOf("function recordIsUnlocked"),
  );
  const mockDocument = {
    createTextNode(value) {
      return { type: "text", value };
    },
  };
  const appendHighlighted = Function(
    "document",
    "cleanText",
    `"use strict"; ${functionSource}; return appendHighlighted;`,
  )(mockDocument, (value) => String(value));
  const target = {
    nodes: [],
    append(...nodes) {
      this.nodes.push(...nodes);
    },
  };
  const glossaryTerm = { type: "term", value: "Runway Street" };

  appendHighlighted(target, "Despite it being the middle of a weekday, ", []);
  target.append(glossaryTerm);
  appendHighlighted(target, " is bustling.", []);

  assert.deepEqual(target.nodes, [
    { type: "text", value: "Despite it being the middle of a weekday, " },
    glossaryTerm,
    { type: "text", value: " is bustling." },
  ]);
});

test("script rows form a continuous bordered grid", async () => {
  const css = await readFile(new URL("assets/styles.css", root), "utf8");
  assert.match(css, /\.script-line \{[^}]*border: 1px solid var\(--line-strong\)/s);
  assert.match(css, /\.script-line \+ \.script-line \{ border-top: 0; \}/);
  assert.match(css, /\.line-number \{[^}]*border-right: 1px solid var\(--line-strong\)/s);
  assert.match(css, /\.line-number \{[^}]*align-items: center[^}]*justify-content: center[^}]*font: 13px/s);
  assert.match(css, /\.language-column \{[^}]*justify-content: center/s);
  assert.match(css, /\.language-column\.english \{ border-left: 1px solid var\(--line-strong\); \}/);
  assert.match(css, /\.chapter-menu-options \{[^}]*grid-template-columns: repeat\(3,/s);
  assert.match(css, /\.chapter-end-navigation \{[^}]*display: flex/s);
  assert.match(css, /\.english-reader-mode \.language-column\.japanese \{ display: none; \}/);
  assert.match(css, /\.english-reader-mode \.language-label \{ display: none; \}/);
  assert.match(css, /\.english-reader-mode \.script-lines \{[^}]*width: min\(780px,[^}]*padding: 32px/s);
  assert.match(css, /\.english-reader-mode \.line-text \{[^}]*font-size: 18px[^}]*text-wrap: pretty/s);
  assert.match(css, /\.glossary-term:hover \.glossary-popover/);
  assert.match(css, /\.glossary-comparison \{[^}]*grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\)/s);
  assert.match(css, /\.glossary-language\.english \{ border-left: 1px solid var\(--line-strong\); \}/);
});
