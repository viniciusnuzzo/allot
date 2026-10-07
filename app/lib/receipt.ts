import { signature as parseSignature } from "@solana/kit";

import { USDC_MINT } from "./config";
import type { AppClient } from "./solana-client";

type TokenBalanceLike = {
  accountIndex: number;
  mint: string;
  owner?: string;
  uiTokenAmount: { amount: string };
};

type ParsedInstructionLike = {
  program?: string;
  programId?: string;
  parsed?: unknown;
};

export type ParsedReceiptTransaction = {
  blockTime: number | bigint | null;
  meta: {
    err: unknown | null;
    preTokenBalances?: readonly TokenBalanceLike[];
    postTokenBalances?: readonly TokenBalanceLike[];
    logMessages?: readonly string[] | null;
  } | null;
  transaction: {
    message: { instructions: readonly ParsedInstructionLike[] };
  };
};

export type ReceiptTransfer = {
  owner: string;
  amount: bigint;
};

export type Receipt = {
  signature: string;
  status: "confirmed" | "failed";
  payer: string | null;
  title: string | null;
  blockTime: number | null;
  total: bigint;
  transfers: readonly ReceiptTransfer[];
};

export class ReceiptNotFoundError extends Error {
  constructor() {
    super("transaction not found");
    this.name = "ReceiptNotFoundError";
  }
}

function parsedMemoValue(parsed: unknown): string | null {
  if (typeof parsed === "string") return parsed;
  if (!parsed || typeof parsed !== "object") return null;
  if ("info" in parsed) {
    const info = parsed.info;
    if (typeof info === "string") return info;
    if (info && typeof info === "object" && "memo" in info && typeof info.memo === "string") {
      return info.memo;
    }
  }
  if ("memo" in parsed && typeof parsed.memo === "string") return parsed.memo;
  return null;
}

function getTitle(transaction: ParsedReceiptTransaction): string | null {
  const prefixes = ["allot:v1:", "fatia:v1:"] as const;
  for (const instruction of transaction.transaction.message.instructions) {
    const isMemo =
      instruction.program === "spl-memo" ||
      instruction.program === "memo" ||
      instruction.programId === "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
    if (!isMemo) continue;

    const memo = parsedMemoValue(instruction.parsed);
    const prefix = prefixes.find((value) => memo?.startsWith(value));
    if (prefix && memo) {
      const title = memo.slice(prefix.length).trim();
      return title || null;
    }
  }

  const memoLog = transaction.meta?.logMessages?.find((line) =>
    prefixes.some((prefix) => line.includes(prefix)),
  );
  if (!memoLog) return null;
  const match = memoLog.match(/(?:allot|fatia):v1:([^"']+)/u);
  return match?.[1]?.trim() || null;
}

export function parseReceiptTransaction(
  signature: string,
  transaction: ParsedReceiptTransaction,
): Receipt {
  const title = getTitle(transaction);
  const blockTime =
    transaction.blockTime === null ? null : Number(transaction.blockTime);

  if (!transaction.meta || transaction.meta.err !== null) {
    return {
      signature,
      status: "failed",
      payer: null,
      title,
      blockTime,
      total: 0n,
      transfers: [],
    };
  }

  const balances = new Map<
    string,
    { owner: string; before: bigint; after: bigint }
  >();
  for (const balance of transaction.meta.preTokenBalances ?? []) {
    if (balance.mint !== USDC_MINT || !balance.owner) continue;
    balances.set(`${balance.accountIndex}:${balance.owner}`, {
      owner: balance.owner,
      before: BigInt(balance.uiTokenAmount.amount),
      after: 0n,
    });
  }
  for (const balance of transaction.meta.postTokenBalances ?? []) {
    if (balance.mint !== USDC_MINT || !balance.owner) continue;
    const key = `${balance.accountIndex}:${balance.owner}`;
    const current = balances.get(key);
    balances.set(key, {
      owner: balance.owner,
      before: current?.before ?? 0n,
      after: BigInt(balance.uiTokenAmount.amount),
    });
  }

  const ownerDeltas = new Map<string, bigint>();
  for (const balance of balances.values()) {
    const delta = balance.after - balance.before;
    ownerDeltas.set(balance.owner, (ownerDeltas.get(balance.owner) ?? 0n) + delta);
  }

  let payer: string | null = null;
  let payerDelta = 0n;
  const transfers: ReceiptTransfer[] = [];
  for (const [owner, delta] of ownerDeltas) {
    if (delta < payerDelta) {
      payer = owner;
      payerDelta = delta;
    }
    if (delta > 0n) transfers.push({ owner, amount: delta });
  }
  const total = transfers.reduce((sum, transfer) => sum + transfer.amount, 0n);

  return {
    signature,
    status: "confirmed",
    payer,
    title,
    blockTime,
    total,
    transfers,
  };
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

export async function readReceipt(
  client: AppClient,
  signatureValue: string,
): Promise<Receipt> {
  let validatedSignature;
  try {
    validatedSignature = parseSignature(signatureValue);
  } catch {
    throw new Error("invalid signature");
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const transaction = await client.rpc
      .getTransaction(validatedSignature, {
        commitment: "confirmed",
        encoding: "jsonParsed",
        maxSupportedTransactionVersion: 1,
      })
      .send();
    if (transaction !== null) {
      return parseReceiptTransaction(
        signatureValue,
        transaction as unknown as ParsedReceiptTransaction,
      );
    }
    if (attempt < 2) await delay((attempt + 1) * 100);
  }

  throw new ReceiptNotFoundError();
}
