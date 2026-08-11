# Black Sheep Town Script Reader

A minimal, searchable Japanese/English reader for the ongoing *Black Sheep Town* machine-assisted fan translation. It includes a clean English-only reading mode and a bilingual version of the shipped game glossary with chapter-aware unlock states.

Chapter navigation defaults to VN order: a content-optimized editorial read-through that preserves every prerequisite in the shipped game's scenario graph while arranging concurrent chapters around chronology, viewpoint reveals, route continuity, and dramatic pacing. The sequence lives beside the prerequisite graph in `data/scenario-progression.json`; every data build validates that it contains all chapters exactly once and never places a chapter before one of its requirements. The chapter menu can switch to the original A–G/X grouping for reference. Both the bilingual comparison and English reader modes use the selected order, including the continue button at the end of each chapter.

The site is plain HTML, CSS, JavaScript, and chapter-split JSON. It has no runtime dependencies and is ready to serve from GitHub Pages.

The repository also includes a [one-click complete game patcher](tools/bst-complete-patcher/README.md) that converts a verified fresh Japanese Windows installation into the current English/JP build without distributing the original game. A separate [BST-specific text hooker](tools/bst-text-hooker/README.md) captures UTAGE dialogue, narration, and selection text that generic Windows text hooks miss.

## Update the translation

Run the data builder against the translation workspace:

```sh
../BST_MTL/work/.venv/bin/python tools/export_reader_art.py --bst-root ../BST_MTL
python3 tools/build_data.py ../BST_MTL/work/translation
npm test
```

The art exporter reconstructs the shipped game's UTAGE dicing atlases and writes only scenario-used backgrounds and portraits as web-sized WebP files. Generated filenames retain the original scene label or the standardized English character name plus its source variant ID, and portraits share a stable 720×900 canvas. The builder reads `chapter_manifest.tsv`, copies every row with non-empty English text from `targets_by_sheet/`, and rewrites `data/index.json` plus one JSON file per translated chapter. It replays every shipped-game visual event—including portrait entrances and moves on non-dialogue rows—so English Reader Mode inserts backgrounds at their original changes and anchors a permanent, individual square portrait beside the corresponding prose whenever the game changes that portrait. These are document annotations rather than viewport-following UI: they remain beside the same passage when the page scrolls and can be printed with the prose. Nearby cards are shifted to the closest open space above or below in the margins. The compact portrait data preserves the game's far-left, left, center, right, and far-right anchors plus its top, middle, and bottom alignment; it never infers placement from the translated speaker. Generated JSON is pretty-printed so script and glossary data remain reviewable directly on GitHub. It also combines the Japanese and English records in `compiled_export/tips_records.tsv` with the standardized titles in `notes/proper_nouns_names_key_items.md` to produce all 98 glossary groups and their 211 evolving, chapter-gated bilingual definitions. Each glossary record is a complete definition; when the game unlocks a higher-priority record, it replaces the earlier definition rather than appending lines to it. `data/scenario-progression.json` mirrors the shipped game's `ScenarioButton.requireScenarios` graph so these variants do not unlock merely because another route appears earlier in the site's chapter menu. Speaker names combine the shipped labels with recoverable production-script markers and a small set of explicit nearby attributions; genuinely unresolved viewpoint, telephone, and off-screen lines remain unlabeled rather than being guessed. Newly started chapters appear automatically; chapter completion is calculated from the manifest.

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
