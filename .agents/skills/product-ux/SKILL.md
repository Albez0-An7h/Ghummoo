---
name: product-ux
description: Use when shaping a Ghumo AI flow, page or feature, or deciding what to build, cut or simplify. Covers traveller, organiser and admin journeys, honest-data rules and where AI belongs.
---

# Product and UX for Ghumo AI

## Who we serve

- **Traveller:** browses India, compares fixed-departure group trips, sends a booking request, and follows their trip in My trips. They need to understand exactly what they are paying for and who runs the trip.
- **Organiser (operator):** a small, independent business, often run from Instagram and WhatsApp. They need to list packages fast (AI Package Studio), manage departures and seats, confirm requests, record payments, and post announcements to confirmed travellers.
- **Admin:** approves and verifies organisers, moderates listings, and handles reports.

## Before designing anything

1. Name the user and the decision they are trying to make on this screen.
2. List the real data the screen has (check the model in `server/src/models/` and the API response). Design from that data; never invent fields to make a layout look full.
3. Find the existing page or component that already does part of the job and extend it instead of building a second one.
4. Decide what to leave out. One clear primary action per screen.

## Honest marketplace rules

- Prices, seats left, departure dates, inclusions, organiser details and booking status come from the API only. If a value is missing, show that it's missing ("Price on request", "Pickup point not yet shared"). Don't fill in a plausible value.
- **No fake social proof.** That means no invented review counts, "X people viewing", urgency timers or "Verified" badges unless `Operator.verifiedAt` is set by an admin.
- Demo and sample content (`isDemo: true`) is labelled where it is shown.
- **Booking is a request.** Copy must say the organiser confirms the booking and shares payment details directly. There is no online payment.
- Private data (traveller phone or email, manifests, payment records) is visible only to the trip's organiser, the traveller themselves and admins.

## Where AI belongs

- **Use AI** where it removes real effort or helps a decision:
  - turning a caption into a structured package;
  - matching a traveller's preferences to real packages;
  - answering questions about a specific package from its stored data.
- Every AI answer is grounded in API data and says when the data doesn't cover the question.
- AI output that creates or changes records is a **draft** that a human reviews before saving.
- **Don't use AI** for navigation, as a decoration, or as a chat box on every page. A good filter or a clear page often beats a chatbot.

## Flow quality checklist

- The primary action is obvious within 3 seconds on a 360px-wide screen.
- Every list has loading, empty (with a next step) and error (with retry) states.
- Forms validate inline, keep the user's input after an error, and explain what to fix.
- Status words are consistent across traveller, organiser and admin views (`pending`, `confirmed`, `rejected`, `cancelled`).
- Copy is plain, warm and specific. Use Indian context (₹, city names, IST) without forced slang.
- Destructive actions (cancel a booking, unpublish) confirm what will happen to seats and travellers.

## Scope control

When a request would add a new surface, check first whether an existing page, filter or component can absorb it. Propose the smallest version that serves the user, and list what you deliberately left out.
