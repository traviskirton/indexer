# Snapshots

Available versioned snapshots of the indexer. To switch to a snapshot:

```bash
git checkout <tag>
git submodule update
npm run build
```

To return to latest:

```bash
git checkout main
git submodule update
npm run build
```

---

## v1-simple-search

**Simple Search Demo**

Single search field centered on page with results underneath. No filters, no facets. Basic text search with fuzzy matching and prefix support.

---

## v2-faceted-features

**Faceted Search Demo**

Two-column UI with dynamic filters. Left panel has search box and filter categories (Type, Genre, Era, Tone, Morality, Archetype, Role, Profession, Reality, Location Type, Franchise). Filters update dynamically based on current results. Categories with no matching options are hidden.

Limitations:
- 1-hop relationship resolution only (characters don't inherit director names)
- No facet inheritance (characters don't inherit genre from movies)
