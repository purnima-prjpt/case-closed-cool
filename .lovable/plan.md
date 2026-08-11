# Longer cases, skip button, and a better dark theme

## 1. Allow 400 characters

Right now the database rejects a case title longer than 200 characters, which is why long
first lines failed. The limit moves to 400 characters for the case title, and the form's
own counter and validation move with it, so Side A and Side B keep working as they do today
(they already allow far more).

## 2. Clear error messages instead of "Couldn't file the case"

Any failure while filing a case or voting will say what actually went wrong, in the
courtroom voice — too long by N characters, case already closed, you already voted,
or a connection problem — never the generic "try again in a moment" line.

## 3. Skip a case on Jury Duty

A "Skip for now" button next to the three verdict buttons moves to the next case without
recording a vote. Skipped cases go to the back of the queue for this session, so they come
back after you've seen the rest. Case counter and progress bar update accordingly. If every
case is skipped, the empty state offers to reshuffle.

## 4. Dark theme refresh (and light stays good)

- Cards get a distinctly lighter surface than the page background, so each card reads as
  its own panel, with a slightly brighter border and a soft shadow.
- Brand indigo shifts to a more vivid, Gen Z-friendly violet with better contrast on both
  themes; secondary surfaces stop being saturated blue and become neutral slate.
- Verdict colors (mint / coral / amber) are retuned per theme so the badges pop on dark
  without glowing, and stay readable on light.
- The same tokens drive both themes, so nothing has to be styled twice.

## 5. Link vs Jury Duty (your last question)

That is already how it works, and it stays that way: opening a share link shows just that
one case card, while Jury Duty shows every open case you have not voted on. With the skip
button added, the bench becomes a proper stack you can flip through.

## Technical notes

- Migration: replace the cases insert policy's `length(title) <= 200` check with `<= 400`.
- `src/routes/index.tsx`: title max length 400; surface real error text from the mutation.
- `src/lib/court.ts` / `src/routes/jury.tsx`: map backend error codes (unique violation,
  policy violation, network) to specific messages; add skip state to the queue.
- `src/styles.css`: retune `:root` and `.dark` token values only — no component-level
  hardcoded colors.
