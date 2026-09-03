// Delulu Bench — cases and votes live in the shared cloud database.
// No accounts: each browser gets a random anonymous voter key.

import { supabase } from "@/integrations/supabase/client";

export type VerdictKey = "notGuilty" | "guilty" | "shared";

export type Case = {
  id: string;
  title: string;
  category: string;
  story: string;
  defense: string;
  sentence?: string;
  createdAt: number;
  expiresAt: number;
  closedAt: number | null;
  votes: Record<VerdictKey, number>;
  voted: boolean;
};

export const CATEGORIES = [
  "Roommates",
  "Friends",
  "Family",
  "Situationships",
  "Group Chat",
  "Work",
  "Money",
  "Food Crimes",
] as const;

export const VERDICTS: { key: VerdictKey; label: string; sub: string }[] = [
  { key: "notGuilty", label: "Not Guilty", sub: "You're valid" },
  { key: "guilty", label: "Guilty", sub: "Bro, no" },
  { key: "shared", label: "Shared Blame", sub: "Both delulu" },
];

// Courtroom flavour, borrowed from Bollywood and animated classics.
export const DIALOGUES = [
  "Order, order! Ye adalat thodi delulu hai.",
  "Tareekh pe tareekh… but this one expires in 24 hours.",
  "Kitne aadmi the? Only 5 votes needed, sir.",
  "Mogambo khush hua — the verdict is in.",
  "Hakuna Matata, but make it legally binding.",
  "To the group chat and beyond.",
  "Bade bade chats mein aisi choti choti baatein hoti rehti hain.",
  "Picture abhi baaki hai, judge saab.",
  "Anyone can cook. Not everyone can split a bill.",
  "Don ko pakadna mushkil hi nahi, namumkin hai — unlike this verdict.",
];

export const SENTENCES = [
  "Sentenced to one (1) sincere apology, no emoji.",
  "Must buy chai for the entire group chat.",
  "Banned from the aux cord for 7 days.",
  "Ordered to reply within 3 hours. Forever.",
  "Community service: doing the dishes twice.",
  "Left on read by the court. Case closed.",
];

const VOTER_KEY = "delulu-bench:voter:v1";
export const LIFETIME_MS = 24 * 60 * 60 * 1000;
export const VERDICT_THRESHOLD = 5;

function isBrowser() {
  return typeof window !== "undefined";
}

export function pick<T>(list: readonly T[], seed?: string): T {
  if (!seed) return list[Math.floor(Math.random() * list.length)]!;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return list[h % list.length]!;
}

/** Random, anonymous, per-browser key. Not tied to any identity. */
export function voterKey(): string {
  if (!isBrowser()) return "";
  let key = localStorage.getItem(VOTER_KEY);
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem(VOTER_KEY, key);
  }
  return key;
}

// --- mapping -------------------------------------------------------------

type Row = {
  id: string;
  title: string;
  category: string;
  story: string;
  defense: string;
  sentence: string | null;
  created_at: string;
  expires_at: string;
  closed_at: string | null;
};

type VoteCountRow = {
  case_id: string;
  verdict: string;
  count: number;
};

const SELECT = "id,title,category,story,defense,sentence,created_at,expires_at,closed_at";

function buildVoteCountsMap(rows: VoteCountRow[]): Record<string, Record<VerdictKey, number>> {
  const map: Record<string, Record<VerdictKey, number>> = {};
  for (const row of rows) {
    const counts = (map[row.case_id] ??= { notGuilty: 0, guilty: 0, shared: 0 });
    if (row.verdict in counts) {
      counts[row.verdict as VerdictKey] = row.count;
    }
  }
  return map;
}

function toCase(row: Row, voteCounts: Record<string, Record<VerdictKey, number>>, votedIds: Set<string>): Case {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    story: row.story,
    defense: row.defense,
    ...(row.sentence ? { sentence: row.sentence } : {}),
    createdAt: new Date(row.created_at).getTime(),
    expiresAt: new Date(row.expires_at).getTime(),
    closedAt: row.closed_at ? new Date(row.closed_at).getTime() : null,
    votes: voteCounts[row.id] ?? { notGuilty: 0, guilty: 0, shared: 0 },
    voted: votedIds.has(row.id),
  };
}

