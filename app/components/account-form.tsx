"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AccountForm({ mode, next = "/teams" }: { mode: "login" | "signup" | "recovery" | "reset"; next?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const label = { login: "Log in", signup: "Sign up", recovery: "Send reset link", reset: "Save new password" }[mode];
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fields, action: mode, next }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (result.next) { router.push(result.next); router.refresh(); }
      else setMessage(result.message);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Could not connect. Try again."); }
    finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="surface-panel space-y-5 max-w-lg">
      {mode === "signup" && <label className="field-label">Your name<input className="field-input" name="name" autoComplete="name" required maxLength={30} /></label>}
      {mode !== "reset" && <label className="field-label">Email<input className="field-input" name="email" type="email" autoComplete="email" required maxLength={254} /></label>}
      {mode !== "recovery" && <label className="field-label">Password<input className="field-input" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? 1 : 12} maxLength={128} required />{mode !== "login" && <span className="text-muted text-sm">At least 12 characters.</span>}</label>}
      {mode === "signup" && <label className="flex items-start gap-3 text-sm"><input type="checkbox" required className="mt-1" /><span>I agree to the <Link href="/terms" className="underline">Terms of Use</Link> and have read the <Link href="/privacy" className="underline">Privacy Policy</Link>.</span></label>}
      {error && <p role="alert" className="notice-error">{error}</p>}
      {message && <p role="status" className="notice-success">{message}</p>}
      <button className="button-primary w-full" disabled={busy}>{busy ? "Please wait…" : label}</button>
      {mode === "login" && <div className="flex flex-wrap justify-between gap-3 text-sm"><Link href={`/signup?next=${encodeURIComponent(next)}`} className="underline">Create an account</Link><Link href="/forgot-password" className="underline">Forgot password?</Link></div>}
      {mode === "signup" && <Link href={`/login?next=${encodeURIComponent(next)}`} className="block underline text-sm">Already registered? Log in</Link>}
    </form>
  );
}
