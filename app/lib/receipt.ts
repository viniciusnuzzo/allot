import { signature as parseSignature } from "@solana/kit";
import { address } from "@solana/kit";
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";

import { USDC_DECIMALS, USDC_MINT } from "./config";
import { parseUsdc, splitAmount } from "./money";
import type { PaymentLink } from "./payment-link";
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
    innerInstructions?: readonly { instructions: readonly ParsedInstructionLike[] }[] | null;
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
  status: "confirmed" | "failed" | "unknown";
  payer: string | null;
  title: string | null;
  agreementShareId: string | null;
  requestId: string | null;
  blockTime: number | null;
  total: bigint;
  transfers: readonly ReceiptTransfer[];
};

export type AgreementTransferCheck = "match" | "mismatch" | "unverifiable";

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

function getMemoDetails(transaction: ParsedReceiptTransaction): { title: string | null; agreementShareId: string | null; requestId: string | null } {
  const prefixes = ["allot:v1:", "fatia:v1:"] as const;
  for (const instruction of transaction.transaction.message.instructions) {
    const isMemo =
      instruction.program === "spl-memo" ||
      instruction.program === "memo" ||
      instruction.programId === "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
    if (!isMemo) continue;

    const memo = parsedMemoValue(instruction.parsed);
    const prefix = prefixes.find((value) => memo?.startsWith(value));
    if (memo?.startsWith("allot:v3:")) {
      const match = /^allot:v3:([0-9a-f-]{36}):([0-9a-f-]{36}):(.+)$/i.exec(memo);
      if (match) return { title: match[3].trim() || null, agreementShareId: match[1].toLowerCase(), requestId: match[2].toLowerCase() };
    }
    if (memo?.startsWith("allot:v2:")) {
      const match = /^allot:v2:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):(.+)$/i.exec(memo);
      if (match) return { title: match[2].trim() || null, agreementShareId: match[1].toLowerCase(), requestId: null };
    }
    if (prefix && memo) {
      const title = memo.slice(prefix.length).trim();
      return { title: title || null, agreementShareId: null, requestId: null };
    }
  }

  return { title: null, agreementShareId: null, requestId: null };
}

export function parseReceiptTransaction(
  signature: string,
  transaction: ParsedReceiptTransaction,
): Receipt {
  const { title, agreementShareId, requestId } = getMemoDetails(transaction);
  const blockTime =
    transaction.blockTime === null ? null : Number(transaction.blockTime);

  if (!transaction.meta || transaction.meta.err !== null) {
    return {
      signature,
      status: transaction.meta === null ? "unknown" : "failed",
      payer: null,
      title,
      agreementShareId,
      requestId,
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
    agreementShareId,
    requestId,
    blockTime,
    total,
    transfers,
  };
}

// Compares the parsed USDC instructions, not just a memo or net balance change.
// This does not establish who controlled a wallet or who accepted an agreement.
export async function checkAgreementTransfers(
  transaction: ParsedReceiptTransaction,
  link: PaymentLink,
): Promise<AgreementTransferCheck> {
  if (!transaction.meta || transaction.meta.err !== null || !transaction.meta.innerInstructions) return "unverifiable";
  const instructions = [
    ...transaction.transaction.message.instructions,
    ...transaction.meta.innerInstructions.flatMap((entry) => entry.instructions),
  ];
  const transfers: { source: string; authority: string; destination: string; amount: bigint }[] = [];
  for (const instruction of instructions) {
    if (instruction.program !== "spl-token" && instruction.programId !== TOKEN_PROGRAM_ADDRESS) continue;
    if (!instruction.parsed || typeof instruction.parsed !== "object" || !("type" in instruction.parsed)) return "unverifiable";
    const parsed = instruction.parsed;
    if (typeof parsed.type !== "string") return "unverifiable";
    if (["initializeAccount", "initializeAccount2", "initializeAccount3", "getAccountDataSize", "initializeImmutableOwner"].includes(parsed.type)) continue;
    if (parsed.type !== "transferChecked" || !("info" in parsed) || !parsed.info || typeof parsed.info !== "object") return "unverifiable";
    const info = parsed.info;
    if (!("mint" in info) || typeof info.mint !== "string") return "unverifiable";
    if (info.mint !== USDC_MINT) continue;
    if (!("tokenAmount" in info) || !info.tokenAmount || typeof info.tokenAmount !== "object" ||
        !("amount" in info.tokenAmount) || typeof info.tokenAmount.amount !== "string" ||
        !("decimals" in info.tokenAmount) || info.tokenAmount.decimals !== USDC_DECIMALS ||
        !("destination" in info) || typeof info.destination !== "string" ||
        !("source" in info) || typeof info.source !== "string" ||
        !("authority" in info) || typeof info.authority !== "string" ||
        !/^\d+$/.test(info.tokenAmount.amount)) return "unverifiable";
    transfers.push({ source: info.source, authority: info.authority, destination: info.destination,
      amount: BigInt(info.tokenAmount.amount) });
  }
  if (transfers.length !== link.recipients.length || new Set(transfers.map((item) => item.source)).size !== 1 ||
      new Set(transfers.map((item) => item.authority)).size !== 1) return "mismatch";
  const total = transfers.reduce((sum, item) => sum + item.amount, 0n);
  let expectedAmounts: bigint[];
  try {
    if (link.amount !== null && parseUsdc(link.amount) !== total) return "mismatch";
    expectedAmounts = splitAmount(total, link.recipients.map((recipient) => recipient.bps));
  } catch { return "mismatch"; }
  const expected = await Promise.all(link.recipients.map(async (recipient, index) => {
    const [destination] = await findAssociatedTokenPda({ owner: address(recipient.address), mint: USDC_MINT,
      tokenProgram: TOKEN_PROGRAM_ADDRESS });
    return `${destination}:${expectedAmounts[index]}`;
  }));
  const actual = transfers.map((item) => `${item.destination}:${item.amount}`);
  expected.sort(); actual.sort();
  return expected.every((value, index) => value === actual[index]) ? "match" : "mismatch";
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

export async function readReceiptDetails(
  client: AppClient,
  signatureValue: string,
): Promise<{ receipt: Receipt; transaction: ParsedReceiptTransaction }> {
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
      const parsed = transaction as unknown as ParsedReceiptTransaction;
      return { receipt: parseReceiptTransaction(signatureValue, parsed), transaction: parsed };
    }
    if (attempt < 2) await delay((attempt + 1) * 100);
  }

  throw new ReceiptNotFoundError();
}

export async function readReceipt(client: AppClient, signatureValue: string): Promise<Receipt> {
  return (await readReceiptDetails(client, signatureValue)).receipt;
}
