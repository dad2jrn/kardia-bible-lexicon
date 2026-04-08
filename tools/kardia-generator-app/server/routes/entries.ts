import { Router, Request, Response } from 'express';
import db from '../db.js';

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a human book name + chapter:verse to OSIS format.
 *  e.g. "Psalm 136:1" → "Ps.136.1",  "Genesis 1:1" → "Gen.1.1"
 *  Falls back to the raw input if no match found. */
const BOOK_MAP: Record<string, string> = {
  genesis: 'Gen', gen: 'Gen',
  exodus: 'Exod', exod: 'Exod', exo: 'Exod',
  leviticus: 'Lev', lev: 'Lev',
  numbers: 'Num', num: 'Num',
  deuteronomy: 'Deut', deut: 'Deut', deu: 'Deut',
  joshua: 'Josh', josh: 'Josh', jos: 'Josh',
  judges: 'Judg', judg: 'Judg', jdg: 'Judg',
  ruth: 'Ruth',
  '1 samuel': '1Sam', '1samuel': '1Sam', '1sam': '1Sam',
  '2 samuel': '2Sam', '2samuel': '2Sam', '2sam': '2Sam',
  '1 kings': '1Kgs', '1kings': '1Kgs', '1kgs': '1Kgs',
  '2 kings': '2Kgs', '2kings': '2Kgs', '2kgs': '2Kgs',
  '1 chronicles': '1Chr', '1chronicles': '1Chr', '1chr': '1Chr',
  '2 chronicles': '2Chr', '2chronicles': '2Chr', '2chr': '2Chr',
  ezra: 'Ezra',
  nehemiah: 'Neh', neh: 'Neh',
  esther: 'Esth', esth: 'Esth', est: 'Esth',
  job: 'Job',
  psalm: 'Ps', psalms: 'Ps', ps: 'Ps', psa: 'Ps',
  proverbs: 'Prov', prov: 'Prov', pro: 'Prov',
  ecclesiastes: 'Eccl', eccl: 'Eccl', ecc: 'Eccl',
  'song of solomon': 'Song', 'song of songs': 'Song', song: 'Song', sos: 'Song',
  isaiah: 'Isa', isa: 'Isa',
  jeremiah: 'Jer', jer: 'Jer',
  lamentations: 'Lam', lam: 'Lam',
  ezekiel: 'Ezek', ezek: 'Ezek', eze: 'Ezek',
  daniel: 'Dan', dan: 'Dan',
  hosea: 'Hos', hos: 'Hos',
  joel: 'Joel',
  amos: 'Amos',
  obadiah: 'Obad', obad: 'Obad',
  jonah: 'Jonah', jon: 'Jonah',
  micah: 'Mic', mic: 'Mic',
  nahum: 'Nah', nah: 'Nah',
  habakkuk: 'Hab', hab: 'Hab',
  zephaniah: 'Zeph', zeph: 'Zeph',
  haggai: 'Hag', hag: 'Hag',
  zechariah: 'Zech', zech: 'Zech',
  malachi: 'Mal', mal: 'Mal',
  matthew: 'Matt', matt: 'Matt', mat: 'Matt',
  mark: 'Mark', mrk: 'Mark',
  luke: 'Luke', luk: 'Luke',
  john: 'John', jhn: 'John',
  acts: 'Acts', act: 'Acts',
  romans: 'Rom', rom: 'Rom',
  '1 corinthians': '1Cor', '1corinthians': '1Cor', '1cor': '1Cor',
  '2 corinthians': '2Cor', '2corinthians': '2Cor', '2cor': '2Cor',
  galatians: 'Gal', gal: 'Gal',
  ephesians: 'Eph', eph: 'Eph',
  philippians: 'Phil', phil: 'Phil',
  colossians: 'Col', col: 'Col',
  '1 thessalonians': '1Thess', '1thessalonians': '1Thess', '1thess': '1Thess',
  '2 thessalonians': '2Thess', '2thessalonians': '2Thess', '2thess': '2Thess',
  '1 timothy': '1Tim', '1timothy': '1Tim', '1tim': '1Tim',
  '2 timothy': '2Tim', '2timothy': '2Tim', '2tim': '2Tim',
  titus: 'Titus', tit: 'Titus',
  philemon: 'Phlm', phlm: 'Phlm',
  hebrews: 'Heb', heb: 'Heb',
  james: 'Jas', jas: 'Jas',
  '1 peter': '1Pet', '1peter': '1Pet', '1pet': '1Pet',
  '2 peter': '2Pet', '2peter': '2Pet', '2pet': '2Pet',
  '1 john': '1John', '1john': '1John', '1jn': '1John',
  '2 john': '2John', '2john': '2John', '2jn': '2John',
  '3 john': '3John', '3john': '3John', '3jn': '3John',
  jude: 'Jude',
  revelation: 'Rev', rev: 'Rev',
};

