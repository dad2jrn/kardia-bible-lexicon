-- =============================================================================
-- KARDIA LEXICON — SQLite Database Schema
-- Version: 1.0.0
-- Architecture: Three-layer Hebrew thought category database
-- Hebrew is always primary. Greek is the vehicle. Hebrew is the thought.
-- =============================================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA encoding = 'UTF-8';


-- =============================================================================
-- LAYER 0 — REFERENCE TABLES
-- Controlled vocabulary. Populated once at init. Never app-mutated.
-- =============================================================================

CREATE TABLE semantic_domains (
    id          TEXT PRIMARY KEY,   -- 'god-covenant', 'human-nature', etc.
    label       TEXT NOT NULL,
    sort_order  INTEGER NOT NULL,
    notes       TEXT
);

CREATE TABLE textual_layers (
    id          TEXT PRIMARY KEY,   -- 'pre-exilic', 'exilic', 'post-exilic', 'second-temple', 'nt'
    label       TEXT NOT NULL,
    gr11_tier   INTEGER NOT NULL    -- 1 = physical/human primary; 2 = developmental; 3 = first-century frame
);

CREATE TABLE testament_scopes (
    id  TEXT PRIMARY KEY            -- 'ot', 'nt', 'both'
);

CREATE TABLE entry_statuses (
    id  TEXT PRIMARY KEY            -- 'draft', 'reviewed', 'approved'
);

CREATE TABLE source_texts (
    id          TEXT PRIMARY KEY,   -- 'BHS', 'NA28', 'LXX', 'LXX-Rahlfs'
    full_name   TEXT NOT NULL,
    testament   TEXT NOT NULL REFERENCES testament_scopes(id),
    edition     TEXT,
    license     TEXT
);

CREATE TABLE translations (
    id          TEXT PRIMARY KEY,   -- 'ESV', 'KJV', 'NIV', 'NASB', 'NLT', etc.
    full_name   TEXT NOT NULL,
    year        INTEGER,
    publisher   TEXT,
    license     TEXT,
    notes       TEXT
);


-- =============================================================================
-- LAYER 1 — CATEGORY DATABASE
-- One row per Hebrew thought category. The authoritative theological content.
-- =============================================================================

CREATE TABLE categories (
    -- Identity
    id                  TEXT PRIMARY KEY,   -- kebab-case, e.g. 'chesed', 'lev-levav'. Stable at 1.0.0+
    hebrew_root         TEXT NOT NULL,      -- Primary lemma in original Unicode script (Hebrew or Greek)
    transliteration     TEXT NOT NULL,      -- Standard academic transliteration
    alternate_spellings TEXT,               -- JSON array: other accepted transliterations

    -- Classification
    testament_scope     TEXT NOT NULL REFERENCES testament_scopes(id),
    semantic_domain_id  TEXT NOT NULL REFERENCES semantic_domains(id),
    textual_layer_id    TEXT NOT NULL REFERENCES textual_layers(id),
    watch_point_flag    INTEGER NOT NULL DEFAULT 0 CHECK (watch_point_flag IN (0,1)),
                        -- 1 = one of the six contamination watch points or GR-11 watch word

    -- Display
    category_label      TEXT NOT NULL,      -- Human-readable display label, max 80 chars
    one_liner           TEXT NOT NULL,      -- Irreducible core sentence. Hebrew-primary framed. Max 300 chars.

    -- Core theological content
    full_definition         TEXT NOT NULL,  -- Min 80 words. Passes GR-01 through GR-11.
    what_it_does            TEXT NOT NULL,  -- Functional description: how category operates in covenant life
    what_it_is_not          TEXT NOT NULL,  -- Primary contamination framings this category must be distinguished from
    second_temple_context   TEXT NOT NULL,  -- First Century Torah-steeped Jewish reader test. Min 60 words.
    theological_notes       TEXT NOT NULL,  -- Scholarly annotation: translation history, contamination vectors, reception history

    -- Rendering
    kardia_rendering        TEXT NOT NULL,  -- Preferred Kardia English phrase. Not a visible gloss; carries meaning.

    -- Spiritual-beings-reframed conditional
    developmental_note  TEXT,              -- REQUIRED when semantic_domain_id = 'spiritual-beings-reframed'

    -- Editorial metadata
    status              TEXT NOT NULL DEFAULT 'draft' REFERENCES entry_statuses(id),
    version             TEXT NOT NULL DEFAULT '0.1.0',  -- Semantic version
    license             TEXT NOT NULL DEFAULT 'MIT' CHECK (license = 'MIT'),
    reviewed_by         TEXT,
    last_updated        TEXT NOT NULL,      -- ISO 8601 date
    iterations          INTEGER,           -- Generator iterations used to produce this entry

    -- Computed / cache
    related_category_ids TEXT,             -- JSON array of category ids. Denormalized for query speed.

    CHECK (
        semantic_domain_id != 'spiritual-beings-reframed'
        OR developmental_note IS NOT NULL
    )
);

