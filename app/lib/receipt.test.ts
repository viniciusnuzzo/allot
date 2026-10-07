import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ReceiptView } from "../components/receipt-view";

import { USDC_MINT } from "./config";
import type { AppClient } from "./solana-client";
import {
  parseReceiptTransaction,
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

  it("reconstructs successful USDC deltas, including a newly created ATA", () => {
    expect(parseReceiptTransaction(SIGNATURE, successfulTransaction)).toEqual({
      signature: SIGNATURE,
      status: "confirmed",
      payer: PAYER,
      title: "Jantar de sábado",
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
