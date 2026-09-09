"use client";

import Link from "next/link";
import type { Note } from "@/lib/types";

type Props = {
  note: Note;
  onUpdate: (id: string, changes: Partial<Note>) => void;
  onArchive: (note: Note) => void;
};

export default function NoteRow({ note, onUpdate, onArchive }: Props) {
  const overdue =
    note.is_todo && !note.is_done && note.due_at && new Date(note.due_at) < new Date();

  return (
    <div className="group border-b border-zinc-900 py-2.5">
      <div className="flex items-start gap-3">
        {note.is_todo ? (
          <button
            onClick={() => onUpdate(note.id, { is_done: !note.is_done })}
            aria-label="toggle done"
            className={`mt-0.5 h-4 w-4 shrink-0 rounded border ${
              note.is_done
                ? "border-emerald-600 bg-emerald-600/20 text-emerald-500"
                : "border-zinc-700"
            } text-[10px] leading-none`}
          >
            {note.is_done ? "✓" : ""}
          </button>
        ) : (
          <span className="pt-0.5 font-mono text-xs text-zinc-600">
            {new Date(note.created_at).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        )}

        <div className="flex-1">
          <p
            className={`text-sm leading-relaxed ${
              note.is_done ? "text-zinc-600 line-through" : "text-zinc-300"
            }`}
          >
            {note.content.split(/(#[\w-]+)/g).map((part, i) =>
              part.startsWith("#") ? (
                <Link
                  key={i}
                  href={`/search?q=${encodeURIComponent(part)}`}
                  className="text-sky-400 hover:text-sky-300"
                >
                  {part}
                </Link>
              ) : (
                part
              )
            )}
          </p>

          {note.is_todo && (
            <div className="mt-1 flex items-center gap-2">
              <input
                type="date"
                value={note.due_at ? note.due_at.slice(0, 10) : ""}
                onChange={(e) =>
                  onUpdate(note.id, {
                    due_at: e.target.value
                      ? new Date(e.target.value + "T17:00:00").toISOString()
                      : null,
                  })
                }
                className={`rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] ${
                  overdue ? "text-red-400" : "text-zinc-500"
                }`}
              />
              {overdue && <span className="font-mono text-[10px] text-red-400">overdue</span>}
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-2.5 pt-0.5">
          <button
            onClick={() => onUpdate(note.id, { is_pinned: !note.is_pinned })}
            aria-label="toggle pin"
            className={`font-mono text-xs ${
              note.is_pinned ? "text-amber-400" : "text-zinc-700 hover:text-zinc-500"
            }`}
          >
            ✦
          </button>
          <button
            onClick={() => onUpdate(note.id, { is_todo: !note.is_todo, is_done: false, due_at: null })}
            aria-label="toggle todo"
            className={`font-mono text-xs ${
              note.is_todo ? "text-amber-500" : "text-zinc-700 hover:text-zinc-500"
            }`}
          >
            ◻
          </button>
          <button
            onClick={() => onArchive(note)}
            aria-label="archive note"
            className="font-mono text-xs text-zinc-700 hover:text-red-400"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}