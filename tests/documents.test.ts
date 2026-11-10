import { describe, it, expect } from "vitest";
import {
  facetsToText,
  mergeFacets,
  resolveRelationships,
  entityToDocument,
  buildIndexedDocument,
} from "../src/documents.js";
import type { Entity, Facets } from "../src/types.js";

/** Small fixture graph: a movie, its director, a second film, a character and an item */
function fixture() {
  const movie: Entity = {
    id: "m1",
    type: "movie",
    name: "Inception",
    facets: { genre: ["sci-fi", "thriller"], era: "2010s", canon: true },
    relationships: [
      { type: "directed-by", target: "p1" },
      { type: "features", target: "c1" },
    ],
  };
  const movie2: Entity = {
    id: "m2",
    type: "movie",
    name: "Tenet",
    facets: { genre: ["sci-fi", "action"], era: "2020s" },
    relationships: [{ type: "directed-by", target: "p1" }],
  };
  const book: Entity = {
    id: "b1",
    type: "book",
    name: "Neuromancer",
    facets: { genre: ["cyberpunk"], tone: "gritty" },
  };
  const director: Entity = {
    id: "p1",
    type: "person",
    name: "Christopher Nolan",
    facets: { profession: ["director"] },
    relationships: [
      { type: "directed", target: "m1" },
      { type: "directed", target: "m2" },
    ],
  };
  const character: Entity = {
    id: "c1",
    type: "character",
    name: "Dom Cobb",
    facets: { morality: "heroic", genre: ["drama"] },
    relationships: [
      { type: "appears-in", target: "m1" },
      { type: "owns", target: "i1" },
      { type: "appears-in", target: "missing" },
    ],
  };
  const item: Entity = {
    id: "i1",
    type: "item",
    name: "Totem",
    relationships: [{ type: "owned-by", target: "c1" }],
  };
  const entities = [movie, movie2, book, director, character, item];
  const entityMap = new Map(entities.map((e) => [e.id, e]));
  return { movie, movie2, book, director, character, item, entityMap };
}

describe("facetsToText", () => {
  it("returns an empty string for missing facets", () => {
    expect(facetsToText(undefined)).toBe("");
    expect(facetsToText({})).toBe("");
  });

  it("flattens arrays and keeps strings, in key order", () => {
    expect(
      facetsToText({ genre: ["sci-fi", "drama"], morality: "heroic" })
    ).toBe("sci-fi drama heroic");
  });

  it("skips booleans and empty strings", () => {
    expect(
      facetsToText({ canon: true, hidden: false, era: "", tone: "dark" })
    ).toBe("dark");
  });
});

describe("mergeFacets", () => {
  it("copies keys the target doesn't have, cloning arrays", () => {
    const source: Facets = { genre: ["sci-fi"], era: "2010s" };
    const target: Facets = {};
    mergeFacets(target, source);
    expect(target).toEqual({ genre: ["sci-fi"], era: "2010s" });

    (source.genre as string[]).push("drama");
    expect(target.genre).toEqual(["sci-fi"]);
  });

  it("merges arrays without duplicates, existing values first", () => {
    const target: Facets = { genre: ["drama", "sci-fi"] };
    mergeFacets(target, { genre: ["sci-fi", "action"] });
    expect(target.genre).toEqual(["drama", "sci-fi", "action"]);
  });

  it("never overwrites an existing non-array value", () => {
    const target: Facets = { morality: "heroic", era: "1980s", tone: ["dark"] };
    mergeFacets(target, {
      morality: "villainous",
      era: ["1990s"],
      tone: "light",
    });
    expect(target).toEqual({ morality: "heroic", era: "1980s", tone: ["dark"] });
  });

  it("ignores null and undefined source values", () => {
    const target: Facets = {};
    mergeFacets(target, {
      a: undefined,
      b: null,
    } as unknown as Facets);
    expect(target).toEqual({});
  });
});

