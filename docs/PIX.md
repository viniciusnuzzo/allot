# Pix split implementation decision

Research date: 2026-10-07. Status: integration design; no Pix checkout, provider account, or real-money payment is connected to Allot.

## Recommended first path

Use Asaas-hosted Pix checkout with a percentage split between verified recipient accounts. Keep entry and settlement in BRL. Do not introduce Pix-to-USDC conversion in the first release.

Each recipient needs an eligible Asaas account and a verified account-to-member association. A pasted wallet ID is not proof of ownership. Define a provider-supported onboarding/ownership-verification flow before implementing public account linking; do not collect banking passwords or provider API keys from members.

Allot owns the proposal and approval workflow. The provider owns collection, custody where applicable, and distribution. Current non-custodial Solana statements must remain scoped to the crypto demo.

## What changes from the current demo

The current payload is explicitly test USDC, with Solana addresses and six-decimal units. Pix needs a separate BRL proposal, integer centavos, verified provider recipient IDs, issuing-account identity, and fee terms. Do not reuse a previously accepted USDC version as permission for a Pix payment.

Approval must bind currency, gross amount, recipient accounts, percentages, the fee policy, and the exact version. Any change creates a fresh proposal and fresh decisions. The creator must not edit provider splits after acceptance.

Percentages are applied to the provider's net amount after fees. As a purely illustrative calculation, R$1,000 less R$10 in fees leaves R$990; a 50/30/20 split yields R$495/R$297/R$198. R$10 is not an Asaas price quote. Obtain actual contract/account fees before promising amounts.

Agree on whether the fee is shared proportionally or paid by a specific party. The proposed simplest policy is proportional sharing of disclosed provider fees; it is not enabled or accepted by existing users. If fees change beyond the accepted terms, require a new agreement.

## End-to-end flow

1. Finish provider account setup, eligible recipient onboarding, and identity mapping in Sandbox.
2. Save a BRL proposal with at least two eligible recipients, exact 100% allocation, issuing account, fee terms, and a fixed gross amount.
3. Reuse the account-bound approval rule: every included recipient must accept the same immutable version.
4. Reserve one checkout attempt under a database lock and unique proposal key. Read provider recipient IDs and amounts from the saved version, never the browser.
5. Create a hosted Pix checkout server-side. Store returned checkout ID, external reference, environment, and URL.
6. Redirect the client to the provider. A redirect back to Allot is navigation, never payment confirmation.
7. Authenticate provider webhooks with the configured token. Insert event IDs under a unique constraint before applying transitions. Check event environment, stored checkout/payment association, currency, amount, and expected split.
8. Record collection and recipient settlement as separate facts. A paid checkout does not establish every recipient's final payout.
9. Reconcile failures, refunds, blocked splits, expiration, and late or duplicated events. Preserve accepted terms and provider evidence.
10. Show the team gross payment, actual fees, net allocation, and settlement status for each recipient. Do not expose CPF, customer contact details, or private team decisions in public receipts.

Checkout creation can succeed at the provider even if the app times out. Record an uncertain creation state and reconcile using the stored external reference. Do not blindly create another checkout. Provider idempotency support must be verified for this endpoint; do not assume it.

## Sandbox request example

Illustration only. Replace wallet IDs with eligible Sandbox accounts. Never use production credentials for this example.

The issuing account is the approved 50% producer. Do not include its own wallet ID in the split list; it keeps the net remainder. The editor and designer receive 30% and 20%. If the issuing account is not an approved recipient, distribute the full approved allocation instead of assigning it an unapproved remainder.

```http
POST https://api-sandbox.asaas.com/v3/checkouts
access_token: <server-side sandbox API key>
Content-Type: application/json
```

```json
{
  "billingTypes": ["PIX"],
  "chargeTypes": ["DETACHED"],
  "minutesToExpire": 60,
  "externalReference": "allot-sandbox-approved-proposal-id",
  "callback": {
    "successUrl": "https://allot-three.vercel.app",
    "cancelUrl": "https://allot-three.vercel.app",
    "expiredUrl": "https://allot-three.vercel.app"
  },
  "items": [{
    "name": "Freelance campaign — sandbox only",
    "quantity": 1,
    "value": 1000
  }],
  "splits": [
    { "walletId": "<verified editor sandbox wallet ID>", "percentualValue": 30 },
    { "walletId": "<verified designer sandbox wallet ID>", "percentualValue": 20 }
  ]
}
```

This is a provider-format example, not a production endpoint or an authorization mechanism. The callback URLs exist but do not confirm payment or track this checkout.

## Credentials and operational prerequisites

- Provider Sandbox account, API key, and verified recipient accounts.
- Server-only API credentials; never NEXT_PUBLIC variables or client requests.
- Distinct Sandbox/production secrets and webhook tokens.
- Public HTTPS webhook endpoint with authenticated and idempotent processing.
- Provider contract/eligibility, actual fees, limits, KYC/AML responsibilities, refund policy, and data-processing terms reviewed before collecting money.
- SMTP for usable public Allot registration remains a separate pending prerequisite.

## Release checks

- Owner and all recipients approve a BRL proposal. One rejection, counteroffer, removed recipient, or changed fee term blocks checkout creation.
- Wrong or substituted provider wallet IDs cannot redirect approved shares.
- An issuing account receives only its accepted remainder.
- Concurrent requests create one known checkout; timeout/retry does not create an untracked duplicate.
- Forged, replayed, duplicated, and out-of-order webhooks do not mark a payment paid or double-distribute.
- Collection, net fee calculation, each payout, expiration, refund, and blocked split reconcile with provider evidence.
- No status or marketing copy promises blockchain-style all-or-nothing Pix settlement.
- Real funds stay disabled until Sandbox evidence, provider setup, and founder approval are complete.

## Primary documentation

- [Asaas hosted checkout](https://docs.asaas.com/docs/asaas-checkout).
- [Pix checkout with split](https://docs.asaas.com/docs/checkout-com-split-de-pagamento).
- [Split rules and net value](https://docs.asaas.com/docs/split-de-pagamentos).
- [Checkout API reference](https://docs.asaas.com/reference/create-new-checkout).
- [Checkout events](https://docs.asaas.com/docs/eventos-para-checkout).
- [Webhook event authentication and processing](https://docs.asaas.com/docs/webhooks-events).
