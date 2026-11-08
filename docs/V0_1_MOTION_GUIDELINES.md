# Ghumo AI V0.1: motion guidelines

*Motion makes India feel alive. It never stands between a traveller and a trip.*

- **Implementation:** `client/src/motion/useSceneMotion.js`.
- **Library:** GSAP 3.15.0 plus ScrollTrigger.

## 1. Rules

1. **Never block.** No pinning, no scroll-jacking, no wheel or touch interception, no intro animation to wait for. Scenes scrub against native scroll, and the page scrolls exactly as it would without motion.
2. **Content first.** Text, prices, seats and buttons are visible in the HTML from the first paint. Reveals start from the visible state as soon as motion is disallowed.
3. **Animate only `transform` and `opacity`.** The one SVG-specific exception is `strokeDashoffset` on the road path. No layout properties, filters or blur animations.
4. **Respect the reader.** `prefers-reduced-motion: reduce` disables every scroll-linked and ambient effect, and skeleton pulses stop.
5. **Phones get less.** Phones get about 40% of the parallax travel and no continuous ambient loops.
6. **Clean up.** All tweens and ScrollTriggers are created inside `gsap.context()` plus `gsap.matchMedia()` and reverted on unmount and whenever a media query changes.
7. **Off screen means off.** Ambient loops play only while their scene is in the viewport.

## 2. Tiers (`gsap.matchMedia`)

| Tier | Query | What runs |
| --- | --- | --- |
| **Full** | `(prefers-reduced-motion: no-preference) and (min-width: 768px)` | Parallax (70 units), sun rise, sunlight shift, road draw, ambient drift, waves and boats, reveals |
| **Lite** | `(prefers-reduced-motion: no-preference) and (max-width: 767.98px)` | Parallax (30 units), sun rise, sunlight shift, road draw, reveals. No loops |
| **None** | `(prefers-reduced-motion: reduce)` | Nothing. Static scenes and all content visible |

## 3. Scene vocabulary

Every scene is plain SVG with tagged layers. Each `[data-scene]` container is its own ScrollTrigger, running from `top bottom` to `bottom top` with `scrub: 0.6`.

| Attribute | Effect | Used for |
| --- | --- | --- |
| `data-depth="d"` | `y` from `d × travel` to `−d × travel` | Mountains at different speeds, dunes, city layers at different depths |
| `data-rise` | Sun moves up as you scroll | Sunrise over ghats, peaks and the sea |
| `data-sun` | Light overlay opacity from 0.05 to 0.6 | Desert dunes with changing sunlight |
| `data-draw` | `strokeDashoffset` from the path length to 0 (until the scene's centre) | The winding mountain road |
| `data-drift` | Slow `x` yoyo (18s and up, sine) | Clouds, kites, mist bands |
| `data-wave` | Small `x` yoyo (about 3s) | River and sea ripples, floating diyas, waterfall streaks |
| `data-bob` | ±1.5° rotation from the hull bottom (about 2.5s) | Boats. Rotation only, because `y` belongs to parallax |

## 4. Page choreography

| Page | Motion |
| --- | --- |
| **Home** | The Himalayan hero scene parallaxes as you scroll away. Nothing else moves except hover lifts |
| **Explore India: landscape chapters** | Each scene parallaxes as it passes. The info panel overlaps the scene (static), and its trip cards reveal with a stagger when they enter |
| **Explore India: city chapters** | On `lg` and up the scene is **CSS-sticky** (not pinned) beside the story. Landmarks, nearby places and trips reveal in staggered groups. **Delhi** hands off: the monument scene fades to 35% and settles as its trip cards arrive (`data-handoff`) |
| **Place pages** | City scenes parallax inside the header. Other places use static palette art |
| **Trips, trip detail, Help me decide, Compare** | No scroll motion. Only hover lifts (disabled under reduced motion) and `animate-fade-up` for dialogs |

**Reveal defaults:**
- `y: 28 → 0`, `opacity: 0 → 1`, `0.6s power2.out`, stagger `0.08s`.
- Triggered once at `top 85%`.
- Reduced motion: none.

## 5. Timing and easing

| Kind | Duration | Ease |
| --- | --- | --- |
| Hover lift, press | 200–300ms | CSS default |
| Reveal | 600ms, staggered at 80ms, total under 0.6s per group | `power2.out` |
| Scrubbed scene layers | Tied to scroll, 0.6s catch-up | `none` |
| Ambient drift | 18–30s yoyo | `sine.inOut` |
| Waves and boats | 2.4–4s yoyo | `sine.inOut` |
| Dialogs and drawers | about 500ms | `fade-up` keyframe |

## 6. Performance budget

- **GSAP lives only in the lazy prototype chunk.** The live site's bundles don't change.
- Scenes are inline SVG: no image decoding, and they stay sharp at every DPR.
- Keep each scene to about 60 elements or fewer, and avoid SVG filters and blur in animated layers.
- Ambient tweens pause off screen, and ScrollTrigger refreshes on hash navigation.
- Check: a Performance trace while scrolling Explore India should show no long tasks over 50ms from animation and no layout shifts (CLS 0 from motion).

## 7. Adding a new scene

1. Draw it in a 1600×900 viewBox. Group the layers by distance and tag them with `data-depth`. The furthest layer gets the smallest value.
2. Keep important shapes within the middle 70% horizontally, because phones crop the sides (`xMidYMax slice`).
3. Put it in a container with `data-scene` inside a component that calls `useSceneMotion(ref)`.
4. Make sure the still frame reads well on its own. That is the reduced-motion experience.
5. Check it at 360px, with reduced motion emulated, and in a Performance trace.
