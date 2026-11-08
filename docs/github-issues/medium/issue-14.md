# Replace GSAP with CSS scroll-driven animations and IntersectionObserver

**Difficulty:** Medium · **Category:** Licensing / Frontend · **Labels:** `enhancement`, `frontend`, `medium` · **Estimated effort:** 1–2 days · **First-time contributor:** No (motion, accessibility and licensing all need to hold together)

## Problem
Ghumo AI is licensed under the AGPL-3.0. The built client bundles GSAP 3.15 (`gsap`, `gsap/ScrollTrigger`), whose "standard no-charge" licence is not open source and not GPL-compatible. That makes redistributing the built app under the AGPL legally unclear.

## Why it matters
Anyone who forks or self-hosts Ghumo should be able to rely on the AGPL alone. GSAP is used for decorative scroll motion only, so removing it costs little and makes the whole stack open source.

## Current behaviour
GSAP is used in exactly one module, `client/src/motion/useSceneMotion.js`. It is called from `client/src/scenes/parts.jsx` and the traveller `HomePage`, `ExploreIndiaPage` and `PlacePage`, plus their `/v01` copies. The module provides:
- parallax on `[data-depth]`, `[data-rise]` and `[data-sun]` elements, plus SVG path drawing, all tied to scroll position;
- ambient loops on `[data-drift]`, `[data-wave]` and `[data-bob]`;
- staggered reveals and a fade-and-scale on scroll;
- three motion tiers through `gsap.matchMedia()`: full (desktop), lite (phones) and none (`prefers-reduced-motion`).

The module is lazy-loaded, and `client/vite.config.js` gives GSAP its own chunk.

## Expected behaviour
The same scenes animate without GSAP:
- **Scroll-linked effects:** CSS scroll-driven animations (`animation-timeline: view()` or `scroll()`). Where a browser lacks support, a small `requestAnimationFrame` scroll handler, or a static scene.
- **Reveals:** `IntersectionObserver` toggling a class.
- **Ambient loops:** plain CSS `@keyframes`.
- **Tiers:** CSS media queries, including `prefers-reduced-motion: reduce` (everything static and fully visible).

`gsap` is removed from `client/package.json`, and its `manualChunks` entry from `client/vite.config.js`.

## Acceptance criteria
- [ ] `gsap` no longer appears in `client/package.json`, `client/package-lock.json` or the built `client/dist`.
- [ ] With reduced motion, every scene is static and all content is visible. `e2e/03-quality.spec.js` "Reduced motion…" passes.
- [ ] No horizontal overflow, console errors or extra layout shift at the five widths in `e2e/03-quality.spec.js`.
- [ ] Scroll performance doesn't regress: the long-task check in `03-quality` passes.
- [ ] Browsers without scroll-driven animation support show a correct static scene, not a broken one.
- [ ] Colours still come from the tokens in `client/src/index.css`.

## Suggested approach
Keep the `data-*` attribute contract so the scene components don't change. Rewrite `useSceneMotion.js` as a hook that adds classes and CSS custom properties (for example `--depth`), and move the motion itself into CSS in `client/src/index.css` or a scene stylesheet. Load the `motion-performance` and `accessibility` skills in `.agents/skills/` first.

## Relevant files
- `client/src/motion/useSceneMotion.js`
- `client/src/scenes/parts.jsx`, `client/src/scenes/landscapes.jsx`, `client/src/scenes/cities.jsx`
- `client/src/traveller/HomePage.jsx`, `ExploreIndiaPage.jsx`, `PlacePage.jsx`
- `client/vite.config.js`, `client/package.json`
- `e2e/03-quality.spec.js`

## Testing requirements
The full e2e suite, especially `03-quality`. Check by hand in Chrome, Safari and Firefox, at phone width, and with reduced motion on.

## Dependencies
Coordinate with `medium/08` (removing `/v01`), because the prototype pages also import the hook. Doing medium/08 first shrinks this issue.

## Notes for maintainers
This resolves licensing question L9 in `docs/PRE_RELEASE_REVIEW.md`. The alternative is a lawyer-drafted AGPL section 7 permission for GSAP, which only the copyright holders can grant.
