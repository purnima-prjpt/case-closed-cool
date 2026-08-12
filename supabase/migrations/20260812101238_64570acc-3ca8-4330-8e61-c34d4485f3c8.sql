DROP POLICY IF EXISTS "Anyone can read live cases" ON public.cases;
CREATE POLICY "Anyone can read live cases" ON public.cases
FOR SELECT USING (created_at > now() - interval '24 hours');

DROP POLICY IF EXISTS "Anyone can file a case" ON public.cases;
CREATE POLICY "Anyone can file a case" ON public.cases
FOR INSERT WITH CHECK (
  closed_at IS NULL
  AND length(title) BETWEEN 1 AND 400
  AND length(story) BETWEEN 1 AND 2000
  AND length(defense) BETWEEN 1 AND 2000
  AND (sentence IS NULL OR length(sentence) <= 500)
  AND length(category) <= 40
);

DROP POLICY IF EXISTS "Anyone can read votes on live cases" ON public.votes;
CREATE POLICY "Anyone can read votes on live cases" ON public.votes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.id = votes.case_id AND c.created_at > now() - interval '24 hours'
  )
);