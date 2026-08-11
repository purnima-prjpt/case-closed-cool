// Client-side text moderation. Runs before a case, defense, or judge
// sentence is accepted. No network calls, no server.

const BANNED = [
  "kill yourself",
  "kys",
  "rape",
  "nazi",
  "terrorist",
  "suicide",
  "slut",
  "whore",
  "bitch",
  "bastard",
  "retard",
  "faggot",
  "nigger",
  "chutiya",
  "madarchod",
  "behenchod",
  "randi",
  "gaandu",
];

const PERSONAL_INFO = [
  /\b\d{10}\b/, // phone-ish
  /[\w.+-]+@[\w-]+\.[\w.]+/, // email
  /\bhttps?:\/\/\S+/i, // links
  /\b\d{1,5}\s+[A-Za-z]+\s+(street|st|road|rd|avenue|ave|lane|ln)\b/i,
];

// Censored / leetspeak / abbreviated forms are not a loophole.
const MASKED = [
  /\bf+[\W_]*[u*@#!0-9][\W_]*c*[\W_]*k+\w*/i,
  /\bs+[\W_]*[h#][\W_]*[i1!*][\W_]*t+\b/i,
  /\bb+[\W_]*[i1!*@][\W_]*t+[\W_]*c+[\W_]*h+\w*/i,
  /\ba+[\W_]*[s$5*]{2,}[\W_]*h*[\W_]*o*[\W_]*l*[\W_]*e*\b/i,
  /\bd+[\W_]*[i1!*][\W_]*c+[\W_]*k+[\W_]*h*e*a*d*\b/i,
  /\bc+[\W_]*u*[\W_]*n+[\W_]*t+\b/i,
  /\bw+[\W_]*t+[\W_]*f+\b/i,
  /\bs+[\W_]*t+[\W_]*f+[\W_]*u+\b/i,
  /\bm+[\W_]*[c*]{1}[\W_]*b*[\W_]*c*\b/i,
  /\bb+[\W_]*[c*][\W_]*\b/i,
  /\bwtf\b|\bstfu\b|\bmc\b|\bbc\b|\bmf\b|\baf\b/i,
  /\*{2,}/,
];

// Leet -> letters, so "b1tch" and "f@ck" normalise before the word check.
function deleet(text: string) {
  return text
    .toLowerCase()
    .replace(/[@4]/g, "a")
    .replace(/[$5]/g, "s")
    .replace(/[!1|]/g, "i")
    .replace(/0/g, "o")
    .replace(/3/g, "e")
    .replace(/7/g, "t")
    .replace(/[^a-z\s]/g, "");
}

export type ModerationResult = { ok: true } | { ok: false; reason: string };

export function moderate(text: string, label = "This", minLength = 10): ModerationResult {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { ok: false, reason: `${label} is empty. Silence in court is not evidence — write something.` };
  }
  if (trimmed.length < minLength) {
    const short = minLength - trimmed.length;
    return {
      ok: false,
      reason: `${label} is ${trimmed.length} characters; the bench needs at least ${minLength}. Add ${short} more — tareekh pe tareekh nahi, detail pe detail.`,
    };
  }
  if (minLength > 0 && !/[a-zA-Z\u0900-\u097F]{2,}/.test(trimmed)) {
    return {
      ok: false,
      reason: `${label} has no real words — only symbols or numbers. Kitne aadmi the? Type it in words, please.`,
    };
  }
  if (trimmed.length > 600) {
    return {
      ok: false,
      reason: `${label} is ${trimmed.length} characters; the limit is 600. Trim ${trimmed.length - 600} — picture abhi baaki hai, par itni lambi nahi.`,
    };
  }

  const lower = ` ${trimmed.toLowerCase().replace(/[^a-z0-9\s]/g, " ")} `;
  const normalised = ` ${deleet(trimmed)} `;
  const squashed = deleet(trimmed).replace(/\s+/g, "");
  const hit =
    BANNED.find((word) => lower.includes(` ${word} `)) ||
    BANNED.find((word) => normalised.includes(` ${word} `)) ||
    BANNED.find((word) => word.length > 4 && squashed.includes(word.replace(/\s+/g, ""))) ||
    MASKED.some((re) => re.test(trimmed));
  if (hit) {
    return { ok: false, reason: "Order, order! Keep it light — that language can't enter the courtroom." };
  }

  if (PERSONAL_INFO.some((re) => re.test(trimmed))) {
    return { ok: false, reason: "No phone numbers, emails, links, or addresses. Stay anonymous, stay iconic." };
  }

  if (/(.)\1{9,}/.test(trimmed)) {
    return { ok: false, reason: "That's keyboard smashing, not a case. Try again." };
  }

  return { ok: true };
}
