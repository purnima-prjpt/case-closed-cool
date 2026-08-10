DROP POLICY IF EXISTS "Anyone can read votes on live cases" ON public.votes;

CREATE POLICY "Anyone can read votes on live cases"
ON public.votes
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.cases c
    WHERE c.id = votes.case_id
      AND (
        (c.closed_at IS NULL AND c.expires_at > (now() - interval '24 hours'))
        OR (c.closed_at IS NOT NULL AND c.closed_at > (now() - interval '24 hours'))
      )
  )
);