import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
import { address } from "@solana/kit";
import { ReceiptView } from "../components/receipt-view";

import { USDC_MINT } from "./config";
import type { AppClient } from "./solana-client";
import {
  parseReceiptTransaction,
  checkAgreementTransfers,
  readReceipt,
  ReceiptNotFoundError,
  type ParsedReceiptTransaction,
} from "./receipt";

const SIGNATURE = "5".repeat(88);
const PAYER = "ComputeBudget111111111111111111111111111111";
const RECIPIENT_A = "11111111111111111111111111111111";
const RECIPIENT_B = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
const OTHER_MINT = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

function balance(
  accountIndex: number,
  owner: string,
  amount: string,
  mint = String(USDC_MINT),
) {
  return {
    accountIndex,
    mint,
    owner,
    uiTokenAmount: { amount, decimals: 6, uiAmount: null, uiAmountString: "0" },
  };
}

const successfulTransaction: ParsedReceiptTransaction = {
  blockTime: 1_700_000_000,
  meta: {
    err: null,
    preTokenBalances: [
      balance(0, PAYER, "10000000"),
      balance(1, RECIPIENT_A, "1000000"),
      balance(4, PAYER, "99", OTHER_MINT),
    ],
    postTokenBalances: [
      balance(0, PAYER, "4000000"),
      balance(1, RECIPIENT_A, "4000000"),
      balance(2, RECIPIENT_B, "3000000"),
      balance(4, PAYER, "199", OTHER_MINT),
    ],
  },
  transaction: {
    message: {
      instructions: [
        {
          program: "spl-memo",
          parsed: "fatia:v1:Jantar de sábado",
        },
      ],
    },
  },
};

describe("parseReceiptTransaction", () => {
  it("reports net changes when the payer also receives a share, without claiming gross transfers", () => {
    const transaction: ParsedReceiptTransaction = {
      ...successfulTransaction,
      meta: { err: null, preTokenBalances: [balance(0, PAYER, "20000000")],
        postTokenBalances: [balance(0, PAYER, "15000000"), balance(1, RECIPIENT_A, "5000000")] },
    };
    const receipt = parseReceiptTransaction(SIGNATURE, transaction);
    expect(receipt).toMatchObject({
      total: 5_000_000n, transfers: [{ owner: RECIPIENT_A, amount: 5_000_000n }],
    });
    const html = renderToStaticMarkup(createElement(ReceiptView, { receipt }));
    expect(html).toContain("Net USDC received");
    expect(html).toContain("not gross transfers");
    expect(html).not.toContain("Total distributed");
  });
  it("reads the title from a new Allot memo", () => {
    const transaction: ParsedReceiptTransaction = {
      ...successfulTransaction,
      transaction: {
        message: {
          instructions: [{ program: "spl-memo", parsed: "allot:v1:Café coletivo" }],
        },
      },
    };

    expect(parseReceiptTransaction(SIGNATURE, transaction).title).toBe("Café coletivo");
  });

  it("shows an agreement reference as a claim, not proof of approval", () => {
    const transaction: ParsedReceiptTransaction = {
      ...successfulTransaction,
      transaction: { message: { instructions: [{ program: "spl-memo", parsed: "allot:v2:11111111-1111-4111-8111-111111111111:Campaign" }] } },
    };
    const receipt = parseReceiptTransaction(SIGNATURE, transaction);
    expect(receipt.agreementShareId).toBe("11111111-1111-4111-8111-111111111111");
    const html = renderToStaticMarkup(createElement(ReceiptView, { receipt }));
    expect(html).toContain("/pagar?s=11111111-1111-4111-8111-111111111111");
    expect(html).toContain("does not prove the agreement was approved");
    const compared = renderToStaticMarkup(createElement(ReceiptView, { receipt, agreementCheck: "match" }));
    expect(compared).toContain("transfer instructions match this published split");
    expect(compared).toContain("does not verify wallet ownership");
  });

  it("reads the agreement and agent request from a v3 memo", () => {
    const transaction: ParsedReceiptTransaction = {
      ...successfulTransaction,
      transaction: { message: { instructions: [{ program: "spl-memo", parsed: "allot:v3:11111111-1111-4111-8111-111111111111:22222222-2222-4222-8222-222222222222:Campaign" }] } },
    };
    const receipt = parseReceiptTransaction(SIGNATURE, transaction);
    expect(receipt).toMatchObject({ agreementShareId: "11111111-1111-4111-8111-111111111111",
      requestId: "22222222-2222-4222-8222-222222222222", title: "Campaign" });
  });

  it("reconstructs successful USDC deltas, including a newly created ATA", () => {
    expect(parseReceiptTransaction(SIGNATURE, successfulTransaction)).toEqual({
      signature: SIGNATURE,
      status: "confirmed",
      payer: PAYER,
      title: "Jantar de sábado",
      agreementShareId: null,
      requestId: null,
      blockTime: 1_700_000_000,
      total: 6_000_000n,
      transfers: [
        { owner: RECIPIENT_A, amount: 3_000_000n },
        { owner: RECIPIENT_B, amount: 3_000_000n },
      ],
    });
  });

  it("marks a failed transaction without inventing transfers", () => {
    const failed: ParsedReceiptTransaction = {
      ...successfulTransaction,
      meta: {
        err: { InstructionError: [1, "InsufficientFunds"] },
        preTokenBalances: successfulTransaction.meta?.preTokenBalances,
        postTokenBalances: successfulTransaction.meta?.preTokenBalances,
      },
    };

    expect(parseReceiptTransaction(SIGNATURE, failed)).toMatchObject({
      status: "failed",
      payer: null,
      total: 0n,
      transfers: [],
    });
  });

  it("does not call missing transaction metadata a failure", () => {
    const receipt = parseReceiptTransaction(SIGNATURE, {
      ...successfulTransaction,
      meta: null,
    });

    expect(receipt).toMatchObject({ status: "unknown", total: 0n, transfers: [] });
    const html = renderToStaticMarkup(createElement(ReceiptView, { receipt }));
    expect(html).toContain("Status unavailable");
    expect(html).toContain("Token balance changes unavailable.");
    expect(html).not.toContain("0.00 USDC");
  });

  it("keeps title null when there is no Allot memo", () => {
    const noMemo: ParsedReceiptTransaction = {
      ...successfulTransaction,
      transaction: { message: { instructions: [] } },
    };

    expect(parseReceiptTransaction(SIGNATURE, noMemo).title).toBeNull();
  });

  it("ignores non-Allot memos", () => {
    const otherMemo: ParsedReceiptTransaction = {
      ...successfulTransaction,
      transaction: {
        message: {
          instructions: [{ program: "spl-memo", parsed: "outro-app:v1:Jantar" }],
        },
      },
    };

    expect(parseReceiptTransaction(SIGNATURE, otherMemo).title).toBeNull();
  });

  it("does not mistake an arbitrary program log for an Allot memo", () => {
    const transaction: ParsedReceiptTransaction = {
      ...successfulTransaction,
      meta: { err: null, logMessages: ["Program log: allot:v1:Fake title"] },
      transaction: { message: { instructions: [] } },
    };

    expect(parseReceiptTransaction(SIGNATURE, transaction).title).toBeNull();
  });

  it("preserves a missing block time", () => {
    expect(
      parseReceiptTransaction(SIGNATURE, {
        ...successfulTransaction,
        blockTime: null,
      }).blockTime,
    ).toBeNull();
  });
});

