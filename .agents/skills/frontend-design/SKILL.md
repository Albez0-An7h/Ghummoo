---
name: frontend-design
description: Use when building or restyling any UI in client/. Defines the Warm Tangerine Glass system (tokens, type, surfaces, components) and how to write React and Tailwind code that matches the existing app.
---

# Frontend design: Warm Tangerine Glass

## Source of truth

- Tokens: `client/src/index.css` (`@theme`). Use the Tailwind names (`bg-brand`, `text-ink`, `border-line`, `bg-sand` and so on). Never hard-code hex values in components; add a token if something is missing.
- Shared components: `client/src/components/ui.jsx`. Reuse these before writing new markup:
  - Button, Input, Textarea, Select, Field;
  - Badge, StatusBadge, Card;
  - Spinner, Skeleton, EmptyState, ErrorState, Notice;
  - Modal, Tabs, Stat, SafeImage, PageHeader, ListEditor.
- Data loading: `useAsync` from `client/src/lib/useAsync.js`. API calls go through `client/src/lib/api.js`, which unwraps `{ data }`.
- Icons: `lucide-react` only.

## Palette

| Role | Token | Value |
| --- | --- | --- |
| Primary action, highlights | `brand` | `#F26A2E` |
| Hover or pressed | `brand-hover` | `#DC571F` |
| Orange text on light | `brand-ink` | `#B4461A` (AA) |
| Page background | `ivory` | `#FFF7EF` |
| Secondary surface | `sand` | `#F9F0E8` |
| Text | `ink` | `#241F1B` |
| Secondary text | `muted` / `subtle` | `#81766D` / `#6B6058` (`subtle` for text under 16px) |
| Borders | `line` | `#EDE1D6` |

- Status colours come from the `success`, `warning` and `danger` tokens and their `-bg` pairs.
- No blue or purple UI accents. Colour richness comes from photography and illustration, not from extra UI hues.
- Never put white text on `brand` below 18px bold; use `ink` on `brand` or `brand-ink` on light surfaces instead.

## Type

- Manrope throughout. Headlines are tight (`tracking-tight`) and confident: 600 to 800 weight, with large editorial sizes on discovery pages.
- Body text is 15 to 16px and line length stays at or under about 70 characters.
- Use the `num` utility (tabular figures) for prices, seats and dates in tables or lists.

## Surfaces and layout

- **Glass** (`glass` utility) is used selectively: over photography or illustration (search panel, floating headers, hero chips). Never stack glass on glass, and never use it on plain backgrounds where it just looks grey.
- **Cards:**
  - corners `rounded-2xl` or `rounded-3xl` with the `shadow-soft` shadow; `shadow-lift` on hover for interactive cards;
  - a 1px `line` border on light backgrounds.
- **Discovery pages:** full-bleed imagery, generous whitespace, horizontal rails (`Rail.jsx`), and editorial headings.
- **Organiser and admin pages:** calm and dense, but still warm (ivory, sand, orange accents). Avoid a generic grey SaaS grid; lead with the next action (requests to confirm, departures filling up).
- Mobile first. Design at 360px, then scale up. Tap targets are at least 44px. No horizontal page scroll.

## Component rules

- One primary (orange) button per view region. Secondary buttons are outline or ghost.
- Every async view handles loading (Skeleton that matches the final layout), empty (EmptyState with a next step) and error (ErrorState or Notice with retry).
- Images go through `SafeImage` with meaningful `alt` text, explicit size or aspect ratio, and `loading="lazy"` below the fold.
- Forms use `Field` (label plus hint plus error). Keep user input after server errors.
- Lazy-load routes in `main.jsx`; keep heavy visuals out of the operator and admin bundles.

## Playful and premium, not noisy

- Delight comes from a few deliberate moments: the hero, destination tiles, empty-state illustrations and the flight cursor. It never comes from decorating every element.
- Prefer one strong image over three weak ones.
- Copy is warm and specific; microcopy can smile, but errors stay clear.

## Before you finish

- Check 360px, 768px and 1280px+ widths.
- Check keyboard focus visibility (the global `:focus-visible` ring must not be removed).
- Run `npm run lint` and `npm run build`.
