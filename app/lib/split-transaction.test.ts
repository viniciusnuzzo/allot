import {
  ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
  findAssociatedTokenPda,
  parseCreateAssociatedTokenIdempotentInstruction,
  parseTransferCheckedInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import { parseAddMemoInstruction as parseMemoInstruction } from "@solana-program/memo";
import {
  address,
  appendTransactionMessageInstructions,
  blockhash,
  compileTransaction,
  createNoopSigner,
  createTransactionMessage,
  fillTransactionMessageProvisoryResourceLimits,
  getBase64EncodedWireTransaction,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  type Address,
  type Instruction,
  type TransactionSigner,
} from "@solana/kit";
import { describe, expect, it, vi } from "vitest";

import { USDC_MINT } from "./config";
import type { AppClient } from "./solana-client";
import {
  buildSplitInstructions,
  sendSplitPayment,
  SplitPaymentError,
} from "./split-transaction";

const PAYER = address("ComputeBudget111111111111111111111111111111");
const RECIPIENT_A = address("11111111111111111111111111111111");
const RECIPIENT_B = address("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
const SIGNATURE = "3".repeat(88);
const RECIPIENT_C = address("AddressLookupTab1e1111111111111111111111111");
const RECIPIENT_D = address("Ed25519SigVerify111111111111111111111111111");
const RECIPIENT_E = address("KeccakSecp256k11111111111111111111111111111");
const TEST_BLOCKHASH = blockhash("11111111111111111111111111111111");

function mockRpc(values: readonly (object | null)[]) {
  const send = vi.fn().mockResolvedValue({ value: values });
  const getMultipleAccounts = vi.fn(() => ({ send }));
  return {
    getMultipleAccounts,
    rpc: { getMultipleAccounts } as unknown as AppClient["rpc"],
    send,
  };
}

const recipients = [
  { address: RECIPIENT_A, amount: 600_000n },
  { address: RECIPIENT_B, amount: 400_000n },
] as const;

function wireSize(instructions: readonly Instruction[], payer: TransactionSigner) {
  const message = pipe(
    createTransactionMessage({ version: 1 }),
    (transaction) => setTransactionMessageFeePayerSigner(payer, transaction),
    (transaction) => fillTransactionMessageProvisoryResourceLimits(transaction),
    (transaction) =>
      setTransactionMessageLifetimeUsingBlockhash(
        { blockhash: TEST_BLOCKHASH, lastValidBlockHeight: 100n },
        transaction,
      ),
    (transaction) => appendTransactionMessageInstructions(instructions, transaction),
  );
  const encoded = getBase64EncodedWireTransaction(compileTransaction(message));
  return Buffer.from(encoded, "base64").byteLength;
}

describe("buildSplitInstructions", () => {
  it("builds missing ATAs, two checked transfers, and one final sanitized memo", async () => {
    const { getMultipleAccounts, rpc, send } = mockRpc([{}, null]);
    const payer = createNoopSigner(PAYER);

    const instructions = await buildSplitInstructions({
      rpc,
      payer,
      mint: USDC_MINT,
      recipients,
      title: "  Café\n   coletivo  ",
    });

    expect(getMultipleAccounts).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledOnce();
    expect(instructions.map((instruction) => instruction.programAddress)).toEqual([
      TOKEN_PROGRAM_ADDRESS,
      ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
      TOKEN_PROGRAM_ADDRESS,
      instructions.at(-1)?.programAddress,
    ]);

    const transferInstructions = instructions.filter(
      (instruction) => instruction.programAddress === TOKEN_PROGRAM_ADDRESS,
    );
    expect(transferInstructions).toHaveLength(2);
    const transfers = transferInstructions.map((instruction) =>
      parseTransferCheckedInstruction(
        instruction as Parameters<typeof parseTransferCheckedInstruction>[0],
      ),
    );
    expect(transfers.map((transfer) => transfer.data.amount)).toEqual([
      600_000n,
      400_000n,
    ]);
    expect(transfers.map((transfer) => transfer.data.decimals)).toEqual([6, 6]);

    const createInstruction = instructions.find(
      (instruction) => instruction.programAddress === ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
    );
    expect(createInstruction).toBeDefined();
    const create = parseCreateAssociatedTokenIdempotentInstruction(
      createInstruction as Parameters<
        typeof parseCreateAssociatedTokenIdempotentInstruction
      >[0],
    );
    const [recipientBAta] = await findAssociatedTokenPda({
      mint: USDC_MINT,
      owner: RECIPIENT_B,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });
    expect(create.accounts.ata.address).toBe(recipientBAta);

    const memo = parseMemoInstruction(
      instructions.at(-1) as Parameters<typeof parseMemoInstruction>[0],
    );
    expect(memo.data.memo).toBe("allot:v1:Café coletivo");
  });

  it.each([
    [
      "duplicate recipients",
      [
        { address: RECIPIENT_A, amount: 500_000n },
        { address: RECIPIENT_A, amount: 500_000n },
      ],
    ],
    [
      "zero amount",
      [
        { address: RECIPIENT_A, amount: 1_000_000n },
        { address: RECIPIENT_B, amount: 0n },
      ],
    ],
  ] satisfies ReadonlyArray<[string, ReadonlyArray<{ address: Address; amount: bigint }>]>) (
    "rejects %s before RPC use",
    async (_label, invalidRecipients) => {
      const { getMultipleAccounts, rpc } = mockRpc([]);

      await expect(
        buildSplitInstructions({
          rpc,
          payer: createNoopSigner(PAYER),
          mint: USDC_MINT,
          recipients: invalidRecipients,
          title: "Teste",
        }),
      ).rejects.toThrow();
      expect(getMultipleAccounts).not.toHaveBeenCalled();
    },
  );

  it("keeps the worst-case five-recipient transaction within the wire limit", async () => {
    const payer = createNoopSigner(PAYER);
    const { rpc } = mockRpc([null, null, null, null, null]);
    const fiveRecipients = [
      RECIPIENT_A,
      RECIPIENT_B,
      RECIPIENT_C,
      RECIPIENT_D,
      RECIPIENT_E,
    ].map((recipientAddress) => ({ address: recipientAddress, amount: 200_000n }));

    const instructions = await buildSplitInstructions({
      rpc,
      payer,
      mint: USDC_MINT,
      recipients: fiveRecipients,
      title: "€".repeat(60),
      agreementShareId: "11111111-1111-4111-8111-111111111111",
    });

    expect(wireSize(instructions, payer)).toBeLessThanOrEqual(4_096);
  });

  it("puts the approved link reference in the memo without changing transfers", async () => {
    const { rpc } = mockRpc([{}, {}]);
    const instructions = await buildSplitInstructions({
      rpc, payer: createNoopSigner(PAYER), mint: USDC_MINT, recipients,
      title: "Campaign", agreementShareId: "11111111-1111-4111-8111-111111111111",
    });
    const memo = parseMemoInstruction(instructions.at(-1) as Parameters<typeof parseMemoInstruction>[0]);
    expect(memo.data.memo).toBe("allot:v2:11111111-1111-4111-8111-111111111111:Campaign");
    expect(instructions.filter((instruction) => instruction.programAddress === TOKEN_PROGRAM_ADDRESS)).toHaveLength(2);
  });
});

describe("sendSplitPayment", () => {
  it("sends the complete list once and returns the signature", async () => {
    const { rpc } = mockRpc([{}, {}]);
    const sendTransaction = vi.fn().mockResolvedValue({
      context: { signature: SIGNATURE },
      status: "successful",
    });
    const client = { rpc, sendTransaction } as unknown as AppClient;

    await expect(
      sendSplitPayment(client, {
        payer: createNoopSigner(PAYER),
        mint: USDC_MINT,
        recipients,
        title: "Teste",
      }),
    ).resolves.toBe(SIGNATURE);
    expect(sendTransaction).toHaveBeenCalledOnce();
  });

  it("normalizes cancellation and preserves a known signature", async () => {
    const { rpc } = mockRpc([{}, {}]);
    const rejected = Object.assign(new Error("User rejected the request"), {
      code: 4001,
      signature: SIGNATURE,
    });
    const client = {
      rpc,
      sendTransaction: vi.fn().mockRejectedValue(rejected),
    } as unknown as AppClient;

    const result = sendSplitPayment(client, {
      payer: createNoopSigner(PAYER),
      mint: USDC_MINT,
      recipients,
      title: "Teste",
    });

    await expect(result).rejects.toMatchObject<Partial<SplitPaymentError>>({
      message: "Payment canceled in the wallet.",
      signature: SIGNATURE,
    });
  });

  it("preserves a signature nested in the Solana transaction-plan failure", async () => {
    const { rpc } = mockRpc([{}, {}]);
    const rejected = Object.assign(new Error("Failed to send transaction"), {
      context: {
        transactionPlanResult: {
          kind: "single",
          status: "failed",
          context: { signature: SIGNATURE },
        },
      },
    });
    const client = {
      rpc,
      sendTransaction: vi.fn().mockRejectedValue(rejected),
    } as unknown as AppClient;

    await expect(sendSplitPayment(client, {
      payer: createNoopSigner(PAYER),
      mint: USDC_MINT,
      recipients,
      title: "Teste",
    })).rejects.toMatchObject<Partial<SplitPaymentError>>({ signature: SIGNATURE });
  });
});
