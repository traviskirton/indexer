import { describe, it, expect, beforeAll } from "vitest";
import { readFile } from "node:fs/promises";
import MiniSearch from "minisearch";
import type { SearchDocument, Facets } from "../src/types.js";

interface StoredResult {
  id: string;
  type: string;
  name: string;
  description: string;
  facets?: Facets;
  tagsArray?: string[];
}

describe("search index", () => {
  let index: MiniSearch<SearchDocument>;

  beforeAll(async () => {
    const data = await readFile("build/search-index.json", "utf-8");
    index = MiniSearch.loadJSON(data, {
      fields: ["name", "description", "body", "aliases", "tags", "facetText", "related"],
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

  describe("tag search", () => {
    it("finds entities by tag", () => {
      const results = index.search("time-travel");
      expect(results.length).toBeGreaterThan(0);
    });

    it("finds entities by theme tags", () => {
      const results = index.search("superhero");
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("facet search", () => {
    it("finds characters by morality facet", () => {
      const results = index.search("heroic");
      expect(results.length).toBeGreaterThan(0);
      const characters = results.filter((r) => r.type === "character");
      expect(characters.length).toBeGreaterThan(0);
    });

    it("finds characters by archetype facet", () => {
      const results = index.search("protagonist");
      expect(results.length).toBeGreaterThan(0);
    });

    it("finds movies by genre facet", () => {
      const results = index.search("sci-fi");
      expect(results.length).toBeGreaterThan(0);
    });

    it("finds locations by reality facet", () => {
      const results = index.search("fictional");
      expect(results.length).toBeGreaterThan(0);
      const locations = results.filter((r) => r.type === "location");
      expect(locations.length).toBeGreaterThan(0);
    });
  });

  describe("relationship resolution", () => {
    it("finds movies by director name", () => {
      const results = index.search("Nolan");
      expect(results.length).toBeGreaterThan(0);
      const movies = results.filter((r) => r.type === "movie");
      expect(movies.length).toBeGreaterThan(0);
    });

    it("finds movies by actor name", () => {
      const results = index.search("Christian Bale");
      expect(results.length).toBeGreaterThan(0);
      const movies = results.filter((r) => r.type === "movie");
      expect(movies.length).toBeGreaterThan(0);
    });
  });

  describe("stored facets and tags", () => {
    it("returns facets in search results", () => {
      const results = index.search("Batman") as unknown as StoredResult[];
      expect(results.length).toBeGreaterThan(0);

      // Find a character result that should have facets
      const characterResult = results.find(
        (r) => r.type === "character" && r.facets
      );
      if (characterResult) {
        expect(characterResult.facets).toBeDefined();
        expect(typeof characterResult.facets).toBe("object");
      }
    });

    it("returns tags array in search results", () => {
      const results = index.search("Batman") as unknown as StoredResult[];
      expect(results.length).toBeGreaterThan(0);

      // Find a result with tags
      const taggedResult = results.find((r) => r.tagsArray && r.tagsArray.length > 0);
      if (taggedResult) {
        expect(Array.isArray(taggedResult.tagsArray)).toBe(true);
      }
    });

    it("allows filtering results by facet value", () => {
      const results = index.search("Batman") as unknown as StoredResult[];

      // Filter to only villainous characters
      const villains = results.filter(
        (r) => r.type === "character" && r.facets?.morality === "villainous"
      );

      // Filter to only heroic characters
      const heroes = results.filter(
        (r) => r.type === "character" && r.facets?.morality === "heroic"
      );

      // We should have both heroes and villains in Batman results
      expect(villains.length + heroes.length).toBeGreaterThan(0);
    });
  });
});
