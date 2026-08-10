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
  votes: { verdict: string; voter_key: string }[] | null;
};

const SELECT = "id,title,category,story,defense,sentence,created_at,expires_at,closed_at,votes(verdict,voter_key)";

function toCase(row: Row, me: string): Case {
  const votes: Record<VerdictKey, number> = { notGuilty: 0, guilty: 0, shared: 0 };
  let voted = false;
  for (const v of row.votes ?? []) {
    if (v.verdict in votes) votes[v.verdict as VerdictKey] += 1;
    if (v.voter_key === me) voted = true;
  }
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
    votes,
    voted,
  };
}

// --- data ----------------------------------------------------------------

export async function fetchCases(): Promise<Case[]> {
  const me = voterKey();
  const { data, error } = await supabase
    .from("cases")
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as Row[]).map((r) => toCase(r, me));
}

export async function fetchCase(id: string): Promise<Case | null> {
  const me = voterKey();
  const { data, error } = await supabase.from("cases").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toCase(data as unknown as Row, me) : null;
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
  return toCase(data as unknown as Row, voterKey());
}

export async function castVote(caseId: string, verdict: VerdictKey): Promise<void> {
  const { error } = await supabase
    .from("votes")
    .insert({ case_id: caseId, verdict, voter_key: voterKey() });
  if (error) throw error;
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
