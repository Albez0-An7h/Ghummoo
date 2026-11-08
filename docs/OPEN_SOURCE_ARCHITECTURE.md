# Ghumo AI: open-source architecture

*Status: **PROPOSED**. No refactoring toward this structure has been done yet. It depends on the owners approving the scope in [OPEN_SOURCE_STRATEGY.md](OPEN_SOURCE_STRATEGY.md).*

## 1. The case against a large monorepo

The suggested layout of `travel-core`, `itinerary-engine`, `destination-recommendations`, `integrations` and `sdk` **doesn't match this codebase**:
- There is no itinerary engine. Itineraries are written by organisers or extracted from their text.
- There is no recommendation model beyond the deterministic discovery ranking.
- There are no third-party travel integrations to put in an `integrations` package.
- An SDK for an API that has no outside users would be premature.

Creating empty or thin packages to look like a platform would add maintenance cost and mislead contributors. **The recommended structure adds exactly one package**: the code that is genuinely reusable.

## 2. Proposed layout

```
ghumo/
├── package.json                 npm workspaces: ["packages/*"] (server and client keep their own installs)
├── packages/
│   └── grounded-extract/        NEW, Apache-2.0, published to npm
│       ├── src/
│       │   ├── providers/
│       │   │   ├── anthropic.js       from server/src/services/ai/provider.js
│       │   │   └── openai-compatible.js
│       │   ├── schema.js              minimal JSON-Schema validator (validate)
│       │   ├── grounding.js           numbersInText, numberInText, later dates and durations (medium/01)
│       │   ├── extract.js             extract({ text, schema, profile, provider })
│       │   └── errors.js              ExtractError with the codes AI_NOT_CONFIGURED, AI_TIMEOUT, …
│       ├── test/                      node --test, no network (injected fetch)
│       ├── examples/                  e.g. an event-listing profile (not travel) to prove it is generic
│       ├── README.md
│       └── LICENSE
├── server/                      unchanged structure; services/ai/ becomes a thin travel "profile"
├── client/
├── e2e/
└── docs/
```

## 3. Package responsibilities and public interface

`grounded-extract` turns free text into a schema-valid record, with these guarantees:
- **no ungrounded numbers**: a numeric field is cleared unless that number appears in the source;
- **deterministic missing fields**: computed by the caller's profile, never by the model;
- **one interface for Anthropic tool use and for any OpenAI-compatible Chat Completions API**.

```js
const { createProvider, extract } = require('grounded-extract');

const provider = createProvider({
  kind: 'openai-compatible',            // or 'anthropic'
  apiKey: process.env.OPENAI_API_KEY,
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
  models: ['gemini-flash-latest', 'gemini-flash-lite-latest'], // fallback order
  timeoutMs: 30000,
  fetch,                                 // injectable for tests
});

const profile = {
  schema,                                // JSON Schema the model must fill
  system: 'Extract only facts present in the text…',
  groundedNumbers: ['price', 'capacity'],// cleared, with a warning, unless found in the text
  required: { price: 'Price per person', departureDates: 'Departure dates' }, // feeds missing[]
  normalise(raw, text) { /* domain clean-up */ },
};

const { record, missing, warnings, model } = await extract({ text, profile, provider });
```

**Errors.** `ExtractError` carries a `code`, `statusCode` and `retryable` field. The codes are `NOT_CONFIGURED`, `TIMEOUT`, `RATE_LIMITED`, `INVALID_OUTPUT` and `PROVIDER_ERROR`; they are the codes the server already uses, renamed without the `AI_` prefix and aliased for compatibility.

**Configuration.** Everything is passed explicitly. The package never reads `process.env`; the server keeps env parsing.

**Extension points:**
- new providers implement `{ name, call({ system, user, schema, maxTokens, timeoutMs }) → { data, model } }`;
- new grounding rules are plain functions `(value, text) → boolean`.

**Dependencies:** none. The package targets Node ≥ 20, which ships `fetch` and `AbortSignal.timeout`.

**Versioning:** SemVer, starting at `0.x` until a second real user exists. Breaking changes are listed in the package `CHANGELOG.md`.

## 4. Integration boundary with the app

`server/src/services/ai/index.js` keeps:
- the travel `SCHEMA`;
- the travel prompt;
- the travel-specific checks: hotel category, pickup point and the list of missing fields.

It then calls `extract()`. `services/discovery/*` keeps using the provider through the same package. API responses stay **unchanged**, so no client change is needed.

## 5. Data model

The package has no data model. Records are whatever the caller's schema describes. The app's Mongoose models stay private to the app.

## 6. Risks

| Risk | Mitigation |
| --- | --- |
| A behaviour change in Studio during extraction | Move code first with no logic change. `server/test/api.test.js` T11, `hardening.test.js` and `discovery.test.js` must pass unchanged |
| Two copies of the provider code during the transition | Do it in one PR: the server imports the package through the workspace |
| npm workspaces changing install behaviour for `server` and `client` | Keep `server/` and `client/` out of the workspaces at first, and reference the package with `"grounded-extract": "file:../packages/grounded-extract"` |
| The package name is taken on npm | Check before publishing. An org scope such as `@ghumo/grounded-extract` avoids clashes but needs an npm org |
| Licence not yet approved | Don't publish the package until the owners approve Apache-2.0 for it |

## 7. Order of work

1. **medium/07:** split `routes/operator.js`. This reduces conflicts before more contributors arrive. It is independent of this plan.
2. **hard/01:** create `packages/grounded-extract` by moving code. No new behaviour.
3. **medium/01:** date and duration grounding, implemented inside the package.
4. **hard/02:** an evaluation harness that uses the package against the stub and real providers.
5. Publish `0.1.0` to npm after the owners approve.
