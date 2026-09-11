"use client";

import { useState } from "react";
import type { Note } from "@/lib/types";
import { extractTags } from "@/lib/utils";

type Props = {
  note: Note;
  onUpdate: (id: string, changes: Partial<Note>) => void;
};

export default function MiniRow({ note, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);

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
    <div className="group flex items-start gap-2 border-b border-zinc-900/60 py-1.5">
      {note.is_todo ? (
        <button
          onClick={() => onUpdate(note.id, { is_done: !note.is_done })}
          aria-label="toggle done"
          className={`-m-1.5 mt-0 shrink-0 p-1.5 ${
            note.is_done ? "text-emerald-500" : "text-zinc-600"
          }`}
        >
          <span
            className={`block h-3.5 w-3.5 rounded border text-center text-[9px] leading-[0.85rem] ${
              note.is_done ? "border-emerald-600 bg-emerald-600/20" : "border-zinc-700"
            }`}
          >
            {note.is_done ? "✓" : ""}
          </span>
        </button>
      ) : (
        <button
          onClick={() => onUpdate(note.id, { is_todo: true })}
          aria-label="make todo"
          className="-m-1.5 mt-0 shrink-0 p-1.5 text-[11px] text-zinc-800 opacity-0 group-hover:opacity-100 hover:text-zinc-500"
        >
          ◻
        </button>
      )}

      {editing ? (
        <textarea
          autoFocus
          value={draft}
          rows={Math.min(draft.split("\n").length + 1, 6)}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              saveEdit();
            }
            if (e.key === "Escape") setEditing(false);
          }}
          onBlur={saveEdit}
          className="w-full resize-none rounded border border-zinc-700 bg-zinc-900 p-1.5 text-[13px] leading-snug text-zinc-200 outline-none"
        />
      ) : (
        <p
          onClick={() => {
            setDraft(note.content);
            setEditing(true);
          }}
          className={`min-w-0 flex-1 cursor-text whitespace-pre-wrap text-[13px] leading-snug ${
            note.is_done ? "text-zinc-600 line-through" : "text-zinc-400"
          }`}
        >
          {note.content.split(/(#[\w-]+)/g).map((part, i) =>
            part.startsWith("#") ? (
              <span key={i} className="text-sky-500/80">{part}</span>
            ) : (
              part
            )
          )}
        </p>
      )}
    </div>
  );
}