// ── Kardia Generator — shared TypeScript interfaces ───────────────────────────

export interface AttestatedGloss {
  gloss: string;
  found_in: string[];
  loses: string;
}

export interface EnglishGlosses {
  recommended: string[];
  attested: AttestatedGloss[];
}

export interface SurfaceVehicles {
  hebrew_lexemes: string[];
  strongs_hebrew: string[];
  lxx_greek: string[];
  nt_greek: string[];
  strongs_greek: string[];
  english_glosses: EnglishGlosses | string[];
}

export interface IllustrativeRendering {
  translation: string;
  text: string;
}

export interface KardiaVerse {
  verse_ref: string;
  standard_rendering: string;
  kardia_translation: string;
}

export interface CategoryEntry {
  id: string;
  hebrew_root: string;
  transliteration: string;
  testament_scope: 'ot' | 'nt' | 'both';
  category_label: string;
  one_liner: string;
  full_definition: string;
  what_it_does: string;
  what_it_is_not: string;
  second_temple_context: string;
  kardia_rendering: string;
  surface_vehicles: SurfaceVehicles;
  illustrative_renderings: IllustrativeRendering[];
  key_verses: string[];
  related_categories: string[];
  theological_notes: string;
  semantic_domain_id: string;
  textual_layer_id: string;
  version: string;
  reviewed_by: string;
  // Internal fields — not persisted to export
  _kardia_verses?: KardiaVerse[];
  _truncation_warning?: boolean;
  _iterations?: number;
}

export interface ValidatorFlag {
  flag_number: number;
  point: string;
  severity: 'minor' | 'major';
  location: string;
  issue: string;
  correction: string;
}

export interface ValidatorResult {
  overall: 'clean' | 'minor-flags' | 'major-flags';
  flags: ValidatorFlag[];
  summary: string;
}
