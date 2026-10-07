import { getAddMemoInstruction } from "@solana-program/memo";
import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstructionAsync,
  getTransferCheckedInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import type { Address, Instruction, TransactionSigner } from "@solana/kit";

import { USDC_DECIMALS } from "./config";
import type { AppClient } from "./solana-client";

export type SplitRecipient = {
  address: Address;
  amount: bigint;
};

export type BuildSplitInstructionsInput = {
  rpc: AppClient["rpc"];
  payer: TransactionSigner;
  mint: Address;
  recipients: readonly SplitRecipient[];
  title: string;
};

export type SendSplitPaymentInput = Omit<BuildSplitInstructionsInput, "rpc">;

export class SplitPaymentError extends Error {
  readonly signature?: string;

  constructor(message: string, signature?: string, cause?: unknown) {
    super(message, { cause });
    this.name = "SplitPaymentError";
    this.signature = signature;
  }
}

function sanitizeMemoTitle(title: string): string {
  const sanitized = title
    .replace(/[\u0000-\u001f\u007f]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, 60);
  if (!sanitized) throw new Error("payment title is empty");
  return sanitized;
}

function validateRecipients(recipients: readonly SplitRecipient[]) {
  if (recipients.length < 2 || recipients.length > 5) {
    throw new Error("split must have 2 to 5 recipients");
  }
  if (recipients.some((recipient) => recipient.amount <= 0n)) {
    throw new Error("recipient amounts must be positive");
  }
  const uniqueAddresses = new Set(recipients.map((recipient) => recipient.address));
  if (uniqueAddresses.size !== recipients.length) {
    throw new Error("recipient addresses must be unique");
  }
}

export async function buildSplitInstructions({
  rpc,
  payer,
  mint,
  recipients,
  title,
}: BuildSplitInstructionsInput): Promise<readonly Instruction[]> {
  validateRecipients(recipients);
  const memoTitle = sanitizeMemoTitle(title);

  const [[sourceAta], destinationAtas] = await Promise.all([
    findAssociatedTokenPda({
      owner: payer.address,
      mint,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    }),
    Promise.all(
      recipients.map(async (recipient) => {
        const [ata] = await findAssociatedTokenPda({
          owner: recipient.address,
          mint,
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
        });
        return ata;
      }),
    ),
  ]);

  const accounts = await rpc
    .getMultipleAccounts(destinationAtas, {
      commitment: "confirmed",
      encoding: "base64",
    })
    .send();

  const instructions: Instruction[] = [];
  for (const [index, recipient] of recipients.entries()) {
    const destination = destinationAtas[index];
    if (accounts.value[index] === null) {
      instructions.push(
        await getCreateAssociatedTokenIdempotentInstructionAsync({
          payer,
          ata: destination,
          owner: recipient.address,
          mint,
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
        }),
      );
    }

    instructions.push(
      getTransferCheckedInstruction({
        source: sourceAta,
        mint,
        destination,
        authority: payer,
        amount: recipient.amount,
        decimals: USDC_DECIMALS,
      }),
    );
  }

  instructions.push(getAddMemoInstruction({ memo: `allot:v1:${memoTitle}` }));
  return instructions;
}

function getKnownSignature(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("signature" in error && typeof error.signature === "string") {
    return error.signature;
  }
  if (
    "context" in error &&
    error.context &&
    typeof error.context === "object" &&
    "signature" in error.context &&
    typeof error.context.signature === "string"
  ) {
    return error.context.signature;
  }
  if ("context" in error && error.context && typeof error.context === "object") {
    const plan = "transactionPlanResult" in error.context
      ? error.context.transactionPlanResult
      : undefined;
    if (plan && typeof plan === "object" && "context" in plan) {
      const planContext = plan.context;
      if (planContext && typeof planContext === "object" &&
          "signature" in planContext && typeof planContext.signature === "string") {
        return planContext.signature;
      }
    }
  }
  return undefined;
}

function isWalletCancellation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? error.code : undefined;
  const name = "name" in error ? String(error.name) : "";
  const message = "message" in error ? String(error.message) : "";
  return (
    code === 4001 ||
    name === "AbortError" ||
    /cancel|declin|denied|reject|recus/iu.test(message)
  );
}

export async function sendSplitPayment(
  client: AppClient,
  input: SendSplitPaymentInput,
): Promise<string> {
  try {
    const instructions = await buildSplitInstructions({
      ...input,
      rpc: client.rpc,
    });
    const result = await client.sendTransaction(instructions);
    return result.context.signature;
  } catch (error) {
    const signature = getKnownSignature(error);
    const message = isWalletCancellation(error)
      ? "Payment canceled in the wallet."
      : "Could not confirm payment on Devnet.";
    throw new SplitPaymentError(message, signature, error);
  }
}
