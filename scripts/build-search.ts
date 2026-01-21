import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import MiniSearch from "minisearch";
import type { Entity, SearchDocument, Facets, Link } from "../src/types.js";

const CONTENT_DIR = "data/content/entities";
const OUTPUT_FILE = "build/search-index.json";

async function loadEntities(): Promise<Entity[]> {
  const files = await readdir(CONTENT_DIR);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));

  const entities: Entity[] = [];
  for (const file of jsonFiles) {
    const content = await readFile(join(CONTENT_DIR, file), "utf-8");
    entities.push(JSON.parse(content) as Entity);
  }

  return entities;
}

/** Convert facets object to searchable text string */
function facetsToText(facets?: Facets): string {
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
interface ResolvedRelationships {
  names: string[];      // All related entity names (2 hops)
  facets: Facets;       // Inherited facets from related entities
}

/** Entity types that should inherit facets from related movies/books */
const TYPES_THAT_INHERIT_FACETS = new Set([
  "character",
  "item",
  "vehicle",
  "location",
]);

/** Entity types that provide facets to inherit */
const TYPES_THAT_PROVIDE_FACETS = new Set(["movie", "book"]);

/** Resolve relationships up to 2 hops deep */
function resolveRelationships(
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
function mergeFacets(target: Facets, source: Facets): void {
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

function entityToDocument(
  entity: Entity,
  entityMap: Map<string, Entity>,
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
interface IndexedDocument extends SearchDocument {
  facets?: Record<string, unknown>;
  tagsArray?: string[];
  links?: Link[];
}

async function buildIndex() {
  console.log("Loading entities...");
  const entities = await loadEntities();
  console.log(`Loaded ${entities.length} entities`);

  // Build entity map for relationship resolution
  const entityMap = new Map<string, Entity>(entities.map((e) => [e.id, e]));

  const miniSearch = new MiniSearch<IndexedDocument>({
    fields: ["name", "description", "body", "aliases", "tags", "facetText", "related"],
    storeFields: ["id", "type", "name", "description", "facets", "tagsArray", "links"],
    searchOptions: {
      boost: {
        name: 3,
        aliases: 2,
        related: 2,
        description: 1.5,
        tags: 1.5,
        facetText: 1,
        body: 0.5,
      },
      fuzzy: 0.2,
      prefix: true,
    },
  });

  console.log("Building documents with 2-hop resolution...");
  const documents: IndexedDocument[] = entities.map((entity) => {
    // Resolve relationships once, use for both search and filtering
    const resolved = resolveRelationships(entity, entityMap);
    const doc = entityToDocument(entity, entityMap, resolved);

    // Merge entity's own facets with inherited facets for filtering
    const mergedFacets: Facets = { ...entity.facets };
    mergeFacets(mergedFacets, resolved.facets);

    return {
      ...doc,
      facets: mergedFacets,
      tagsArray: entity.tags,
      links: entity.links,
    };
  });

  miniSearch.addAll(documents);

  // Count statistics
  const typeCounts = new Map<string, number>();
  const facetedCount = entities.filter((e) => e.facets && Object.keys(e.facets).length > 0).length;
  const taggedCount = entities.filter((e) => e.tags && e.tags.length > 0).length;
  const relatedCount = entities.filter((e) => e.relationships && e.relationships.length > 0).length;

  for (const entity of entities) {
    typeCounts.set(entity.type, (typeCounts.get(entity.type) ?? 0) + 1);
  }

  console.log("\nEntity types:");
  for (const [type, count] of [...typeCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }
  console.log(`\nWith facets: ${facetedCount}/${entities.length}`);
  console.log(`With tags: ${taggedCount}/${entities.length}`);
  console.log(`With relationships: ${relatedCount}/${entities.length}`);

  console.log("\nWriting index...");
  const indexData = JSON.stringify(miniSearch.toJSON());

  await mkdir("build", { recursive: true });
  await writeFile(OUTPUT_FILE, indexData, "utf-8");

  const sizeMB = (Buffer.byteLength(indexData) / 1024 / 1024).toFixed(2);
  console.log(`Index written to ${OUTPUT_FILE} (${sizeMB} MB)`);
}

buildIndex().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