describe("resolveRelationships", () => {
  it("returns nothing for an entity without relationships", () => {
    const { book, entityMap } = fixture();
    expect(resolveRelationships(book, entityMap)).toEqual({
      names: [],
      facets: {},
    });
  });

  it("collects names two hops out, skipping missing targets and the entity itself", () => {
    const { character, entityMap } = fixture();
    const { names } = resolveRelationships(character, entityMap);
    // hop 1: Inception, Totem; hop 2 (via Inception): Christopher Nolan.
    // Dom Cobb is reachable through both, but is never listed.
    expect(names).toEqual(["Inception", "Christopher Nolan", "Totem"]);
  });

  it("lists each related name once", () => {
    const { movie, entityMap } = fixture();
    // hop 1: Nolan, Cobb; hop 2: Tenet (via Nolan), Totem (via Cobb).
    // Inception itself is reachable through both and is skipped.
    expect(resolveRelationships(movie, entityMap).names).toEqual([
      "Christopher Nolan",
      "Tenet",
      "Dom Cobb",
      "Totem",
    ]);
  });

  it("lets characters, items, vehicles and locations inherit facets from related movies", () => {
    const { character, entityMap } = fixture();
    expect(resolveRelationships(character, entityMap).facets).toEqual({
      genre: ["sci-fi", "thriller"],
      era: "2010s",
      canon: true,
    });
  });

  it("merges facets from several movies and books", () => {
    const { book, entityMap } = fixture();
    const vehicle: Entity = {
      id: "v1",
      type: "vehicle",
      name: "Van",
      relationships: [
        { type: "appears-in", target: "m1" },
        { type: "appears-in", target: "m2" },
        { type: "appears-in", target: book.id },
      ],
    };
    expect(resolveRelationships(vehicle, entityMap).facets).toEqual({
      genre: ["sci-fi", "thriller", "action", "cyberpunk"],
      era: "2010s",
      canon: true,
      tone: "gritty",
    });
  });

  it("does not inherit facets for other entity types", () => {
    const { director, movie, entityMap } = fixture();
    expect(resolveRelationships(director, entityMap).facets).toEqual({});
    expect(resolveRelationships(movie, entityMap).facets).toEqual({});
  });

  it("only inherits from direct (hop 1) movies and books", () => {
    const { item, entityMap } = fixture();
    // Totem -> Dom Cobb (character) -> Inception (movie): two hops, no facets.
    expect(resolveRelationships(item, entityMap).facets).toEqual({});
  });
});

describe("entityToDocument", () => {
  it("flattens the entity into text fields", () => {
    const { character, entityMap } = fixture();
    const entity: Entity = {
      ...character,
      description: "An extractor.",
      aliases: ["Cobb", "Dominick Cobb"],
      tags: ["thief", "dreamer"],
      content: [
        { title: "Bio", body: "First." },
        { title: "Role", body: "Second." },
      ],
    };
    const resolved = resolveRelationships(entity, entityMap);
    expect(entityToDocument(entity, entityMap, resolved)).toEqual({
      id: "c1",
      type: "character",
      name: "Dom Cobb",
      description: "An extractor.",
      body: "First.\n\nSecond.",
      aliases: "Cobb Dominick Cobb",
      tags: "thief dreamer",
      facetText: "heroic drama sci-fi thriller 2010s",
      related: "Inception Christopher Nolan Totem",
    });
  });

  it("uses empty strings for missing optional fields", () => {
    const entity: Entity = { id: "x", type: "item", name: "Thing" };
    expect(
      entityToDocument(entity, new Map(), { names: [], facets: {} })
    ).toEqual({
      id: "x",
      type: "item",
      name: "Thing",
      description: "",
      body: "",
      aliases: "",
      tags: "",
      facetText: "",
      related: "",
    });
  });
});

describe("buildIndexedDocument", () => {
  it("stores own facets merged with inherited ones, own values first", () => {
    const { character, entityMap } = fixture();
    const doc = buildIndexedDocument(character, entityMap);
    expect(doc.facets).toEqual({
      morality: "heroic",
      genre: ["drama", "sci-fi", "thriller"],
      era: "2010s",
      canon: true,
    });
  });

  it("does not mutate the source entity's facets", () => {
    const { character, entityMap } = fixture();
    buildIndexedDocument(character, entityMap);
    expect(character.facets).toEqual({ morality: "heroic", genre: ["drama"] });
  });

  it("passes tags and links through as stored fields", () => {
    const links = [{ url: "https://example.com", title: "Example", type: "wiki" }];
    const entity: Entity = {
      id: "o1",
      type: "organization",
      name: "Cobol Engineering",
      tags: ["corporation"],
      links,
    };
    const doc = buildIndexedDocument(entity, new Map());
    expect(doc.tagsArray).toEqual(["corporation"]);
    expect(doc.links).toBe(links);
    expect(doc.facets).toEqual({});
    expect(doc.tags).toBe("corporation");
  });
});
