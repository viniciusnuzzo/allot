import { NextResponse } from "next/server";

import { readReceipt, ReceiptNotFoundError } from "@/app/lib/receipt";
import { client } from "@/app/lib/solana-client";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/receipts/[signature]">,
) {
  const { signature } = await params;
  try {
    const receipt = await readReceipt(client, signature);
    return NextResponse.json({
      ...receipt,
      totalUnits: receipt.total.toString(),
      transfers: receipt.transfers.map((transfer) => ({ owner: transfer.owner, amountUnits: transfer.amount.toString() })),
      total: undefined,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const invalid = error instanceof Error && error.message === "invalid signature";
    return NextResponse.json(
      { error: invalid ? "Invalid signature." : error instanceof ReceiptNotFoundError ? "Transaction not found." : "Devnet unavailable." },
      { status: invalid ? 400 : error instanceof ReceiptNotFoundError ? 404 : 503 },
    );
  }
}
