import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link2 } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import { Countdown, VerdictBadge } from "@/components/CaseCard";
import { Layout } from "@/components/Layout";
import {
  DIALOGUES,
  VERDICTS,
  VERDICT_THRESHOLD,
  fetchCase,
  isClosed,
  leadingVerdict,
  pick,
  shareUrl,
  totalVotes,
} from "@/lib/court";

export const Route = createFileRoute("/verdict")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search["id"] === "string" ? (search["id"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "The Verdict — Delulu Bench" },
      {
        name: "description",
        content:
          "See how strangers voted on this case: Not Guilty, Guilty or Shared Blame. Share the link and let the jury fill up.",
      },
      { property: "og:title", content: "The Verdict — Delulu Bench" },
      {
        property: "og:description",
        content: "Strangers voted. Here's the verdict. Gone in 24 hours.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Verdict,
});

function Verdict() {
  const { id } = Route.useSearch();

  const { data: item, isLoading } = useQuery({
    queryKey: ["case", id],
    queryFn: () => fetchCase(id),
    enabled: Boolean(id),
    refetchInterval: 10000,
  });

  const dialogue = useMemo(() => pick(DIALOGUES, item?.id), [item?.id]);

  if (isLoading) {
    return (
      <Layout>
        <section className="mx-auto max-w-2xl px-4 py-20 text-center text-sm text-muted-foreground">
          Fetching the case file…
        </section>
      </Layout>
    );
  }

  if (!item) {
    return (
      <Layout>
        <section className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-extrabold">Case not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This case expired, or the link got mangled. All cases vanish after 24 hours.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            Back to the bench
          </Link>
        </section>
      </Layout>
    );
  }

  const total = totalVotes(item);
  const lead = leadingVerdict(item);
  const settled = isClosed(item) && lead !== null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl(item!));
      toast.success("Link copied. Send it to the group chat.");
    } catch {
      toast.error("Couldn't copy. Grab it from the address bar.");
    }
  }

  return (
    <Layout>
      <section className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {item.category}
            </p>
            <Countdown item={item} />
          </div>
          <h1 className="mt-2 font-display text-2xl font-extrabold leading-snug">{item.title}</h1>
          <p className="mt-4 text-sm leading-relaxed">{item.story}</p>

          <div className="mt-4 rounded-xl border border-border bg-secondary/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Side B
            </p>
            <p className="mt-1 text-sm">{item.defense}</p>
          </div>

          {item.sentence && (
            <div className="mt-3 rounded-xl border border-dashed border-border p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Suggested sentence
              </p>
              <p className="mt-1 text-sm">{item.sentence}</p>
            </div>
          )}

          <div className="mt-6 border-t border-border pt-6">
            {settled && lead ? (
              <div className="flex flex-wrap items-center gap-3">
                <VerdictBadge verdict={lead.key} percent={lead.percent} />
                <span className="text-sm text-muted-foreground">
                  {total} {total === 1 ? "vote" : "votes"} · verdict delivered
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {total}/{VERDICT_THRESHOLD} votes — verdict pending. Kitne aadmi the?
              </p>
            )}

            <div className="mt-4 space-y-3">
              {VERDICTS.map((v) => {
                const count = item.votes[v.key];
                const pct = total ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={v.key}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{v.label}</span>
                      <span className="text-muted-foreground">
                        {pct}% · {count}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: `var(--${v.key === "notGuilty" ? "notguilty" : v.key})`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="mt-6 text-xs italic text-muted-foreground">{dialogue}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={copy}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Link2 className="h-4 w-4" /> Copy share link
            </button>
            <Link
              to="/jury"
              className="inline-flex items-center rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
            >
              Go to jury duty
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
