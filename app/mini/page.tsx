"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Note } from "@/lib/types";
import { extractTags } from "@/lib/utils";
import MiniRow from "@/components/MiniRow";

const SHOW = 8;

export default function Mini() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("notes")
        .select("*")
        .is("archived_at", null)
        .is("parent_id", null)
        .order("created_at", { ascending: false })
        .limit(SHOW);
      if (data) setNotes(data);
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
      parent_id: null,
      tags: extractTags(content),
    };
    setNotes((current) => [temp, ...current].slice(0, SHOW));
    setDraft("");
    const { data, error } = await supabase
      .from("notes")
      .insert({ content, tags: temp.tags })
      .select()
      .single();
    if (error) {
      setNotes((current) => current.filter((n) => n.id !== temp.id));
      setDraft(content);
    } else if (data) {
      setNotes((current) => current.map((n) => (n.id === temp.id ? data : n)));
    }
  }

  async function updateNote(id: string, changes: Partial<Note>) {
  const before = notes;
  setNotes((current) => current.map((n) => (n.id === id ? { ...n, ...changes } : n)));
  const { error } = await supabase.from("notes").update(changes).eq("id", id);
  if (error) setNotes(before);
}

  return (
    <main className="min-h-screen bg-zinc-950 px-3 pb-3">
      <div className="sticky top-0 bg-zinc-950 pb-2 pt-3">
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
          placeholder="jot..."
          className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-sm text-zinc-200 outline-none focus:border-zinc-600"
        />
      </div>

     {notes.map((note) => (
  <MiniRow key={note.id} note={note} onUpdate={updateNote} />
))}
     <div className="flex justify-end gap-3 pt-2">
  <Link href="/" className="font-mono text-[11px] text-zinc-700 hover:text-zinc-400">
    stream
  </Link>
  <Link href="/todos" className="font-mono text-[11px] text-zinc-700 hover:text-zinc-400">
    todos
  </Link>
</div>
    </main>
  );
}