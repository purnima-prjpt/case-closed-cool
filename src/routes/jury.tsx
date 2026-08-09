import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Countdown, verdictStyles } from "@/components/CaseCard";
import { Layout } from "@/components/Layout";
import {
  DIALOGUES,
  VERDICTS,
  loadCases,
  pick,
  shareUrl,
  voteOn,
  votedIds,
  type Case,
  type VerdictKey,
} from "@/lib/court";

export const Route = createFileRoute("/jury")({
  head: () => ({
    meta: [
      { title: "Jury Duty — Delulu Bench" },
      {
        name: "description",
        content:
          "Read anonymous cases and vote Not Guilty, Guilty or Shared Blame. Hand down a sentence while you're at it.",
      },
      { property: "og:title", content: "Jury Duty — Delulu Bench" },
      {
        property: "og:description",
        content: "Judge strangers' everyday drama. One case at a time. Gone in 24 hours.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Jury,
});

function Jury() {
  const [queue, setQueue] = useState<Case[]>([]);
  const [index, setIndex] = useState(0);
  const [sentence, setSentence] = useState("");

  useEffect(() => {
    const voted = new Set(votedIds());
    setQueue(loadCases().filter((c) => !voted.has(c.id)));
  }, []);

  const current = queue[index];
  const dialogue = useMemo(() => pick(DIALOGUES, current?.id), [current?.id]);

  function vote(key: VerdictKey) {
    if (!current) return;
    if (sentence.trim()) {
      const check = moderate(sentence, "Your sentence");
      if (!check.ok) {
        toast.error(check.reason);
        return;
      }
    }
    voteOn(current.id, key);
    toast.success(sentence.trim() ? sentence.trim() : pick(SENTENCES));
    setSentence("");
    setIndex((i) => i + 1);
  }

  return (
    <Layout>
      <section className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Jury duty</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One case at a time. Vote honestly, you're anonymous anyway.
        </p>

        {!current ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="font-display text-lg font-bold">Court adjourned.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You've judged everything on the docket. Tareekh pe tareekh.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
            >
              Raise your own case
            </Link>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {current.category}
              </p>
              <Countdown item={current} />
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold leading-snug">{current.title}</h2>
            <p className="mt-4 text-sm leading-relaxed">{current.story}</p>

            <div className="mt-4 rounded-xl border border-border bg-secondary/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                The defense
              </p>
              <p className="mt-1 text-sm">{current.defense}</p>
            </div>

            <p className="mt-4 text-xs italic text-muted-foreground">{dialogue}</p>

            <label className="mt-6 block text-sm font-semibold">
              Sentence <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              placeholder="Sentenced to buying chai for the group chat"
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {VERDICTS.map((v) => (
                <button
                  key={v.key}
                  onClick={() => vote(v.key)}
                  className={`rounded-xl border px-3 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5 ${verdictStyles[v.key]}`}
                >
                  {v.label}
                  <span className="block text-xs font-medium opacity-70">{v.sub}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Case {index + 1} of {queue.length}
              </span>
              <Link
                to="/verdict"
                search={{ c: shareUrl(current).split("?c=")[1] ?? "" }}
                className="font-semibold text-primary hover:underline"
              >
                Skip to verdict →
              </Link>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}
