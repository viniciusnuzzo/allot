import { describe, expect, it } from "vitest";

import { agreementChanges } from "./agreement-diff";
import type { Split } from "./teams";

const first = {
  id: "first", team_id: "team", state: "superseded", share_id: null, created_at: "2026-10-07",
  recipient_ids: ["a", "b"],
  payload: { v: 1, title: "Campaign", amount: "100.00", recipients: [
    { name: "Ana", address: "11111111111111111111111111111111", bps: 5000 },
    { name: "Bia", address: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr", bps: 5000 },
  ] },
} as Split;

describe("agreementChanges", () => {
  it("tracks who changed even when recipient order changes", () => {
    const current: Split = { ...first, id: "second", recipient_ids: ["b", "a"], payload: {
      ...first.payload, recipients: [
        { ...first.payload.recipients[1], bps: 6000 },
        { ...first.payload.recipients[0], bps: 4000 },
      ],
    } };
    expect(agreementChanges(first, current)).toEqual(["Bia: 50.00% → 60.00%", "Ana: 50.00% → 40.00%"]);
  });

  it("shows changed wallet addresses", () => {
    const current: Split = { ...first, payload: { ...first.payload, recipients: [
      { ...first.payload.recipients[0], address: "ComputeBudget111111111111111111111111111111" },
      first.payload.recipients[1],
    ] } };
    expect(agreementChanges(first, current)).toContain("Ana: wallet address changed");
  });
});
