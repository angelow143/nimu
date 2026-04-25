"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result.error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center bg-white text-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 relative overflow-hidden">
      {/* Background Blurs */}
      <div
        aria-hidden="true"
        className="absolute -top-20 -left-20 size-96 rounded-full bg-purple-500 blur-3xl opacity-20"
      ></div>
      <div
        aria-hidden="true"
        className="absolute -bottom-20 -right-20 size-96 rounded-full bg-orange-300 blur-3xl opacity-20"
      ></div>

      <div className="relative z-10 w-full max-w-md mx-auto p-8">
        <div className="bg-zinc-100/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="text-2xl font-thin tracking-widest hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Nimu
            </Link>
            <h1 className="text-3xl font-bold mt-4">Welcome Back</h1>
            <p className="text-zinc-500 mt-2">Log in to manage your portfolio</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium ml-1 text-zinc-600 dark:text-zinc-400">
                Email Address
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="block w-full rounded-xl bg-white dark:bg-zinc-800 border border-transparent px-5 py-3 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
                placeholder="admin"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium ml-1 text-zinc-600 dark:text-zinc-400">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full rounded-xl bg-white dark:bg-zinc-800 border border-transparent px-5 py-3 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-8 py-4 text-sm font-semibold text-white hover:bg-purple-600 focus:ring-4 focus:ring-purple-400/50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-zinc-500">
            Don't have an account?{" "}
            <Link href="/signup" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
