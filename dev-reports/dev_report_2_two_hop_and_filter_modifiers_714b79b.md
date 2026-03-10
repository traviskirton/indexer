# Development Report: 2-Hop Resolution & Filter Modifiers

**Commit:** 714b79b
**Phase:** Search intelligence
**Breakthrough:** no

## Objective

Improve search relevance through relationship graph traversal and give users fine-grained control over filtering with OR/NOT/MUST modifiers.

## Summary

Added 2-hop relationship resolution to the indexer so that searching for a director's name surfaces their characters, and characters inherit facets (genre, era, tone) from related movies. Built a tri-state filter modifier system in the demo UI where Option+click cycles filters through OR (blue), NOT (red), and MUST (green) modes. MUST mode narrows visible filter options to only compatible values.

## Changes Made

| File | Change |
|------|--------|
| `scripts/build-search.ts` | Added `resolveRelationships()` for 2-hop traversal, `mergeFacets()` for facet inheritance, selective inheritance rules (characters/items/vehicles/locations inherit from movies/books) |
| `demo.html` | Filter modifier system — `MODIFIER` enum, `MODIFIER_CYCLE` array, `entityMatchesFilters()` with OR/NOT/MUST logic, `categoryHasMust()` for narrowing available options, Option+click cycling, color-coded pills |
| `.snapshots/versions` | Added v3-filter-modifiers snapshot |

### Key design decisions

- **Selective inheritance**: Only certain entity types (character, item, vehicle, location) inherit facets, and only from certain providers (movie, book). This prevents nonsensical facet pollution.
- **Modifier UX**: Regular click toggles selection; Option/Cmd+click cycles through modifier modes. Avoids cluttering the UI with extra controls.
- **MUST narrows options**: When MUST is active in a category, the available filter values narrow to only those compatible with the intersection, preventing impossible combinations.

## Issues Resolved

1. **Facet pollution** — Unrestricted inheritance would give every entity every facet from the graph. Solved with `TYPES_THAT_INHERIT_FACETS` and `TYPES_THAT_PROVIDE_FACETS` allowlists.
2. **Self-referencing loops** — 2-hop traversal could loop back to the original entity. Added `hop2Entity.id === entity.id` guard.
3. **OR + MUST interaction** — When a category has both OR and MUST filters, OR values are ignored (MUST takes priority since it's more restrictive).

## Next Steps

- Add result counts to filter pills
- Consider adding link indexing for richer entity connections
- Explore persisting filter state in URL parameters
