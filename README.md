# Case Closed Online

you can suggest a better name for this that can attract gen z and color pattlets too.  but you have follow the guidliness given below.

Internet Court — Let the internet decide

Post your everyday drama. Strangers vote. Gone in 24 hours.

Internet Court is a fun, anonymous web app where people post lighthearted everyday situations and let strangers decide who's right. Your roommate keeps stealing your charger? Your friend dodged the bill again? Post it, let the internet vote, and get a verdict — complete with a funny sentence.

It is purely for entertainment. It is not for legal advice, serious disputes, harassment, defamation, or public shaming.

Core rules

No accounts. No signup, no login, no profiles. Nobody knows who you are.

Nothing is stored on a server. Cases and votes live only in the browser's session storage. There is no database.

Every case has a short life. A case closes as soon as 5 judges vote, or when its 24-hour timer runs out — whichever comes first.

Verdicts linger a little. Once a case closes, the verdict stays visible under Recent Verdicts for 24 hours, then disappears forever.

How to use it

1. Raise a case

Open the Raise a Case tab.

Pick a category: Roommates, Friends, Work, Family, Neighbours, Public Behaviour, or Other.

Write your side of the story. Rotating placeholder examples (like "My roommate keeps using my charger without asking...") show what a good case looks like.

Optionally add the other side — what you think the other person would say in their defense.

A small Before you post reminder row keeps things safe: keep it light · no real legal stuff · no abusive words · no bullying · nothing vulgar · no death or violence · add enough detail.

Hit submit. No name needed.

2. Share your case

After submitting, you get your case link — a unique URL with a copy button (and native sharing on phones).

The case data is encoded directly into the link, so anyone who opens it sees your case on their Judge's Bench, ready to vote. Nothing needs a server.

3. Judge other cases

Open the Judge's Bench to see every open case, each with a live countdown timer.

Read both sides, then vote: Guilty, Not Guilty, or Shared responsibility.

Optionally suggest a funny sentence (up to 80 characters) — the best one becomes part of the verdict.

Each browser gets one vote per case. Once you vote, that's it.

A progress bar shows the jury filling up: 5 votes closes the case.

Not enough humans around? The AI jury can fill the empty seats so a verdict still lands.

4. See the verdict

When the 5th vote lands (or time runs out), the case closes and the verdict appears: the winning side, the vote percentages, and the sentence.

Human-suggested sentences beat AI ones, so real wit wins.

The verdict card has its own copy link button and a close button that takes you back home.

Closed cases sit under Recent Verdicts for 24 hours, then vanish.

Writing checks and moderation

Every submission — the case, the defense, and any funny sentence — passes through automatic checks before it's accepted.

Quality checks

Minimum 25 characters and at least 4 words, with friendly nudges like "Write a few more words so people can understand your case."

Language filter (English + Hinglish)

A strong filter covering profanity, slurs, sexual content, hate speech, and anything about death, killing, or self-harm — in both English and Hinglish (Roman Hindi), including common short forms.

It catches disguised spellings too: leet-speak (@ → a, 0 → o), repeated letters (fuuuck), and separators (f u c k) are all normalized before matching.

A built-in allow-list protects innocent words (like "class" or "grape") from false alarms.

Blocked text gets a friendly message: "Let's keep it fun. Please rewrite your case without abusive or harmful words."

Look and feel

Theme: a clean daylight look — near-white background, deep ink text, and an indigo brand color.

Verdict colors: mint for Not Guilty, coral for Guilty, amber for Shared.

Fonts: Space Grotesk for headings, DM Sans for body text.

Style: soft rounded cards, light borders, subtle shadows, and big tap targets — clean, playful, and trustworthy.

Tech notes

Built with React 19 and TanStack Start (file-based routing), styled with Tailwind CSS v4.

Runs entirely in the browser — no backend, no database, no accounts.

Cases and votes are kept in sessionStorage; share links carry the full case encoded in the URL (?c=...), so sharing works without any server.

Text moderation runs client-side in a dedicated module, checking the case, the defense, and judge sentences before anything is accepted.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/94f38365-3344-4c6d-a4d8-aff6c506c652).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
