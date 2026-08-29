import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
// The built frontend (from `npm run build` in app/) lives here by default, so this
// one process is everything a self-host needs in production — no separate static host.
const STATIC_DIR = process.env.STATIC_DIR || path.join(__dirname, '../../app/dist');
// Task attachments, saved straight to this server's own disk (not object storage) — mount this
// as a volume in production or uploads won't survive a container rebuilt.
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '../uploads');
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** Keeps a filename readable while making it safe to write to disk — no path separators,
 * no leading dots (which could hide a file or resolve to "." / ".."), no null bytes. */
function sanitizeFilename(name) {
  const base = path.basename(name).replace(/[/\\\0]/g, '_').replace(/^\.+/, '');
  const trimmed = base.slice(0, 150).trim();
  return trimmed || 'file';
}

/** Stored on disk as `<uuid>__<sanitized original name>` — the uuid is the public id (used in
 * URLs and validated with UUID_RE before ever touching the filesystem with it), the suffix is
 * only there so downloads keep a real filename and extension. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

async function findUploadedFile(id) {
  if (!UUID_RE.test(id)) return null;
  const prefix = `${id}__`;
  const entries = await fs.readdir(UPLOADS_DIR).catch(() => []);
  const match = entries.find((entry) => entry.startsWith(prefix));
  if (!match) return null;
  return { diskPath: path.join(UPLOADS_DIR, match), originalName: match.slice(prefix.length) };
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => cb(null, `${randomUUID()}__${sanitizeFilename(file.originalname)}`),
  }),
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      id integer PRIMARY KEY DEFAULT 1,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT app_state_single_row CHECK (id = 1)
    )
  `);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Everything the app persists lives in one JSONB blob — see app/src/api.ts
// for the PersistedState shape. There's no auth, so anyone with the URL
// reads/writes the same shared state (that's the intended "shared, no
// login" model this was built for).
app.get('/api/state', async (_req, res) => {
  try {
    const result = await pool.query('SELECT data FROM app_state WHERE id = 1');
    res.json(result.rows[0]?.data ?? null);
  } catch (err) {
    console.error('GET /api/state failed', err);
    res.status(500).json({ error: 'Failed to load state' });
  }
});

app.put('/api/state', async (req, res) => {
  const data = req.body;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    res.status(400).json({ error: 'Body must be a JSON object' });
    return;
  }
  try {
    await pool.query(
      `INSERT INTO app_state (id, data, updated_at) VALUES (1, $1, now())
       ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = now()`,
      [data],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/state failed', err);
    res.status(500).json({ error: 'Failed to save state' });
  }
});

// Task attachments, stored on this server's own disk under UPLOADS_DIR. Metadata (id, name,
// size, mimeType) lives in the same app_state JSONB blob as everything else — see FileTile in
// app/src/store.ts — so these routes only ever deal with the file bytes themselves.
app.post('/api/files', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      res.status(status).json({ error: err.message });
      return;
    }
    if (err) {
      console.error('POST /api/files failed', err);
      res.status(500).json({ error: 'Upload failed' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No file in request' });
      return;
    }
    const id = req.file.filename.split('__')[0];
    res.json({ id, name: req.file.originalname, size: req.file.size, mimeType: req.file.mimetype });
  });
});

app.get('/api/files/:id', async (req, res) => {
  const found = await findUploadedFile(req.params.id);
  if (!found) {
    res.status(404).json({ error: 'File not found' });
    return;
  }
  // res.download (not sendFile) so this always comes back as an attachment — an uploaded HTML
  // or SVG file served inline, same-origin, would otherwise be a stored-XSS vector.
  res.download(found.diskPath, found.originalName);
});

app.delete('/api/files/:id', async (req, res) => {
  const found = await findUploadedFile(req.params.id);
  if (!found) {
    res.status(404).json({ error: 'File not found' });
    return;
  }
  try {
    await fs.unlink(found.diskPath);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/files failed', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Static frontend + SPA fallback (skip /api/* so a missing API route 404s properly).
app.use(express.static(STATIC_DIR));
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

Promise.all([ensureSchema(), fs.mkdir(UPLOADS_DIR, { recursive: true })])
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Forecast server listening on :${PORT}`);
      console.log(`Serving frontend from ${STATIC_DIR}`);
      console.log(`Storing uploads in ${UPLOADS_DIR}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
  });
