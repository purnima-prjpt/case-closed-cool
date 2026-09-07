DROP VIEW IF EXISTS public.case_vote_counts;

CREATE VIEW public.case_vote_counts
WITH (security_invoker = false) AS
SELECT v.case_id,
       v.verdict,
       (count(*))::integer AS count
FROM public.votes v
JOIN public.cases c ON c.id = v.case_id
WHERE c.created_at > (now() - interval '24 hours')
GROUP BY v.case_id, v.verdict;

GRANT SELECT ON public.case_vote_counts TO anon, authenticated;
GRANT ALL ON public.case_vote_counts TO service_role;