CREATE INDEX idx_categories_domain      ON categories(semantic_domain_id);
CREATE INDEX idx_categories_layer       ON categories(textual_layer_id);
CREATE INDEX idx_categories_scope       ON categories(testament_scope);
CREATE INDEX idx_categories_watch_point ON categories(watch_point_flag) WHERE watch_point_flag = 1;
CREATE INDEX idx_categories_status      ON categories(status);


-- Category → Category semantic relationships
-- Normalizes the JSON related_categories array into queryable rows
CREATE TABLE category_relations (
    from_category_id    TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    to_category_id      TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    relation_type       TEXT NOT NULL DEFAULT 'related',
                        -- 'related' | 'antonym' | 'hypernym' | 'hyponym' | 'cognate-root'
    notes               TEXT,
    PRIMARY KEY (from_category_id, to_category_id, relation_type)
);


-- Key verses (OSIS references demonstrating the category as defined)
CREATE TABLE category_key_verses (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id     TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    osis_ref        TEXT NOT NULL,  -- e.g. 'Gen.1.1', 'Ps.136.1'
    sort_order      INTEGER NOT NULL DEFAULT 0,
    note            TEXT,
    UNIQUE (category_id, osis_ref)
);

CREATE INDEX idx_key_verses_category ON category_key_verses(category_id);
CREATE INDEX idx_key_verses_ref      ON category_key_verses(osis_ref);


-- Changelog (audit trail for all changes after 1.0.0)
CREATE TABLE category_changelog (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id     TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    change_date     TEXT NOT NULL,      -- ISO 8601 date
    author          TEXT NOT NULL,
    summary         TEXT NOT NULL,
    semantic_change INTEGER NOT NULL CHECK (semantic_change IN (0,1)),
                    -- 1 = alters meaning → minor version bump; 0 = editorial fix → no bump
    version_before  TEXT,
    version_after   TEXT
);

CREATE INDEX idx_changelog_category ON category_changelog(category_id);
CREATE INDEX idx_changelog_date     ON category_changelog(change_date);


-- Kardia verse translations (working artifact — not canonical lexicon data)
CREATE TABLE kardia_verses (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id         TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    osis_ref            TEXT NOT NULL,
    standard_rendering  TEXT NOT NULL,  -- ESV or most common English for comparison
    kardia_translation  TEXT NOT NULL,  -- Contextually driven natural English. No mechanical gloss insertion.
    translation_basis   TEXT,           -- Which translation was used as the standard rendering base
    UNIQUE (category_id, osis_ref)
);

CREATE INDEX idx_kardia_verses_category ON kardia_verses(category_id);
CREATE INDEX idx_kardia_verses_ref      ON kardia_verses(osis_ref);


-- Illustrative renderings (comparison translations for key verses)
CREATE TABLE illustrative_renderings (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id     TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    translation_id  TEXT NOT NULL REFERENCES translations(id),
    osis_ref        TEXT NOT NULL,
    text            TEXT NOT NULL
);

CREATE INDEX idx_illustrative_category ON illustrative_renderings(category_id);


-- =============================================================================
-- LAYER 1 — SURFACE VEHICLES
-- The lexical vehicles through which each Hebrew category travels across languages
-- =============================================================================

-- Strong's master registry (all known IDs — populated from OSHB + MorphGNT)
CREATE TABLE strongs (
    id              TEXT PRIMARY KEY,   -- 'H2617', 'G1656' — H or G prefix + number
    language        TEXT NOT NULL CHECK (language IN ('hebrew', 'greek')),
    lemma           TEXT,               -- Original-script lemma
    transliteration TEXT,
    brief_gloss     TEXT,               -- BDB/BDAG brief gloss for reference only
    source          TEXT                -- 'OSHB', 'MorphGNT', 'SBLGNT', 'LXX-extended'
);

