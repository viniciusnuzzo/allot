import { requireAccount } from "@/app/lib/supabase-server";
import { JoinTeamForm } from "@/app/components/team-dashboard";

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams;
  const code = typeof params.code === "string" && /^[a-f0-9]{32}$/i.test(params.code) ? params.code : "";
  await requireAccount(code ? `/join?code=${code}` : "/teams");
  return <><header className="app-header"><h1 className="app-title">Join your team</h1><p className="app-intro">Use the owner’s invitation to enter the workspace.</p></header><div className="max-w-xl"><JoinTeamForm code={code} /></div></>;
}
