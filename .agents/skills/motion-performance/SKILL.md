---
name: motion-performance
description: Use when adding animation, scroll effects, parallax, canvas effects or transitions, or when work affects bundle size or loading speed. Motion in Ghumo AI is cinematic but must stay usable, optional and fast.
---

# Motion and performance

## Principles

1. **Motion explains or delights. It never gates.** Every feature works with motion off. Content is never hidden until an animation runs.
2. **Respect `prefers-reduced-motion`.** The global rule in `client/src/index.css` shortens CSS animations. JavaScript-driven motion must check `window.matchMedia('(prefers-reduced-motion: reduce)')` and fall back to a static state. Listen for changes, as `FlightCursor.jsx` does.
3. **Cinematic means few, slow and well-eased.** Use one hero moment per page, gentle parallax and staggered reveals. No bouncing UI, no constant looping motion near text, and nothing that flashes more than 3 times a second.

## Timing and easing

- Micro-interactions (hover, press): 120 to 200ms.
- Reveals and panels: 300 to 500ms, using `cubic-bezier(0.2, 0.7, 0.2, 1)` (the existing `animate-fade-up`).
- Hero or scene transitions: up to about 900ms. Never block input during them.
- Stagger lists by 40 to 60ms and cap the total at about 400ms.

## Implementation rules

- Animate only `transform` and `opacity` (and `filter` sparingly). Never animate layout properties (`width`, `height`, `top`, `margin`).
- Prefer CSS transitions and keyframes plus `IntersectionObserver` for scroll reveals. Use `requestAnimationFrame` for continuous effects, and stop the loop when nothing is moving (see `FlightCursor.jsx`).
- Don't drive per-frame animation through React state. Write to refs, the DOM style or a canvas.
- Pointer-only effects (cursor, tilt, magnetic hover) are enabled only for `(hover: hover) and (pointer: fine)`, use `pointer-events: none` overlays, and stay off operator and admin dashboards.
- Pause or stop effects when the tab is hidden (`visibilitychange`) or the element is off screen.
- Scroll listeners are `passive`. No scroll-jacking, and keep native scrolling.
- Use `backdrop-filter` (glass) sparingly. It is expensive on low-end Android, so limit it to a few elements per screen and never apply it to long scrolling lists.
- **No new animation library by default.** Add one (for example a small motion library) only if CSS and rAF genuinely can't do the job, and explain the size cost in the report.

## Performance budgets (mobile, mid-range Android, 4G)

- LCP under 2.5s, CLS under 0.1, INP under 200ms.
- Keep initial JS for public pages lean. Routes are lazy-loaded in `client/src/main.jsx`; keep it that way, and lazy-load heavy scenes or illustrations below the fold.
- Images: explicit dimensions or aspect ratio, responsive sizes, lazy below the fold (see `india-visual-storytelling`).
- Fonts: Manrope only, with `font-display: swap`, and load only the weights you use.
- API: avoid waterfalls. Fetch page data in parallel and show skeletons that match the final layout.

## How to verify

- Toggle reduced motion (DevTools → Rendering → Emulate CSS `prefers-reduced-motion`) and confirm the page is complete and usable.
- Record a Performance trace while scrolling the home and explore pages. There should be no long tasks over 50ms caused by animation, and the frame rate should stay steady.
- Check `npm run build` output sizes and mention any notable growth in the report.
