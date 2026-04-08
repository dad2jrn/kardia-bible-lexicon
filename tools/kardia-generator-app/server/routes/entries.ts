import { Router, Request, Response } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/entries — return all approved entries
router.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM entries ORDER BY approved_at DESC').all();
  res.json(rows);
});

// POST /api/entries — upsert an entry by id
router.post('/', (req: Request, res: Response) => {
  const { id, data, category_label, transliteration, hebrew_root, iterations } = req.body as {
    id: string;
    data: unknown;
    category_label?: string;
    transliteration?: string;
    hebrew_root?: string;
    iterations?: number;
  };

  if (!id || !data) {
    res.status(400).json({ error: 'id and data are required' });
    return;
  }

  const dataStr = typeof data === 'string' ? data : JSON.stringify(data);

  db.prepare(`
    INSERT INTO entries (id, data, category_label, transliteration, hebrew_root, iterations)
    VALUES (@id, @data, @category_label, @transliteration, @hebrew_root, @iterations)
    ON CONFLICT(id) DO UPDATE SET
      data = excluded.data,
      category_label = excluded.category_label,
      transliteration = excluded.transliteration,
      hebrew_root = excluded.hebrew_root,
      iterations = excluded.iterations,
      approved_at = datetime('now')
  `).run({ id, data: dataStr, category_label, transliteration, hebrew_root, iterations: iterations ?? 1 });

  res.status(201).json({ ok: true, id });
});

// PUT /api/entries/:id — update an existing entry
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body as Partial<{
    data: unknown;
    category_label: string;
    transliteration: string;
    hebrew_root: string;
    iterations: number;
  }>;

  const existing = db.prepare('SELECT id FROM entries WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }

  const fields: string[] = [];
  const params: Record<string, unknown> = { id };

  if (updates.data !== undefined) {
    fields.push('data = @data');
    params.data = typeof updates.data === 'string' ? updates.data : JSON.stringify(updates.data);
  }
  if (updates.category_label !== undefined) {
    fields.push('category_label = @category_label');
    params.category_label = updates.category_label;
  }
  if (updates.transliteration !== undefined) {
    fields.push('transliteration = @transliteration');
    params.transliteration = updates.transliteration;
  }
  if (updates.hebrew_root !== undefined) {
    fields.push('hebrew_root = @hebrew_root');
    params.hebrew_root = updates.hebrew_root;
  }
  if (updates.iterations !== undefined) {
    fields.push('iterations = @iterations');
    params.iterations = updates.iterations;
  }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  db.prepare(`UPDATE entries SET ${fields.join(', ')} WHERE id = @id`).run(params);
  res.json({ ok: true, id });
});

// DELETE /api/entries/:id — remove an entry
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM entries WHERE id = ?').run(id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }
  res.json({ ok: true, id });
});

export default router;
