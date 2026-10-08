"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatUsdc } from "@/app/lib/money";
import type { AgentProjectDraft, Project } from "@/app/lib/teams";

export function ProjectPlanning({ teamId, owner, projects, ready, drafts }: {
  teamId: string; owner: boolean; projects: Project[]; ready: boolean; drafts: AgentProjectDraft[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    const form = event.currentTarget;
    const values = new FormData(form);
    try {
      const response = await fetch("/api/projects", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team: teamId, parent: values.get("parent") || null,
          title: values.get("title"), budget: values.get("budget") || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create project.");
      form.reset();
      router.refresh();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not create project.");
    } finally { setBusy(false); }
  }

  async function decide(draft: string, decision: "accept" | "reject") {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/projects/draft", { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ team: teamId, draft, decision }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not change project draft.");
      router.refresh();
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Could not change project draft."); }
    finally { setBusy(false); }
  }

  function branch(parent: string | null): React.ReactNode {
    const children = projects.filter((project) => project.parent_id === parent);
    if (!children.length) return null;
    return <ul className="grid gap-3">{children.map((project) => <li className="data-row" key={project.id}>
      <div className="flex flex-wrap justify-between gap-2"><strong>{project.title}</strong><span className="text-muted text-sm">{project.budget_units === null ? "Budget not set" : `${formatUsdc(BigInt(project.budget_units))} test USDC planned`}</span></div>
      {projects.some((child) => child.parent_id === project.id) && <div className="mt-3 border-l border-black/20 pl-4">{branch(project.id)}</div>}
    </li>)}</ul>;
  }

  return <section className="surface-panel space-y-4" aria-labelledby="project-title">
    <div><h2 id="project-title" className="text-2xl font-semibold">Projects &amp; budgets</h2><p className="text-muted mt-2 text-sm">Plan work in parent projects and subprojects. These test-USDC budgets are notes, not reserved funds or agent spending limits. Agreements and payments are not linked to them yet.</p></div>
    {!ready ? <p className="notice-neutral" role="status">Project planning is not installed in this database yet.</p> : <>{projects.length ? branch(null) : <p className="text-muted">No projects planned yet.</p>}
      {owner && drafts.length > 0 && <div className="space-y-3"><h3 className="font-semibold">Agent-suggested projects</h3>{drafts.map((draft) => <article className="data-row" key={draft.id}><strong>{draft.title}</strong><p className="text-muted mt-2 text-sm">{draft.budgetUnits === null ? "Budget not set" : `${formatUsdc(BigInt(draft.budgetUnits))} test USDC planned`} · {draft.parentId ? `Subproject of ${projects.find((project) => project.id === draft.parentId)?.title ?? "another project"}` : "Top-level project"}. No funds reserved.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" className="button-secondary text-sm" disabled={busy} onClick={() => void decide(draft.id, "accept")}>Create this project</button><button type="button" className="button-danger text-sm" disabled={busy} onClick={() => void decide(draft.id, "reject")}>Reject draft</button></div></article>)}</div>}
      {owner && <form className="grid gap-3" onSubmit={(event) => void create(event)}>
        <label className="field-label">Project title<input className="field-input" name="title" required maxLength={60} /></label>
        <label className="field-label">Within project<select className="field-input" name="parent" defaultValue=""><option value="">Top level</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
        <label className="field-label">Planned budget · test USDC (optional)<input className="field-input" name="budget" inputMode="decimal" placeholder="100.00" /></label>
        <button className="button-secondary justify-self-start" disabled={busy}>{busy ? "Creating…" : "Create project"}</button>
      </form>}
      {error && <p role="alert" className="notice-error">{error}</p>}
    </>}
  </section>;
}
