-- Ensure the aggregate view runs as the caller, not the owner.
ALTER VIEW public.case_vote_counts SET (security_invoker = true);
