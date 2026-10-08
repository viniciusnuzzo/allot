import { beforeEach, describe, expect, it, vi } from "vitest";

import { readReceipt, ReceiptNotFoundError } from "@/app/lib/receipt";
import { GET } from "./route";

vi.mock("@/app/lib/receipt", async (original) => {
  const actual = await original<typeof import("@/app/lib/receipt")>();
  return { ...actual, readReceipt: vi.fn() };
});
vi.mock("@/app/lib/solana-client", () => ({ client: {} }));

const context = { params: Promise.resolve({ signature: "5".repeat(88) }) } as RouteContext<"/api/receipts/[signature]">;

describe("public receipt API", () => {
  beforeEach(() => vi.resetAllMocks());

  it("serializes exact base units without losing bigint precision", async () => {
    vi.mocked(readReceipt).mockResolvedValue({
      signature: "5".repeat(88), status: "confirmed", payer: null, title: null,
      agreementShareId: null, blockTime: null, total: 9_007_199_254_740_993n,
      transfers: [{ owner: "wallet", amount: 9_007_199_254_740_993n }],
    });
    const response = await GET(new Request("http://localhost/api/receipts/5"), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      totalUnits: "9007199254740993", transfers: [{ amountUnits: "9007199254740993" }],
    });
  });

  it("does not call a missing transaction confirmed", async () => {
    vi.mocked(readReceipt).mockRejectedValue(new ReceiptNotFoundError());
    const response = await GET(new Request("http://localhost/api/receipts/5"), context);
    expect(response.status).toBe(404);
  });
});
