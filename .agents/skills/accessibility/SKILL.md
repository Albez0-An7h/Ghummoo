---
name: accessibility
description: Use for every UI change in Ghumo AI. A checklist for keyboard support, screen readers, contrast, forms, motion and mobile, aiming at WCAG 2.2 AA.
---

# Accessibility (WCAG 2.2 AA)

Every important feature must work with a keyboard, a screen reader, zoom at 200%, reduced motion, and a 360px-wide phone.

## Structure

- One `<h1>` per page, with headings in order. Use landmarks: `<header>`, `<nav>`, `<main>`, `<footer>`.
- Use real elements: `<button>` for actions, `<a href>` for navigation, `<label>` for every input. Never put a clickable `<div>` where a button belongs.
- On route change, move focus to the main heading or `<main>` and update `document.title`.
- Lists of trips and bookings use list semantics (`<ul>`/`<li>`) or a proper `<table>` with headers.

## Keyboard

- Every interactive element is reachable in a logical tab order and works with Enter or Space. Rails and carousels scroll with the keyboard and expose their controls.
- The focus ring is always visible. Don't override the global `:focus-visible` style in `index.css` without an equally visible replacement.
- **Modals** (`Modal` in `ui.jsx`): trap focus, close on Escape, return focus to the element that opened them, and set `aria-modal` with a labelled title.
- Menus, tabs and filters follow the matching ARIA patterns (arrow keys inside tab lists).

## Colour and contrast

- Text contrast is at least 4.5:1, or 3:1 for text 24px and above (or 18.66px bold), and 3:1 for UI borders and icons that carry meaning.
- Known-safe pairs:
  - `ink` on `ivory` or `sand`;
  - `subtle` on `ivory` for small text;
  - `brand-ink` for orange text;
  - white on `brand` only for large or bold text.
- `muted` (`#81766D`) on ivory is about 4.2:1, so use it only for text 18.66px bold or larger; otherwise use `subtle`.
- Never use colour alone for status. Pair it with text or an icon (as `StatusBadge` does).
- Text over photos needs a scrim or glass panel that keeps it AA over the busiest part of the image.

## Forms

- Each field has a visible label, an optional hint and an error message linked with `aria-describedby`. Errors are announced (use `role="alert"` or a live region) and say how to fix them.
- Don't clear input after a failed submit. Mark required fields in text, not only with an asterisk colour.
- Use the right `type`, `inputmode` and `autocomplete` (`tel`, `email`, `name`).

## Images and media

- Meaningful images have descriptive `alt`. Decorative scenes use `alt=""` or `aria-hidden="true"`. Icon-only buttons have an `aria-label`.
- Canvas effects (the flight cursor) are `aria-hidden` and `pointer-events: none`.

## Motion and timing

- Honour `prefers-reduced-motion` (see `motion-performance`). Nothing auto-plays for more than 5 seconds without a pause control.
- Seat holds and other time limits are explained in text. Never auto-cancel silently.

## Dynamic content

- Toasts (`react-hot-toast`) are not the only place important results appear. Show booking or confirmation results on the page too.
- Loading states have an accessible label (`aria-busy`, or a visually hidden "Loading trips…").

## Mobile

- Tap targets are at least 44×44px with spacing. There's no horizontal page scroll at 360px, and the layout works at 200% zoom.
- Don't disable pinch zoom.

## How to check

- Tab through the changed screens with no mouse.
- Run a quick screen-reader pass with VoiceOver: headings list, form labels, button names.
- Run Lighthouse or axe in DevTools on the changed pages, fix every serious issue, and note any remaining issues in the report.