CREATE INDEX idx_strongs_language ON strongs(language);


-- Hebrew lexemes belonging to a category
CREATE TABLE category_hebrew_lexemes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id     TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    lexeme          TEXT NOT NULL,          -- Unicode Hebrew script
    strongs_id      TEXT NOT NULL REFERENCES strongs(id),
    is_primary      INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0,1)),
    notes           TEXT,
    UNIQUE (category_id, strongs_id)
);

CREATE INDEX idx_heb_lexemes_category ON category_hebrew_lexemes(category_id);
CREATE INDEX idx_heb_lexemes_strongs  ON category_hebrew_lexemes(strongs_id);


-- LXX Greek lexemes that render a Hebrew category
CREATE TABLE category_lxx_lexemes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id     TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    lexeme          TEXT NOT NULL,          -- Greek transliteration
    strongs_id      TEXT NOT NULL REFERENCES strongs(id),
    frequency_rank  INTEGER,               -- 1 = most common LXX rendering of this Hebrew
    notes           TEXT,
    UNIQUE (category_id, strongs_id)
);

CREATE INDEX idx_lxx_lexemes_category ON category_lxx_lexemes(category_id);
CREATE INDEX idx_lxx_lexemes_strongs  ON category_lxx_lexemes(strongs_id);


-- NT Greek lexemes carrying a Hebrew category via LXX antecedent chain
CREATE TABLE category_nt_lexemes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id     TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    lexeme          TEXT NOT NULL,          -- Greek transliteration
    strongs_id      TEXT NOT NULL REFERENCES strongs(id),
    lxx_source_id   TEXT REFERENCES strongs(id),  -- The LXX Greek Strong's ID that is the antecedent
    frequency_rank  INTEGER,
    notes           TEXT,
    UNIQUE (category_id, strongs_id)
);

CREATE INDEX idx_nt_lexemes_category ON category_nt_lexemes(category_id);
CREATE INDEX idx_nt_lexemes_strongs  ON category_nt_lexemes(strongs_id);


