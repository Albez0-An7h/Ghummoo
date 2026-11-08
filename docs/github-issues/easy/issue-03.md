# Check uploaded image file signatures instead of trusting Content-Type

**Difficulty:** Easy · **Category:** Security · **Labels:** `security`, `backend`, `testing`, `easy` · **Estimated effort:** 3–5 hours · **First-time contributor:** No (needs care with file handling and multipart tests, and there is no existing upload test to copy)

## Problem
`POST /api/uploads` (`server/src/routes/uploads.js`) decides whether a file is an image only from `file.mimetype` (lines 17-22). That value is the `Content-Type` the browser or client sent for the multipart part, so any file can be uploaded by labelling it `image/png`. The stored extension is also derived from that claimed type (line 14).

## Why it matters
Uploaded files are served publicly from `/uploads` (`server/src/app.js:33`). Helmet's default `X-Content-Type-Options: nosniff` and extension-based content types reduce the risk of a browser executing a disguised file, but the server still stores and serves arbitrary bytes from organiser and admin accounts. Checking the file's real signature is cheap and closes that gap.

## Current behaviour
- A text or HTML file sent with `Content-Type: image/png` is accepted (201) and served as `/uploads/<name>.png`.
- There are no tests for the upload route.

## Expected behaviour
After multer has written the file, the route reads its first bytes and checks that they match the claimed type:

| Type | Signature |
| --- | --- |
| JPEG | `FF D8 FF` at offset 0 |
| PNG | `89 50 4E 47 0D 0A 1A 0A` at offset 0 |
| WebP | `RIFF` at offset 0 and `WEBP` at offset 8 |
| AVIF | `ftyp` at offset 4 and a brand of `avif` or `avis` at offset 8 |

If the bytes do not match the claimed type, the stored file is deleted and the route returns 400: "The file isn't a valid JPG, PNG, WebP or AVIF image". No new dependency.

## Acceptance criteria
- [ ] A file whose bytes do not match its declared image type returns 400 and leaves no file in `UPLOAD_DIR`.
- [ ] Valid JPEG, PNG, WebP and AVIF files are still accepted with the same response shape (`{ url: '/uploads/...' }`).
- [ ] A mismatch between two image types (PNG bytes sent as `image/jpeg`) is rejected, so the stored extension always matches the content.
- [ ] Deletion errors are handled (the request still gets 400, and the error is logged).
- [ ] No new dependency is added.

## Suggested approach
Write a small pure function `detectImageType(buffer)` (for example in `server/src/utils/`) that returns `'image/jpeg'`, `'image/png'`, `'image/webp'`, `'image/avif'` or `null`. In the route, open `req.file.path`, read 16 bytes with `fs.promises.open` and `handle.read`, compare with `req.file.mimetype`, and `fs.promises.unlink` on mismatch. Keep the existing `fileFilter` as a first, cheap check.

## Relevant files
- `server/src/routes/uploads.js`
- `server/src/app.js` (static serving of `/uploads`)
- `server/src/middleware/errorHandler.js` (upload error handling)

## Testing requirements
- Unit-test `detectImageType` with small hand-made buffers for each type plus text, empty and truncated buffers.
- Add an API test (new file, e.g. `server/test/uploads.test.js`) that signs in as the demo organiser and posts `FormData` with a `Blob` (both are global in Node 20): a minimal valid PNG header returns 201 and the file exists; text labelled `image/png` returns 400 and the upload directory has no new file. Tests already point `UPLOAD_DIR` at a temporary folder.

## Dependencies
None. `medium/04` (storage adapter) rewrites the same route; if both are in progress, land this first so the check becomes part of the adapter contract.
