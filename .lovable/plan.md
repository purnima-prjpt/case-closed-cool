# Set the Delulu Bench favicon

Use the chosen Gen Z meme-court gavel-with-sunglasses draft as the site's favicon.

## Steps
1. Downscale the chosen draft (`favicon-gen-z-draft.png`) to a 64×64 square favicon and copy it into `public/favicon.png`.
2. Update `src/routes/__root.tsx` head links to reference `/favicon.png` instead of the default `/favicon.ico`.
3. Delete the template's stale `public/favicon.ico`.
4. Verify the favicon loads in the preview tab.

No other UI or functional changes.