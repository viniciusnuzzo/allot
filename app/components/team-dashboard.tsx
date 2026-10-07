"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { teamAction, type Team } from "@/app/lib/teams";

export function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <div><button className="button-secondary" disabled={busy} onClick={async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
      if (!response.ok) throw new Error("Could not log out. Try again.");
      router.push("/login"); router.refresh();
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Could not connect."); }
    finally { setBusy(false); }
  }}>{busy ? "Logging out…" : "Log out"}</button>{error && <p role="alert">{error}</p>}</div>;
}

export function JoinTeamForm({ code = "" }: { code?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <form className="surface-panel space-y-4" onSubmit={async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    const code = String(new FormData(event.currentTarget).get("code") ?? "").trim();
    try {
      const result = await teamAction({ action: "join", code });
      router.replace(`/teams/${result.id}`); router.refresh();
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Could not join."); }
    finally { setBusy(false); }
  }}><h2 className="text-2xl font-semibold">Join a team</h2><label className="field-label">Invitation code<input name="code" className="field-input font-mono" defaultValue={code} autoComplete="off" required minLength={32} maxLength={32} spellCheck={false} /></label><p className="text-muted text-sm">Use the code your team owner shared with you. Joining shares your display name with the team.</p>{error && <p role="alert" className="notice-error">{error}</p>}<button className="button-primary" disabled={busy}>{busy ? "Joining…" : "Join team"}</button></form>;
}

export function TeamDashboard({ teams }: { teams: Team[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <div className="space-y-8">
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Your teams">
      {teams.map((team) => <Link href={`/teams/${team.id}`} key={team.id} className="surface-panel block"><h2 className="text-2xl font-semibold break-words">{team.name}</h2><p className="text-muted mt-2">Open team →</p></Link>)}
      {!teams.length && <p className="notice-neutral">No teams yet. Create one or enter an invitation code.</p>}
    </section>
    <div className="grid gap-6 lg:grid-cols-2">
      <form className="surface-panel space-y-4" onSubmit={async (event) => {
        event.preventDefault(); setBusy(true); setError("");
        const name = new FormData(event.currentTarget).get("name");
        try { const result = await teamAction({ action: "create", name }); router.push(`/teams/${result.id}`); router.refresh(); }
        catch (problem) { setError(problem instanceof Error ? problem.message : "Could not create the team."); }
        finally { setBusy(false); }
      }}><h2 className="text-2xl font-semibold">Create a team</h2><label className="field-label">Team name<input className="field-input" name="name" required maxLength={60} /></label>{error && <p role="alert" className="notice-error">{error}</p>}<button className="button-primary" disabled={busy}>{busy ? "Creating…" : "Create team"}</button></form>
      <JoinTeamForm />
    </div>
  </div>;
}
