import { AccountForm } from "@/app/components/account-form";
import { accountReturnPath } from "@/app/lib/account-validation";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return <><header className="app-header"><h1 className="app-title">Sign up</h1><p className="app-intro">Create your account, confirm your email, and join your team.</p></header><p className="notice-neutral max-w-lg mb-5">Public registration is not open yet. Email verification is currently available only for approved test accounts.</p><AccountForm mode="signup" next={accountReturnPath(params.next)} /></>;
}
