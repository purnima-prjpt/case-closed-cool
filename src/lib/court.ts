// Delulu Bench — all state lives in the browser. sessionStorage + URL only.

export type VerdictKey = "notGuilty" | "guilty" | "shared";

export type Case = {
  id: string;
  title: string;
  category: string;
  story: string;
  defense: string;
  createdAt: number;
  expiresAt: number;
  votes: Record<VerdictKey, number>;
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

const KEY = "delulu-bench:v1";
const VOTED_KEY = "delulu-bench:voted:v1";
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

export function newId() {
  return Math.random().toString(36).slice(2, 9);
}

function seedCases(): Case[] {
  const now = Date.now();
  const base = [
    {
      title: "My roommate keeps using my charger without asking",
      category: "Roommates",
      story:
        "Every single night my 65W brick migrates to her side of the room. I've asked nicely four times. Yesterday I found it under her pillow like a hostage.",
      defense: "She says a charger in a shared flat is 'communal infrastructure'.",
      votes: { notGuilty: 3, guilty: 1, shared: 1 },
      age: 3,
    },
    {
      title: "My friend dodged the bill again",
      category: "Money",
      story:
        "Fourth dinner in a row where he goes to the washroom exactly when the bill lands. He ordered the most expensive thing both times I counted.",
      defense: "He claims his UPI has been 'acting weird since March'.",
      votes: { notGuilty: 4, guilty: 6, shared: 2 },
      age: 8,
    },
    {
      title: "I left the group chat over a poll about brunch",
      category: "Group Chat",
      story:
        "They made a poll with 11 options, ignored my vote, and then picked the place I said I was allergic to. So I left. Dramatically.",
      defense: "They say I could have 'just muted it like a normal person'.",
      votes: { notGuilty: 2, guilty: 2, shared: 3 },
      age: 14,
    },
    {
      title: "I ate my flatmate's labelled leftovers",
      category: "Food Crimes",
      story:
        "It had her name on a sticky note. But it was 2am, it was biryani, and I fully intended to replace it. I have not replaced it. It has been nine days.",
      defense: "I did leave a very heartfelt apology note with a drawing.",
      votes: { notGuilty: 1, guilty: 7, shared: 2 },
      age: 19,
    },
  ];
  return base.map((c) => ({
    id: newId(),
    title: c.title,
    category: c.category,
    story: c.story,
    defense: c.defense,
    createdAt: now - c.age * 60 * 60 * 1000,
    expiresAt: now + (24 - c.age) * 60 * 60 * 1000,
    votes: c.votes,
  }));
}

export function loadCases(): Case[] {
  if (!isBrowser()) return [];
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) {
      const seeded = seedCases();
      sessionStorage.setItem(KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as Case[];
    return parsed.filter((c) => c.expiresAt > Date.now());
  } catch {
    return [];
  }
}

export function saveCases(cases: Case[]) {
  if (!isBrowser()) return;
  sessionStorage.setItem(KEY, JSON.stringify(cases));
}

export function addCase(input: {
  title: string;
  category: string;
  story: string;
  defense: string;
}): Case {
  const now = Date.now();
  const created: Case = {
    id: newId(),
    ...input,
    createdAt: now,
    expiresAt: now + LIFETIME_MS,
    votes: { notGuilty: 0, guilty: 0, shared: 0 },
  };
  const all = loadCases();
  saveCases([created, ...all]);
  return created;
}

export function voteOn(id: string, verdict: VerdictKey): Case[] {
  const all = loadCases().map((c) =>
    c.id === id ? { ...c, votes: { ...c.votes, [verdict]: c.votes[verdict] + 1 } } : c,
  );
  saveCases(all);
  markVoted(id);
  return all;
}

export function votedIds(): string[] {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(sessionStorage.getItem(VOTED_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function markVoted(id: string) {
  if (!isBrowser()) return;
  const ids = new Set(votedIds());
  ids.add(id);
  sessionStorage.setItem(VOTED_KEY, JSON.stringify([...ids]));
}

export function totalVotes(c: Case) {
  return c.votes.notGuilty + c.votes.guilty + c.votes.shared;
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

// --- share encoding: whole case travels in the URL ---

export function encodeCase(c: Case): string {
  const json = JSON.stringify(c);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeCase(encoded: string): Case | null {
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Case;
    if (!parsed?.id || !parsed?.title) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function shareUrl(c: Case) {
  if (!isBrowser()) return "";
  return `${window.location.origin}/verdict?c=${encodeCase(c)}`;
}
