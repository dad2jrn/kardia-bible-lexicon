# Kardia Bible Lexicon

An open source Hebrew thought category database serving as the semantic layer beneath the English Bible. Every English word in any translation resolves through its Greek or Hebrew lexeme to a Hebrew thought category entry.

**The Hebrew category is always primary. Greek is the vehicle. Hebrew is the thought.**

---

## Purpose

The Kardia Lexicon exists to recover the full Second Temple Jewish conceptual world behind the English Bible — available to anyone. Scholars, developers, Bible app builders, pastors, and lay readers.

Most English Bible readers encounter the text through a pipeline that moves steadily away from the original authors' thought world:

```
Greek lexicon (often Hellenistic definitions)
       ↓
English gloss
       ↓
Western theological category (often Augustinian or Reformed)
       ↓
Reader
```

The Kardia Lexicon reverses this. It grounds every English word — in both Testaments — in its underlying Hebrew thought category, recovers the Second Temple Jewish meaning, and makes that meaning available at the word level for any reader.

---

## Architecture

The lexicon is organized in three layers:

### Layer 1 — `data/categories.json`
The authoritative theological content. One entry per Hebrew thought category. Contains full definitions, surface vehicles across Hebrew/LXX/NT Greek/English, key verses, related categories, and illustrative renderings across translations.

### Layer 2 — `data/lexeme-map.json`
The bridge layer. Maps every relevant Strong's ID (Hebrew and Greek) to its Hebrew category ID. Includes LXX source Hebrew, usage notes, and exception cases where context governs meaning.

### Layer 3 — `data/verse-index.json`
Translation-independent verse tagging. Tags word positions in the original language text using Strong's IDs. **No translation text is stored here.** The app resolves to English at render time using its own interlinear alignment data — meaning this lexicon works with any Bible translation.

---

## Design Principles

**Translation independence** — No translation text is stored in the database. Strong's numbers and original language words are public domain. The lexicon works with ESV, NIV, KJV, NKJV, CSB, or any translation that provides Strong's-tagged interlinear data.

**Hebrew categories for both Testaments** — The New Testament authors were First Century Jews writing in Greek but thinking in Hebrew. When they chose a Greek word, they chose the word that most closely carried the Hebrew category they had in mind. The LXX (Septuagint) is the philological bridge — NT authors followed LXX vocabulary choices, which had already encoded Hebrew meaning into Greek words. There is no separate Greek category layer. The Hebrew category is primary for both Testaments.

**Second Temple Jewish reader test** — Every definition asks: what would a First Century Jew, steeped in Torah and Prophets, living in a synagogue community with a covenantal and eschatological horizon, have understood this word to mean in their body, their community, and their covenant history?

---

## Guard Rails

These constraints govern every entry in the lexicon:

- **Never** import Augustinian categories — no soul/body dualism, no inherited guilt as legal status, no concupiscence. Fourth-century Western impositions.
- **Never** use Greek philosophical categories as primary meaning — Platonic immortal soul, Stoic logos, Aristotelian virtue ethics are contrast only, never definition.
- **Never** use Reformation systematic theology as interpretive grid — TULIP, Westminster covenant theology, Lutheran Law/Gospel schema are post-biblical constructs.
- **Never** flatten Hebrew words to their weakest English gloss.
- **Always** ground NT Greek in LXX antecedents and the Hebrew categories those words were chosen to carry.
- **Always** apply the Second Temple Jewish reader test.

### Six Contamination Watch Points

| Word | Never | Always |
|---|---|---|
| nephesh | immortal soul | whole animated person — breath and body together |
| sarx / basar | body as morally suspect | creaturely limitation and mortality |
| yirah | dread | reverent awe that produces willing alignment |
| mishpat | punitive judgment | right-ordering of relationship and community |
| kaphar | default penal substitution | covenantal restoration |
| chesed | unconditional sentiment | covenantal loyalty in action |

---

## 30 Seed Categories

### Group 1 — God and Covenant
`Elohim` · `YHWH` · `El Shaddai` · `chesed` · `emeth` · `berith`

### Group 2 — Human Nature
`nephesh` · `lev / levav` · `basar` · `ruach` · `yetzer`

### Group 3 — Relational and Ethical
`yada` · `shalom` · `teshuvah` · `mishpat` · `tsedaqah` · `racham` · `yirah`

### Group 4 — Worship and Presence
`kavod` · `shachah` · `dabar` · `qodesh` · `shem`

### Group 5 — Sin and Redemption
`chata` · `avon` · `pesha` · `kaphar` · `padah` · `ga'al` · `shub`

**Status: 0 / 30 complete**

---

## File Structure

```
kardia-bible-lexicon/
├── README.md
├── LICENSE
├── SCHEMA.md
├── data/
│   ├── categories.json       ← Layer 1: Hebrew category entries
│   ├── lexeme-map.json       ← Layer 2: Strong's ID → category bridge
│   └── verse-index.json      ← Layer 3: translation-independent verse tags
├── schemas/
│   ├── category.schema.json  ← JSON Schema for Layer 1 entries
│   ├── lexeme.schema.json    ← JSON Schema for Layer 2 entries
│   └── verse.schema.json     ← JSON Schema for Layer 3 entries
└── tools/
    └── kardia-generator.html ← Standalone AI generator tool
```

---

## Usage

The JSON files are designed to be consumed directly by any Bible app or API that provides Strong's-tagged interlinear data.

```javascript
// Example: resolve a Strong's ID to its Hebrew category
import lexemeMap from './data/lexeme-map.json';
import categories from './data/categories.json';

function getCategory(strongsId) {
  const mapping = lexemeMap.entries.find(e => e.strongs_id === strongsId);
  if (!mapping) return null;
  return categories.entries.find(c => c.id === mapping.hebrew_category_id);
}

// G26 (agape) → chesed entry
const category = getCategory('G26');
console.log(category.category_label); // "Covenant Loyalty"
console.log(category.one_liner);      // "The active, obligated faithfulness of a covenant partner..."
```

---

## Contributing

This project welcomes contributions from biblical scholars, Hebrew linguists, Second Temple Judaism specialists, and developers.

**Before contributing**, please read the Guard Rails section carefully. Every entry must pass the Second Temple Jewish reader test and must not import Western theological categories as primary meaning.

Contributions that introduce Augustinian, Platonic, or Reformation systematic theology framing as primary definitions will not be accepted.

---

## License

Creative Commons Attribution — Non-Commercial — Share Alike 4.0 International (CC BY-NC-SA 4.0)

You are free to share and adapt this material for non-commercial purposes, provided you give appropriate attribution and distribute your contributions under the same license.

See `LICENSE` for full terms.

---

## About

The Kardia Lexicon is part of the Kardia Bible project. The Kardia Bible app is one implementation of this resource — the reference use case — but the lexicon itself is open, distributable, and designed to integrate with any Bible platform, API, or reading environment that provides Strong's-tagged interlinear data.
