# Black Sheep Town Script Reader

A minimal, searchable Japanese/English reader for the ongoing *Black Sheep Town* machine-assisted fan translation. It includes a clean English-only reading mode and the shipped game glossary with chapter-aware unlock states.

Chapter navigation defaults to VN order: a stable reading sequence that respects the shipped game's scenario prerequisites, with the game's day and time metadata resolving simultaneously available scenes. The chapter menu can switch to the original A–G/X grouping for reference. Both the bilingual comparison and English reader modes use the selected order, including the continue button at the end of each chapter.

The site is plain HTML, CSS, JavaScript, and chapter-split JSON. It has no runtime dependencies and is ready to serve from GitHub Pages.

## Update the translation

Run the data builder against the translation workspace:

```sh
python3 tools/build_data.py ../BST_MTL/work/translation
npm test
```

The builder reads `chapter_manifest.tsv`, copies every row with non-empty English text from `targets_by_sheet/`, and rewrites `data/index.json` plus one JSON file per translated chapter. Generated JSON is pretty-printed so script and glossary data remain reviewable directly on GitHub. It also combines `compiled_export/tips_records.tsv` with the standardized titles in `notes/proper_nouns_names_key_items.md` to produce all 98 glossary groups and their 211 evolving, chapter-gated definitions. Each glossary record is a complete definition; when the game unlocks a higher-priority record, it replaces the earlier definition rather than appending lines to it. `data/scenario-progression.json` mirrors the shipped game's `ScenarioButton.requireScenarios` graph so these variants do not unlock merely because another route appears earlier in the site's chapter menu. Speaker names appear only where the shipped game provides an explicit speaker label; the site does not infer viewpoint, telephone, or off-screen speakers. Newly started chapters appear automatically; chapter completion is calculated from the manifest.

You can also set `BST_TRANSLATION_ROOT` instead of passing the path:

```sh
BST_TRANSLATION_ROOT=/path/to/BST_MTL/work/translation npm run build:data
```

## Local preview

Because the reader fetches chapter JSON, serve the directory over HTTP rather than opening `index.html` directly:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## GitHub Pages

Publish the repository root from the default branch. `.nojekyll` is included, so no Jekyll build is required.

This is an unofficial, noncommercial fan translation. Please support the creators and own a legal Japanese copy of *Black Sheep Town*.
