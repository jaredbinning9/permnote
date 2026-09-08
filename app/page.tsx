"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Note } from "@/lib/types";

function extractTags(content: string): string[] {
  const matches = content.match(/#[\w-]+/g);
  return matches ? matches.map((t) => t.slice(1).toLowerCase()) : [];
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function timeLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(200);
      if (!error && data) setNotes(data);
      setLoading(false);
    }
    init();
  }, [router]);

  async function addNote() {
    const content = draft.trim();
    if (!content) return;

    const temp: Note = {
      id: crypto.randomUUID(),
      content,
      created_at: new Date().toISOString(),
      is_todo: false,
      is_done: false,
      is_pinned: false,
      due_at: null,
      archived_at: null,
      tags: extractTags(content),
    };

    setNotes([temp, ...notes]);
    setDraft("");

    const { data, error } = await supabase
      .from("notes")
      .insert({ content, tags: temp.tags })
      .select()
      .single();

    if (error) {
      setNotes((current) => current.filter((n) => n.id !== temp.id));
      setDraft(content);
      alert(`Save failed: ${error.message}`);
    } else if (data) {
      setNotes((current) => current.map((n) => (n.id === temp.id ? data : n)));
    }
  }

  const groups: { label: string; items: Note[] }[] = [];
  for (const note of notes) {
    const label = dayLabel(note.created_at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(note);
    else groups.push({ label, items: [note] });
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-zinc-950 px-4 pb-24">
      <div className="sticky top-0 z-10 bg-zinc-950 pb-3 pt-4">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addNote()}
          placeholder="Capture a thought... use #tags"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-200 outline-none focus:border-zinc-600"
        />
      </div>

      {loading && <p className="pt-8 text-center font-mono text-sm text-zinc-600">loading...</p>}

      {!loading && notes.length === 0 && (
        <p className="pt-8 text-center font-mono text-sm text-zinc-600">
          empty stream. type something above.
        </p>
      )}

      {groups.map((group) => (
        <section key={group.label}>
          <h2 className="pb-1 pt-5 font-mono text-xs uppercase tracking-widest text-zinc-600">
            {group.label}
          </h2>
          {group.items.map((note) => (
            <div key={note.id} className="border-b border-zinc-900 py-2.5">
              <div className="flex items-start gap-3">
                <span className="pt-0.5 font-mono text-xs text-zinc-600">
                  {timeLabel(note.created_at)}
                </span>
                <p className="flex-1 text-sm leading-relaxed text-zinc-300">
                  {note.content.split(/(#[\w-]+)/g).map((part, i) =>
                    part.startsWith("#") ? (
                      <span key={i} className="text-sky-400">{part}</span>
                    ) : (
                      part
                    )
                  )}
                </p>
              </div>
            </div>
          ))}
        </section>
      ))}
    </main>
  );
}