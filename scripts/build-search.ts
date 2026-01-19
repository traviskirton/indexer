import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import MiniSearch from "minisearch";
import type { Entity, SearchDocument, Facets } from "../src/types.js";

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

/** Resolve relationship targets to entity names */
function resolveRelatedNames(
  entity: Entity,
  entityMap: Map<string, Entity>
): string {
  if (!entity.relationships) return "";

  const names = entity.relationships
    .map((rel) => entityMap.get(rel.target)?.name)
    .filter((name): name is string => Boolean(name));

  // Deduplicate names
  return [...new Set(names)].join(" ");
}

function entityToDocument(
  entity: Entity,
  entityMap: Map<string, Entity>
): SearchDocument {
  const body =
    entity.content?.map((section) => section.body).join("\n\n") ?? "";
  const aliases = entity.aliases?.join(" ") ?? "";
  const tags = entity.tags?.join(" ") ?? "";
  const facetText = facetsToText(entity.facets);
  const related = resolveRelatedNames(entity, entityMap);

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
}

async function buildIndex() {
  console.log("Loading entities...");
  const entities = await loadEntities();
  console.log(`Loaded ${entities.length} entities`);

  // Build entity map for relationship resolution
  const entityMap = new Map<string, Entity>(entities.map((e) => [e.id, e]));

  const miniSearch = new MiniSearch<IndexedDocument>({
    fields: ["name", "description", "body", "aliases", "tags", "facetText", "related"],
    storeFields: ["id", "type", "name", "description", "facets", "tagsArray"],
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

  console.log("Building documents...");
  const documents: IndexedDocument[] = entities.map((entity) => {
    const doc = entityToDocument(entity, entityMap);
    return {
      ...doc,
      facets: entity.facets,
      tagsArray: entity.tags,
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
