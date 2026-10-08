"use client";

import { useState } from "react";

import { formatUsdc } from "../lib/money";
import type { AgreementTransferCheck, Receipt } from "../lib/receipt";
import { PieSplit, PIE_COLORS } from "./pie-split";

function receiptPercentages(receipt: Receipt): number[] {
  if (receipt.total === 0n) return receipt.transfers.map(() => 0);
  return receipt.transfers.map((transfer) =>
    Number((transfer.amount * 10_000n) / receipt.total),
  );
}

export function ReceiptView({ receipt, agreementCheck = null }: { receipt: Receipt; agreementCheck?: AgreementTransferCheck | "unavailable" | null }) {
  const [copied, setCopied] = useState(false);
  const percentages = receiptPercentages(receipt);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <section className="surface-panel">
        <span
          className="status-chip"
          data-status={receipt.status}
        >
          {{ confirmed: "Confirmed on Devnet", failed: "Transaction failed", unknown: "Status unavailable" }[receipt.status]}
        </span>
        <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          {receipt.title ?? "Transaction receipt"}
        </h2>
        <p className="text-muted mt-3">
          {receipt.blockTime === null ? (
            "Time unavailable"
          ) : (
            <time suppressHydrationWarning dateTime={new Date(receipt.blockTime * 1_000).toISOString()}>
              {new Date(receipt.blockTime * 1_000).toLocaleString("en-US")}
            </time>
          )}
        </p>

        {receipt.agreementShareId ? (
          <p className="notice-neutral mt-4 text-sm">
            Transaction memo claims to reference <a className="underline break-all" href={`/pagar?s=${receipt.agreementShareId}`}>this payment agreement</a>. Anyone can write a memo; this reference alone does not prove the agreement was approved or that these transfers match it.
          </p>
        ) : null}
        {agreementCheck && <p className="notice-neutral mt-3 text-sm" role="status">{{
          match: "The parsed test-USDC transfer instructions match this published split's recipient token accounts and amounts. This does not verify wallet ownership or prove who wrote the memo.",
          mismatch: "The memo's agreement reference does not match the published split or these transfer instructions. Do not treat this as an Allot payment proof.",
          unverifiable: "The transaction did not provide enough parsed instruction detail to compare with the published split.",
          unavailable: "Could not check the published agreement right now; the memo remains an unverified claim.",
        }[agreementCheck]}</p>}

        <div className="amount-block">
          <p className="text-sm font-semibold">Net USDC received</p>
          <p className="mt-1 text-3xl font-semibold">{receipt.status === "unknown" ? "Unavailable" : `${formatUsdc(receipt.total)} USDC`}</p>
        </div>

        {receipt.payer ? (
          <div className="mt-6 min-w-0">
            <p className="text-muted text-sm">Largest net sender</p>
            <code className="notice-neutral mt-2 block break-all text-sm">
              {receipt.payer}
            </code>
          </div>
        ) : null}

        <div className="mt-8">
          <h2 className="text-xl font-semibold">Wallets with a net increase</h2>
          {receipt.transfers.length === 0 ? (
            <p className="text-muted mt-3">{receipt.status === "unknown" ? "Token balance changes unavailable." : "No net USDC increases recorded."}</p>
          ) : (
            <div className="mt-4 grid gap-3">
              {receipt.transfers.map((transfer, index) => (
                <article key={transfer.owner} className="data-row">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">
                      <span
                        aria-hidden="true"
                        className="slice-dot"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      Wallet {index + 1}
                    </p>
                    <p className="tabular font-mono text-sm">
                      {formatUsdc(transfer.amount)} USDC · {(percentages[index] / 100).toFixed(2)}%
                    </p>
                  </div>
                  <code className="text-muted mt-3 block break-all text-xs">{transfer.owner}</code>
                </article>
              ))}
            </div>
          )}
        </div>

        <p className="notice-neutral mt-6 text-sm">This receipt shows net wallet balance changes, not gross transfers. A share sent back to the payer does not increase their balance. Confirmation does not verify team approval or wallet ownership.</p>
        <div className="mt-8 min-w-0 border-t border-black/20 pt-6">
          <p className="text-muted text-sm">Public signature</p>
          <code className="mt-2 block break-all text-xs">{receipt.signature}</code>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={copyLink}
              className="button-primary text-sm"
            >
              {copied ? "Link copied!" : "Copy receipt"}
            </button>
            <a
              href={`https://explorer.solana.com/tx/${receipt.signature}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              className="button-secondary text-sm"
            >
              View on Explorer ↗
            </a>
          </div>
        </div>
      </section>

      {receipt.transfers.length > 0 ? (
        <aside className="preview-panel h-fit lg:sticky lg:top-8">
          <p className="text-sm font-semibold">Net balance increases</p>
          <PieSplit
            bps={percentages}
            className="mx-auto mt-6 h-48 w-48 max-w-full"
          />
        </aside>
      ) : null}
    </div>
  );
}
