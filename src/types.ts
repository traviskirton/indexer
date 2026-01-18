export interface ContentSection {
  title: string;
  body: string;
}

export interface Relationship {
  type: string;
  target: string; // UUID
}

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
}

/** Document shape indexed by MiniSearch */
export interface SearchDocument {
  id: string;
  type: string;
  name: string;
  description: string;
  body: string; // concatenated content sections
  aliases: string;
}

/** Stored fields returned in search results */
export interface SearchResult {
  id: string;
  type: string;
  name: string;
  description: string;
}
