"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Note } from "@/lib/types";
import NoteRow from "@/components/NoteRow";
import TabBar from "@/components/TabBar";
import { extractTags } from "@/lib/utils";

export default function Todos() {
  const [todos, setTodos] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
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
        .eq("is_todo", true)
        .is("archived_at", null)
        .order("due_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (!error && data) setTodos(data);
      setLoading(false);
    }
    init();
  }, [router]);

  async function updateNote(id: string, changes: Partial<Note>) {
    const before = todos;
    setTodos((current) =>
      current.map((n) => (n.id === id ? { ...n, ...changes } : n))
    );
    const { error } = await supabase.from("notes").update(changes).eq("id", id);
    if (error) {
      setTodos(before);
      alert(`Update failed: ${error.message}`);
    }
  }
  async function archiveNote(note: Note) {
  setTodos((current) => current.filter((n) => n.id !== note.id));
  const { error } = await supabase
    .from("notes")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", note.id);
  if (error) {
    setTodos((current) => [note, ...current]);
    alert(`Archive failed: ${error.message}`);
  }
}

  const open = todos.filter((t) => !t.is_done && t.is_todo);
  const done = todos.filter((t) => t.is_done && t.is_todo);

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-zinc-950 px-4 pb-24 pt-4">
        <div className="sticky top-0 z-10 bg-zinc-950 pb-2">
  <textarea
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
        addTodo();
        e.currentTarget.style.height = "auto";
      }
    }}
    placeholder="Add a todo..."
    className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm leading-relaxed text-zinc-200 outline-none focus:border-zinc-600"
  />
</div>
      <h1 className="pb-2 font-mono text-xs uppercase tracking-widest text-zinc-600">
        open · {open.length}
      </h1>
      {loading && <p className="pt-4 text-center font-mono text-sm text-zinc-600">loading...</p>}
      {!loading && open.length === 0 && (
        <p className="pt-4 text-center font-mono text-sm text-zinc-600">nothing open. nice.</p>
      )}
      {open.map((note) => (
        <NoteRow key={note.id} note={note} onUpdate={updateNote} onArchive={archiveNote} />
      ))}

      {done.length > 0 && (
        <>
          <h2 className="pb-2 pt-8 font-mono text-xs uppercase tracking-widest text-zinc-700">
            done · {done.length}
          </h2>
          {done.map((note) => (
            <NoteRow key={note.id} note={note} onUpdate={updateNote} onArchive={archiveNote}/>
          ))}
        </>
      )}
      <TabBar />
    </main>
  );
}
  async function addTodo() {
  const content = draft.trim();
  if (!content) return;
  const temp: Note = {
    id: crypto.randomUUID(),
    content,
    created_at: new Date().toISOString(),
    is_todo: true,
    is_done: false,
    is_pinned: false,
    due_at: null,
    archived_at: null,
    parent_id: null,
    tags: extractTags(content),
  };
  setTodos((current) => [temp, ...current]);
  setDraft("");
  const { data, error } = await supabase
    .from("notes")
    .insert({ content, tags: temp.tags, is_todo: true })
    .select()
    .single();
  if (error) {
    setTodos((current) => current.filter((n) => n.id !== temp.id));
    setDraft(content);
    alert(`Save failed: ${error.message}`);
  } else if (data) {
    setTodos((current) => current.map((n) => (n.id === temp.id ? data : n)));
  }
}