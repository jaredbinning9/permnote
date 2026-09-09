"use client";

type Props = {
  message: string;
  onUndo?: () => void;
};

export default function Toast({ message, onUndo }: Props) {
  return (
    <div className="fixed bottom-16 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 shadow-lg">
      <span className="text-sm text-zinc-300">{message}</span>
      {onUndo && (
        <button onClick={onUndo} className="text-sm font-medium text-sky-400 hover:text-sky-300">
          undo
        </button>
      )}
    </div>
  );
}