import type { Metadata } from "next";
import Link from "next/link";

import { BrandLink } from "../components/brand-mark";
import { PaymentReview } from "../components/payment-review";
import { decodePaymentLink, paymentLinkSchema, type PaymentLink } from "../lib/payment-link";
import { supabaseServer } from "../lib/supabase-server";

type PaymentPageProps = { searchParams: Promise<{ d?: string | string[]; s?: string | string[]; request?: string | string[] }> };

export const metadata: Metadata = {
  title: "Review payment | Allot",
  robots: { index: false, follow: false },
};

export default async function PaymentPage({ searchParams }: PaymentPageProps) {
  const params = await searchParams;
  const payload = typeof params.d === "string" ? params.d : "";
  let link: PaymentLink | null = null;
  if (typeof params.s === "string" && /^[a-f0-9-]{36}$/i.test(params.s)) {
    const db = await supabaseServer();
    const { data, error } = await db.rpc("allot_payment", { share: params.s });
    const parsed = paymentLinkSchema.safeParse(data);
    if (!error && parsed.success) link = parsed.data;
  } else if (params.s === undefined) {
    try { link = decodePaymentLink(payload); } catch { link = null; }
  }

  if (link === null) {
    return (
      <main className="app-shell">
        <div className="site-width">
          <nav className="floating-nav" aria-label="Navigation"><BrandLink /><Link href="/" className="back-link">Back to home</Link></nav>
          <section className="max-w-2xl app-header">
          <p className="text-danger font-bold">Invalid link</p>
          <h1 className="app-title mt-3">This link is incomplete or damaged.</h1>
          <p className="app-intro">Ask the person who created the payment to generate and share a new link.</p>
          <Link href="/" className="button-primary mt-8">Back to Allot</Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="site-width">
        <nav className="floating-nav" aria-label="Navigation">
          <BrandLink /><Link href="/" className="back-link">Back to home</Link>
        </nav>
        <header className="app-header">
          <h1 className="app-title">Review every share before you pay.</h1>
          <p className="app-intro">One signature sends the full amount to all addresses below.</p>
          <p className="notice-neutral mt-4">{params.s ? "Every listed recipient accepted this saved split. Account approval does not verify wallet ownership." : "Legacy link: creator identity and recipient approvals are not verified. Review every detail."}</p>
        </header>
        <PaymentReview link={link} agreementShareId={typeof params.s === "string" ? params.s : undefined}
          requestId={typeof params.request === "string" && /^[a-f0-9-]{36}$/i.test(params.request) ? params.request : undefined} />
      </div>
    </main>
  );
}
