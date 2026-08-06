import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../", import.meta.url);

test("reader HTML exposes the required controls and regions", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  for (const id of [
    "chapter-select",
    "previous-chapter",
    "next-chapter",
    "script-search",
    "script-lines",
    "line-template",
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /lang="ja"/);
  assert.match(html, /lang="en"/);
});

test("generated chapter index agrees with its chapter files", async () => {
  const dataRoot = new URL("data/", root);
  const index = JSON.parse(await readFile(new URL("index.json", dataRoot), "utf8"));
  const files = await readdir(new URL("chapters/", dataRoot));

  assert.ok(index.chapters.length > 0);
  assert.equal(files.filter((name) => name.endsWith(".json")).length, index.chapters.length);

  let translatedLines = 0;
  const seenIds = new Set();
  for (const chapter of index.chapters) {
    const payload = JSON.parse(
      await readFile(new URL(`chapters/${chapter.slug}.json`, dataRoot), "utf8"),
    );
    assert.deepEqual(payload.chapter, chapter);
    assert.equal(payload.lines.length, chapter.translatedLines);
    assert.ok(chapter.translatedLines <= chapter.totalLines);
    for (const line of payload.lines) {
      assert.equal(typeof line.id, "string");
      assert.equal(typeof line.n, "number");
      assert.equal(typeof line.jp, "string");
      assert.equal(typeof line.en, "string");
      assert.ok(line.jp.length > 0);
      assert.ok(line.en.length > 0);
      assert.ok(!seenIds.has(line.id), `duplicate line ID: ${line.id}`);
      seenIds.add(line.id);
    }
    translatedLines += payload.lines.length;
  }
  assert.equal(translatedLines, index.translatedLines);
});

test("client rendering treats script text as text, not HTML", async () => {
  const app = await readFile(new URL("assets/app.js", root), "utf8");
  assert.match(app, /textContent = value/);
  assert.doesNotMatch(app, /innerHTML\s*=/);
});
