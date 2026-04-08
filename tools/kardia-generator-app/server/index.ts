import express from 'express';
import cors from 'cors';
import entriesRouter from './routes/entries.js';

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/entries', entriesRouter);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`[server] Listening on http://localhost:${PORT}`);
});
