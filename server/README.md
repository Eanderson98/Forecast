# Forecast server

Express API + Postgres persistence for the Forecast app (`../app/`). Routes:

- `GET /api/state` — returns the whole shared app state (or `null` if nothing's been saved yet)
- `PUT /api/state` — replaces it
- `POST /api/files` — uploads one task attachment (multipart, field name `file`) to this server's own disk (`UPLOADS_DIR`); returns `{ id, name, size, mimeType }`
- `GET /api/files/:id` — downloads a previously uploaded file
- `DELETE /api/files/:id` — deletes one

It also serves the built frontend (`../app/dist` by default) as static files, so in production this one process is the whole app.

See `../app/README.md` for local dev, Docker Compose self-hosting, and environment variables.
