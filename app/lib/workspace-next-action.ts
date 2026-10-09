type WorkspaceState = {
  owner: boolean;
  memberIds: string[];
  pendingRecipientIds: string[] | null;
  acceptedRecipientIds: string[];
  respondedRecipientIds: string[];
  currentUserId: string;
  hasPublished: boolean;
};

export function workspaceNextAction(state: WorkspaceState) {
  const { owner, memberIds, pendingRecipientIds, acceptedRecipientIds, respondedRecipientIds, currentUserId, hasPublished } = state;
  if (!owner) {
    if (pendingRecipientIds?.includes(currentUserId) && !respondedRecipientIds.includes(currentUserId))
      return { step: "YOUR TURN", title: "Review your share", description: "Check the wallet address and percentage before you accept, reject, or request a change.", href: "#approval-title", action: "Review agreement" };
    return { step: "UP TO DATE", title: "Nothing to review yet", description: pendingRecipientIds ? "Your response is recorded. Watch for a revised agreement or an approved payment link." : "The team owner will send you an agreement to review.", href: "", action: "" };
  }
  if (memberIds.length < 2)
    return { step: "01 / 03 · BUILD THE TEAM", title: "Bring your teammate in", description: "Create an invitation and share its link. You can propose a split after another person joins.", href: "#members-title", action: "Invite a teammate" };
  if (pendingRecipientIds) {
    if (pendingRecipientIds.some((id) => !memberIds.includes(id)))
      return { step: "02 / 03 · AGREEMENT", title: "Revise this split", description: "A recipient left the team. Update the agreement before it can be published.", href: "#approval-title", action: "Review agreement" };
    if (pendingRecipientIds.every((id) => acceptedRecipientIds.includes(id)))
      return { step: "02 / 03 · AGREEMENT", title: "Every share is approved", description: "Generate the payment link. A payer will still sign in their own wallet on Solana Devnet.", href: "#approval-title", action: "Generate payment link" };
    return { step: "02 / 03 · AGREEMENT", title: "Agreement in review", description: `${acceptedRecipientIds.length} of ${pendingRecipientIds.length} recipients accepted this version. Review responses and revise the split if needed.`, href: "#approval-title", action: "View agreement" };
  }
  if (hasPublished)
    return { step: "03 / 03 · PAYMENT", title: "The agreement is ready to share", description: "Send the approved link to the payer. Payment needs their wallet signature and a separate Devnet receipt.", href: "#history-title", action: "View payment link" };
  return { step: "02 / 03 · AGREEMENT", title: "Put the split in writing", description: "Set each recipient's wallet and percentage, then send the proposal for approval.", href: "#editor-title", action: "Propose a split" };
}
