# Allot pitch

Updated: 2026-10-07. Initial audience: small freelance production teams, especially a producer, editor, and designer working on one client project.

## One sentence

Allot gives freelance teams one payment link that unlocks only after every recipient accepts the same split.

## Thirty-second pitch

Freelance teams finish the work together, but getting paid often leaves one person collecting the client payment and forwarding everybody else's share.

Allot starts with the agreement. The owner proposes the split. Each recipient accepts, rejects, or asks for a different percentage. The link stays locked until everyone accepts the same version.

Our current Solana Devnet demo sends the approved shares in one test-USDC transaction. Our next payment rail is Pix, so a Brazilian client can pay in reais.

The outcome we are testing: teammates spend less time chasing each other for money.

## Ninety-second pitch

A producer, an editor, and a designer work on one campaign. Before the client pays, somebody has to decide how the money is divided. If the producer proposes 10% to the designer and the designer expects 20%, sending a payment link does not solve their disagreement.

Allot makes the agreement part of the payment workflow. The producer proposes the whole split. Every recipient sees the amount, percentages, and destinations. The designer can reject 10% and request 20%. The owner revises the terms, and everyone approves the new version. Until that happens, the payment link cannot be published.

In our current test-USDC demo, the client signs one transaction that transfers the shares directly. All transfers succeed together or the transaction fails. The public receipt shows transaction status and net wallet balance changes.

For Brazilian clients, our recommended next step is Pix through an established payment provider. That path will settle in reais, require verified recipient accounts, and disclose provider fees before approval. It is planned, not live.

Payment splitting already exists. Our focus is a usable agreement workflow for small freelance teams, with negotiation and approval of each payment version. That focus is a hypothesis to validate with teams; we are not claiming an exclusive payment invention.

We want to test the next project with a team that currently collects the client's payment in one person's account and forwards the shares manually.

## Demo sequence

1. Create a team and invite the editor/designer with a code.
2. Propose a valid split totaling 100%.
3. Designer rejects 10% and requests 20%; publication stays blocked.
4. Owner revises the allocation; the new version has no inherited approvals.
5. Each included recipient accepts their own decision; publish the saved link.
6. Show the client's complete payment review.
7. With a funded Devnet wallet, sign once and reconcile the receipt with Explorer. Do not claim this step was proved if it was not performed.

## Claims we can make

- Owner/member permissions and exact-version unanimous publication are implemented.
- Members can request a different percentage; owners cannot accept for other accounts.
- Approved saved links retain their original terms.
- Current payments use test USDC on Solana Devnet.
- Provider-managed Pix split is a documented next step.

## Claims we cannot make

- Pix is already available, or the app accepts real money.
- Competitors cannot support consent or approvals.
- Allot is cheaper, safer, faster, or legally superior without measured evidence.
- A confirmed blockchain receipt proves team acceptance or wallet ownership.
- No teammate will ever need to chase a late client.
- Real-money pricing, users, traction, revenue, or customer testimonials exist.
- The current demo replaces payroll, contracts, invoices, or tax obligations.

## Pilot proof

Interview five freelance production teams that worked on a shared client project recently. Ask how they agreed on the division, who collected the payment, what needed follow-up, and whether they would complete account onboarding.

Then observe one project agreement end to end. Measure time to unanimous acceptance, revisions, abandoned proposals, receipt reconciliation, and payment follow-ups. A pilot target is not a current metric.

Keep monetization undecided until the pilot establishes willingness to pay and provider costs.
