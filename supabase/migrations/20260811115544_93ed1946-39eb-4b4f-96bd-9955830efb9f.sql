DROP POLICY IF EXISTS "Anyone can file a case" ON public.cases;
CREATE POLICY "Anyone can file a case" ON public.cases
FOR INSERT
TO public
WITH CHECK (
  (closed_at IS NULL)
  AND (length(title) >= 1 AND length(title) <= 400)
  AND (length(story) >= 1 AND length(story) <= 2000)
  AND (length(defense) >= 1 AND length(defense) <= 2000)
  AND (sentence IS NULL OR length(sentence) <= 200)
  AND (length(category) <= 40)
);