describe("readReceipt", () => {
  it("retries not-found responses and then returns the receipt", async () => {
    vi.useFakeTimers();
    const send = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(successfulTransaction);
    const client = {
      rpc: { getTransaction: vi.fn(() => ({ send })) },
    } as unknown as AppClient;

    const result = readReceipt(client, SIGNATURE);
    await vi.runAllTimersAsync();

    await expect(result).resolves.toMatchObject({ signature: SIGNATURE, total: 6_000_000n });
    expect(send).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("throws a typed error after three not-found responses", async () => {
    vi.useFakeTimers();
    const send = vi.fn().mockResolvedValue(null);
    const client = {
      rpc: { getTransaction: vi.fn(() => ({ send })) },
    } as unknown as AppClient;

    const result = readReceipt(client, SIGNATURE);
    const expectation = expect(result).rejects.toBeInstanceOf(ReceiptNotFoundError);
    await vi.runAllTimersAsync();

    await expectation;
    expect(send).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });

  it("rejects an invalid signature before RPC use", async () => {
    const getTransaction = vi.fn();
    const client = { rpc: { getTransaction } } as unknown as AppClient;

    await expect(readReceipt(client, "invalid")).rejects.toThrow("invalid signature");
    expect(getTransaction).not.toHaveBeenCalled();
  });
});

describe("checkAgreementTransfers", () => {
  const link = { v: 1 as const, title: "Campaign", amount: "6.00", recipients: [
    { name: "A", address: RECIPIENT_A, bps: 5000 },
    { name: "B", address: RECIPIENT_B, bps: 5000 },
  ] };

  it("compares exact token-account destinations and base-unit amounts", async () => {
    const destinations = await Promise.all(link.recipients.map(async (recipient) =>
      (await findAssociatedTokenPda({ owner: address(recipient.address), mint: USDC_MINT,
        tokenProgram: TOKEN_PROGRAM_ADDRESS }))[0]));
    const transaction: ParsedReceiptTransaction = { ...successfulTransaction,
      meta: { ...successfulTransaction.meta!, innerInstructions: [] },
      transaction: { message: { instructions: destinations.map((destination) => ({ program: "spl-token",
        parsed: { type: "transferChecked", info: { authority: PAYER, source: "source-ata", destination,
          mint: USDC_MINT, tokenAmount: { amount: "3000000", decimals: 6 } } } })) } },
    };
    expect(await checkAgreementTransfers(transaction, link)).toBe("match");
    const altered = { ...link, recipients: [link.recipients[0], { ...link.recipients[1], bps: 4000 }] };
    expect(await checkAgreementTransfers(transaction, altered)).toBe("mismatch");
    expect(await checkAgreementTransfers({ ...transaction, meta: { ...transaction.meta!, innerInstructions: null } }, link)).toBe("unverifiable");
  });
});
