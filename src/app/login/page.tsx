"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setSubmitting(false);

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/");
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <header className="border-b border-black pb-4">
        <h1 className="font-pixel text-2xl mb-2">LOGIN</h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 font-mono text-xs"
        autoComplete="off"
      >
        <div className="space-y-1">
          <label htmlFor="email" className="block">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full border border-black px-2 py-1 bg-white text-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full border border-black px-2 py-1 bg-white text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="border border-black px-4 py-2 bg-white text-black btn-plain"
        >
          {submitting ? "LOGGING IN..." : "LOGIN"}
        </button>
      </form>

      <p className="font-mono text-xs">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
        .
      </p>
    </div>
  );
}

