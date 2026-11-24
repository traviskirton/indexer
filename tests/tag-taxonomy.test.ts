import { describe, it, expect } from "vitest";
import {
  TAG_TAXONOMY,
  tagToLabel,
  labelToTag,
  buildTagToParentMap,
  buildParentToTagsMap,
  expandTag,
  getTagParent,
  getCategory,
  getCategoryIds,
  isCategory,
} from "../src/tag-taxonomy.js";

describe("tagToLabel", () => {
  it("title-cases each kebab-case word", () => {
    expect(tagToLabel("academy-award-winner")).toBe("Academy Award Winner");
    expect(tagToLabel("sci-fi")).toBe("Sci Fi");
    expect(tagToLabel("noir")).toBe("Noir");
  });

  it("leaves digits alone and handles the empty string", () => {
    expect(tagToLabel("007")).toBe("007");
    expect(tagToLabel("1980s")).toBe("1980s");
    expect(tagToLabel("")).toBe("");
  });
});

describe("labelToTag", () => {
  it("lower-cases and hyphenates whitespace runs", () => {
    expect(labelToTag("Academy Award Winner")).toBe("academy-award-winner");
    expect(labelToTag("Sci   Fi")).toBe("sci-fi");
  });

  it("round-trips every taxonomy tag through tagToLabel", () => {
    for (const category of TAG_TAXONOMY) {
      for (const tag of category.children) {
        expect(labelToTag(tagToLabel(tag))).toBe(tag);
      }
    }
  });
});

describe("taxonomy data", () => {
  it("has unique category ids", () => {
    const ids = getCategoryIds();
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has non-empty, duplicate-free, kebab-case children", () => {
    for (const category of TAG_TAXONOMY) {
      expect(category.children.length).toBeGreaterThan(0);
      expect(new Set(category.children).size).toBe(category.children.length);
      for (const tag of category.children) {
        expect(tag).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      }
    }
  });
});

describe("lookups", () => {
  it("lists category ids in taxonomy order", () => {
    expect(getCategoryIds()).toEqual(TAG_TAXONOMY.map((c) => c.id));
    expect(getCategoryIds()[0]).toBe("type");
  });

  it("finds a category by id", () => {
    expect(getCategory("era")?.label).toBe("Era");
    expect(getCategory("nope")).toBeUndefined();
  });

  it("tells categories from tags", () => {
    expect(isCategory("genre")).toBe(true);
    expect(isCategory("action")).toBe(false);
  });

  it("maps each category id to its children", () => {
    const map = buildParentToTagsMap();
    expect(map.size).toBe(TAG_TAXONOMY.length);
    expect(map.get("genre")).toBe(getCategory("genre")!.children);
  });

  it("maps a tag to its parent category", () => {
    expect(getTagParent("action")).toBe("genre");
    expect(getTagParent("1980s")).toBe("era");
    expect(getTagParent("genre")).toBeUndefined();
    expect(getTagParent("not-a-tag")).toBeUndefined();
  });

  it("maps a tag listed in several categories to the last one", () => {
    // Current behaviour: later categories overwrite earlier ones.
    expect(getTagParent("batman")).toBe("franchise"); // also in characters
    expect(getTagParent("noir")).toBe("style"); // also in genre
    expect(getTagParent("musical")).toBe("skill"); // also in genre
    expect(buildTagToParentMap().get("classic")).toBe("recognition"); // also in style
  });
});

describe("expandTag", () => {
  it("expands a category id to itself plus its children", () => {
    expect(expandTag("tone")).toEqual(["tone", ...getCategory("tone")!.children]);
  });

  it("returns a plain tag or unknown value as-is", () => {
    expect(expandTag("dark")).toEqual(["dark"]);
    expect(expandTag("not-a-tag")).toEqual(["not-a-tag"]);
  });
});
