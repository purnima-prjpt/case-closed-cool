-- 1) Hide votes.voter_key from public reads (column-level privileges)
REVOKE SELECT ON public.votes FROM anon, authenticated;
GRANT SELECT (id, case_id, verdict, created_at) ON public.votes TO anon, authenticated;
GRANT INSERT ON public.votes TO anon, authenticated;
GRANT ALL ON public.votes TO service_role;
GRANT ALL ON public.cases TO service_role;

-- Allow a browser to check only its own votes, without exposing anyone else's key
CREATE OR REPLACE FUNCTION public.voted_case_ids(_voter_key text)
RETURNS TABLE (case_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.case_id
  FROM public.votes v
  JOIN public.cases c ON c.id = v.case_id
  WHERE v.voter_key = _voter_key
    AND length(_voter_key) >= 8
    AND c.created_at > now() - interval '24 hours';
$$;

REVOKE ALL ON FUNCTION public.voted_case_ids(text) FROM public;
GRANT EXECUTE ON FUNCTION public.voted_case_ids(text) TO anon, authenticated, service_role;

-- 2) Moderation controls: only trusted server-side (service_role) may close or remove cases
DROP POLICY IF EXISTS "Moderators can close or edit cases" ON public.cases;
CREATE POLICY "Moderators can close or edit cases"
ON public.cases
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Moderators can remove cases" ON public.cases;
CREATE POLICY "Moderators can remove cases"
ON public.cases
FOR DELETE
TO service_role
USING (true);

DROP POLICY IF EXISTS "Moderators can remove votes" ON public.votes;
CREATE POLICY "Moderators can remove votes"
ON public.votes
FOR DELETE
TO service_role
USING (true);