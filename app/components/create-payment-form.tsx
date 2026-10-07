"use client";

import { useRef, useState } from "react";

import { paymentLinkSchema, type PaymentLink } from "../lib/payment-link";
import type { Member, Split } from "../lib/teams";
import { AddressField } from "./address-field";
import { PieSplit, PIE_COLORS } from "./pie-split";

type DraftRecipient = {
  id: number;
  name: string;
  address: string;
  bps: number;
  userId: string;
};

function equalShares(count: number): number[] {
  const base = Math.floor(10_000 / count);
  const shares = Array.from({ length: count }, () => base);
  shares[0] += 10_000 - base * count;
  return shares;
}

function newRecipient(id: number, bps: number, member?: Member): DraftRecipient {
  return { id, name: member?.name ?? "", address: "", bps, userId: member?.user_id ?? "" };
}

export function CreatePaymentForm({ members, initial, onSubmit }: { members: Member[]; initial?: Split; onSubmit: (payload: PaymentLink, ids: string[]) => Promise<void> }) {
  const nextId = useRef(6);
  const [title, setTitle] = useState(initial?.payload.title ?? "");
  const [amount, setAmount] = useState(initial?.payload.amount ?? "");
  const [recipients, setRecipients] = useState<DraftRecipient[]>(initial
    ? initial.payload.recipients.map((recipient, index) => ({ ...recipient, id: index + 1, userId: initial.recipient_ids[index] }))
    : [newRecipient(1, 5_000, members[0]), newRecipient(2, 5_000, members[1])]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const totalBps = recipients.reduce((sum, recipient) => sum + recipient.bps, 0);
  const difference = 10_000 - totalBps;

  function invalidate() {
    setError(null);
  }

  function updateRecipient(
    id: number,
    field: "name" | "address" | "bps",
    value: string | number,
  ) {
    invalidate();
    setRecipients((current) =>
      current.map((recipient) =>
        recipient.id === id ? { ...recipient, [field]: value } : recipient,
      ),
    );
  }

  function divideEqually() {
    invalidate();
    const shares = equalShares(recipients.length);
    setRecipients((current) =>
      current.map((recipient, index) => ({ ...recipient, bps: shares[index] })),
    );
  }

  function addRecipient() {
    if (recipients.length >= 5) return;
    invalidate();
    const shares = equalShares(recipients.length + 1);
    setRecipients((current) => [
      ...current.map((recipient, index) => ({ ...recipient, bps: shares[index] })),
      newRecipient(nextId.current++, shares.at(-1) ?? 0, members.find((member) => !current.some((recipient) => recipient.userId === member.user_id))),
    ]);
  }

  function removeRecipient(id: number) {
    if (recipients.length <= 2) return;
    invalidate();
    const next = recipients.filter((recipient) => recipient.id !== id);
    const shares = equalShares(next.length);
    setRecipients(
      next.map((recipient, index) => ({ ...recipient, bps: shares[index] })),
    );
  }

  async function generateLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = paymentLinkSchema.safeParse({
      v: 1,
      title,
      amount: amount.trim() || null,
      recipients: recipients.map(({ name, address, bps }) => ({
        name,
        address: address.trim(),
        bps,
      })),
    });

    if (!result.success) {
      const issue = result.error.issues[0];
      setError(issue?.message || "Review the details before creating the link.");
      return;
    }

    setBusy(true); setError(null);
    try {
      await onSubmit(result.data, recipients.map((recipient) => recipient.userId));
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Could not submit this split."); }
    finally { setBusy(false); }
  }

  return (
    <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <form onSubmit={generateLink} className="surface-panel space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label sm:col-span-2">
            Payment title
            <input
              required
              value={title}
              maxLength={60}
              onChange={(event) => {
                invalidate();
                setTitle(event.target.value);
              }}
              placeholder="e.g. Saturday dinner"
              className="field-input"
            />
          </label>
          <label className="field-label">
            Amount in USDC <span className="text-muted">(optional)</span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(event) => {
                invalidate();
                setAmount(event.target.value);
              }}
              placeholder="e.g. 120.00"
              className="field-input"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Who gets paid</h2>
            <p
              className={`mt-1 text-sm font-semibold ${difference === 0 ? "text-success" : "text-danger"}`}
            >
              {difference === 0
                ? "Adds up to 100%."
                : difference > 0
                  ? `${(difference / 100).toFixed(2)}% remaining`
                  : `${(Math.abs(difference) / 100).toFixed(2)}% over`}
            </p>
          </div>
          <button
            type="button"
            onClick={divideEqually}
            className="button-secondary text-sm"
          >
            Split equally
          </button>
        </div>

        <div className="grid gap-4">
          {recipients.map((recipient, index) => (
            <div key={recipient.id} className="space-y-3">
            <label className="field-label">Team member
              <select required className="field-input" value={recipient.userId} onChange={(event) => {
                invalidate();
                const member = members.find((value) => value.user_id === event.target.value);
                setRecipients((current) => current.map((value) => value.id === recipient.id ? { ...value, userId: member?.user_id ?? "", name: member?.name ?? "", address: "" } : value));
              }}>
                <option value="">Choose a member</option>
                {members.map((member) => <option key={member.user_id} value={member.user_id} disabled={recipients.some((value) => value.id !== recipient.id && value.userId === member.user_id)}>{member.name} · {member.user_id.slice(0, 6)}</option>)}
              </select>
            </label>
            <AddressField
              key={recipient.id}
              index={index}
              name={recipient.name}
              address={recipient.address}
              bps={recipient.bps}
              canRemove={recipients.length > 2}
              onChange={(field, value) =>
                updateRecipient(recipient.id, field, value)
              }
              onRemove={() => removeRecipient(recipient.id)}
            />
            </div>
          ))}
        </div>

        {recipients.length < 5 ? (
          <button
            type="button"
            onClick={addRecipient}
            className="button-secondary text-sm"
          >
            + Add person
          </button>
        ) : null}

        {error ? (
          <p role="alert" className="notice-error">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="button-primary w-full"
          disabled={busy || members.length < 2}
        >
          {busy ? "Submitting…" : initial ? "Submit revised split" : "Send split for approval"}
        </button>
        <p className="text-sm text-muted">Every recipient must accept this version before a payment link can be generated. Any revision requires everyone to approve again.</p>
      </form>

      <aside className="preview-panel h-fit lg:sticky lg:top-8">
        <p className="text-sm font-semibold">Split preview</p>
        <PieSplit
          bps={recipients.map((recipient) => Math.max(0, recipient.bps))}
          labels={recipients.map((recipient) => recipient.name)}
          className="mx-auto mt-6 h-48 w-48 max-w-full"
        />
        <ul className="mt-6 grid gap-3 text-sm">
          {recipients.map((recipient, index) => (
            <li key={recipient.id} className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate">
                <span
                  aria-hidden="true"
                  className="slice-dot"
                  style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                />
                {recipient.name || `Person ${index + 1}`}
              </span>
              <span className="text-muted tabular shrink-0 font-mono">
                {(recipient.bps / 100).toFixed(2)}%
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
