# Add a Dockerfile and a docker-compose setup with MongoDB

**Difficulty:** Easy · **Category:** DevOps · **Labels:** `enhancement`, `devops`, `documentation`, `easy` · **Estimated effort:** 4–6 hours · **First-time contributor:** No (needs Docker experience and care with secrets and the embedded-database install step)

## Problem
The app is deployed with `render.yaml` and `.replit`, but there is no container image. Self-hosters and contributors without Node 22 have no single, repeatable way to run the production build with a real MongoDB.

## Why it matters
A container gives the same build everywhere (`npm run build`, then `npm start` serving `client/dist` from Express, per AGENTS.md "Production"). A compose file with MongoDB lets people try the app against a real database instead of the embedded one.

## Current behaviour
- `npm run setup` installs root, server and client dependencies, including the root dev tools (Playwright, concurrently) that a production image does not need.
- `mongodb-memory-server` is a production dependency of the server (`server/package.json`) and its `postinstall` script downloads a MongoDB binary. That is unnecessary when `MONGODB_URI` is set.
- Uploads are written to `server/uploads` or `UPLOAD_DIR` (`server/src/routes/uploads.js:8`), which is lost when a container is replaced.

## Expected behaviour
- A multi-stage `Dockerfile`: build stage installs client dependencies (with dev dependencies, Vite is needed) and runs the client build; runtime stage installs server production dependencies only, copies `server/` and `client/dist`, runs as a non-root user, exposes `PORT` (default 5050) and starts with `node server/src/index.js`.
- A `HEALTHCHECK` using `/api/health`.
- `.dockerignore` excluding `node_modules`, `.env` files, `server/.data`, `server/uploads`, `.cache`, `test-results` and `e2e` output.
- `docker-compose.yml` with `app` and `mongo` services, a named volume for MongoDB data and one for uploads, `MONGODB_URI=mongodb://mongo:27017/ghumo`, and `SEED_ON_EMPTY=true` for a first run.
- No secret is baked into the image. `JWT_SECRET`, AI keys and `DEMO_ADMIN_PASSWORD` come from the environment or an untracked `.env` file referenced by compose.
- A README section listing the variables, pointing at `server/.env.example` as the reference.

## Acceptance criteria
- [ ] `docker compose up --build` starts the app and MongoDB; `/api/health` returns 200 and demo trips are listed.
- [ ] The image contains no `.env` file and no secrets (`docker history` and the file system show none).
- [ ] The runtime image does not download a MongoDB binary during install (for example set `MONGOMS_DISABLE_POSTINSTALL=1`, and check it works with this version of `mongodb-memory-server`).
- [ ] The container runs as a non-root user.
- [ ] Uploaded photos survive `docker compose down` and `up` (volume).
- [ ] README documents build, run and every environment variable used, and says the compose MongoDB is for local use and self-hosting, not a managed production database.

## Suggested approach
Use the Node version in `.nvmrc` for the base image (`node:22-slim` or similar). Install with `npm ci --prefix client` and `npm ci --omit=dev --prefix server`. Set `NODE_ENV=production` only in the runtime stage.

## Relevant files
- `render.yaml`, `.replit`, `.nvmrc` (current deployment settings)
- `server/.env.example`
- `server/src/index.js`, `server/src/config/db.js`, `server/src/app.js`
- `README.md`

## Testing requirements
Build and run locally with compose; sign in with a demo account; upload a photo as the demo organiser; restart and confirm data and photo remain. Optionally add a CI job that only builds the image.

## Dependencies
None. `medium/04` (persistent photo storage) changes how uploads are stored; the uploads volume may become unnecessary after it.
