"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMsg(error.message);
    } else {
      router.push("/");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="w-full max-w-xs space-y-3">
        <h1 className="font-mono text-zinc-400">permnote login</h1>
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-200 outline-none focus:border-zinc-600"
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-200 outline-none focus:border-zinc-600"
        />
        <button
          onClick={handleLogin}
          className="w-full rounded-lg bg-zinc-200 p-3 text-sm font-medium text-zinc-900 hover:bg-white"
        >
          sign in
        </button>
        {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}
      </div>
    </main>
  );
}