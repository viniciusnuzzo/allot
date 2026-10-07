"use client";

import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
import { address, type Address } from "@solana/kit";
import { useConnectedWallet } from "@solana/kit-plugin-wallet/react";
import { useWalletAccountTransactionSendingSigner } from "@solana/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { SOLANA_CHAIN, USDC_MINT } from "../lib/config";
import { formatUsdc, parseUsdc, splitAmount } from "../lib/money";
import {
  normalizePaymentError,
  PaymentPreflightError,
  type PaymentFailure,
} from "../lib/payment-errors";
import type { PaymentLink } from "../lib/payment-link";
import { client } from "../lib/solana-client";
import { sendSplitPayment } from "../lib/split-transaction";
import { PieSplit, PIE_COLORS } from "./pie-split";
import { WalletButton } from "./wallet-button";

type PaymentState =
  | "disconnected"
  | "ready"
  | "awaiting-signature"
  | "sending"
  | "confirmed"
  | "failed";

type ConnectedWallet = NonNullable<ReturnType<typeof useConnectedWallet>>;

const STATUS: Record<PaymentState, string> = {
  disconnected: "Connect your wallet to continue.",
  ready: "Ready to pay.",
  "awaiting-signature": "Review and approve in your wallet.",
  sending: "Transaction sent. Confirming…",
  confirmed: "Payment confirmed.",
  failed: "Payment was not completed.",
};

async function validateBalances(
  payer: Address,
  total: bigint,
  recipients: readonly Address[],
) {
  const [sourceAta] = await findAssociatedTokenPda({
    owner: payer,
    mint: USDC_MINT,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });
  const destinationAtas = await Promise.all(
    recipients.map(async (owner) => {
      const [ata] = await findAssociatedTokenPda({
        owner,
        mint: USDC_MINT,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      });
      return ata;
    }),
  );

  const [sourceInfo, solBalance, destinationAccounts, ataRent] = await Promise.all([
    client.rpc
      .getAccountInfo(sourceAta, { commitment: "confirmed", encoding: "base64" })
      .send(),
    client.rpc.getBalance(payer, { commitment: "confirmed" }).send(),
    client.rpc
      .getMultipleAccounts(destinationAtas, {
        commitment: "confirmed",
        encoding: "base64",
      })
      .send(),
    client.rpc.getMinimumBalanceForRentExemption(165n).send(),
  ]);

  if (sourceInfo.value === null) {
    throw new PaymentPreflightError("INSUFFICIENT_USDC");
  }
  const tokenBalance = await client.rpc
    .getTokenAccountBalance(sourceAta, { commitment: "confirmed" })
    .send();
  if (BigInt(tokenBalance.value.amount) < total) {
    throw new PaymentPreflightError("INSUFFICIENT_USDC");
  }

  const missingAtas = destinationAccounts.value.filter((account) => account === null).length;
  const estimatedFee = 10_000n;
  const requiredSol = ataRent * BigInt(missingAtas) + estimatedFee;
  if (solBalance.value < requiredSol) {
    throw new PaymentPreflightError("INSUFFICIENT_SOL");
  }
}

