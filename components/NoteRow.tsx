"use client";

import { useState } from "react";
import Link from "next/link";
import type { Note } from "@/lib/types";
import { extractTags } from "@/lib/utils";

type Props = {
  note: Note;
  onUpdate: (id: string, changes: Partial<Note>) => void;
  onArchive: (note: Note) => void;
  onStartThread: () => void;
  hasThread: boolean;
};

const CLAMP_THRESHOLD = 180;

export default function NoteRow({ note, onUpdate, onArchive, onStartThread, hasThread }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);
  const [expanded, setExpanded] = useState(false);

  const overdue =
    note.is_todo && !note.is_done && note.due_at && new Date(note.due_at) < new Date();
  const clampable =
    note.content.length > CLAMP_THRESHOLD || note.content.split("\n").length > 3;

  function startEdit() {
    setDraft(note.content);
    setEditing(true);
  }

  function saveEdit() {
    const content = draft.trim();
    if (!content || content === note.content) {
      setEditing(false);
      return;
    }
    onUpdate(note.id, { content, tags: extractTags(content) });
    setEditing(false);
  }

  return (
    <div className="border-b border-zinc-900 py-2.5">
      <div className="flex items-start gap-3">
        {note.is_todo ? (
          <button
            onClick={() => onUpdate(note.id, { is_done: !note.is_done })}
            aria-label="toggle done"
            className={`-m-2 mt--1 shrink-0 p-2 ${
              note.is_done ? "text-emerald-500" : "text-zinc-600"
            }`}
          >
            <span
              className={`block h-4 w-4 rounded border text-center text-[10px] leading-4 ${
                note.is_done ? "border-emerald-600 bg-emerald-600/20" : "border-zinc-700"
              }`}
            >
              {note.is_done ? "✓" : ""}
            </span>
          </button>
        ) : (
          <span className="pt-0.5 font-mono text-xs text-zinc-600">
            {new Date(note.created_at).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        )}

        <div className="min-w-0 flex-1">
          {editing ? (
            <textarea
              autoFocus
              value={draft}
              rows={Math.min(draft.split("\n").length + 1, 10)}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  saveEdit();
                }
                if (e.key === "Escape") setEditing(false);
              }}
              onBlur={saveEdit}
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-sm leading-relaxed text-zinc-200 outline-none"
            />
          ) : (
            <>
              <p
                onClick={startEdit}
                className={`cursor-text whitespace-pre-wrap text-sm leading-relaxed ${
                  note.is_done ? "text-zinc-600 line-through" : "text-zinc-300"
                } ${clampable && !expanded ? "line-clamp-3" : ""}`}
              >
                {note.content.split(/(#[\w-]+)/g).map((part, i) =>
                  part.startsWith("#") ? (
                    <Link
                      key={i}
                      href={`/search?q=${encodeURIComponent(part)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sky-400 hover:text-sky-300"
                    >
                      {part}
                    </Link>
                  ) : (
                    part
                  )
                )}
              </p>
              {clampable && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="mt-0.5 font-mono text-[11px] text-zinc-600 hover:text-zinc-400"
                >
                  {expanded ? "less ▴" : "more ▾"}
                </button>
              )}
            </>
          )}

          {note.is_todo && !editing && (
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

        {!editing && (
  <div className="flex shrink-0 items-start">
    {!hasThread && (
      <button
        onClick={onStartThread}
        aria-label="start thread"
        className="p-2 text-sm text-zinc-600 hover:text-zinc-400"
      >
        ⊕
      </button>
    )}
    <button
      onClick={() => onUpdate(note.id, { is_pinned: !note.is_pinned })}
      aria-label="toggle pin"
      className={`p-2 text-sm ${
        note.is_pinned ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"
      }`}
    >
      ✦
    </button>
    <button
      onClick={() =>
        onUpdate(note.id, { is_todo: !note.is_todo, is_done: false, due_at: null })
      }
      aria-label="toggle todo"
      className={`p-2 text-sm ${
        note.is_todo ? "text-amber-500" : "text-zinc-600 hover:text-zinc-400"
      }`}
    >
      ◻
    </button>
    <button
      onClick={() => onArchive(note)}
      aria-label="archive note"
      className="p-2 text-sm text-zinc-600 hover:text-red-400"
    >
      ×
    </button>
  </div>
)}
      </div>
    </div>
  );
}