import type { Metadata } from "next";
import Link from "next/link";

import { BrandLink } from "../../components/brand-mark";
import { ReceiptView } from "../../components/receipt-view";
import { checkAgreementTransfers, readReceiptDetails, ReceiptNotFoundError, type AgreementTransferCheck } from "../../lib/receipt";
import { paymentLinkSchema } from "../../lib/payment-link";
import { client } from "../../lib/solana-client";
import { supabaseServer } from "../../lib/supabase-server";

type ReceiptPageProps = { params: Promise<{ signature: string }> };

export const metadata: Metadata = {
  title: "Transaction receipt | Allot",
  robots: { index: false, follow: false },
};

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { signature } = await params;
  let receipt = null;
  let agreementCheck: AgreementTransferCheck | "unavailable" | null = null;
  let error: "invalid" | "not-found" | "network" | null = null;
  try {
    const details = await readReceiptDetails(client, signature);
    receipt = details.receipt;
    if (receipt.agreementShareId && receipt.status === "confirmed") {
      try {
        const db = await supabaseServer();
        const { data, error: agreementError } = await db.rpc("allot_payment", { share: receipt.agreementShareId });
        if (agreementError) agreementCheck = "unavailable";
        else if (data === null) agreementCheck = "mismatch";
        else {
          const link = paymentLinkSchema.safeParse(data);
          agreementCheck = !link.success ? "unavailable" : link.data.title !== receipt.title
            ? "mismatch" : await checkAgreementTransfers(details.transaction, link.data);
        }
      } catch { agreementCheck = "unavailable"; }
    }
  } catch (caught) {
    if (caught instanceof ReceiptNotFoundError) error = "not-found";
    else if (caught instanceof Error && caught.message === "invalid signature") error = "invalid";
    else error = "network";
  }

  if (!receipt) {
    const content = {
      invalid: ["Invalid signature", "Check that you copied the entire receipt link."],
      "not-found": ["Transaction not found", "It may still be confirming on Devnet. Wait a few seconds and refresh."],
      network: ["Devnet unavailable", "Could not check the blockchain right now. Try refreshing the page."],
    }[error ?? "network"];
    return (
      <main className="app-shell">
        <div className="site-width">
          <nav className="floating-nav" aria-label="Navigation"><BrandLink /><Link href="/" className="back-link">Back to home</Link></nav>
          <section className="max-w-2xl app-header">
          <p className="text-danger font-bold">Receipt</p>
          <h1 className="app-title mt-3">{content[0]}</h1>
          <p className="app-intro">{content[1]}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="button-primary">Back to Allot</Link>
            {error === "not-found" ? <a href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`} target="_blank" rel="noreferrer" className="button-secondary">Check on Explorer ↗</a> : null}
          </div>
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
          <h1 className="app-title">A public receipt, straight from the blockchain.</h1>
          <p className="app-intro">Transaction status and net USDC balance changes recorded on Devnet.</p>
        </header>
        <ReceiptView receipt={receipt} agreementCheck={agreementCheck} />
      </div>
    </main>
  );
}
