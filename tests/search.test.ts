import { describe, it, expect, beforeAll } from "vitest";
import { readFile } from "node:fs/promises";
import MiniSearch from "minisearch";
import type { SearchDocument } from "../src/types.js";

describe("search index", () => {
  let index: MiniSearch<SearchDocument>;

  beforeAll(async () => {
    const data = await readFile("build/search-index.json", "utf-8");
    index = MiniSearch.loadJSON(data, {
      fields: ["name", "description", "body", "aliases"],
    });
  });

  it("loads the index successfully", () => {
    expect(index.documentCount).toBeGreaterThan(0);
  });

  it("finds entities by name", () => {
    const results = index.search("Batman");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.name.includes("Batman"))).toBe(true);
  });

  it("finds entities by alias", () => {
    const results = index.search("Dark Knight");
    expect(results.length).toBeGreaterThan(0);
  });

  it("returns stored fields in results", () => {
    const results = index.search("Joker");
    expect(results.length).toBeGreaterThan(0);

    const first = results[0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("type");
    expect(first).toHaveProperty("name");
    expect(first).toHaveProperty("description");
  });

  it("supports fuzzy matching", () => {
    const results = index.search("Btman", { fuzzy: 0.4 }); // typo (missing 'a')
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.name.includes("Batman"))).toBe(true);
  });

  it("supports prefix search", () => {
    const results = index.search("Bru", { prefix: true }); // partial for Bruce
    expect(results.length).toBeGreaterThan(0);
  });

  it("boosts name matches with custom weights", () => {
    const results = index.search("Gotham", {
      boost: { name: 3, aliases: 2, description: 1.5 },
    });
    // Should find Gotham-related entities
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.name.includes("Gotham"))).toBe(true);
  });
});
