---
name: india-visual-storytelling
description: Use when choosing or creating imagery, landmark illustrations, landscape scenes or destination storytelling for Ghumo AI. Covers sourcing, licensing, cultural accuracy, art direction and delivery formats.
---

# India visual storytelling

The aim is to make people *want to go*, through editorial photography, custom Indian landmark illustrations and atmospheric landscape scenes. The visuals must be honest, respectful and fast.

## Art direction

- **Photography:** editorial and human-scale, with real places, natural light and warm grading that sits well on ivory.
  - Prefer moments (a chai stop at Kasol, prayer flags at Chandrashila, a houseboat at dawn in Alleppey) to stock-style poses or over-saturated HDR.
- **Illustration:** custom, simplified landmark and landscape art in the brand palette, with tangerine, peach, sand and ink plus one natural accent per scene (Himalayan snow, Kerala green, Rajasthan sand).
  - Flat or lightly textured shapes, a consistent stroke and corner language, and no generic clip-art.
- **Atmospheric scenes:** layered landscapes (mountain ridges, backwaters, dunes, ghats) usable as hero backdrops and section dividers. Build them in layers so they can carry subtle parallax.
- **Glass over imagery:** search panels and chips may float on photos with the `glass` utility. Make sure text keeps AA contrast over the busiest part of the image (add a soft scrim if needed).

## Cultural accuracy and respect

- Show each landmark correctly (architecture, setting, region). Don't merge places, invent monuments or place a landmark in the wrong state.
- Religious sites are shown respectfully: no people posed disrespectfully, and no sacred symbols used as decoration or patterns.
- Represent India's diversity of regions, people and seasons, not only the Taj Mahal and Goa. Avoid exoticising clichés (snake charmers, poverty as backdrop).
- Name places in their common English form, and add the local name where it helps.

## Honesty rules

- **Trip images belong to the trip.** A package's photos come from its organiser (`TripPackage.images`) or are clearly marked as representative of the destination.
- Never show a hotel, vehicle or activity in imagery that the package doesn't include.
- Destination illustrations are never used as if they were trip photos.
- Demo and sample imagery is labelled as such where it might be mistaken for a real listing.

## Sourcing and licensing

- Use only images we have the right to use: organiser uploads, our own illustrations, or openly licensed photos (for example the Unsplash licence, as in the current seed data). Record the source and credit in code comments or a credits file.
- No scraped Instagram or Google images, and no AI-generated "photos" presented as real places.
- Don't recreate another brand's illustration style or mascot.

## Delivery

- Illustrations: optimised inline SVG or `.svg` files (aim for under 30 KB each, no embedded rasters). Expose colours through `currentColor` or CSS variables so they follow tokens.
- Photos: modern formats (AVIF or WebP with a JPEG fallback), responsive `srcset`/`sizes`, an explicit aspect ratio, `loading="lazy"` below the fold, and `fetchpriority="high"` only for the hero image.
- Store project assets in `client/src/assets/` (bundled) or `client/public/` (static). Keep the total weight of the first view under about 400 KB of images on mobile.
- Every image has `alt` text that describes the place ("Boats on the Alleppey backwaters at sunrise"). Purely decorative scenes use `alt=""` and `aria-hidden`.
