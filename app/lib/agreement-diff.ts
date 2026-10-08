import type { Split } from "./teams";

export function agreementChanges(previous: Split, current: Split): string[] {
  const changes: string[] = [];
  if (previous.payload.title !== current.payload.title) changes.push("Project title changed");
  if (previous.payload.amount !== current.payload.amount) changes.push("Payment amount changed");
  const oldRecipients = new Map(previous.recipient_ids.map((id, index) => [id, previous.payload.recipients[index]]));
  const newRecipients = new Set(current.recipient_ids);
  for (const [index, id] of current.recipient_ids.entries()) {
    const recipient = current.payload.recipients[index];
    const old = oldRecipients.get(id);
    if (!old) changes.push(`${recipient.name || `Recipient ${index + 1}`} added`);
    else {
      if (old.bps !== recipient.bps) changes.push(`${recipient.name || `Recipient ${index + 1}`}: ${(old.bps / 100).toFixed(2)}% → ${(recipient.bps / 100).toFixed(2)}%`);
      if (old.address !== recipient.address) changes.push(`${recipient.name || `Recipient ${index + 1}`}: wallet address changed`);
    }
  }
  for (const [id, old] of oldRecipients) {
    if (!newRecipients.has(id)) changes.push(`${old.name || "A recipient"} removed`);
  }
  return changes;
}