-- English glosses: recommended renderings per category
CREATE TABLE english_glosses_recommended (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    gloss       TEXT NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_eng_rec_category ON english_glosses_recommended(category_id);


-- English glosses: attested translation glosses with analysis of what each loses
CREATE TABLE english_glosses_attested (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    gloss       TEXT NOT NULL,
    loses       TEXT NOT NULL   -- What this gloss loses from the Hebrew category
);

CREATE INDEX idx_eng_att_category ON english_glosses_attested(category_id);


-- Attested gloss → translations (many-to-many)
CREATE TABLE attested_gloss_translations (
    attested_gloss_id   INTEGER NOT NULL REFERENCES english_glosses_attested(id) ON DELETE CASCADE,
    translation_id      TEXT NOT NULL REFERENCES translations(id),
    PRIMARY KEY (attested_gloss_id, translation_id)
);


-- =============================================================================
-- LAYER 2 — LEXEME MAP
-- Strong's ID → Hebrew category lookup bridge.
-- Mapping direction: Strong's ID → primaryCategory. NEVER reverse.
-- =============================================================================

CREATE TABLE lexeme_map (
    strongs_id          TEXT PRIMARY KEY REFERENCES strongs(id),
    primary_category_id TEXT NOT NULL REFERENCES categories(id),
    is_lxx_source       INTEGER NOT NULL DEFAULT 0 CHECK (is_lxx_source IN (0,1)),
                        -- 1 = this Greek entry is an LXX vehicle for the Hebrew category
    hebrew_source_id    TEXT REFERENCES strongs(id),
                        -- For Greek entries: the Hebrew Strong's ID this traces back to
    lxx_antecedent_documented INTEGER NOT NULL DEFAULT 0 CHECK (lxx_antecedent_documented IN (0,1)),
                        -- 1 = LXX antecedent chain is fully documented (required for Greek entries)
    notes               TEXT,
    data_source         TEXT    -- 'OSHB', 'MorphGNT', 'editorial', etc.
);

CREATE INDEX idx_lexeme_map_primary ON lexeme_map(primary_category_id);
CREATE INDEX idx_lexeme_map_heb_src ON lexeme_map(hebrew_source_id);


-- Secondary and tertiary category mappings (polysemy)
-- Ordered: lower sort_order = higher frequency in canonical corpus
CREATE TABLE lexeme_secondary_categories (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    strongs_id      TEXT NOT NULL REFERENCES strongs(id) ON DELETE CASCADE,
    category_id     TEXT NOT NULL REFERENCES categories(id),
    sort_order      INTEGER NOT NULL,   -- 1 = first secondary, 2 = second secondary, etc.
    notes           TEXT,
    UNIQUE (strongs_id, category_id)
);

CREATE INDEX idx_sec_cat_strongs ON lexeme_secondary_categories(strongs_id);
CREATE INDEX idx_sec_cat_category ON lexeme_secondary_categories(category_id);


-- Context rules for polysemy override
-- Allows the lexeme map to return a different category based on syntactic/literary context
CREATE TABLE context_rules (
    id                  TEXT PRIMARY KEY,   -- e.g. 'ruach-genitive-yhwh'
    strongs_id          TEXT NOT NULL REFERENCES strongs(id) ON DELETE CASCADE,
    condition_desc      TEXT NOT NULL,      -- Natural language: "followed by YHWH as genitive"
    condition_pattern   TEXT,               -- Optional: formal syntax pattern or regex if machine-applicable
    override_category_id TEXT NOT NULL REFERENCES categories(id),
    priority            INTEGER NOT NULL DEFAULT 0,  -- Higher = evaluated first when multiple rules match
    notes               TEXT
);

CREATE INDEX idx_context_rules_strongs ON context_rules(strongs_id);


-- Context rule examples (at least 2 OSIS refs per rule, enforced at app layer)
CREATE TABLE context_rule_examples (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_id         TEXT NOT NULL REFERENCES context_rules(id) ON DELETE CASCADE,
    osis_ref        TEXT NOT NULL,
    notes           TEXT,
    UNIQUE (rule_id, osis_ref)
);


-- =============================================================================
-- LAYER 3 — VERSE INDEX
-- Translation-independent. Tags word positions in original-language text.
-- NO translation column anywhere in this layer. Ever.
-- =============================================================================

-- Book registry (canonical order)
CREATE TABLE books (
    id              TEXT PRIMARY KEY,   -- OSIS book code: 'Gen', 'Exod', 'Matt', etc.
    name            TEXT NOT NULL,
    testament       TEXT NOT NULL REFERENCES testament_scopes(id),
    canonical_order INTEGER NOT NULL UNIQUE,
    chapter_count   INTEGER
);

CREATE INDEX idx_books_testament ON books(testament);
CREATE INDEX idx_books_order     ON books(canonical_order);


-- Verse registry (one row per verse across all source texts)
CREATE TABLE verses (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    osis_ref    TEXT NOT NULL,          -- e.g. 'Gen.1.1'
    book_id     TEXT NOT NULL REFERENCES books(id),
    chapter     INTEGER NOT NULL,
    verse       INTEGER NOT NULL,
    source_text TEXT NOT NULL REFERENCES source_texts(id),
    word_count  INTEGER,
    UNIQUE (osis_ref, source_text)
);

CREATE INDEX idx_verses_osis    ON verses(osis_ref);
CREATE INDEX idx_verses_book    ON verses(book_id);
CREATE INDEX idx_verses_source  ON verses(source_text);


-- Word index — the core of Layer 3
-- One row per word token in the original-language text
-- NO translation property. Translation resolution is the app's responsibility.
CREATE TABLE word_tokens (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    verse_id                INTEGER NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
    position                INTEGER NOT NULL,   -- Zero-indexed position within verse
    strongs_id              TEXT NOT NULL REFERENCES strongs(id),
    lemma                   TEXT,               -- Original-script lemma (aids human review)
    morphology              TEXT,               -- OpenScriptures morphology code, e.g. 'HVqp3ms'
    surface_form            TEXT,               -- The actual word form as it appears in the source text

    -- Performance cache: pre-resolved at build time, refreshed when lexeme map changes
    category_id             TEXT REFERENCES categories(id),
    context_rule_applied    TEXT REFERENCES context_rules(id),

    -- Textual criticism flags
    variant_flag            INTEGER DEFAULT 0 CHECK (variant_flag IN (0,1)),
                            -- 1 = word position differs between NA28 and SBLGNT
    variant_note            TEXT,

    UNIQUE (verse_id, position)
);

CREATE INDEX idx_word_tokens_verse      ON word_tokens(verse_id);
CREATE INDEX idx_word_tokens_strongs    ON word_tokens(strongs_id);
CREATE INDEX idx_word_tokens_category   ON word_tokens(category_id);
CREATE INDEX idx_word_tokens_morphology ON word_tokens(morphology);

-- Composite index for the most common lookup: all occurrences of a category in order
CREATE INDEX idx_word_tokens_cat_verse  ON word_tokens(category_id, verse_id);


-- =============================================================================
-- INTERLINEAR ALIGNMENT INTERFACE
-- Documents the contract between the lexicon and external alignment resolvers.
-- The lexicon does NOT own alignment data; it specifies the interface.
-- =============================================================================

-- Supported translation × source text alignment registry
CREATE TABLE alignment_sources (
    id              TEXT PRIMARY KEY,   -- e.g. 'OSHB-ESV', 'MorphGNT-KJV'
    translation_id  TEXT NOT NULL REFERENCES translations(id),
    source_text_id  TEXT NOT NULL REFERENCES source_texts(id),
    provider        TEXT NOT NULL,      -- e.g. 'OSHB', 'Step Bible', 'Tyndale House'
    license         TEXT,
    endpoint_url    TEXT,               -- REST endpoint if remote resolver
    notes           TEXT,
    UNIQUE (translation_id, source_text_id)
);


-- Alignment cache (optional: store resolved alignments for offline/performance use)
-- A row records which English word positions correspond to a given original-language token
CREATE TABLE alignment_cache (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    word_token_id       INTEGER NOT NULL REFERENCES word_tokens(id) ON DELETE CASCADE,
    alignment_source_id TEXT NOT NULL REFERENCES alignment_sources(id),
    english_positions   TEXT NOT NULL,  -- JSON array of integer positions in the English verse
    english_words       TEXT NOT NULL,  -- JSON array of English word strings
    cached_at           TEXT NOT NULL,  -- ISO 8601 datetime
    UNIQUE (word_token_id, alignment_source_id)
);

CREATE INDEX idx_align_cache_token  ON alignment_cache(word_token_id);
CREATE INDEX idx_align_cache_source ON alignment_cache(alignment_source_id);


-- =============================================================================
-- FULL-TEXT SEARCH
-- SQLite FTS5 virtual tables for lexicon search
-- =============================================================================

CREATE VIRTUAL TABLE categories_fts USING fts5(
    id UNINDEXED,
    category_label,
    transliteration,
    one_liner,
    full_definition,
    what_it_does,
    what_it_is_not,
    second_temple_context,
    theological_notes,
    kardia_rendering,
    content='categories',
    content_rowid='rowid'
);

-- Triggers to keep FTS index current
CREATE TRIGGER categories_fts_insert AFTER INSERT ON categories BEGIN
    INSERT INTO categories_fts(rowid, id, category_label, transliteration, one_liner,
        full_definition, what_it_does, what_it_is_not, second_temple_context,
        theological_notes, kardia_rendering)
    VALUES (new.rowid, new.id, new.category_label, new.transliteration, new.one_liner,
        new.full_definition, new.what_it_does, new.what_it_is_not, new.second_temple_context,
        new.theological_notes, new.kardia_rendering);
END;

CREATE TRIGGER categories_fts_update AFTER UPDATE ON categories BEGIN
    INSERT INTO categories_fts(categories_fts, rowid, id, category_label, transliteration, one_liner,
        full_definition, what_it_does, what_it_is_not, second_temple_context,
        theological_notes, kardia_rendering)
    VALUES ('delete', old.rowid, old.id, old.category_label, old.transliteration, old.one_liner,
        old.full_definition, old.what_it_does, old.what_it_is_not, old.second_temple_context,
        old.theological_notes, old.kardia_rendering);
    INSERT INTO categories_fts(rowid, id, category_label, transliteration, one_liner,
        full_definition, what_it_does, what_it_is_not, second_temple_context,
        theological_notes, kardia_rendering)
    VALUES (new.rowid, new.id, new.category_label, new.transliteration, new.one_liner,
        new.full_definition, new.what_it_does, new.what_it_is_not, new.second_temple_context,
        new.theological_notes, new.kardia_rendering);
END;

CREATE TRIGGER categories_fts_delete AFTER DELETE ON categories BEGIN
    INSERT INTO categories_fts(categories_fts, rowid, id, category_label, transliteration, one_liner,
        full_definition, what_it_does, what_it_is_not, second_temple_context,
        theological_notes, kardia_rendering)
    VALUES ('delete', old.rowid, old.id, old.category_label, old.transliteration, old.one_liner,
        old.full_definition, old.what_it_does, old.what_it_is_not, old.second_temple_context,
        old.theological_notes, old.kardia_rendering);
END;


-- =============================================================================
-- SEED DATA — Reference table values
-- =============================================================================

INSERT INTO testament_scopes VALUES ('ot'), ('nt'), ('both');

INSERT INTO entry_statuses VALUES ('draft'), ('reviewed'), ('approved');

INSERT INTO source_texts VALUES
    ('BHS',         'Biblia Hebraica Stuttgartensia',    'ot',   '5th edition',          'CC BY 4.0 (OSHB alignment)'),
    ('NA28',        'Nestle-Aland 28th Edition',         'nt',   '28th edition',          'Scholarly standard; SBLGNT for alignment'),
    ('SBLGNT',      'SBL Greek New Testament',           'nt',   '2010',                 'CC BY 4.0'),
    ('LXX',         'Septuagint (Rahlfs-Hanhart)',        'both', 'Rahlfs-Hanhart 2006',  'Public domain');

INSERT INTO textual_layers VALUES
    ('pre-exilic',    'Pre-Exilic',    1),
    ('exilic',        'Exilic',        1),
    ('post-exilic',   'Post-Exilic',   1),
    ('second-temple', 'Second Temple', 2),
    ('nt',            'New Testament', 3);

INSERT INTO semantic_domains VALUES
    ('god-covenant',              'God and Covenant',           1,  'Core covenant theology: divine names and covenant qualities'),
    ('human-nature',              'Human Nature',               2,  'Anthropology: what it means to be human in Hebrew thought'),
    ('relational-ethical',        'Relational and Ethical',     3,  'Ethics and relationship: how covenant shapes human action'),
    ('worship-presence',          'Worship and Presence',       4,  'Liturgy and divine presence: how Israel approaches YHWH'),
    ('sin-redemption',            'Sin and Redemption',         5,  'Failure and restoration: the full Hebrew vocabulary of return'),
    ('land-creation',             'Land and Creation',          6,  'Creation theology and land promise'),
    ('leadership-vocation',       'Leadership and Vocation',    7,  'Calling, office, and covenant service'),
    ('eschatology-hope',          'Eschatology and Hope',       8,  'Future hope and end-time categories'),
    ('nt-lxx-distinctive',        'NT/LXX Distinctive',         9,  'Greek entries without direct Hebrew cognate — LXX-mediated'),
    ('spiritual-beings-reframed', 'Spiritual Beings Reframed',  10, 'Angelology/demonology: categories requiring developmental_note');

INSERT INTO translations (id, full_name) VALUES
    ('ESV',   'English Standard Version'),
    ('KJV',   'King James Version'),
    ('NIV',   'New International Version'),
    ('NASB',  'New American Standard Bible'),
    ('NLT',   'New Living Translation'),
    ('NKJV',  'New King James Version'),
    ('CSB',   'Christian Standard Bible'),
    ('DRA',   'Douay-Rheims Bible'),
    ('GNT',   'Good News Translation'),
    ('NETS',  'New English Translation of the Septuagint');


-- =============================================================================
-- SCHEMA METADATA
-- =============================================================================

CREATE TABLE _schema_meta (
    key     TEXT PRIMARY KEY,
    value   TEXT NOT NULL
);

INSERT INTO _schema_meta VALUES
    ('schema_version',  '1.0.0'),
    ('project',         'Kardia Lexicon'),
    ('license',         'MIT'),
    ('created',         date('now')),
    ('description',     'Hebrew thought category database — semantic layer beneath the English Bible. Hebrew is primary. Greek is the vehicle.');
