# Filter UI Specification

## Overview

The search interface combines a text search field with dynamic faceted filters. Results are the intersection of search matches and filter selections, sorted by relevance.

```
[Search: "Nolan"___________]

Filters:
├─ Type: ☑ Character ☐ Person ☐ Movie
├─ Genre: ☐ Sci-Fi ☐ Drama ☐ Thriller
├─ Morality: ☐ Heroic ☐ Villainous
└─ ...

Results: (sorted by relevance)
```

---

## Query Model

```
Results = search(query) ∩ filter(selections) → sorted by relevance
```

- **Empty search + filters**: filters become the query
- **Search + no filters**: standard text search
- **Search + filters**: intersection of both sets

Examples:
- `"Nolan" + Type=Character` → characters in Nolan films
- `Genre=Fantasy + Type=Character` → all fantasy characters
- `Type=Book + Reality=Real` → books referencing real places
- `Role=Spy` → all spies

---

## Categories

| Category | Source | Count | Applies To |
|----------|--------|-------|------------|
| **Type** | `entity.type` | 10 | All |
| **Genre** | `facets.genre` | 22 | Movies, Books |
| **Era** | `facets.era`, `facets.active-era` | 27 | Movies, Books, People |
| **Tone** | `facets.tone` | 21 | Movies, Books |
| **Morality** | `facets.morality` | 5 | Characters |
| **Archetype** | `facets.archetype` | 27 | Characters |
| **Role** | tags | 27 | Characters |
| **Profession** | `facets.profession` | 26 | People |
| **Reality** | `facets.reality` | 2 | Locations |
| **Location Type** | `facets.location-type` | 24 | Locations |
| **Franchise** | tags | ~20 | All |

### Category Values

**Type** (10)
```
Movie, Book, Character, Person, Location, Item, Vehicle, Organization, Franchise, Company
```

**Genre** (22)
```
Sci-Fi, Drama, Fantasy, Thriller, Adventure, Crime, Action, Mystery, Cyberpunk, Comedy, War, Superhero, Spy, Satire, Western, Romance, Space Opera, Espionage...
```

**Era** (27)
```
1950s, 1960s, 1970s, 1980s, 1990s, 2000s, 2010s, Victorian, Mid-Century, Modern, Cold War...
```

**Tone** (21)
```
Dark, Serious, Cerebral, Atmospheric, Suspenseful, Gritty, Philosophical, Whimsical, Light, Epic, Dramatic, Tragic, Comedic, Gothic...
```

**Morality** (5)
```
Heroic, Villainous, Ambiguous, Neutral, Antihero
```

**Archetype** (27)
```
Mentor, Warrior, Mastermind, Ruler, Caregiver, Everyman, Sage, Rebel, Innocent, Explorer, Trickster, Outlaw, Lover, Assassin, Protector...
```

**Role** (27)
```
Spy, Detective, Assassin, Mobster, Wizard, Villain, Hero, Butler, Agent, Operative, Investigator, Thief, Soldier, Warrior, Informant, Henchman, Sidekick, Vigilante, Con Artist, Hitman...
```

**Profession** (26)
```
Actor, Director, Writer, Producer, Composer, Author, Screenwriter, Cinematographer, Software Engineer, Voice Actor, Playwright, Musician...
```

**Reality** (2)
```
Real, Fictional
```

**Location Type** (24)
```
City, Building, Structure, Region, Planet, Realm, Country, Studio, Landscape, Mountain, Village, Fortress, Neighborhood...
```

**Franchise** (~20)
```
Batman, DC Universe, Dark Knight, James Bond, Back to the Future, The Godfather, Middle Earth, Lord of the Rings, Foundation, Discworld, Sherlock Holmes, Inception, Tenet, Interstellar, The Prestige, Oppenheimer...
```

---

## Dynamic Facets

Filter options update based on current results.

### Behavior

1. Execute current query (search + active filters)
2. Scan all results for their facet/tag values
3. For each category:
   - Collect values that exist in results
   - If 0 values → **hide entire category**
   - If values exist → show only those values
