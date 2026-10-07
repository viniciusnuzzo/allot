import { AccountForm } from "@/app/components/account-form";
import { accountReturnPath } from "@/app/lib/account-validation";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  return <><header className="app-header"><h1 className="app-title">Log in</h1><p className="app-intro">Open your teams and review your share.</p></header>{params.error && <p role="alert" className="notice-error mb-5">The email link expired or could not be verified. Try logging in or request a new password reset.</p>}<AccountForm mode="login" next={accountReturnPath(params.next)} /></>;
}
