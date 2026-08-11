import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Countdown, verdictStyles } from "@/components/CaseCard";
import { Layout } from "@/components/Layout";
import {
  DIALOGUES,
  VERDICTS,
  VERDICT_THRESHOLD,
  castVote,
  describeError,

  fetchCases,
  isOpen,
  pick,
  totalVotes,
  type VerdictKey,
} from "@/lib/court";

export const Route = createFileRoute("/jury")({
  head: () => ({
    meta: [
      { title: "Jury Duty — Delulu Bench" },
      {
        name: "description",
        content:
          "Read anonymous cases and vote Not Guilty, Guilty or Shared Blame. Five votes close a case.",
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
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const [skipped, setSkipped] = useState<string[]>([]);

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: fetchCases,
    refetchInterval: 15000,
  });

  const pending = useMemo(() => cases.filter((c) => isOpen(c) && !c.voted), [cases]);
  const queue = useMemo(() => {
    const fresh = pending.filter((c) => !skipped.includes(c.id));
    const later = pending.filter((c) => skipped.includes(c.id));
    return [...fresh, ...later];
  }, [pending, skipped]);
  const allSkipped = queue.length > 0 && queue.every((c) => skipped.includes(c.id));
  const current = allSkipped ? undefined : (queue[index] ?? queue[0]);
  const dialogue = useMemo(() => pick(DIALOGUES, current?.id), [current?.id]);

  function skip() {
    if (!current) return;
    setSkipped((s) => (s.includes(current.id) ? s : [...s, current.id]));
    setIndex(0);
  }

  const mutation = useMutation({
    mutationFn: ({ id, verdict }: { id: string; verdict: VerdictKey }) => castVote(id, verdict),
    onSuccess: () => {
      toast.success("Verdict recorded. Order, order!");
      setIndex((i) => i + 1);
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
    onError: (err: unknown) => {
      toast.error(describeError(err, "vote"));
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });


  return (
    <Layout>
      <section className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Jury duty</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One case at a time. Vote honestly, you're anonymous anyway.
        </p>

        {isLoading ? (
          <p className="mt-8 text-sm text-muted-foreground">Calling the docket…</p>
        ) : !current ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="font-display text-lg font-bold">
              {allSkipped ? "You skipped the whole docket." : "Court adjourned."}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {allSkipped
                ? "Picture abhi baaki hai — reshuffle and give them another look."
                : "You've judged everything on the docket. Tareekh pe tareekh."}
            </p>
            {allSkipped ? (
              <button
                onClick={() => {
                  setSkipped([]);
                  setIndex(0);
                }}
                className="btn-shine mt-5 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                Reshuffle the docket
              </button>
            ) : (
              <Link
                to="/"
                className="btn-shine mt-5 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                Raise your own case
              </Link>
            )}
          </div>

        ) : (
          <div className="card-sheen mt-8 rounded-2xl border border-border bg-card p-6">
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
                Side B
              </p>
              <p className="mt-1 text-sm">{current.defense}</p>
            </div>

            {current.sentence && (
              <div className="mt-3 rounded-xl border border-dashed border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Proposed sentence
                </p>
                <p className="mt-1 text-sm">{current.sentence}</p>
              </div>
            )}

            <p className="mt-4 text-xs italic text-muted-foreground">{dialogue}</p>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {VERDICTS.map((v) => (
                <button
                  key={v.key}
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate({ id: current.id, verdict: v.key })}
                  className={`rounded-xl border px-3 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-60 ${verdictStyles[v.key]}`}
                >
                  {v.label}
                  <span className="block text-xs font-medium opacity-70">{v.sub}</span>
                </button>
              ))}
            </div>

            <button
              onClick={skip}
              disabled={mutation.isPending || queue.length < 2}
              className="mt-2 w-full rounded-xl border border-dashed border-border px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              Skip for now →
            </button>


            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Jury {totalVotes(current)}/{VERDICT_THRESHOLD}
                </span>
                <span>
                  Case {Math.min(index + 1, queue.length)} of {queue.length}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.min(100, (totalVotes(current) / VERDICT_THRESHOLD) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-4 text-right">
              <Link
                to="/verdict"
                search={{ id: current.id }}
                className="text-xs font-semibold text-primary hover:underline"
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
