# Persistent photo storage behind a small storage adapter

**Difficulty:** Medium · **Category:** Architecture · **Labels:** `enhancement`, `architecture`, `backend`, `devops`, `medium` · **Estimated effort:** 2–3 days · **First-time contributor:** No (touches upload handling, static serving and deployment behaviour)

## Problem
Uploaded package photos and organiser logos are written to local disk by multer (`server/src/routes/uploads.js:8-23`, `UPLOAD_DIR` defaulting to `server/uploads`) and served by `express.static` at `/uploads` (`server/src/app.js:31-33`). On hosts with an ephemeral filesystem (Render, Replit deployments, containers) these files disappear on every redeploy or restart. This is recorded in `docs/GHUMO_V0_1_KNOWN_LIMITATIONS.md` ("Image uploads") and `docs/V0_1_CODEBASE_AUDIT.md` (`POST /uploads`).

## Why it matters
After a redeploy, trips show broken cover photos, and organisers have no idea why. The limitations doc says this must be fixed before a real launch.

## Current behaviour
- Files live only on the instance's disk.
- Database records store URLs such as `/uploads/<name>.jpg` (`TripPackage.coverImage`, `images`; organiser `logoUrl`).

## Expected behaviour
- A storage adapter interface, e.g. `save({ buffer | stream, filename, contentType }) → { url }`, `open(filename) → { stream, contentType, size } | null`, `remove(filename)`.
- A **disk** implementation with today's behaviour, used by default.
- A **GridFS** implementation using `GridFSBucket` from the MongoDB driver that Mongoose already includes, so there is no new service and no new dependency.
- Selected by an environment variable (e.g. `UPLOAD_STORAGE=disk|gridfs`), documented in `server/.env.example` and the README.
- Existing `/uploads/<filename>` URLs keep working with both implementations: the `/uploads/:name` route serves from the active adapter, with correct `Content-Type`, caching headers and 404 for unknown names. With GridFS, a file still found on local disk may be served as a fallback during migration.
- Optional: a one-off, non-destructive script that copies existing files from disk into GridFS.

## Acceptance criteria
- [ ] With `UPLOAD_STORAGE` unset, behaviour is identical to today.
- [ ] With `gridfs`, an uploaded image survives deleting the local uploads folder and restarting the server.
- [ ] Response shape of `POST /api/uploads` is unchanged (`{ url: '/uploads/...' }`).
- [ ] Served images keep `nosniff` and a correct `Content-Type`; the Content Security Policy needs no change (same origin).
- [ ] File-size and type limits still apply (and the signature check from `easy/03`, if merged).
- [ ] No new npm dependency.
- [ ] README, `server/.env.example` and the known-limitations doc are updated.

## Suggested approach
Switch multer to `memoryStorage()` (the 5 MB limit keeps memory use bounded) and hand the buffer to the adapter, or keep disk storage and stream the temporary file into GridFS. Put adapters in `server/src/services/storage/` (`index.js`, `disk.js`, `gridfs.js`). Look files up by `filename` in GridFS so URLs don't change.

## Relevant files
- `server/src/routes/uploads.js`
- `server/src/app.js`
- `server/src/config/db.js` (connection used by GridFS)
- `server/.env.example`, `README.md`, `docs/GHUMO_V0_1_KNOWN_LIMITATIONS.md`
- `client/src/pages/operator/packageForm.jsx`, `client/src/pages/operator/ProfilePage.jsx` (callers; no change expected)

## Testing requirements
API tests for both adapters: upload, fetch via `/uploads/<name>` (200 and same bytes), unknown name (404), and for GridFS, fetch after removing `UPLOAD_DIR`. The embedded test database supports GridFS.

## Dependencies
`easy/03` (file signature check) should land first so the check is part of the adapter flow. `easy/11` (Docker) may drop its uploads volume once this lands.

## Notes for maintainers
GridFS keeps photos in the same database as bookings, which grows the database and its backups. If object storage (S3-compatible) is preferred later, it can be a third adapter behind the same interface.