/** Case ids this browser has already voted on. Voter keys never leave the server. */
async function myVotedCaseIds(): Promise<Set<string>> {
  const me = voterKey();
  if (!me) return new Set();
  const { data, error } = await supabase.rpc("voted_case_ids", { _voter_key: me });
  if (error) return new Set();
  return new Set(((data ?? []) as { case_id: string }[]).map((r) => r.case_id));
}

async function fetchVoteCounts(caseId?: string): Promise<Record<string, Record<VerdictKey, number>>> {
  let query = supabase.from("case_vote_counts").select("case_id,verdict,count");
  if (caseId) query = query.eq("case_id", caseId);
  const { data, error } = await query;
  if (error) throw error;
  return buildVoteCountsMap((data ?? []) as VoteCountRow[]);
}

// --- data ----------------------------------------------------------------

export async function fetchCases(): Promise<Case[]> {
  const [voted, counts, res] = await Promise.all([
    myVotedCaseIds(),
    fetchVoteCounts(),
    supabase.from("cases").select(SELECT).order("created_at", { ascending: false }),
  ]);
  if (res.error) throw res.error;
  return ((res.data ?? []) as unknown as Row[]).map((r) => toCase(r, counts, voted));
}

export async function fetchCase(id: string): Promise<Case | null> {
  const [voted, counts, res] = await Promise.all([
    myVotedCaseIds(),
    fetchVoteCounts(id),
    supabase.from("cases").select(SELECT).eq("id", id).maybeSingle(),
  ]);
  if (res.error) throw res.error;
  return res.data ? toCase(res.data as unknown as Row, counts, voted) : null;
}


export async function createCase(input: {
  title: string;
  story: string;
  defense: string;
  sentence?: string;
}): Promise<Case> {
  const { data, error } = await supabase
    .from("cases")
    .insert({
      title: input.title,
      category: "Open Court",
      story: input.story,
      defense: input.defense,
      sentence: input.sentence ?? null,
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return toCase(data as unknown as Row, {}, new Set<string>());
}

export async function castVote(caseId: string, verdict: VerdictKey): Promise<void> {
  const { error } = await supabase
    .from("votes")
    .insert({ case_id: caseId, verdict, voter_key: voterKey() });
  if (error) throw error;
}

/** Turn a backend error into a plain, courtroom-flavoured sentence. */
export function describeError(err: unknown, action: "file" | "vote"): string {
  const e = err as { code?: string; message?: string } | null;
  const code = e?.code ?? "";
  const msg = (e?.message ?? "").toLowerCase();

  if (code === "23505" || msg.includes("duplicate key")) {
    return "You've already voted on this case. One vote per browser — no double dhamaal.";
  }
  if (code === "42501" || msg.includes("row-level security") || msg.includes("violates row")) {
    return action === "vote"
      ? "This case is already closed — the jury filled up or the 24 hours ran out."
      : "The bench rejected this filing: something is too long or empty. Trim it and try again.";
  }
  if (code === "23514" || msg.includes("check constraint")) {
    return "One of your fields is longer than the court allows. Shorten it and refile.";
  }
  if (code === "23503" || msg.includes("foreign key")) {
    return "That case no longer exists — it expired and vanished.";
  }
  if (msg.includes("fetch") || msg.includes("network") || code === "") {
    if (msg.includes("fetch") || msg.includes("network")) {
      return "Couldn't reach the court — check your connection and try again.";
    }
  }
  return e?.message
    ? `The bench refused it: ${e.message}`
    : "Something went wrong at the bench. Try once more.";
}

// --- derived helpers -----------------------------------------------------

export function totalVotes(c: Case) {
  return c.votes.notGuilty + c.votes.guilty + c.votes.shared;
}

export function isClosed(c: Case) {
  return c.closedAt !== null || c.expiresAt <= Date.now();
}

export function isOpen(c: Case) {
  return !isClosed(c);
}

export function leadingVerdict(c: Case): { key: VerdictKey; percent: number } | null {
  const total = totalVotes(c);
  if (total === 0) return null;
  const entries = Object.entries(c.votes) as [VerdictKey, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const [key, count] = entries[0]!;
  return { key, percent: Math.round((count / total) * 100) };
}

export function timeLeft(c: Case) {
  const ms = Math.max(0, c.expiresAt - Date.now());
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function shareUrl(c: Case) {
  if (!isBrowser()) return "";
  return `${window.location.origin}/verdict?id=${c.id}`;
}
