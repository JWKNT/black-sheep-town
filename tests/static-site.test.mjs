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
    "reader-portrait-stage",
    "theme-toggle",
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /lang="ja"/);
  assert.match(html, /lang="en"/);
  assert.match(html, /assets\/app\.js\?v=/);
  assert.match(html, /src="https:\/\/jehlp\.net\/site-theme\/v2\/theme\.js"/);
  assert.match(html, /href="https:\/\/jehlp\.net\/site-theme\/v2\/reader\.css"/);
  assert.match(html, /data-theme-toggle[^>]*>◐<\/button>/);
  assert.match(html, /id="result-status"[^>]*hidden/);
});

test("hidden character quiz contains 50 four-choice questions and is not linked from the main site", async () => {
  const quizHtml = await readFile(new URL("quiz/index.html", root), "utf8");
  const quizJs = await readFile(new URL("quiz/quiz.js", root), "utf8");
  const quizCss = await readFile(new URL("quiz/quiz.css", root), "utf8");
  assert.match(quizHtml, /Which <cite>Black Sheep Town<\/cite> character are you\?/);
  assert.doesNotMatch(quizHtml, /scientifically dubious|Fifty questions|8 minutes|Spoiler-light|Enter the City/);
  assert.match(quizHtml, />Start quiz<\/button>/);
  assert.match(quizHtml, /id="result-portrait"/);
  assert.match(quizJs, /questions\.length !== 50/);
  assert.match(quizJs, /question\.options\.length !== 4/);
  assert.equal((quizJs.match(/\bq\("/g) || []).length, 50);
  assert.equal((quizJs.match(/result\("/g) || []).length, 16);
  assert.match(quizJs, /A group project is due tonight/);
  assert.match(quizJs, /A family obligation and a close friend's important event/);
  assert.match(quizCss, /\.result-portrait-frame/);
  assert.match(quizCss, /--quiz-blue:\s*var\(--blue/);
  assert.match(quizCss, /\.question-panel h1\s*\{[^}]*font-size:\s*clamp\(21px/s);
  assert.doesNotMatch(quizCss, /--quiz-(?:red|gold)|#d83a52|#a91f38|#e5ad35/i);
  const portraits = [...quizJs.matchAll(/"(assets\/vn\/portraits\/[^"']+\.webp)"/g)];
  assert.equal(portraits.length, 16);
  for (const [, portrait] of portraits) {
    await readFile(new URL(portrait, root));
  }
  for (const page of ["index.html", "glossary.html", "tools.html"]) {
    const html = await readFile(new URL(page, root), "utf8");
    assert.doesNotMatch(html, /(?:href|src)=["'][^"']*quiz/i, `${page} links to the hidden quiz`);
  }
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
    "theme-toggle",
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /assets\/glossary\.js\?v=/);
  assert.match(html, /src="https:\/\/jehlp\.net\/site-theme\/v2\/theme\.js"/);
  assert.match(html, /data-theme-toggle[^>]*>◐<\/button>/);
  assert.match(html, /class="glossary-jp-description" lang="ja"/);
  assert.match(html, /class="glossary-en-description" lang="en"/);
  assert.doesNotMatch(html, /class="glossary-id"/);
  assert.doesNotMatch(html, /glossary-entry-footer|glossary-unlock|glossary-back-link/);
});

test("tools page exposes verified patch and hooker downloads", async () => {
  const html = await readFile(new URL("tools.html", root), "utf8");
  assert.match(html, /href="\.\/">Reader<\/a>/);
  assert.match(html, /href="glossary\.html">Glossary<\/a>/);
  assert.match(html, /href="tools\.html" aria-current="page">Tools<\/a>/);
  assert.match(html, /bst-english-patcher-v1\.0\.16\/BLACK-SHEEP-TOWN-English-Patcher-v1\.0\.16-Core\.zip/);
  assert.match(html, /bst-english-patcher-v1\.0\.16\/BLACK-SHEEP-TOWN-English-Patcher-v1\.0\.16-Full-Payload\.zip/);
  assert.match(html, /bst-text-hooker-v1\.0\.3\/BST-Text-Hooker-v1\.0\.3\.zip/);
  assert.doesNotMatch(html, /HASH_PENDING/);
  assert.match(html, /ff03aa4e0f338f350974c465a086c7fa38d8bc9a7b37287f020bb22b7ca16965/);
  assert.match(html, /0be24fd11bae571c94852a54dca2f086cea653027e643d9cf7393dfcb62bdbe6/);
  assert.match(html, /a5432fac05dd3b5076cb6c1f73ac35b361d2be24ff9612d1dbaad36c83200ecf/);
  assert.match(html, /src="https:\/\/jehlp\.net\/site-theme\/v2\/theme\.js"/);
  assert.match(html, /data-theme-toggle[^>]*>◐<\/button>/);
});

test("complete patch payload contains the technically audited English asset", async () => {
  const manifest = JSON.parse(await readFile(
    new URL("tools/bst-complete-patcher/payload/english-sharedassets0/manifest.json", root),
    "utf8",
  ));
  assert.equal(
    manifest.target_sha256,
    "c1e6f05c5bbbd4f408245c47a595e840a5b3b857ae824bfd77300d2e28db1f2a",
  );
  const existingHookManifest = JSON.parse(await readFile(
    new URL(
      "tools/bst-complete-patcher/payload/patched-game-assembly-existing-hook/manifest.json",
      root,
    ),
    "utf8",
  ));
  assert.equal(
    existingHookManifest.source_sha256,
    "02259b4974560eca2de6e49d0837ab0dbd56c0b3fdbdf84ddf6d85bd9cebf66c",
  );
  assert.equal(
    existingHookManifest.target_sha256,
    "533972af488cada3246333c5921d8e28d1e2c5ece7effe1b5cc9479dd2672abd",
  );
  const previousPatchManifest = JSON.parse(await readFile(
    new URL(
      "tools/bst-complete-patcher/payload/patched-game-assembly-v1.0.3/manifest.json",
      root,
    ),
    "utf8",
  ));
  assert.equal(
    previousPatchManifest.source_sha256,
    "71af44505f02ee81c97f81806be283d61b8f59174aba82b1ad17f4f99dda469d",
  );
  assert.equal(previousPatchManifest.target_sha256, existingHookManifest.target_sha256);
  const primaryRuntimeManifest = JSON.parse(await readFile(
    new URL(
      "tools/bst-complete-patcher/payload/patched-game-assembly/manifest.json",
      root,
    ),
    "utf8",
  ));
  assert.equal(
    primaryRuntimeManifest.target_sha256,
    "0c41f57ff8b4943fba15cef3ab810b84f978f76f74f03081f2107475fb4708af",
  );
  const installer = await readFile(
    new URL("tools/bst-complete-patcher/install_bst_patch.py", root),
    "utf8",
  );
  assert.match(installer, /def update_installed\(/);
  assert.match(installer, /require_rollback/);
  assert.match(installer, /legacy_layout/);
  assert.match(installer, /def parse_dragged_path\(/);
  assert.match(installer, /6348 active portrait rows verified/);
  assert.match(installer, /30777 dialogue rows verified/);
  assert.match(installer, /ExitProcess\(42\)/);
  assert.match(installer, /BSTGame\.exe/);
  assert.match(installer, /build-resolved-language-switch/);
  const nativePatcher = await readFile(
    new URL("tools/bst-complete-patcher/patch_native_runtime.py", root),
    "utf8",
  );
  assert.match(nativePatcher, /find_language_callback_tail/);
  assert.match(nativePatcher, /find_import_iat_va/);
  assert.match(nativePatcher, /patch_tips_close_fallback/);
  assert.match(nativePatcher, /Finalize every Tips close synchronously/);
  assert.match(nativePatcher, /patch_tips_nested_open_guard/);
  assert.match(nativePatcher, /Keep the original story status when a Tips link is clicked repeatedly/);
  assert.match(installer, /bst-complete-patch-v1\.0\.16/);
});

test("generated chapter index agrees with its chapter files", async () => {
  const dataRoot = new URL("data/", root);
  const index = JSON.parse(await readFile(new URL("index.json", dataRoot), "utf8"));
  const files = await readdir(new URL("chapters/", dataRoot));

  assert.equal(index.chapters.length, 63);
  assert.equal(files.filter((name) => name.endsWith(".json")).length, index.chapters.length);
  assert.equal(index.chapters[0].title, "YS's Successor");
  assert.equal(index.chapters.find((chapter) => chapter.slug === "X10").title, "The Adventures of Tomas Liao");
  assert.ok(index.chapters.every((chapter) => chapter.title !== chapter.slug));

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
  assert.equal(lineById.get("F1:0312")?.se, "");
  assert.equal(
    [...lineById.values()].filter((line) => line.se).length,
    9106,
  );

  assert.equal(
    lineById.get("x1:0156")?.en,
    "A single groove ran across his exposed forehead.",
  );
  assert.match(lineById.get("x1:0157")?.en || "", /no ordinary groove/);
  assert.match(lineById.get("x1:0159")?.en || "", /<tips=16>Type A<\/tips>/);
  assert.match(lineById.get("E1:0024")?.en || "", /At birth, however, she was biologically male/);

  assert.equal(lineById.get("A2-2:0299")?.se, "Kenjirou Shio");
  assert.equal(lineById.get("A3:0040")?.se, "Xie Liang");
  assert.equal(lineById.get("A3:0051")?.se, "Xie Liang");
  assert.equal(lineById.get("B1:0718")?.se, "Kenjirou Shio");
  assert.equal(lineById.get("X3-2:0842")?.se, "Liao Zhiming");
  assert.equal(lineById.get("x12:0152")?.se, "Konta Tanaka");
  assert.equal(lineById.get("X15-1:0162")?.se, "Honda");
  assert.equal(lineById.get("A5:0068")?.se, "Xie Liang");
  assert.equal(lineById.get("E4:0255")?.se, "Kuniaki Roji");
  for (const narratorOrAmbiguous of [
    "E5:0438",
    "G2:0410",
    "X13:0605",
  ]) {
    assert.equal(lineById.get(narratorOrAmbiguous)?.se, "");
  }
});

test("repository JSON is pretty-printed for review", async () => {
  const jsonFiles = [
    new URL("package.json", root),
    new URL("data/index.json", root),
    new URL("data/glossary.json", root),
    new URL("data/scenario-progression.json", root),
    new URL("data/art-manifest.json", root),
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
  assert.deepEqual(progression.vnOrder, [
    "X1", "A1", "B1", "A2-1", "A2-2", "E1", "E2", "X2-1", "X2-2", "C1",
    "A3", "B2", "E3", "A4", "D1", "F1", "F2", "F3", "E4", "A5", "D2",
    "X3-1", "X3-2", "X3-3", "C2", "X6-1", "X6-2", "X7", "X4", "G1", "G2",
    "G3", "X8", "X9", "X10", "A6", "C3", "E5", "B3-1", "B3-2", "F4", "B4-1",
    "B4-2", "X11", "C4", "E6", "E7", "D3", "A7", "B5", "X14", "X19", "X12",
    "B6", "X15-1", "X15-2", "X18", "D5", "F5", "A8", "X13", "X16", "X17",
  ]);
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
  assert.match(app, /close\.className = "glossary-popover-close"/);
  assert.match(app, /term\.classList\.add\("is-dismissed"\)/);
  assert.doesNotMatch(app, /glossary-popover-action/);
  assert.doesNotMatch(app, /glossary-popover-japanese/);
  assert.match(app, /function currentChapterOrder/);
  assert.match(app, /elements\.endNextChapter\.addEventListener/);
  assert.match(app, /function makeBackgroundFigure/);
  assert.match(app, /function makePortraitCard/);
  assert.match(app, /function changedPortraits/);
  assert.match(app, /function layoutPortraitStage/);
  assert.match(app, /dataset\.anchorLine/);
  assert.match(app, /function nearestOpenTop/);
  assert.match(app, /chapterTitle\.textContent = meta\.title/);
  assert.match(app, /resultStatus\.hidden = terms\.length === 0/);
  assert.doesNotMatch(app, /window\.addEventListener\("scroll", schedulePortraitUpdate/);
  assert.doesNotMatch(app, /\bportraitSignatures\b/);
  assert.doesNotMatch(app, /innerHTML\s*=/);

  const glossary = await readFile(new URL("assets/glossary.js", root), "utf8");
  assert.match(glossary, /function currentChapterOrder/);
  assert.match(glossary, /\.glossary-jp-description/);
  assert.match(glossary, /\.glossary-en-description/);
  assert.doesNotMatch(glossary, /\.glossary-id/);
  assert.doesNotMatch(glossary, /unlockLabel|glossary-unlock|glossary-back-link/);
  assert.doesNotMatch(glossary, /innerHTML\s*=/);
});

test("pages use the shared reader system", async () => {
  const reader = await readFile(new URL("index.html", root), "utf8");
  const glossary = await readFile(new URL("glossary.html", root), "utf8");
  const tools = await readFile(new URL("tools.html", root), "utf8");
  const styles = await readFile(new URL("../site-theme/v2/reader.css", root), "utf8");

  assert.match(reader, /site-theme\/v2\/theme\.js/);
  assert.match(glossary, /site-theme\/v2\/theme\.js/);
  assert.match(tools, /site-theme\/v2\/theme\.js/);
  assert.match(reader, /site-theme\/v2\/reader\.css/);
  assert.match(glossary, /site-theme\/v2\/reader\.css/);
  assert.match(tools, /site-theme\/v2\/reader\.css/);
  assert.match(reader, /data-theme-toggle[^>]*>◐<\/button>/);
  assert.match(glossary, /data-theme-toggle[^>]*>◐<\/button>/);
  assert.match(tools, /data-theme-toggle[^>]*>◐<\/button>/);
  assert.match(styles, /:root\[data-theme="dark"\]/);
  assert.match(styles, /--portrait-start: rgb\(28 31 35 \/ 82%\)/);
});

test("reader visual data resolves to exported game artwork", async () => {
  const manifest = JSON.parse(await readFile(new URL("data/art-manifest.json", root), "utf8"));
  assert.equal(manifest.missingBackgroundLabels.length, 0);
  assert.ok(Object.keys(manifest.backgrounds).length > 300);
  assert.ok(Object.keys(manifest.portraits).length > 300);

  let backgroundChanges = 0;
  let portraitStates = 0;
  const artworkPaths = new Set();
  const chapterFiles = await readdir(new URL("data/chapters/", root));
  for (const file of chapterFiles.filter((name) => name.endsWith(".json"))) {
    const payload = JSON.parse(await readFile(new URL(`data/chapters/${file}`, root), "utf8"));
    for (const line of payload.lines) {
      if (line.bg) {
        backgroundChanges += 1;
        assert.match(line.bg, /^assets\/vn\/backgrounds\/background-[^/]+\.webp$/);
        artworkPaths.add(line.bg);
      }
      for (const portrait of line.p || []) {
        portraitStates += 1;
        assert.match(
          portrait.u,
          /^assets\/vn\/portraits\/portrait-[a-z0-9-]+-f\d{3}-[^/]+\.webp$/,
        );
        assert.ok(["l", "r", "c"].includes(portrait.s));
        assert.ok(["fl", "l", "c", "r", "fr"].includes(portrait.x));
        assert.ok(["t", "m", "b"].includes(portrait.y));
        artworkPaths.add(portrait.u);
      }
    }
  }
  assert.ok(backgroundChanges > 800);
  assert.ok(portraitStates > 20_000);
  const a21 = JSON.parse(await readFile(new URL("data/chapters/A2-1.json", root), "utf8"));
  const firstChrisAppearance = a21.lines.find((line) => line.id === "A2-1:0219");
  assert.ok(
    firstChrisAppearance.p?.some((portrait) => portrait.x === "c"),
    "blank in-game character events must carry into the next translated line",
  );
  await Promise.all([...artworkPaths].map((path) => readFile(new URL(path, root))));
});

test("data builder preserves and validates the site-owned editorial VN order", async () => {
  const builder = await readFile(new URL("tools/build_data.py", root), "utf8");
  assert.match(builder, /def sync_scenario_progression/);
  assert.match(builder, /progression\.get\("vnOrder", \[\]\)/);
  assert.doesNotMatch(builder, /chapter_unlock_and_editorial_reading_order\.md/);
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

test("script rows use the shared ruled layout", async () => {
  const css = await readFile(new URL("../site-theme/v2/reader.css", root), "utf8");
  const app = await readFile(new URL("assets/app.js", root), "utf8");
  assert.match(css, /\.script-line \{[^}]*border-top: 1px solid var\(--line\)/s);
  assert.match(css, /\.script-lines \{[^}]*border-bottom: 1px solid var\(--line-strong\)/s);
  assert.match(css, /\.line-number \{[^}]*align-items: center[^}]*justify-content: center[^}]*font: 11px/s);
  assert.match(css, /\.language-column \{[^}]*justify-content: center/s);
  assert.match(css, /\.language-column\.english \{ border-left: 1px solid var\(--line-strong\); \}/);
  assert.match(css, /\.chapter-menu-options \{[^}]*grid-template-columns: repeat\(3,/s);
  assert.match(css, /\.chapter-end-navigation \{[^}]*display: flex/s);
  assert.match(css, /\.english-reader-mode \.language-column\.japanese \{ display: none; \}/);
  assert.match(css, /\.english-reader-mode \.language-label \{ display: none; \}/);
  assert.match(css, /\.english-reader-mode \.script-lines \{[^}]*width: min\(780px,[^}]*padding: 32px/s);
  assert.match(css, /\.english-reader-mode \.line-text \{[^}]*font-size: 18px[^}]*text-wrap: pretty/s);
  assert.match(css, /\.english-reader-mode \.reader-mobile-portraits \{[^}]*display: flex[^}]*min-height: 158px/s);
  assert.match(css, /\.reader-mobile-portrait img \{[^}]*object-fit: contain[^}]*object-position: center bottom/s);
  assert.match(app, /function makeMobilePortraitStrip\(portraits\)/);
  assert.match(app, /if \(enteringPortraits\.length\) fragment\.append\(makeMobilePortraitStrip\(enteringPortraits\)\)/);
  assert.match(css, /\.line-text \{[^}]*overflow-wrap: normal[^}]*word-break: normal/s);
  assert.match(css, /\.glossary-term:hover \.glossary-popover/);
  assert.match(css, /\.english-reader-mode \.glossary-popover-close \{[^}]*top: 7px[^}]*right: 7px[^}]*display: flex/s);
  assert.match(css, /\.glossary-term\.is-dismissed \.glossary-popover \{ display: none; \}/);
  assert.match(css, /\.glossary-comparison \{[^}]*grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\)/s);
  assert.match(css, /\.glossary-language\.english \{ border-left: 1px solid var\(--line-strong\); \}/);
});
