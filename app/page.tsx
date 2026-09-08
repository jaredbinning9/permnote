import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { count, error } = await supabase
    .from("notes")
    .select("*", { count: "exact", head: true });

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950">
      <h1 className="font-mono text-zinc-400">
        {error ? `connection error: ${error.message}` : `connected. notes in db: ${count}`}
      </h1>
    </main>
  );
}