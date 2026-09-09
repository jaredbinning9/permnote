"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Note } from "@/lib/types";
import NoteRow from "@/components/NoteRow";
import TabBar from "@/components/TabBar";

<div className="pt-8 pb-2 text-center">
  <Link href="/archive" className="font-mono text-xs text-zinc-700 hover:text-zinc-400">
    view archived →
  </Link>
</div>
function SearchInner() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [results, setResults] = useState<Note[]>([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [searched, setSearched] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/login");
    });
  }, [router]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearched(false);
      return;
    }
    const timer = setTimeout(async () => {
      let request = supabase.from("notes").select("*");
      if (q.startsWith("#")) {
        request = request.contains("tags", [q.slice(1).toLowerCase()]);
      } else {
        request = request.ilike("content", `%${q}%`);
      }
      if (!includeArchived) request = request.is("archived_at", null);
      const { data, error } = await request
        .order("created_at", { ascending: false })
        .limit(100);
      if (!error && data) setResults(data);
      setSearched(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, includeArchived]);

  async function updateNote(id: string, changes: Partial<Note>) {
    setResults((current) => current.map((n) => (n.id === id ? { ...n, ...changes } : n)));
    await supabase.from("notes").update(changes).eq("id", id);
  }

  async function archiveNote(note: Note) {
    setResults((current) => current.filter((n) => n.id !== note.id));
    await supabase
      .from("notes")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", note.id);
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-zinc-950 px-4 pb-24">
      <div className="sticky top-0 z-10 bg-zinc-950 pb-2 pt-4">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes, or #tag"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-200 outline-none focus:border-zinc-600"
        />
      <div className="mt-2">
  <label className="flex items-center gap-2 font-mono text-xs text-zinc-600">
    <input
      type="checkbox"
      checked={includeArchived}
      onChange={(e) => setIncludeArchived(e.target.checked)}
    />
    include archived
  </label>
  <Link
    href="/archive"
    className="mt-1.5 inline-block font-mono text-xs text-zinc-600 hover:text-zinc-300"
  >
    view archive →
  </Link>
</div>
      </div>

      {searched && results.length === 0 && (
        <p className="pt-8 text-center font-mono text-sm text-zinc-600">no matches.</p>
      )}
      {results.map((note) => (
        <NoteRow key={note.id} note={note} onUpdate={updateNote} onArchive={archiveNote} />
      ))}
      <TabBar />
    </main>
  );
}

export default function Search() {
  return (
    <Suspense>
      <SearchInner />
    </Suspense>
  );
}