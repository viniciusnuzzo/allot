import { expect, it } from "vitest";
import { accountReturnPath, authInput, teamInput } from "./account-validation";

it("rejects unsafe redirects, weak signup passwords, and unbounded invitation/decision inputs", () => {
  for (const value of ["https://evil.example", "//evil.example", "/\\evil.example", "/teams/../evil", "/join?code=x&next=https://evil.example"]) expect(accountReturnPath(value)).toBe("/teams");
  const code = "a".repeat(32);
  expect(accountReturnPath(`/join?code=${code}`)).toBe(`/join?code=${code}`);
  expect(authInput.safeParse({ action: "signup", name: "Member", email: "user@example.test", password: "short" }).success).toBe(false);
  expect(teamInput.safeParse({ action: "join", code: "guess" }).success).toBe(false);
  expect(teamInput.safeParse({ action: "join", code }).success).toBe(true);
  const input = { action: "decide", team: "00000000-0000-4000-8000-000000000001", split: "00000000-0000-4000-8000-000000000002", decision: "countered" };
  expect(teamInput.safeParse(input).success).toBe(false);
  expect(teamInput.safeParse({ ...input, requested_bps: 2000 }).success).toBe(true);
  expect(teamInput.safeParse({ ...input, requested_bps: 10001 }).success).toBe(false);
});
