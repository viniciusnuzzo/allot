import { AccountForm } from "@/app/components/account-form";
import { requireAccount } from "@/app/lib/supabase-server";
export default async function ResetPage() {
  await requireAccount("/reset-password");
  return <><header className="app-header"><h1 className="app-title">Choose a new password</h1></header><AccountForm mode="reset" /></>;
}
