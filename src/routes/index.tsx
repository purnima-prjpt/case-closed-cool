import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Gavel, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CaseCard } from "@/components/CaseCard";
import { Layout } from "@/components/Layout";
import {
  DIALOGUES,
  addCase,
  loadCases,
  pick,
  shareUrl,
  type Case,
} from "@/lib/court";
import { moderate } from "@/lib/moderation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Delulu Bench — Let the internet decide your drama" },
      {
        name: "description",
        content:
          "Post your everyday drama anonymously, let strangers vote, get a verdict. No accounts, no receipts — every case vanishes in 24 hours.",
      },
      { property: "og:title", content: "Delulu Bench — Let the internet decide" },
      {
        property: "og:description",
        content:
          "Anonymous court for everyday drama. Strangers vote Not Guilty, Guilty or Shared Blame. Gone in 24 hours.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [defense, setDefense] = useState("");
  const [sentence, setSentence] = useState("");

  useEffect(() => setCases(loadCases()), []);

  const dialogue = useMemo(() => pick(DIALOGUES), []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    for (const [text, label] of [
      [title, "Your case title"],
      [story, "Your side of the story"],
      [defense, "Their defense"],
      ...(sentence.trim() ? ([[sentence, "Your suggested sentence"]] as const) : []),
    ] as const) {
      const check = moderate(text, label);
      if (!check.ok) {
        toast.error(check.reason);
        return;
      }
    }
    const created = addCase({
      title: title.trim(),
      category: "Open Court",
      story: story.trim(),
      defense: defense.trim(),
      ...(sentence.trim() ? { sentence: sentence.trim() } : {}),
    });
    setCases(loadCases());
    setTitle("");
    setStory("");
    setDefense("");
    setSentence("");
    toast.success("Case filed. Order, order!");
    navigate({ to: "/verdict", search: { c: shareUrl(created).split("?c=")[1] ?? "" } });
  }

  return (
    <Layout>
      <section className="mx-auto max-w-5xl px-4 pt-12 pb-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" /> {dialogue}
        </span>
        <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Post your drama.
          <br />
          <span className="text-primary">Let the internet decide.</span>
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Strangers vote. You get a verdict. No accounts, no receipts, no drama police — every case
          self-destructs in 24 hours.
        </p>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-4 lg:grid-cols-[1fr_1.1fr]">
        <form
          onSubmit={submit}
          className="h-fit rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-20"
        >
          <h2 className="font-display text-xl font-bold">Raise a case</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep it light. No names, no numbers, no links.
          </p>

          <label className="mt-5 block text-sm font-semibold">What happened?</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My roommate keeps using my charger without asking"
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />

          <label className="mt-4 block text-sm font-semibold">Your side</label>
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={4}
            placeholder="Set the scene. Kitne aadmi the?"
            className="mt-1.5 w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />

          <label className="mt-4 block text-sm font-semibold">Their defense</label>
          <textarea
            value={defense}
            onChange={(e) => setDefense(e.target.value)}
            rows={3}
            placeholder="Be fair. What would they say?"
            className="mt-1.5 w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />

          <label className="mt-4 block text-sm font-semibold">
            Suggested sentence <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            rows={2}
            placeholder="If guilty… one (1) sincere apology, no emoji."
            className="mt-1.5 w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />

          <button
            type="submit"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Gavel className="h-4 w-4" /> File it
          </button>
        </form>

        <div>
          <div className="rounded-2xl border border-border bg-secondary/50 p-5">
            <h2 className="font-display text-lg font-bold">Court rules</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>1. Keep it light. Everyday drama only — no serious harm, no harassment.</li>
              <li>2. No abusive language, slurs, or censored spellings of them.</li>
              <li>3. Stay anonymous. No real names, phone numbers, emails, links, or addresses.</li>
              <li>4. Be fair — write their defense honestly, not as a strawman.</li>
              <li>5. At least 5 votes are mandatory to close a case. One vote per browser.</li>
              <li>6. Every case self-destructs in 24 hours. Picture abhi baaki hai… par sirf ek din.</li>
            </ul>
          </div>

          <h2 className="mt-8 font-display text-xl font-bold">Live docket</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cases still awaiting a verdict.</p>
          <div className="mt-4 space-y-4">
            {cases.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Docket's empty. Be the first delulu.
              </p>
            ) : (
              cases.map((c) => <CaseCard key={c.id} item={c} />)
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
