# indexer

Builds a full-text search index from the entity dataset in
[`traviskirton/content`](https://github.com/traviskirton/content) (movies, books,
characters, people, locations, items and so on). The UI that uses the index is
[`traviskirton/search`](https://github.com/traviskirton/search), which pulls this
repo in as a submodule.

- **Input:** one JSON file per entity in `data/content/entities/` (the `content`
  repo, pinned as a git submodule).
- **Output:** `build/search-index.json`, a serialised
  [MiniSearch](https://github.com/lucaong/minisearch) index (about 2.8 MB for
  915 entities).
- **Indexing:** each entity is indexed on its name, aliases, description, body
  text, tags and facet values. It also gets the names of everything up to two
  relationship hops away, so searching "Nolan" finds his films. Characters, items,
  vehicles and locations also inherit `genre`/`era`/`tone`-style facets from the
  movies and books they relate to.

## Requirements

- Node.js 20.19+, 22.12+ or 24+ (vitest's vite needs `^20.19.0 || >=22.12.0`; developed on Node 25)
- pnpm 10 (the version is pinned in `package.json` under `packageManager`)

## Install

```bash
git clone https://github.com/traviskirton/indexer.git
cd indexer
git submodule update --init   # fetches data/content at the pinned commit
pnpm install
```

## Build the index

```bash
pnpm build
```

This reads `data/content/entities/*.json` and writes `build/search-index.json`.
It prints counts by entity type and how many entities have facets, tags and
relationships. `build/` is git-ignored.

## Test

```bash
pnpm build        # tests/search.test.ts reads build/search-index.json
pnpm test --run   # run once; plain `pnpm test` starts vitest in watch mode
pnpm exec tsc --noEmit   # type-check scripts/ and src/
```

- `tests/documents.test.ts` and `tests/tag-taxonomy.test.ts` are unit tests on
  small fixtures. They need no build and no content.
- `tests/search.test.ts` checks the built index against the real content. If
  `pnpm build` hasn't been run, that suite fails with `ENOENT`.

## Update the content

```bash
pnpm update-content
```

This runs `git pull` inside `data/content`, which moves the submodule off its
pinned commit. Rebuild, re-run the tests, then commit the new `data/content`
pointer if you want to keep it.

## Layout

| Path | What it is |
|------|------------|
| `scripts/build-search.ts` | Index builder (`pnpm build`) |
| `src/documents.ts` | Turns an entity into its indexed document: 2-hop relationship names, facet inheritance, text fields |
| `src/types.ts` | Entity, facet and search-document types |
| `src/tag-taxonomy.ts` | Parent > child tag taxonomy and helpers (not used by the build) |
| `tests/` | Vitest suites |
| `docs/content-issues.md` | Known problems in the content data |
| `data/content/` | `content` repo submodule |
| `.snapshots/` | Snapshot tags (`v1-simple-search`, `v2-faceted-features`, `v3-filter-modifiers`) |
| `dev-reports/` | Development reports |
