# Kardia Rendering Principles

**Status:** Canonical — governs all `kardia_rendering` fields and `_kardia_verses` translations  
**License:** MIT

---

## The Core Principle

The `kardia_rendering` and `_kardia_verses` translations carry Hebrew category meaning into English through **natural phrasing** — not label insertion. The category shapes the diction. It does not appear as a gloss.

A Kardia translation should read as translation, not annotation.

**Wrong approach:** Replace the English word with the category label.  
> "My people do not *covenant-know*" ← mechanical. Unreadable. Defeats the purpose.

**Right approach:** Let the Hebrew category determine how you phrase the meaning.  
> "My people have broken the bond of knowing" ← natural. Carries the relational rupture yāḏaʿ names.

---

## The Test

Before finalizing a `_kardia_verses` rendering, ask:

1. **Would a reader understand this without footnotes?** If the phrasing requires explanation to make sense, rephrase.
2. **Does the phrasing carry the Hebrew category's actual semantic weight?** If a conventional English word could do the same job, the Kardia rendering isn't earning its place.
3. **Is the category shaping the diction or decorating it?** The category should determine word choice and phrasing at the level of meaning, not surface.

---

## Guidelines by Category Type

### For action/relational categories (chesed, yada, racham, etc.)

The category is most naturally carried by **verb phrases and relational constructions** rather than noun substitution.

- *yāḏaʿ*: "holds in knowing," "stands within the bond," "has broken the bond of knowing," "the knowing that constitutes relationship"
- *chesed*: "faithful covenant love" works as a noun phrase but becomes strained as a verb — prefer "shows covenant faithfulness toward," "holds the bond toward"
- *racham*: "the womb-deep compassion that moves toward," "moved with the kind of love a mother has for the child she bore"

### For presence/weight categories (kavod, shekinah, panim)

These are best carried by **concrete spatial and physical language** — avoid abstraction.

- *kavod*: "the weight of his presence," "his presence pressed in," "filling the space with his actual nearness" — not "glory" without qualification
- Let the physical rootedness of the Hebrew show in English.

### For inner-person categories (nephesh, lev-levav, ruach)

These resist single-word substitution. Use **descriptive phrases that preserve wholeness**.

- *nephesh*: "his whole living self," "the full weight of who he was," "every breath of him" — context determines which dimension is foregrounded
- *lev*: "the seat of all his thinking and choosing," "where his covenant loyalties lived," "his deepest operative self" — not "heart" without unpacking what that means
- **Avoid inserting the category label as a compound modifier** ("whole inner person — seat of thought, will, and covenant loyalty" is too long for verse text; reserve that phrasing for the `kardia_rendering` field and theological notes)

### For sin/redemption categories (kaphar, chata, pesha)

Carry the **relational rupture frame**, not the legal/juridical frame.

- *chata*: "missed the mark of the relationship," "stepped outside the covenant bond" — not "transgressed the law"
- *kaphar*: "covered over and restored," "made the bond whole again" — not "paid the penalty for"

---

## Verse-by-Verse Rendering Decisions

The same Hebrew word may call for different English phrasing in different verses. The context — literary type, speaker, relational dynamic, emotional register — determines how the category surfaces.

### Example: yāḏaʿ across its key verses

| Verse | Context | Mechanical (wrong) | Natural Kardia rendering |
|---|---|---|---|
| Hos 4:6 | Prophetic indictment — covenant rupture | "lack of covenant knowing" | "they have abandoned the bond of knowing me" |
| Jer 31:34 | Eschatological promise — covenant restoration | "hold covenant knowing of me" | "they will all know me from within the bond — directly, from least to greatest" |
| Jer 1:5 | Divine election — covenant commissioning | "held you in covenant knowing" | "I claimed you as my own before you drew breath" |
| Exod 33:17 | Divine favor — covenant intimacy | "hold you in covenant knowing by name" | "I know you — you by name, you specifically — and that is why you have found favor" |
| Isa 1:3 | Lament over Israel's covenant failure | "Israel does not covenant-know" | "Israel no longer knows its owner — the bond has gone dead" |

Notice that the rendering shifts register, syntax, and even structure verse by verse. What stays constant is the **covenantal relational meaning**, not the phrase.

### Example: nephesh across its key verses

| Verse | Context | Mechanical (wrong) | Natural Kardia rendering |
|---|---|---|---|
| Gen 2:7 | Creation — Adam becoming alive | "became a living self" | "the man became a living being — the dust, alive" *(nephesh chayyah needs both words)* |
| Deut 6:5 | Shema — total covenant devotion | "with all your living self" | "with every fiber of your being" or "with all that you are" |
| Ps 42:1 | Lament — whole-person longing | "my living self pants" | "I am panting for you — everything I am, thirsting" |
| Ps 103:1 | Praise — whole-person blessing | "O my living self, bless" | "Everything I am — bless YHWH" |
| Mark 8:35 | Discipleship — total self-surrender | "save his living self" | "save his whole life" *(psyche here = nephesh; 'life' works when the context is physical)* |

---

## The `kardia_rendering` Field vs. `_kardia_verses`

These serve different purposes and should be handled differently:

**`kardia_rendering`** — a concise descriptor for the category, used in lexicon display, search results, and reference. It can be a noun phrase that names the concept, even if it wouldn't work smoothly dropped into a verse. Examples:
- `"faithful covenant love"` (chesed)
- `"living self"` (nephesh)
- `"covenant knowing"` (yada)
- `"the manifest weight of YHWH's presence"` (kavod)

**`_kardia_verses`** — actual translation of specific verses. Must be smooth, readable English. The category meaning should be **felt in the phrasing**, not visible as a label.

If inserting the `kardia_rendering` phrase directly into the verse produces awkward English, that is a signal to rephrase — not to accept the awkwardness.

---

## Guard-Rail Check for Renderings

Before finalizing any Kardia rendering, confirm:

- [ ] Does it carry the Hebrew category's primary semantic weight?
- [ ] Is it free of Augustinian, Platonic, or Reformation imports?
- [ ] Does it read as natural English without requiring footnotes?
- [ ] For watch-point words: does it avoid the contamination framing named in GR-01 through GR-06?
- [ ] For NT entries: does it carry the LXX antecedent register, not a Greek philosophical register?
- [ ] Is the physical/embodied/relational dimension preserved?
- [ ] Is it contextually fitted to this specific verse, not mechanically applied from the category label?
