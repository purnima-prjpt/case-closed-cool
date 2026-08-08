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

export type ModerationResult = { ok: true } | { ok: false; reason: string };

export function moderate(text: string, label = "This"): ModerationResult {
  const trimmed = text.trim();

  if (trimmed.length < 10) {
    return { ok: false, reason: `${label} is too short. Give us the tea, not the teabag.` };
  }
  if (trimmed.length > 600) {
    return { ok: false, reason: `${label} is too long. This is a bench, not a Netflix series.` };
  }

  const lower = ` ${trimmed.toLowerCase().replace(/[^a-z0-9\s]/g, " ")} `;
  const hit = BANNED.find((word) => lower.includes(` ${word} `));
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
