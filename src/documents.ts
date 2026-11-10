import type { Entity, SearchDocument, Facets, Link } from "./types.js";

/** Convert facets object to searchable text string */
export function facetsToText(facets?: Facets): string {
  if (!facets) return "";

  const values: string[] = [];
  for (const value of Object.values(facets)) {
    if (Array.isArray(value)) {
      values.push(...value.map(String));
    } else if (typeof value === "boolean") {
      // Skip booleans - not useful for text search
    } else if (value) {
      values.push(String(value));
    }
  }
  return values.join(" ");
}

/** 2-hop relationship resolution result */
export interface ResolvedRelationships {
  names: string[];      // All related entity names (2 hops)
  facets: Facets;       // Inherited facets from related entities
}

/** Entity types that should inherit facets from related movies/books */
export const TYPES_THAT_INHERIT_FACETS = new Set([
  "character",
  "item",
  "vehicle",
  "location",
]);

/** Entity types that provide facets to inherit */
export const TYPES_THAT_PROVIDE_FACETS = new Set(["movie", "book"]);

/** Resolve relationships up to 2 hops deep */
export function resolveRelationships(
  entity: Entity,
  entityMap: Map<string, Entity>
): ResolvedRelationships {
  const names = new Set<string>();
  const inheritedFacets: Facets = {};

  if (!entity.relationships) {
    return { names: [], facets: {} };
  }

  // Should this entity type inherit facets?
  const shouldInheritFacets = TYPES_THAT_INHERIT_FACETS.has(entity.type);

  // Hop 1: Direct relationships
  for (const rel of entity.relationships) {
    const hop1Entity = entityMap.get(rel.target);
    if (!hop1Entity) continue;

    names.add(hop1Entity.name);

    // Only inherit facets if:
    // 1. This entity type should inherit (character, item, etc.)
    // 2. The related entity provides facets (movie, book)
    if (
      shouldInheritFacets &&
      TYPES_THAT_PROVIDE_FACETS.has(hop1Entity.type) &&
      hop1Entity.facets
    ) {
      mergeFacets(inheritedFacets, hop1Entity.facets);
    }

    // Hop 2: Relationships of related entities
    if (hop1Entity.relationships) {
      for (const rel2 of hop1Entity.relationships) {
        const hop2Entity = entityMap.get(rel2.target);
        if (!hop2Entity) continue;

        // Don't loop back to the original entity
        if (hop2Entity.id === entity.id) continue;

        names.add(hop2Entity.name);
      }
    }
  }

  return {
    names: [...names],
    facets: inheritedFacets,
  };
}

/** Merge source facets into target (mutates target) */
export function mergeFacets(target: Facets, source: Facets): void {
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined || value === null) continue;

    const existing = target[key];
    if (existing === undefined) {
      // Copy value (arrays need to be cloned)
      target[key] = Array.isArray(value) ? [...value] : value;
    } else if (Array.isArray(existing) && Array.isArray(value)) {
      // Merge arrays, deduplicate
      const merged = new Set([...existing, ...value]);
      target[key] = [...merged];
    }
    // For non-array values, keep the original (don't overwrite)
  }
}

export function entityToDocument(
  entity: Entity,
  resolved: ResolvedRelationships
): SearchDocument {
  const body =
    entity.content?.map((section) => section.body).join("\n\n") ?? "";
  const aliases = entity.aliases?.join(" ") ?? "";
  const tags = entity.tags?.join(" ") ?? "";

  // Use pre-resolved relationships
  const related = resolved.names.join(" ");

  // Combine entity's own facets with inherited facets for search
  const ownFacetText = facetsToText(entity.facets);
  const inheritedFacetText = facetsToText(resolved.facets);
  const facetText = [ownFacetText, inheritedFacetText].filter(Boolean).join(" ");

  return {
    id: entity.id,
    type: entity.type,
    name: entity.name,
    description: entity.description ?? "",
    body,
    aliases,
    tags,
    facetText,
    related,
  };
}

/** Extended document type for MiniSearch that includes stored fields */
export interface IndexedDocument extends SearchDocument {
  facets?: Record<string, unknown>;
  tagsArray?: string[];
  links?: Link[];
}

/** Build the document indexed and stored for one entity */
export function buildIndexedDocument(
  entity: Entity,
  entityMap: Map<string, Entity>
): IndexedDocument {
  // Resolve relationships once, use for both search and filtering
  const resolved = resolveRelationships(entity, entityMap);
  const doc = entityToDocument(entity, resolved);

  // Merge entity's own facets with inherited facets for filtering
  const mergedFacets: Facets = { ...entity.facets };
  mergeFacets(mergedFacets, resolved.facets);

  return {
    ...doc,
    facets: mergedFacets,
    tagsArray: entity.tags,
    links: entity.links,
  };
}
