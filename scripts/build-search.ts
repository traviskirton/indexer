import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import MiniSearch from "minisearch";
import type { Entity, SearchDocument } from "../src/types.js";

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

function entityToDocument(entity: Entity): SearchDocument {
  const body =
    entity.content?.map((section) => section.body).join("\n\n") ?? "";
  const aliases = entity.aliases?.join(" ") ?? "";

  return {
    id: entity.id,
    type: entity.type,
    name: entity.name,
    description: entity.description ?? "",
    body,
    aliases,
  };
}

async function buildIndex() {
  console.log("Loading entities...");
  const entities = await loadEntities();
  console.log(`Loaded ${entities.length} entities`);

  const miniSearch = new MiniSearch<SearchDocument>({
    fields: ["name", "description", "body", "aliases"],
    storeFields: ["id", "type", "name", "description"],
    searchOptions: {
      boost: { name: 3, aliases: 2, description: 1.5 },
      fuzzy: 0.2,
      prefix: true,
    },
  });

  const documents = entities.map(entityToDocument);
  miniSearch.addAll(documents);

  console.log("Building index...");
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
