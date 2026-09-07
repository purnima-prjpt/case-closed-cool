DROP VIEW IF EXISTS public.case_vote_counts;

CREATE VIEW public.case_vote_counts
WITH (security_invoker = true) AS
SELECT v.case_id,
       v.verdict,
       (count(*))::integer AS count
FROM public.votes v
GROUP BY v.case_id, v.verdict;

GRANT SELECT ON public.case_vote_counts TO anon, authenticated;
GRANT ALL ON public.case_vote_counts TO service_role;

REVOKE SELECT ON public.votes FROM anon, authenticated;
GRANT SELECT (case_id, verdict) ON public.votes TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can read vote tallies on live cases" ON public.votes;
CREATE POLICY "Anyone can read vote tallies on live cases"
ON public.votes FOR SELECT
TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.cases c
  WHERE c.id = votes.case_id
    AND c.created_at > (now() - interval '24 hours')
));