4. Optionally display counts: `Heroic (12)`

### Example: Search "Batman"

```
Type (5)           → Character, Person, Movie, Location, Vehicle
Genre (3)          → Action, Crime, Drama
Morality (3)       → Heroic, Villainous, Ambiguous
Archetype (8)      → Warrior, Mastermind, Caregiver, Mentor...
Role (6)           → Vigilante, Butler, Mobster, Detective...
Profession (0)     → [HIDDEN - no people with profession in Batman results]
Reality (2)        → Real, Fictional
Location Type (4)  → City, Building, Structure...
Franchise (3)      → Batman, DC Universe, Dark Knight
```

### Example: Search "Batman" + Type=Character

Categories narrow further:
```
Morality (3)       → Heroic, Villainous, Ambiguous
Archetype (6)      → Warrior, Mastermind, Caregiver...
Role (5)           → Vigilante, Butler, Mobster...
Franchise (2)      → Batman, DC Universe
Genre (0)          → [HIDDEN - characters don't have genre directly]
```

Wait—with facet inheritance, characters WOULD have genre. See below.

---

## Multi-Hop Relationship Resolution

For queries like "Nolan" + Type=Character to work, characters need "Christopher Nolan" in their indexed fields.

### Build-Time Resolution (2 hops)

For each entity, resolve:
1. **Related entity names** (1-2 hops)
2. **Related entity facet values** (1-2 hops)

Example for Dom Cobb (character):
```
Direct relationships:
  appears_in → Inception

Resolved into indexed content:
  Names:     "Inception", "Christopher Nolan", "Warner Bros", "Hans Zimmer"
  Facets:    "sci-fi", "thriller", "2010s", "cerebral", "atmospheric"
```

### Relationship Paths to Follow

| Entity Type | Hop 1 | Hop 2 |
|-------------|-------|-------|
| Character | appears_in → Movie | → directed_by, stars, composed_by, produced_by |
| Character | appears_in → Movie | → facets (genre, era, tone) |
| Person | starred_in, directed → Movie | → other people on film |
| Location | featured_in → Movie | → directed_by, facets |
| Item | featured_in → Movie | → directed_by, facets |

### Result

After build-time resolution:
- Search "Nolan" matches Dom Cobb (has "Christopher Nolan" in related)
- Search "fantasy" matches Gandalf (has "fantasy" inherited from LOTR's genre)
- Filter Genre=Sci-Fi includes characters from sci-fi movies

---

## Display Label Conversion

Tags and facet values are stored as `kebab-case`. Convert to Title Case for display.

```
alfred-pennyworth  →  Alfred Pennyworth
sci-fi             →  Sci-Fi
new-york           →  New York
origin-story       →  Origin Story
christopher-nolan  →  Christopher Nolan
```

---

## Implementation Notes

### Client-Side Approach (recommended for 914 entities)

1. Load all entities into memory
2. Build lookup maps:
   - `byId: { [id]: entity }`
   - `byType: { [type]: [entities] }`
3. On search/filter change:
   - Compute matching entities
   - Scan for available facet values
   - Update filter UI
   - Display results

### Index Structure

The search index should include:

```typescript
interface IndexedEntity {
  // Identity
  id: string;
  type: string;
  name: string;

  // Searchable text
  description: string;
  body: string;
  aliases: string;
  tags: string;           // joined tags
  related: string;        // resolved names (2 hops)
  inheritedFacets: string; // facet values from related entities

  // Stored for filtering
  facets: Record<string, string | string[]>;
  tagsArray: string[];
}
```

### Filter Logic

```typescript
function getAvailableFilters(results: Entity[]): FilterOptions {
  const options: FilterOptions = {};

  for (const category of CATEGORIES) {
    const values = new Set<string>();

    for (const entity of results) {
      const entityValues = getValuesForCategory(entity, category);
      entityValues.forEach(v => values.add(v));
    }

    if (values.size > 0) {
      options[category.id] = {
        label: category.label,
        values: Array.from(values).sort()
      };
    }
    // If 0 values, category is omitted (hidden)
  }

  return options;
}
```