function toOsis(raw: string): string {
  // Match patterns like "Psalm 136:1", "Gen. 1:1", "1 John 4:8"
  const m = raw.match(/^([\d\s]*[A-Za-z]+\.?(?:\s+[A-Za-z]+)*)\s+(\d+):(\d+)/);
  if (!m) return raw;
  const bookRaw = m[1].replace(/\.$/, '').trim().toLowerCase();
  const chapter = m[2];
  const verse = m[3];
  const osis = BOOK_MAP[bookRaw];
  if (!osis) return raw;
  return `${osis}.${chapter}.${verse}`;
}

/** Ensure a Strong's ID exists in the strongs table. */
function ensureStrongs(id: string) {
  const lang = id.startsWith('H') ? 'hebrew' : 'greek';
  db.prepare('INSERT OR IGNORE INTO strongs (id, language) VALUES (?, ?)').run(id, lang);
}

/** Ensure a translation ID exists in the translations table. */
function ensureTranslation(id: string) {
  db.prepare('INSERT OR IGNORE INTO translations (id, full_name) VALUES (?, ?)').run(id, id);
}

// ---------------------------------------------------------------------------
// Entry reconstruction helper — builds the full entry JSON from normalized rows
// ---------------------------------------------------------------------------

interface CategoryRow {
  id: string;
  hebrew_root: string;
  transliteration: string;
  alternate_spellings: string | null;
  testament_scope: string;
  semantic_domain_id: string;
  textual_layer_id: string;
  watch_point_flag: number;
  category_label: string;
  one_liner: string;
  full_definition: string;
  what_it_does: string;
  what_it_is_not: string;
  second_temple_context: string;
  theological_notes: string;
  kardia_rendering: string;
  developmental_note: string | null;
  status: string;
  version: string;
  license: string;
  reviewed_by: string | null;
  last_updated: string;
  iterations: number | null;
  related_category_ids: string | null;
}

