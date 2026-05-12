## Goal

Port the lead-capture + email-sequence pattern from the reference RunMatch project onto WatchMatch AI: an `EmailGate` modal that captures the lead before unlocking the personalized result, sends an immediate Day-0 welcome via Brevo, and enrolls the contact into a Brevo automation list for the multi-day nurture sequence (the same 8-email content already drafted on `/brevo-smartwatch-sequence`).

## What gets built

1. **Enable Lovable Cloud** (required to securely store the Brevo API key and run server logic; users see Cloud, we use Supabase under the hood).
2. **Connect Brevo** as a standard connector (asks the user once; the connection key is then injected as `BREVO_API_KEY`).
3. **`EmailGate` component** (`src/components/EmailGate.tsx`)
   - Premium modal with first-name + email + GDPR consent
   - Bullet list of what they get (full personalized report, alternate pick, 8-day expert series)
   - Loading / success states, framer-motion, brand glass styling
   - localStorage flag so subscribed users skip the gate next time
   - Optional dismiss ("just show my results") so it never blocks UX
4. **Server function `subscribeLead`** (`src/lib/brevo.functions.ts`)
   - POST through the Brevo connector gateway
   - Upserts contact with rich attributes: FIRSTNAME, TOP_MATCH_BRAND, TOP_MATCH_MODEL, CATEGORY, PHONE_OS, BATTERY_PREF, WATCHMATCH_URL, SOURCE, UTM, OPT_IN_DATE
   - Adds to a list ID per source (quiz_gate / exit_popup / inline_hero)
   - Immediately sends Day-0 transactional template (configurable `BREVO_WELCOME_TEMPLATE_ID`, defaults to a graceful inline fallback HTML if unset) so the user gets value within seconds
   - Returns `{ success, welcomeSent }` and surfaces clean errors
5. **UTM helper** (`src/lib/utm.ts`) — captures UTM params on first visit, persists in sessionStorage.
6. **Wire the gate into the results flow**
   - In `watch-match.$slug.tsx` results page, gate the full detail view behind `EmailGate` (top match always visible as a teaser; full alternates / detailed report unlocked after subscribe or skip).
   - Pass real top-match brand/model + category + watch-match URL + UTM into `subscribeLead`.
7. **Soft exit-intent trigger** on the quiz/results page (mouse-leave on desktop, 25s dwell on mobile) — only fires once per session and never if already subscribed.
8. **Analytics** — push `lead_capture` events to `dataLayer` so GA4 / GTM picks them up.

## Email sequence delivery

The 8-email nurture sequence content already exists on `/brevo-smartwatch-sequence` (writing-ready). We will:
- Send Day-0 immediately from our server function (controlled, instant, branded).
- Days 2–21 are delivered by **Brevo Automations** triggered on list subscription — this is configured once inside Brevo (no cron infrastructure needed in our app, unlike the reference project's pg_cron dispatcher). The sequence page already documents the exact list/template setup for the Brevo dashboard.

## Security

- API key never reaches the client; all Brevo calls go through the server function via the Lovable connector gateway.
- Email + name validated with Zod (`email`, `max(255)`, regex), consent required, rate-limited to 1 submit per 5 s on the client.
- No user PII logged.

## Out of scope (can be added later if you want)

- Double opt-in (DOI) — easy to flip on once you create a Brevo DOI template; the server function already supports a `doubleOptIn` flag.
- A custom drip dispatcher running in Lovable (the reference uses pg_cron). Not needed: Brevo Automations handles Day 2–21 natively.

## Files touched

- new: `src/components/EmailGate.tsx`, `src/lib/brevo.functions.ts`, `src/lib/utm.ts`
- edited: `src/routes/watch-match.$slug.tsx` (gate the unlock), `src/routes/index.tsx` (capture UTM on land)

Once you approve, I'll enable Lovable Cloud, prompt you to connect Brevo, then ship the code.
