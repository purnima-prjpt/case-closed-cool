CREATE TABLE public.cases (
  id TEXT NOT NULL PRIMARY KEY DEFAULT encode(gen_random_bytes(5), 'hex'),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Open Court',
  story TEXT NOT NULL,
  defense TEXT NOT NULL,
  sentence TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '24 hours',
  closed_at TIMESTAMPTZ
);

CREATE TABLE public.votes (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  verdict TEXT NOT NULL CHECK (verdict IN ('notGuilty', 'guilty', 'shared')),
  voter_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (case_id, voter_key)
);

CREATE INDEX cases_expires_at_idx ON public.cases (expires_at DESC);
CREATE INDEX votes_case_id_idx ON public.votes (case_id);

GRANT SELECT, INSERT ON public.cases TO anon, authenticated;
GRANT SELECT, INSERT ON public.votes TO anon, authenticated;
GRANT ALL ON public.cases TO service_role;
GRANT ALL ON public.votes TO service_role;

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read live cases"
  ON public.cases FOR SELECT
  USING (
    (closed_at IS NULL AND expires_at > now() - interval '24 hours')
    OR (closed_at IS NOT NULL AND closed_at > now() - interval '24 hours')
  );

CREATE POLICY "Anyone can file a case"
  ON public.cases FOR INSERT
  WITH CHECK (
    closed_at IS NULL
    AND length(title) BETWEEN 1 AND 200
    AND length(story) BETWEEN 1 AND 2000
    AND length(defense) BETWEEN 1 AND 2000
    AND (sentence IS NULL OR length(sentence) <= 200)
    AND length(category) <= 40
  );

CREATE POLICY "Anyone can read votes on live cases"
  ON public.votes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = votes.case_id));

CREATE POLICY "Anyone can vote on an open case"
  ON public.votes FOR INSERT
  WITH CHECK (
    length(voter_key) BETWEEN 8 AND 64
    AND EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = votes.case_id
        AND c.closed_at IS NULL
        AND c.expires_at > now()
    )
  );

-- Force server-controlled lifecycle values on insert.
CREATE OR REPLACE FUNCTION public.cases_set_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.created_at := now();
  NEW.expires_at := now() + interval '24 hours';
  NEW.closed_at := NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER cases_set_lifecycle_trg
  BEFORE INSERT ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.cases_set_lifecycle();

-- Close the case as soon as the 5th vote lands.
CREATE OR REPLACE FUNCTION public.close_case_on_quorum()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vote_count INTEGER;
BEGIN
  SELECT count(*) INTO vote_count FROM public.votes WHERE case_id = NEW.case_id;
  IF vote_count >= 5 THEN
    UPDATE public.cases SET closed_at = now()
    WHERE id = NEW.case_id AND closed_at IS NULL;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER close_case_on_quorum_trg
  AFTER INSERT ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.close_case_on_quorum();

-- Seed examples so the bench isn't empty.
INSERT INTO public.cases (title, category, story, defense, sentence) VALUES
('My roommate keeps using my charger without asking', 'Roommates',
 'Every single night my 65W brick migrates to her side of the room. I''ve asked nicely four times. Yesterday I found it under her pillow like a hostage.',
 'She says a charger in a shared flat is ''communal infrastructure''.',
 'One (1) charger of her own, purchased with her own money.'),
('My friend dodged the bill again', 'Money',
 'Fourth dinner in a row where he goes to the washroom exactly when the bill lands. He ordered the most expensive thing both times I counted.',
 'He claims his UPI has been ''acting weird since March''.',
 'Must pay the next three bills, in full, in cash.'),
('I left the group chat over a poll about brunch', 'Group Chat',
 'They made a poll with 11 options, ignored my vote, and then picked the place I said I was allergic to. So I left. Dramatically.',
 'They say I could have ''just muted it like a normal person''.',
 NULL),
('I ate my flatmate''s labelled leftovers', 'Food Crimes',
 'It had her name on a sticky note. But it was 2am, it was biryani, and I fully intended to replace it. I have not replaced it. It has been nine days.',
 'I did leave a very heartfelt apology note with a drawing.',
 'Replace the biryani. Double portion. Today.');

-- Daily cleanup once the verdict window has passed.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'delulu-bench-cleanup',
  '17 * * * *',
  $$
  DELETE FROM public.cases
  WHERE (closed_at IS NOT NULL AND closed_at < now() - interval '24 hours')
     OR (closed_at IS NULL AND expires_at < now() - interval '24 hours');
  $$
);