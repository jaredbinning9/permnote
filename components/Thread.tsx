"use client";

import { useState } from "react";
import type { Note } from "@/lib/types";
import NoteRow from "@/components/NoteRow";

type Props = {
  parent: Note;
  children_: Note[];
  onUpdate: (id: string, changes: Partial<Note>) => void;
  onArchive: (note: Note) => void;
  onAddChild: (parentId: string, content: string) => void;
};

export default function Thread({ parent, children_, onUpdate, onArchive, onAddChild }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  function submit() {
    const content = draft.trim();
    if (!content) return;
    onAddChild(parent.id, content);
    setDraft("");
  }

  return (
    <div className="ml-8">
      <button
        onClick={() => setOpen(!open)}
        className="py-0.5 font-mono text-[11px] text-zinc-600 hover:text-zinc-400"
      >
        {open ? "▾" : "▸"}{" "}
        {children_.length > 0 ? `${children_.length} in thread` : "start thread"}
      </button>

      {open && (
        <div className="border-l border-zinc-800 pl-3">
          {children_.map((child) => (
            <NoteRow key={child.id} note={child} onUpdate={onUpdate} onArchive={onArchive} />
          ))}
          <textarea
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={`Add to this thread...`}
            className="mt-1 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-sm text-zinc-300 outline-none focus:border-zinc-600"
          />
        </div>
      )}
    </div>
  );
}