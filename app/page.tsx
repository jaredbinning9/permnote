"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Note } from "@/lib/types";
import { extractTags } from "@/lib/utils";
import NoteRow from "@/components/NoteRow";
import TabBar from "@/components/TabBar";
import Toast from "@/components/Toast";

const CONTEXTS = ["all", "work", "personal"] as const;
type Context = (typeof CONTEXTS)[number];

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [context, setContext] = useState<Context>("all");
  const [toast, setToast] = useState<{ message: string; undo?: () => void } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("permnote-context");
    if (saved && CONTEXTS.includes(saved as Context)) setContext(saved as Context);

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

  function pickContext(c: Context) {
    setContext(c);
    localStorage.setItem("permnote-context", c);
  }

  function showToast(message: string, undo?: () => void) {
    setToast({ message, undo });
    setTimeout(() => setToast(null), 5000);
  }

  async function addNote() {
    let content = draft.trim();
    if (!content) return;

    if (context !== "all" && !extractTags(content).includes(context)) {
      content = `${content} #${context}`;
    }

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

  async function updateNote(id: string, changes: Partial<Note>) {
    const before = notes;
    setNotes((current) => current.map((n) => (n.id === id ? { ...n, ...changes } : n)));
    const { error } = await supabase.from("notes").update(changes).eq("id", id);
    if (error) {
      setNotes(before);
      alert(`Update failed: ${error.message}`);
    }
  }

  async function archiveNote(note: Note) {
    const stamp = new Date().toISOString();
    setNotes((current) => current.filter((n) => n.id !== note.id));
    const { error } = await supabase
      .from("notes")
      .update({ archived_at: stamp })
      .eq("id", note.id);
    if (error) {
      setNotes((current) => [note, ...current]);
      alert(`Archive failed: ${error.message}`);
      return;
    }
    showToast("Note archived", async () => {
      setToast(null);
      setNotes((current) =>
        [note, ...current].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
      await supabase.from("notes").update({ archived_at: null }).eq("id", note.id);
    });
  }

  const visible =
    context === "all" ? notes : notes.filter((n) => n.tags.includes(context));
  const pinned = visible.filter((n) => n.is_pinned);

  const groups: { label: string; items: Note[] }[] = [];
  for (const note of visible) {
    const label = dayLabel(note.created_at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(note);
    else groups.push({ label, items: [note] });
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-zinc-950 px-4 pb-24">
      <div className="sticky top-0 z-10 bg-zinc-950 pb-2 pt-4">
        <textarea
          autoFocus
          rows={1}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              addNote();
              e.currentTarget.style.height = "auto";
            }
          }}
          placeholder={
            context === "all"
              ? "Capture a thought... Shift+Enter for a new line"
              : `Capture to #${context}...`
          }
          className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm leading-relaxed text-zinc-200 outline-none focus:border-zinc-600"
        />
        <div className="mt-2 flex gap-1">
          {CONTEXTS.map((c) => (
            <button
              key={c}
              onClick={() => pickContext(c)}
              className={`rounded-full px-3 py-1 font-mono text-xs ${
                context === c
                  ? "bg-zinc-800 text-zinc-200"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {pinned.length > 0 && (
        <section className="mb-1">
          <button
            onClick={() => setPinnedOpen(!pinnedOpen)}
            className="flex items-center gap-2 py-1 font-mono text-xs text-zinc-500 hover:text-zinc-300"
          >
            <span className="text-amber-400">✦</span>
            pinned · {pinned.length} {pinnedOpen ? "▾" : "▸"}
          </button>
          {pinnedOpen &&
            pinned.map((note) => (
              <NoteRow
                key={`pin-${note.id}`}
                note={note}
                onUpdate={updateNote}
                onArchive={archiveNote}
              />
            ))}
        </section>
      )}

      {loading && <p className="pt-8 text-center font-mono text-sm text-zinc-600">loading...</p>}
      {!loading && visible.length === 0 && (
        <p className="pt-8 text-center font-mono text-sm text-zinc-600">
          {context === "all" ? "empty stream. type something above." : `nothing in #${context} yet.`}
        </p>
      )}

      {groups.map((group) => (
        <section key={group.label}>
          <h2 className="pb-1 pt-5 font-mono text-xs uppercase tracking-widest text-zinc-600">
            {group.label}
          </h2>
          {group.items.map((note) => (
            <NoteRow key={note.id} note={note} onUpdate={updateNote} onArchive={archiveNote} />
          ))}
        </section>
      ))}

      {toast && <Toast message={toast.message} onUndo={toast.undo} />}
      <TabBar />
    </main>
  );
}