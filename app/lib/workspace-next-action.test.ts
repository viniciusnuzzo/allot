import { describe, expect, it } from "vitest";
import { workspaceNextAction } from "./workspace-next-action";

const base = { owner: true, memberIds: ["owner"], pendingRecipientIds: null, acceptedRecipientIds: [], respondedRecipientIds: [], currentUserId: "owner", hasPublished: false };

describe("workspaceNextAction", () => {
  it("guides a new owner from invitation to a proposal", () => {
    expect(workspaceNextAction(base).href).toBe("#members-title");
    expect(workspaceNextAction({ ...base, memberIds: ["owner", "member"] }).href).toBe("#editor-title");
  });

  it("requires every current recipient to approve before publishing", () => {
    const pending = { ...base, memberIds: ["owner", "a", "b"], pendingRecipientIds: ["a", "b"] };
    expect(workspaceNextAction({ ...pending, acceptedRecipientIds: ["a"] }).title).toBe("Agreement in review");
    expect(workspaceNextAction({ ...pending, acceptedRecipientIds: ["a", "b"] }).title).toBe("Every share is approved");
    expect(workspaceNextAction({ ...pending, memberIds: ["owner", "a"], acceptedRecipientIds: ["a", "b"] }).title).toBe("Revise this split");
  });

  it("sends a recipient to their decision and an owner to the published link", () => {
    expect(workspaceNextAction({ ...base, owner: false, memberIds: ["owner", "a"], currentUserId: "a", pendingRecipientIds: ["a"] }).href).toBe("#approval-title");
    expect(workspaceNextAction({ ...base, owner: false, memberIds: ["owner", "a"], currentUserId: "a", pendingRecipientIds: ["a"], respondedRecipientIds: ["a"] }).href).toBe("");
    expect(workspaceNextAction({ ...base, memberIds: ["owner", "a"], hasPublished: true }).href).toBe("#history-title");
  });
});
