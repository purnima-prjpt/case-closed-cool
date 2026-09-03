-- Fix: votes_voter_key_public_exposure
-- Expose vote counts through an aggregate view instead of the raw votes table,
-- so the anonymous voter_key never leaves the server.

-- Safe aggregate view: no voter_key column, no individual vote rows.
CREATE OR REPLACE VIEW public.case_vote_counts AS
SELECT
  case_id,
  verdict,
  COUNT(*)::int AS count
FROM public.votes
GROUP BY case_id, verdict;

-- Public read access to the aggregate view only.
GRANT SELECT ON public.case_vote_counts TO anon;
GRANT SELECT ON public.case_vote_counts TO authenticated;

-- Remove the broad SELECT policy on votes that exposed voter_key to everyone.
DROP POLICY IF EXISTS "Anyone can read votes on live cases" ON public.votes;

-- Only service_role can inspect raw votes (moderation / audit).
CREATE POLICY "Service role can read raw votes"
ON public.votes
FOR SELECT
TO service_role
USING (true);