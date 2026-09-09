"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Note } from "@/lib/types";
import TabBar from "@/components/TabBar";
import Toast from "@/components/Toast";

function purgeLabel(archivedAt: string): string {
  const purgeDate = new Date(new Date(archivedAt).getTime() + 60 * 24 * 60 * 60 * 1000); // 60-day purge window - must match the pg_cron job 'purge-archived-notes' in Supabase
  const daysLeft = Math.ceil((purgeDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (daysLeft <= 0) return "purges soon";
  if (daysLeft === 1) return "purges tomorrow";
  return `purges in ${daysLeft} days`;
}

export default function Archive() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
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
        .not("archived_at", "is", null)
        .order("archived_at", { ascending: false })
        .limit(200);
      if (!error && data) setNotes(data);
      setLoading(false);
    }
    init();
  }, [router]);

  async function restoreNote(note: Note) {
    setNotes((current) => current.filter((n) => n.id !== note.id));
    const { error } = await supabase
      .from("notes")
      .update({ archived_at: null })
      .eq("id", note.id);
    if (error) {
      setNotes((current) => [note, ...current]);
      alert(`Restore failed: ${error.message}`);
      return;
    }
    setToast("Note restored to stream");
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-zinc-950 px-4 pb-24 pt-4">
      <h1 className="pb-2 font-mono text-xs uppercase tracking-widest text-zinc-600">
        archived · {notes.length}
      </h1>

      {loading && <p className="pt-8 text-center font-mono text-sm text-zinc-600">loading...</p>}
      {!loading && notes.length === 0 && (
        <p className="pt-8 text-center font-mono text-sm text-zinc-600">
          nothing archived. the stream is clean.
        </p>
      )}

      {notes.map((note) => (
        <div key={note.id} className="border-b border-zinc-900 py-2.5">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm leading-relaxed text-zinc-500">{note.content}</p>
              <p className="mt-0.5 font-mono text-[10px] text-zinc-700">
                {new Date(note.created_at).toLocaleDateString()} · {purgeLabel(note.archived_at!)}
              </p>
            </div>
            <button
              onClick={() => restoreNote(note)}
              className="shrink-0 pt-0.5 font-mono text-xs text-zinc-600 hover:text-emerald-400"
            >
              restore
            </button>
          </div>
        </div>
      ))}

      {toast && <Toast message={toast} />}
      <TabBar />
    </main>
  );
}