# Make cases real: shared backend for Delulu Bench

## What's wrong today

Nothing is saved anywhere outside your own browser tab. Cases and votes live in `sessionStorage`, which:

- is wiped the moment you close the tab (that's why your own filed cases disappear),
- is per-device, so nobody else ever sees your docket,
- means the "live docket" you see is really just the 4 seeded examples plus whatever you typed in that tab.

The only way another person could see a case was by opening a `?c=...` share link, and even then their vote landed in *their* browser only — it never came back to you. So the app effectively has no audience.

## The fix

Turn on Lovable Cloud (built-in database) and move cases and votes to it. Still no accounts, still anonymous, still auto-expiring.

### How it will work

1. **File a case** → saved to the shared database, gets a real short ID and a clean share link (`/verdict?id=abc123`).
2. **Bench (`/jury`)** → shows every open case from everyone, newest first, with live countdown.
3. **Vote** → written to the database and immediately counted for everybody. One vote per browser, enforced by a stored anonymous browser ID plus a uniqueness rule in the database.
4. **Close** → a case closes at 5 votes or 24 hours, whichever comes first.
5. **Recent Verdicts** → closed cases stay visible for 24 hours after closing, then disappear.

### Rules kept exactly as-is

- No signup, no login, no profiles, no IP or personal data stored.
- One vote per browser per case.
- Case closes at 5 votes or 24h.
- Verdict visible for 24h after close, then gone.
- Client-side moderation still runs before anything is submitted.
- Nothing about the look, copy, court rules, dialogues, or Google Analytics changes.

## Technical details

- Enable Lovable Cloud. Two tables:
  - `cases` — id, title, category, story, defense, sentence, created_at, expires_at, closed_at.
  - `votes` — id, case_id, verdict, voter_key, created_at, unique on (case_id, voter_key).
- Grants + RLS: anonymous role can read open/recently-closed cases and insert cases and votes; no updates or deletes from the client. Vote totals read through an aggregated view or count query so no one can see who voted what.
- `voter_key` is a random UUID generated in the browser and kept in `localStorage` — anonymous, not tied to any identity.
- Reads/writes go through TanStack `createServerFn` modules; routes load via TanStack Query so the docket refreshes.
- `src/lib/court.ts` keeps its pure helpers (`totalVotes`, `leadingVerdict`, `timeLeft`, verdict metadata, dialogues) and drops the `sessionStorage` + URL-encoding storage layer.
- Old `?c=...` links keep working: `/verdict` will still decode a `c` param if present, alongside the new `?id=` lookup.
- Seeded demo cases move into the migration as literal inserts so the bench isn't empty on a fresh deploy.
- Expiry is enforced on read (filter by `expires_at`) plus a cleanup that drops rows past their verdict-visibility window.

## About GitHub

Connecting GitHub is independent of this — it just mirrors the code to a repo with two-way sync. Do it from the + menu → GitHub → Connect project whenever you like; it won't affect this work.
