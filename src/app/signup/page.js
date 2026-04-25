"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/login?message=Account created successfully! You can now log in.");
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center bg-white text-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 relative overflow-hidden">
      <div aria-hidden="true" className="absolute -top-20 -right-20 size-96 rounded-full bg-pink-500 blur-3xl opacity-20"></div>
      <div aria-hidden="true" className="absolute -bottom-20 -left-20 size-96 rounded-full bg-indigo-300 blur-3xl opacity-20"></div>

      <div className="relative z-10 w-full max-w-md mx-auto p-8">
        <div className="bg-zinc-100/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
          <div className="mb-8 text-center">
            <Link href="/" className="text-2xl font-thin tracking-widest hover:text-purple-600 dark:hover:text-purple-400">Olivia</Link>
            <h1 className="text-3xl font-bold mt-4">Create Account</h1>
            <p className="text-zinc-500 mt-2">Sign up to view and comment on albums</p>
          </div>

          {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg text-sm text-center">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="block w-full rounded-xl bg-white dark:bg-zinc-800 border border-transparent px-5 py-3 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all" placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">Email Address (Username)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="block w-full rounded-xl bg-white dark:bg-zinc-800 border border-transparent px-5 py-3 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all" placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="block w-full rounded-xl bg-white dark:bg-zinc-800 border border-transparent px-5 py-3 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-950 px-8 py-4 text-sm font-semibold text-white hover:bg-zinc-800 dark:hover:bg-zinc-200 focus:ring-4 focus:ring-zinc-400/50 active:scale-[0.98] transition-all disabled:opacity-50">
              {loading ? <div className="size-5 border-2 border-zinc-400 border-t-white rounded-full animate-spin"></div> : "Sign Up"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-zinc-500">
            Already have an account? <Link href="/login" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">Log In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
