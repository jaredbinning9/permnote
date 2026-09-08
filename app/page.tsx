"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [status, setStatus] = useState("checking session...");
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      const { count, error } = await supabase
        .from("notes")
        .select("*", { count: "exact", head: true });
      setStatus(error ? `error: ${error.message}` : `logged in as ${session.user.email}. notes: ${count}`);
    }
    check();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950">
      <h1 className="font-mono text-zinc-400">{status}</h1>
    </main>
  );
}