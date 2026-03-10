# Development Report: Foundation & Faceted Search

**Commit:** 6b6bf0e
**Phase:** Core infrastructure
**Breakthrough:** no

## Objective

Stand up a search indexer for structured entity content, then build a faceted search demo UI with dynamic filtering.

## Summary

Created a TypeScript project that reads JSON entity files (characters, movies, locations, etc.), builds a MiniSearch full-text index with weighted fields, and serves results through a single-page demo UI. The demo evolved from a simple centered search box (v1) to a two-column layout with a left filter panel and right results pane (v2). Filter categories are driven by entity facets, tags, and type metadata, and hide dynamically when no options match.

## Changes Made

| File | Purpose |
|------|---------|
| `package.json` | Project setup — pnpm, tsx, MiniSearch, vitest |
| `src/types.ts` | Core types: Entity, Facets, SearchDocument, SearchResult |
| `src/tag-taxonomy.ts` | Tag taxonomy definitions |
| `scripts/build-search.ts` | Index builder — loads entities, converts to search docs, writes JSON index |
| `demo.html` | Search UI — search box, dynamic facet filters, result cards |
| `data/content` | Content submodule with entity JSON files |
| `.snapshots/` | Snapshot versioning (v1-simple-search, v2-faceted-features) |

## Issues Resolved

1. **Content management** — Tried git submodule, then symlink, then back to submodule for `data/content`
2. **Dynamic filter hiding** — Categories with zero matching options are hidden from the filter panel to avoid dead-end selections
3. **Facet-to-text conversion** — Boolean facet values are skipped in text search to avoid false matches; arrays are flattened and joined

## Next Steps

- Add relationship graph traversal beyond 1-hop
- Support facet inheritance (e.g., characters inheriting genre from their movies)
- Add filter modifiers for NOT/MUST logic
