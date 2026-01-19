export interface ContentSection {
  title: string;
  body: string;
}

export interface Relationship {
  type: string;
  target: string; // UUID
}

export type FacetValue = string | string[] | boolean;
export type Facets = Record<string, FacetValue>;

export interface Entity {
  id: string;
  type: string;
  name: string;
  description?: string;
  content?: ContentSection[];
  aliases?: string[];
  relationships?: Relationship[];
  properties?: Record<string, unknown>;
  tags?: string[];
  facets?: Facets;
}

/** Document shape indexed by MiniSearch */
export interface SearchDocument {
  id: string;
  type: string;
  name: string;
  description: string;
  body: string; // concatenated content sections
  aliases: string;
  tags: string; // space-joined tags for text search
  facetText: string; // facet values concatenated for text search
  related: string; // resolved relationship target names
}

/** Stored fields returned in search results */
export interface SearchResult {
  id: string;
  type: string;
  name: string;
  description: string;
  facets?: Facets; // structured facets for filtering
  tags?: string[]; // original tags array for filtering
}