function ConnectedPaymentAction({
  connected,
  link,
  total,
}: {
  connected: ConnectedWallet;
  link: PaymentLink;
  total: bigint | null;
}) {
  const router = useRouter();
  const signer = useWalletAccountTransactionSendingSigner(
    connected.account,
    SOLANA_CHAIN,
  );
  const [state, setState] = useState<PaymentState>("ready");
  const [failure, setFailure] = useState<PaymentFailure | null>(null);

  async function pay() {
    if (state !== "ready" || total === null) return;
    setFailure(null);
    setState("awaiting-signature");

    try {
      const recipientAddresses = link.recipients.map((recipient) =>
        address(recipient.address),
      );
      await validateBalances(address(connected.account.address), total, recipientAddresses);
      const amounts = splitAmount(
        total,
        link.recipients.map((recipient) => recipient.bps),
      );
      const signature = await sendSplitPayment(client, {
        payer: signer,
        mint: USDC_MINT,
        title: link.title,
        recipients: recipientAddresses.map((recipientAddress, index) => ({
          address: recipientAddress,
          amount: amounts[index],
        })),
      });

      setState("sending");
      setState("confirmed");
      router.push(`/r/${signature}`);
    } catch (error) {
      setFailure(normalizePaymentError(error));
      setState("failed");
    }
  }

  function retry() {
    if (!failure?.canRetry) return;
    setFailure(null);
    setState("ready");
  }

  return (
    <div className="mt-6 border-t border-black/20 pt-6">
      <p className="text-muted text-sm">{STATUS[state]}</p>
      <button
        type="button"
        onClick={pay}
        disabled={state !== "ready" || total === null}
        className="button-primary mt-4 w-full"
      >
        {state === "awaiting-signature"
          ? "Waiting for signature…"
          : state === "sending"
            ? "Confirming…"
            : "Pay once"}
      </button>

      {failure ? (
        <div role="alert" className="notice-error mt-4">
          <p>{failure.message}</p>
          {failure.signature ? (
            <a
              href={`/r/${failure.signature}`}
              className="mt-2 block break-all font-medium underline"
            >
              Check receipt {failure.signature}
            </a>
          ) : null}
          {failure.canRetry ? (
            <button
              type="button"
              onClick={retry}
              className="button-danger mt-3 text-sm"
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function PaymentReview({ link }: { link: PaymentLink }) {
  const connected = useConnectedWallet(client);
  const [amountInput, setAmountInput] = useState(link.amount ?? "");

  let total: bigint | null = null;
  try {
    total = parseUsdc(amountInput);
  } catch {
    total = null;
  }
  const amounts = total
    ? splitAmount(
        total,
        link.recipients.map((recipient) => recipient.bps),
      )
    : null;

  return (
    <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <section className="surface-panel">
        <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{link.title}</h2>

        {link.amount ? (
          <div className="amount-block">
            <p className="text-sm font-semibold">Total</p>
            <p className="mt-1 text-3xl font-semibold">{formatUsdc(total ?? 0n)} USDC</p>
          </div>
        ) : (
          <label className="field-label mt-6">
            Amount in USDC
            <input
              required
              inputMode="decimal"
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              placeholder="Minimum 1.00"
              className="field-input"
            />
            {amountInput && total === null ? (
              <span className="text-danger">Enter at least 1 USDC.</span>
            ) : null}
          </label>
        )}

        <div className="mt-8 grid gap-3">
          {link.recipients.map((recipient, index) => (
            <article key={recipient.address} className="data-row">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate font-medium">
                  <span
                    aria-hidden="true"
                    className="slice-dot"
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  {recipient.name || `Person ${index + 1}`}
                </p>
                <p className="tabular shrink-0 font-mono text-sm">
                  {amounts ? `${formatUsdc(amounts[index])} USDC` : `${(recipient.bps / 100).toFixed(2)}%`}
                </p>
              </div>
              <details className="text-muted mt-3 text-xs">
                <summary className="cursor-pointer font-semibold hover:text-black">View full address</summary>
                <code className="mt-2 block break-all">{recipient.address}</code>
              </details>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-3 text-sm">
          <p className="notice-devnet">
            Devnet: use only test USDC and test SOL. No real money.
          </p>
          <p className="notice-neutral">
            The transaction is public and cannot be undone. Check every address before signing.
          </p>
        </div>

        <div className="mt-6">
          <WalletButton />
        </div>
        {connected ? (
          <ConnectedPaymentAction connected={connected} link={link} total={total} />
        ) : (
          <p className="text-muted mt-6 border-t border-black/20 pt-6 text-sm">
            {STATUS.disconnected}
          </p>
        )}
      </section>

      <aside className="preview-panel h-fit lg:sticky lg:top-8">
        <p className="text-sm font-semibold">Split</p>
        <PieSplit
          bps={link.recipients.map((recipient) => recipient.bps)}
          labels={link.recipients.map((recipient) => recipient.name)}
          className="mx-auto mt-6 h-48 w-48 max-w-full"
        />
      </aside>
    </div>
  );
}