function reconstructEntry(cat: CategoryRow) {
  const id = cat.id;

  const keyVerses = (
    db.prepare('SELECT osis_ref FROM category_key_verses WHERE category_id = ? ORDER BY sort_order').all(id) as { osis_ref: string }[]
  ).map(r => r.osis_ref);

  const kardiaVerses = db
    .prepare('SELECT osis_ref, standard_rendering, kardia_translation FROM kardia_verses WHERE category_id = ?')
    .all(id) as { osis_ref: string; standard_rendering: string; kardia_translation: string }[];

  const illustrative = (
    db.prepare('SELECT translation_id, osis_ref, text FROM illustrative_renderings WHERE category_id = ?').all(id) as {
      translation_id: string; osis_ref: string; text: string;
    }[]
  ).map(r => ({ translation: r.translation_id, text: r.text }));

  const recommended = (
    db.prepare('SELECT gloss FROM english_glosses_recommended WHERE category_id = ? ORDER BY sort_order').all(id) as { gloss: string }[]
  ).map(r => r.gloss);

  const attestedRows = db
    .prepare('SELECT id, gloss, loses FROM english_glosses_attested WHERE category_id = ?')
    .all(id) as { id: number; gloss: string; loses: string }[];

  const attested = attestedRows.map(row => {
    const found_in = (
      db.prepare('SELECT translation_id FROM attested_gloss_translations WHERE attested_gloss_id = ?').all(row.id) as { translation_id: string }[]
    ).map(r => r.translation_id);
    return { gloss: row.gloss, found_in, loses: row.loses };
  });

  const hebLexemes = db
    .prepare('SELECT lexeme, strongs_id FROM category_hebrew_lexemes WHERE category_id = ?')
    .all(id) as { lexeme: string; strongs_id: string }[];

  const lxxLexemes = db
    .prepare('SELECT lexeme, strongs_id FROM category_lxx_lexemes WHERE category_id = ? ORDER BY frequency_rank NULLS LAST')
    .all(id) as { lexeme: string; strongs_id: string }[];

  const ntLexemes = db
    .prepare('SELECT lexeme, strongs_id FROM category_nt_lexemes WHERE category_id = ? ORDER BY frequency_rank NULLS LAST')
    .all(id) as { lexeme: string; strongs_id: string }[];

  return {
    id: cat.id,
    hebrew_root: cat.hebrew_root,
    transliteration: cat.transliteration,
    testament_scope: cat.testament_scope,
    semantic_domain_id: cat.semantic_domain_id,
    textual_layer_id: cat.textual_layer_id,
    category_label: cat.category_label,
    one_liner: cat.one_liner,
    full_definition: cat.full_definition,
    what_it_does: cat.what_it_does,
    what_it_is_not: cat.what_it_is_not,
    second_temple_context: cat.second_temple_context,
    theological_notes: cat.theological_notes,
    kardia_rendering: cat.kardia_rendering,
    developmental_note: cat.developmental_note ?? undefined,
    status: cat.status,
    version: cat.version,
    reviewed_by: cat.reviewed_by ?? undefined,
    last_updated: cat.last_updated,
    _iterations: cat.iterations ?? 1,
    related_categories: JSON.parse(cat.related_category_ids ?? '[]'),
    key_verses: keyVerses,
    _kardia_verses: kardiaVerses,
    illustrative_renderings: illustrative,
    surface_vehicles: {
      hebrew_lexemes: hebLexemes.map(r => r.lexeme),
      strongs_hebrew: hebLexemes.map(r => r.strongs_id),
      lxx_greek: lxxLexemes.map(r => r.lexeme),
      nt_greek: ntLexemes.map(r => r.lexeme),
      strongs_greek: [...new Set([...lxxLexemes.map(r => r.strongs_id), ...ntLexemes.map(r => r.strongs_id)])],
      english_glosses: {
        recommended,
        attested,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Upsert transaction — decomposes a full entry JSON into normalized rows
// ---------------------------------------------------------------------------

function upsertEntry(entry: Record<string, unknown>) {
  const id = entry.id as string;

  const upsert = db.transaction(() => {
    // 1. Pre-populate strongs for all lexeme IDs referenced
    const hebStrongs = (entry.strongs_hebrew as string[] | undefined) ?? [];
    const greekStrongs = (entry.strongs_greek as string[] | undefined) ?? [];
    const surfaceVehicles = (entry.surface_vehicles as Record<string, unknown> | undefined) ?? {};
    const svHebStrongs = (surfaceVehicles.strongs_hebrew as string[] | undefined) ?? [];
    const svGreekStrongs = (surfaceVehicles.strongs_greek as string[] | undefined) ?? [];

    for (const sid of [...hebStrongs, ...greekStrongs, ...svHebStrongs, ...svGreekStrongs]) {
      if (sid) ensureStrongs(sid);
    }

    // 2. Upsert the main categories row
    db.prepare(`
      INSERT INTO categories (
        id, hebrew_root, transliteration, alternate_spellings,
        testament_scope, semantic_domain_id, textual_layer_id, watch_point_flag,
        category_label, one_liner, full_definition, what_it_does,
        what_it_is_not, second_temple_context, theological_notes, kardia_rendering,
        developmental_note, status, version, license, reviewed_by,
        last_updated, iterations, related_category_ids
      ) VALUES (
        @id, @hebrew_root, @transliteration, @alternate_spellings,
        @testament_scope, @semantic_domain_id, @textual_layer_id, @watch_point_flag,
        @category_label, @one_liner, @full_definition, @what_it_does,
        @what_it_is_not, @second_temple_context, @theological_notes, @kardia_rendering,
        @developmental_note, @status, @version, @license, @reviewed_by,
        date('now'), @iterations, @related_category_ids
      )
      ON CONFLICT(id) DO UPDATE SET
        hebrew_root           = excluded.hebrew_root,
        transliteration       = excluded.transliteration,
        alternate_spellings   = excluded.alternate_spellings,
        testament_scope       = excluded.testament_scope,
        semantic_domain_id    = excluded.semantic_domain_id,
        textual_layer_id      = excluded.textual_layer_id,
        watch_point_flag      = excluded.watch_point_flag,
        category_label        = excluded.category_label,
        one_liner             = excluded.one_liner,
        full_definition       = excluded.full_definition,
        what_it_does          = excluded.what_it_does,
        what_it_is_not        = excluded.what_it_is_not,
        second_temple_context = excluded.second_temple_context,
        theological_notes     = excluded.theological_notes,
        kardia_rendering      = excluded.kardia_rendering,
        developmental_note    = excluded.developmental_note,
        status                = excluded.status,
        version               = excluded.version,
        reviewed_by           = excluded.reviewed_by,
        last_updated          = date('now'),
        iterations            = excluded.iterations,
        related_category_ids  = excluded.related_category_ids
    `).run({
      id,
      hebrew_root: entry.hebrew_root as string,
      transliteration: entry.transliteration as string,
      alternate_spellings: entry.alternate_spellings
        ? JSON.stringify(entry.alternate_spellings)
        : null,
      testament_scope: entry.testament_scope as string,
      semantic_domain_id: entry.semantic_domain_id as string,
      textual_layer_id: entry.textual_layer_id as string,
      watch_point_flag: entry.watch_point_flag ? 1 : 0,
      category_label: entry.category_label as string,
      one_liner: entry.one_liner as string,
      full_definition: entry.full_definition as string,
      what_it_does: entry.what_it_does as string,
      what_it_is_not: entry.what_it_is_not as string,
      second_temple_context: entry.second_temple_context as string,
      theological_notes: entry.theological_notes as string,
      kardia_rendering: entry.kardia_rendering as string,
      developmental_note: (entry.developmental_note as string | undefined) ?? null,
      status: (entry.status as string | undefined) ?? 'approved',
      version: (entry.version as string | undefined) ?? '1.0.0',
      license: 'MIT',
      reviewed_by: (entry.reviewed_by as string | undefined) ?? null,
      iterations: (entry._iterations as number | undefined) ?? 1,
      related_category_ids: JSON.stringify(
        (entry.related_categories as string[] | undefined) ?? []
      ),
    });

    // 3. key_verses
    db.prepare('DELETE FROM category_key_verses WHERE category_id = ?').run(id);
    const keyVerses = (entry.key_verses as string[] | undefined) ?? [];
    const insertKV = db.prepare(
      'INSERT INTO category_key_verses (category_id, osis_ref, sort_order) VALUES (?, ?, ?)'
    );
    keyVerses.forEach((ref, i) => insertKV.run(id, ref, i));

    // 4. kardia_verses
    db.prepare('DELETE FROM kardia_verses WHERE category_id = ?').run(id);
    const kardiaVerses = (entry._kardia_verses as Array<{
      osis_ref?: string; verse_ref?: string;
      standard_rendering: string; kardia_translation: string;
    }> | undefined) ?? [];
    const insertKardiaVerse = db.prepare(
      'INSERT INTO kardia_verses (category_id, osis_ref, standard_rendering, kardia_translation) VALUES (?, ?, ?, ?)'
    );
    for (const kv of kardiaVerses) {
      const ref = kv.osis_ref ?? kv.verse_ref ?? '';
      insertKardiaVerse.run(id, ref, kv.standard_rendering, kv.kardia_translation);
    }

    // 5. illustrative_renderings
    db.prepare('DELETE FROM illustrative_renderings WHERE category_id = ?').run(id);
    const illustrative = (entry.illustrative_renderings as Array<{
      translation: string; text: string; osis_ref?: string;
    }> | undefined) ?? [];
    const insertIllus = db.prepare(
      'INSERT INTO illustrative_renderings (category_id, translation_id, osis_ref, text) VALUES (?, ?, ?, ?)'
    );
    for (const ir of illustrative) {
      ensureTranslation(ir.translation);
      // Extract OSIS ref from text if not provided explicitly
      const osis = ir.osis_ref ?? toOsis(ir.text.split(' — ')[0].trim());
      insertIllus.run(id, ir.translation, osis, ir.text);
    }

    // 6 & 7. english_glosses (recommended + attested)
    db.prepare('DELETE FROM english_glosses_recommended WHERE category_id = ?').run(id);
    db.prepare('DELETE FROM english_glosses_attested WHERE category_id = ?').run(id);

    const sv = (entry.surface_vehicles as Record<string, unknown> | undefined) ?? {};
    const glosses = (sv.english_glosses as Record<string, unknown> | undefined) ?? {};

    const recommended = (glosses.recommended as string[] | undefined) ?? [];
    const insertRec = db.prepare(
      'INSERT INTO english_glosses_recommended (category_id, gloss, sort_order) VALUES (?, ?, ?)'
    );
    recommended.forEach((g, i) => insertRec.run(id, g, i));

    const attested = (glosses.attested as Array<{
      gloss: string; found_in: string[]; loses: string;
    }> | undefined) ?? [];
    const insertAtt = db.prepare(
      'INSERT INTO english_glosses_attested (category_id, gloss, loses) VALUES (?, ?, ?)'
    );
    const insertAttTrans = db.prepare(
      'INSERT OR IGNORE INTO attested_gloss_translations (attested_gloss_id, translation_id) VALUES (?, ?)'
    );
    for (const a of attested) {
      const result = insertAtt.run(id, a.gloss, a.loses);
      const glossId = result.lastInsertRowid;
      for (const tid of (a.found_in ?? [])) {
        ensureTranslation(tid);
        insertAttTrans.run(glossId, tid);
      }
    }

    // 8. category_hebrew_lexemes
    db.prepare('DELETE FROM category_hebrew_lexemes WHERE category_id = ?').run(id);
    const hebLexemes = (sv.hebrew_lexemes as string[] | undefined) ?? [];
    const hebStrongsIds = (sv.strongs_hebrew as string[] | undefined) ?? [];
    const insertHeb = db.prepare(
      'INSERT INTO category_hebrew_lexemes (category_id, lexeme, strongs_id, is_primary) VALUES (?, ?, ?, ?)'
    );
    hebLexemes.forEach((lexeme, i) => {
      const sid = hebStrongsIds[i];
      if (sid) {
        ensureStrongs(sid);
        insertHeb.run(id, lexeme, sid, i === 0 ? 1 : 0);
      }
    });

    // 9. category_lxx_lexemes
    db.prepare('DELETE FROM category_lxx_lexemes WHERE category_id = ?').run(id);
    const lxxLexemes = (sv.lxx_greek as string[] | undefined) ?? [];
    const insertLxx = db.prepare(
      'INSERT INTO category_lxx_lexemes (category_id, lexeme, strongs_id, frequency_rank) VALUES (?, ?, ?, ?)'
    );
    // strongs_greek covers both LXX and NT — use what we have
    const allGreekStrongs = (sv.strongs_greek as string[] | undefined) ?? [];
    lxxLexemes.forEach((lexeme, i) => {
      const sid = allGreekStrongs[i] ?? `G_lxx_${i}`;
      if (!sid.startsWith('G_lxx_')) ensureStrongs(sid);
      insertLxx.run(id, lexeme, sid, i + 1);
    });

    // 10. category_nt_lexemes
    db.prepare('DELETE FROM category_nt_lexemes WHERE category_id = ?').run(id);
    const ntLexemes = (sv.nt_greek as string[] | undefined) ?? [];
    const insertNt = db.prepare(
      'INSERT INTO category_nt_lexemes (category_id, lexeme, strongs_id, frequency_rank) VALUES (?, ?, ?, ?)'
    );
    ntLexemes.forEach((lexeme, i) => {
      // NT Greek shares strongs_greek pool; index offset past LXX entries
      const sid = allGreekStrongs[i] ?? `G_nt_${i}`;
      if (!sid.startsWith('G_nt_')) ensureStrongs(sid);
      insertNt.run(id, lexeme, sid, i + 1);
    });
  });

  upsert();
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET /api/entries — return all approved entries, fully reconstructed
router.get('/', (_req: Request, res: Response) => {
  const cats = db
    .prepare('SELECT * FROM categories ORDER BY last_updated DESC')
    .all() as CategoryRow[];
  const entries = cats.map(reconstructEntry);
  res.json(entries);
});

// POST /api/entries — upsert a full entry
router.post('/', (req: Request, res: Response) => {
  const entry = req.body as Record<string, unknown>;

  if (!entry.id) {
    res.status(400).json({ error: 'id is required' });
    return;
  }

  const required = [
    'hebrew_root', 'transliteration', 'testament_scope',
    'semantic_domain_id', 'textual_layer_id',
    'category_label', 'one_liner', 'full_definition',
    'what_it_does', 'what_it_is_not', 'second_temple_context',
    'theological_notes', 'kardia_rendering',
  ] as const;

  for (const field of required) {
    if (!entry[field]) {
      res.status(400).json({ error: `${field} is required` });
      return;
    }
  }

  try {
    upsertEntry(entry);
    res.status(201).json({ ok: true, id: entry.id });
  } catch (err) {
    console.error('[POST /api/entries]', err);
    res.status(500).json({ error: String(err) });
  }
});

// PUT /api/entries/:id — partial update (kardia verses or scalar category fields)
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }

  const body = req.body as Record<string, unknown>;

  try {
    const patch = db.transaction(() => {
      // Patch kardia_verses if provided
      if (Array.isArray(body.kardia_verses)) {
        db.prepare('DELETE FROM kardia_verses WHERE category_id = ?').run(id);
        const insertKV = db.prepare(
          'INSERT INTO kardia_verses (category_id, osis_ref, standard_rendering, kardia_translation) VALUES (?, ?, ?, ?)'
        );
        for (const kv of body.kardia_verses as Array<{
          osis_ref?: string; verse_ref?: string;
          standard_rendering: string; kardia_translation: string;
        }>) {
          const ref = kv.osis_ref ?? kv.verse_ref ?? '';
          insertKV.run(id, ref, kv.standard_rendering, kv.kardia_translation);
        }
      }

      // Patch scalar category fields if provided
      const scalars: Record<string, unknown> = {};
      const allowed = [
        'status', 'reviewed_by', 'iterations', 'version',
        'theological_notes', 'kardia_rendering', 'developmental_note',
      ] as const;
      for (const key of allowed) {
        if (body[key] !== undefined) scalars[key] = body[key];
      }
      if (Object.keys(scalars).length > 0) {
        const sets = Object.keys(scalars).map(k => `${k} = @${k}`).join(', ');
        db.prepare(`UPDATE categories SET ${sets}, last_updated = date('now') WHERE id = @id`)
          .run({ ...scalars, id });
      }
    });

    patch();
    res.json({ ok: true, id });
  } catch (err) {
    console.error('[PUT /api/entries/:id]', err);
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/entries/:id — ON DELETE CASCADE handles child rows
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }
  res.json({ ok: true, id });
});

export default router;
