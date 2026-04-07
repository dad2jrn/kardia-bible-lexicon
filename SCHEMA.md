# Kardia Lexicon — Schema Reference

Full field-by-field documentation for all three data layers.

---

## Layer 1 — `data/categories.json`

One entry per Hebrew thought category. This is the theological core.

### Top-level structure

```json
{
  "version": "1.0",
  "generated": "ISO 8601 date",
  "entries": [ ]
}
```

### Category entry fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | Lowercase transliterated Hebrew, URL-safe. Primary key. Example: `"chesed"` |
| `hebrew_root` | string | ✓ | Hebrew characters. Example: `"חֶסֶד"` |
| `transliteration` | string | ✓ | Readable phonetic rendering. Example: `"chesed"` |
| `testament_scope` | enum | ✓ | `"ot"` \| `"nt"` \| `"both"` |
| `category_label` | string | ✓ | Short English label for UI display. Example: `"Covenant Loyalty"` |
| `one_liner` | string | ✓ | Single sentence. What this word does, not what it means. Max 25 words. |
| `full_definition` | string | ✓ | 2–4 paragraphs. Second Temple Hebrew perspective. No Western theological framing. |
| `what_it_does` | string | | How this concept functions in covenant relationship. Action-oriented. |
| `what_it_is_not` | string | ✓ | Explicitly names the Western/Augustinian misreading and explains the distortion. |
| `second_temple_context` | string | ✓ | How this concept functioned in Second Temple Jewish life — synagogue, Torah practice, community, eschatological expectation. |
| `kardia_rendering` | string | ✓ | Kardia translation preferred English rendering. Short phrase. Example: `"self-giving covenant loyalty"` |
| `surface_vehicles` | object | ✓ | All surface expressions of this Hebrew category across languages. See below. |
| `illustrative_renderings` | array | | Major translation renderings showing the variance problem. Illustrative only — not structural. |
| `key_verses` | string[] | ✓ | 3–5 OSIS format verse refs. Example: `["Ps.136.1", "Mic.6.8", "1Jn.4.8"]` |
| `related_categories` | string[] | | IDs of semantically related Hebrew categories. |
| `theological_notes` | string | | Scholarly notes on translation history and contamination history. |
| `version` | string | | Schema version for this entry. Example: `"1.0"` |
| `reviewed_by` | enum | | `"ai-draft"` \| `"theologian-reviewed"` \| `"approved"` |

### `surface_vehicles` object

```json
{
  "hebrew_lexemes": ["chesed", "racham"],
  "strongs_hebrew": ["H2617", "H7356"],
  "lxx_greek": ["agape", "eleos"],
  "nt_greek": ["agape", "charis"],
  "strongs_greek": ["G26", "G5485"],
  "english_glosses": [
    "love", "lovingkindness", "mercy",
    "steadfast love", "grace", "kindness"
  ]
}
```

### `illustrative_renderings` array

```json
[
  { "translation": "ESV",  "text": "steadfast love" },
  { "translation": "KJV",  "text": "lovingkindness" },
  { "translation": "NIV",  "text": "unfailing love" },
  { "translation": "NKJV", "text": "mercy" },
  { "translation": "CSB",  "text": "faithful love" }
]
```

---

## Layer 2 — `data/lexeme-map.json`

Maps every relevant Strong's ID to its Hebrew category.

### Top-level structure

```json
{
  "version": "1.0",
  "generated": "ISO 8601 date",
  "entries": [ ]
}
```

### Lexeme map entry fields

| Field | Type | Required | Description |
|---|---|---|---|
| `strongs_id` | string | ✓ | Strong's ID. Prefix H for Hebrew, G for Greek. Example: `"G26"`, `"H2617"` |
| `lexeme` | string | ✓ | Transliterated word. Example: `"agape"`, `"chesed"` |
| `original_script` | string | | Word in original script. Example: `"ἀγάπη"`, `"חֶסֶד"` |
| `language` | enum | ✓ | `"hebrew"` \| `"greek"` \| `"aramaic"` |
| `lxx_source_hebrew` | string | | For Greek entries: Strong's H ID of the Hebrew word this Greek renders in the LXX. The philological link proving Hebrew category continuity. |
| `hebrew_category_id` | string | ✓ | Foreign key into `categories.json`. Example: `"chesed"` |
| `category_confidence` | enum | | `"primary"` \| `"partial"` \| `"contextual"` |
| `usage_notes` | string | | How this lexeme carries the Hebrew category. Authorial usage patterns. |
| `exceptions` | string | | Cases where this lexeme does NOT carry the category mapping. |

---

## Layer 3 — `data/verse-index.json`

Translation-independent verse tagging. Tags word positions in the original language text.

**No translation text is stored in this file.**

### Top-level structure

```json
{
  "version": "1.0",
  "generated": "ISO 8601 date",
  "entries": [ ]
}
```

### Verse index entry fields

| Field | Type | Required | Description |
|---|---|---|---|
| `verse_ref` | string | ✓ | OSIS standard reference. Example: `"1JN.4.8"`, `"GEN.1.1"`, `"PS.23.1"` |
| `source_text` | enum | ✓ | `"masoretic"` \| `"greek"` \| `"aramaic"` |
| `tagged_words` | array | ✓ | Array of word tag objects. |

### Tagged word object fields

| Field | Type | Required | Description |
|---|---|---|---|
| `original_word` | string | ✓ | Transliterated original language word. Example: `"agape"` |
| `original_script` | string | | Word in original script characters. |
| `strongs_id` | string | ✓ | Strong's ID. Used by app to resolve to English word in user's translation. |
| `word_position` | integer | ✓ | 1-indexed position in the original language verse. |
| `hebrew_category_id` | string | ✓ | Foreign key into `categories.json`. What fires when the user taps this word. |
| `context_note` | string | | Verse-specific note if the category application needs contextual nuance here. |

### Why no translation property

The app loads the user's preferred translation and uses Strong's-tagged interlinear alignment data to resolve word positions to English words at render time. The same verse index entry serves ESV, KJV, NIV, NKJV, CSB, or any other translation without modification.

---

## Key Design Rule

The Hebrew category sits at the center of the entire system. All Greek lexemes, English glosses, and translation variants orbit it as surface expressions of the same underlying concept.

One entry for `chesed` serves every verse across both Testaments where that category appears — in Hebrew as `chesed`, in Greek as `agape` or `eleos`, in English as "love," "lovingkindness," "mercy," or "steadfast love." The reader who taps any of those English words in any of those verses encounters the same Hebrew thought category entry.
