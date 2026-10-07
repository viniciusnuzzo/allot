import { AccountForm } from "@/app/components/account-form";
export default function ForgotPage() {
  return <><header className="app-header"><h1 className="app-title">Reset your password</h1><p className="app-intro">We’ll send a reset link to your email.</p></header><AccountForm mode="recovery" /></>;
}
