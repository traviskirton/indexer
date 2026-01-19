/**
 * Tag Taxonomy
 *
 * Defines a 2-level parent > child hierarchy for tags.
 * Searching a parent tag will match all child tags.
 */

/** Convert kebab-case tag to plain language */
export function tagToLabel(tag: string): string {
  return tag
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Convert plain language label to kebab-case tag */
export function labelToTag(label: string): string {
  return label
    .toLowerCase()
    .replace(/\s+/g, '-');
}

/** Tag category definition */
export interface TagCategory {
  id: string;
  label: string;
  children: string[];
}

/**
 * Tag Taxonomy
 *
 * Structure: parent > children
 * When searching for a parent, all children are included.
 */
export const TAG_TAXONOMY: TagCategory[] = [
  // === Entity Types ===
  {
    id: 'type',
    label: 'Type',
    children: [
      'movie',
      'film',
      'book',
      'novel',
      'short-story',
      'television',
      'tv-show',
    ],
  },

  // === Characters (franchise-specific) ===
  {
    id: 'characters',
    label: 'Characters',
    children: [
      'alfred-pennyworth',
      'bruce-wayne',
      'batman',
      'joker',
      'catwoman',
      'commissioner-gordon',
      'bane',
      'doc-brown',
      'marty-mcfly',
      'biff-tannen',
      'michael-corleone',
      'vito-corleone',
      'don-corleone',
      'frodo',
      'gandalf',
      'aragorn',
      'sauron',
      'gollum',
      'sherlock-holmes',
      'john-watson',
      'moriarty',
      'james-bond',
      'hari-seldon',
    ],
  },

  // === Genre ===
  {
    id: 'genre',
    label: 'Genre',
    children: [
      'action',
      'adventure',
      'comedy',
      'crime',
      'drama',
      'fantasy',
      'horror',
      'mystery',
      'romance',
      'sci-fi',
      'science-fiction',
      'thriller',
      'western',
      'noir',
      'espionage',
      'spy-fiction',
      'cyberpunk',
      'heist',
      'satire',
      'musical',
      'animation',
      'documentary',
      'war',
      'biographical',
    ],
  },

  // === Theme ===
  {
    id: 'theme',
    label: 'Theme',
    children: [
      'loyalty',
      'betrayal',
      'redemption',
      'revenge',
      'justice',
      'corruption',
      'power',
      'ambition',
      'family',
      'identity',
      'sacrifice',
      'survival',
      'freedom',
      'isolation',
      'obsession',
      'paranoia',
      'morality',
      'deception',
      'trust',
      'honor',
      'duty',
      'legacy',
      'fate',
      'destiny',
      'love',
      'loss',
      'grief',
      'hope',
      'fear',
      'greed',
      'transformation',
      'coming-of-age',
    ],
  },

  // === Era/Period ===
  {
    id: 'era',
    label: 'Era',
    children: [
      'ancient',
      'medieval',
      'renaissance',
      'victorian',
      'edwardian',
      '1920s',
      '1930s',
      '1940s',
      '1950s',
      '1960s',
      '1970s',
      '1980s',
      '1990s',
      '2000s',
      '2010s',
      '2020s',
      'cold-war',
      'post-war',
      'futuristic',
      'near-future',
      'far-future',
      'timeless',
      '19th-century',
      '20th-century',
      '21st-century',
    ],
  },

  // === Tone ===
  {
    id: 'tone',
    label: 'Tone',
    children: [
      'dark',
      'light',
      'gritty',
      'whimsical',
      'cerebral',
      'atmospheric',
      'suspenseful',
      'tense',
      'dramatic',
      'comedic',
      'tragic',
      'epic',
      'intimate',
      'surreal',
      'dreamlike',
      'nostalgic',
      'melancholic',
      'hopeful',
      'bleak',
      'campy',
      'satirical',
      'heartfelt',
    ],
  },

  // === Setting ===
  {
    id: 'setting',
    label: 'Setting',
    children: [
      'urban',
      'rural',
      'suburban',
      'industrial',
      'gothic',
      'dystopian',
      'utopian',
      'post-apocalyptic',
      'underwater',
      'underground',
      'space',
      'desert',
      'jungle',
      'forest',
      'mountain',
      'coastal',
      'island',
      'metropolitan',
      'small-town',
      'wilderness',
    ],
  },

  // === Franchise/Universe ===
  {
    id: 'franchise',
    label: 'Franchise',
    children: [
      'batman',
      'dc-universe',
      'dark-knight',
      'gotham',
      'james-bond',
      '007',
      'mi6',
      'back-to-the-future',
      'hill-valley',
      'the-godfather',
      'corleone',
      'middle-earth',
      'lord-of-the-rings',
      'the-hobbit',
      'foundation',
      'foundation-series',
      'discworld',
      'sherlock-holmes',
      'neuromancer',
      'sprawl',
      'inception',
      'tenet',
      'interstellar',
      'the-prestige',
      'oppenheimer',
      'christopher-nolan',
    ],
  },

  // === Skill ===
  {
    id: 'skill',
    label: 'Skill',
    children: [
      'combat',
      'martial-arts',
      'stealth',
      'tactical',
      'strategic',
      'marksman',
      'hacking',
      'engineering',
      'scientific',
      'medical',
      'legal',
      'political',
      'diplomatic',
      'linguistic',
      'artistic',
      'musical',
      'athletic',
      'acrobatic',
      'driving',
      'piloting',
      'leadership',
      'investigation',
      'deduction',
    ],
  },

  // === Trait (personality) ===
  {
    id: 'trait',
    label: 'Trait',
    children: [
      'loyal',
      'brave',
      'cunning',
      'wise',
      'cruel',
      'ruthless',
      'ambitious',
      'charismatic',
      'intelligent',
      'resourceful',
      'determined',
      'manipulative',
      'mysterious',
      'enigmatic',
      'charming',
      'witty',
      'arrogant',
      'stoic',
      'eccentric',
      'calculating',
      'patient',
      'fierce',
      'cold',
      'clever',
      'cynical',
      'idealistic',
      'pragmatic',
      'honorable',
      'fearless',
      'compassionate',
      'vengeful',
    ],
  },

  // === Style (visual/aesthetic) ===
  {
    id: 'style',
    label: 'Style',
    children: [
      'gothic',
      'art-deco',
      'noir',
      'neon',
      'retro',
      'vintage',
      'classic',
      'modern',
      'futuristic',
      'sleek',
      'ornate',
      'minimalist',
      'baroque',
      'industrial',
      'brutalist',
      'elegant',
      'cinematic',
      'iconic',
    ],
  },

  // === Place (real locations) ===
  {
    id: 'place',
    label: 'Place',
    children: [
      'california',
      'new-york',
      'london',
      'paris',
      'los-angeles',
      'chicago',
      'tokyo',
      'las-vegas',
      'italy',
      'england',
      'france',
      'germany',
      'japan',
      'hollywood',
      'manhattan',
      'san-francisco',
      'washington-dc',
      'moscow',
      'berlin',
    ],
  },

  // === Narrative ===
  {
    id: 'narrative',
    label: 'Narrative',
    children: [
      'twist',
      'plot-twist',
      'flashback',
      'nonlinear',
      'unreliable-narrator',
      'mcguffin',
      'cliffhanger',
      'foreshadowing',
      'origin-story',
      'sequel',
      'prequel',
      'trilogy',
      'ensemble',
      'character-driven',
      'action-driven',
      'dialogue-heavy',
      'visual-storytelling',
    ],
  },

  // === Recognition ===
  {
    id: 'recognition',
    label: 'Recognition',
    children: [
      'academy-award',
      'academy-award-winner',
      'academy-award-nominee',
      'oscar-winner',
      'golden-globe',
      'bafta',
      'acclaimed',
      'award-winning',
      'critically-acclaimed',
      'cult-classic',
      'blockbuster',
      'box-office-hit',
      'classic',
      'legendary',
      'influential',
    ],
  },

  // === Role (profession/occupation) ===
  {
    id: 'role',
    label: 'Role',
    children: [
      'actor',
      'actress',
      'director',
      'writer',
      'producer',
      'composer',
      'cinematographer',
      'scientist',
      'spy',
      'detective',
      'mobster',
      'businessman',
      'soldier',
      'agent',
      'assassin',
      'thief',
      'lawyer',
      'doctor',
      'politician',
      'journalist',
      'engineer',
      'pilot',
      'captain',
      'butler',
      'mentor',
      'villain',
      'hero',
      'antihero',
    ],
  },
];

/** Build a map of child tag -> parent category */
export function buildTagToParentMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const category of TAG_TAXONOMY) {
    for (const child of category.children) {
      map.set(child, category.id);
    }
  }
  return map;
}

/** Build a map of parent category -> child tags */
export function buildParentToTagsMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const category of TAG_TAXONOMY) {
    map.set(category.id, category.children);
  }
  return map;
}

/** Get all tags that should match when searching for a given tag */
export function expandTag(tag: string): string[] {
  const parentMap = buildParentToTagsMap();

  // If it's a parent category, return all children
  if (parentMap.has(tag)) {
    return [tag, ...parentMap.get(tag)!];
  }

  // Otherwise just return the tag itself
  return [tag];
}

/** Get the parent category for a tag, if any */
export function getTagParent(tag: string): string | undefined {
  const childToParent = buildTagToParentMap();
  return childToParent.get(tag);
}

/** Get category by ID */
export function getCategory(id: string): TagCategory | undefined {
  return TAG_TAXONOMY.find(c => c.id === id);
}

/** Get all category IDs */
export function getCategoryIds(): string[] {
  return TAG_TAXONOMY.map(c => c.id);
}

/** Check if a tag is a known category parent */
export function isCategory(tag: string): boolean {
  return TAG_TAXONOMY.some(c => c.id === tag);
}
