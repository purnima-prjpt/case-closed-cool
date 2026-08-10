import { Link } from "@tanstack/react-router";
import { Clock, Users } from "lucide-react";
import { useEffect, useState } from "react";

import {
  VERDICTS,
  isClosed,
  leadingVerdict,
  timeLeft,
  totalVotes,
  type Case,
  type VerdictKey,
} from "@/lib/court";

export const verdictStyles: Record<VerdictKey, string> = {
  notGuilty: "bg-notguilty/25 text-notguilty-foreground border-notguilty/60",
  guilty: "bg-guilty/25 text-guilty-foreground border-guilty/60",
  shared: "bg-shared/25 text-shared-foreground border-shared/60",
};

export function VerdictBadge({ verdict, percent }: { verdict: VerdictKey; percent?: number }) {
  const meta = VERDICTS.find((v) => v.key === verdict)!;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${verdictStyles[verdict]}`}
    >
      {meta.label}
      {percent !== undefined && <span className="opacity-70">{percent}%</span>}
    </span>
  );
}

export function Countdown({ item }: { item: Case }) {
  const [label, setLabel] = useState(() => timeLeft(item));
  useEffect(() => {
    const t = setInterval(() => setLabel(timeLeft(item)), 1000);
    return () => clearInterval(t);
  }, [item]);

  if (item.closedAt !== null) {
    return <span className="font-mono text-xs text-muted-foreground">case closed</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
      <Clock className="h-3.5 w-3.5" /> {label} left
    </span>
  );
}

export function CaseCard({ item }: { item: Case }) {
  const lead = leadingVerdict(item);
  const total = totalVotes(item);

  return (
    <article className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-[0_8px_24px_-16px_oklch(0.269_0.042_285.2/0.6)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {item.category}
          </p>
          <h3 className="mt-1 font-display text-lg font-bold leading-snug">{item.title}</h3>
        </div>
        {lead && <VerdictBadge verdict={lead.key} percent={lead.percent} />}
      </div>

      <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{item.story}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Countdown item={item} />
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" /> {total} {total === 1 ? "vote" : "votes"}
        </span>
        <Link
          to="/verdict"
          search={{ id: item.id }}
          className="ml-auto text-sm font-semibold text-primary hover:underline"
        >
          {isClosed(item) ? "See verdict →" : "Open case →"}
        </Link>
      </div>
    </article>
  );
}
