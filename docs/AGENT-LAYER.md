# Allot agent layer — policy and payment requests deployed

The agent can propose agreements and request payment of an approved fixed-amount agreement. It never receives a wallet key. The team owner configures a test-USDC budget, per-payment maximum, human-review threshold, recipient allowlist, and expiry. A request atomically reserves policy budget and uses an idempotency key. Requests above the threshold require owner approval. Changing the policy or revoking the credential expires open requests. Every payment still requires a browser-wallet signature.

## Database status

All six agent migrations through `db/agent-payment-requests.sql` were applied to the Allot Supabase project. The payment-policy migration passed a rollback-first compile check and an isolated database flow covering reservation, idempotency, owner approval, and signing-link release. No secret should be pasted into chat, committed, or included in a video.

The Allot 2.0 migrations `db/agent-draft-submission.sql` and `db/agent-dashboard-state.sql` are installed. Owner submission links an agent draft to the resulting agreement version, hides submitted drafts from the review list, rejects repeated submission and a superseded base agreement, and records an activity event. The owner dashboard reads exact active-credential, budget-commitment, confirmed-payment, and pending-review totals from the database.

`db/agent-activity.sql` is installed. Activity now includes policy changes, payment requests, owner decisions, and confirmed matching receipts.

`db/decision-audit.sql` records future acceptance, rejection, and counterproposal changes. Earlier overwritten decisions cannot be reconstructed.

`db/projects.sql` adds planning projects and subprojects with test-USDC budgets. `db/agent-projects.sql` adds project drafts suggested by an agent and accepted or rejected by the owner. The budgets do **not** reserve funds, constrain payments, or authorize agents to spend.

## API contract

`POST /api/agent` takes `Authorization: Bearer <team credential>` and JSON:

```json
{"action":"get_agreement","team":"<team UUID>","agreementId":"<split UUID>"}
```

`create_agreement` takes `team`, a normal payment-link `payload`, and `recipientIds` matching the recipient order. It returns a **draft ID**, not a published agreement. `propose_change` takes those fields plus `agreementId` as the base version. `request_approval` records a request for owner review; it does not submit or approve the draft. The owner must review and submit the draft; that submission creates a new version and resets prior approvals. Direct calls to `approve_agreement` and `execute_payment` are rejected. Human approval remains the existing authenticated `/api/teams` action, and payment remains wallet-signed in `/pagar`.

`create_project` takes `team`, optional `parent`, a title and optional test-USDC `budget`. It returns a draft requiring explicit owner acceptance. The owner can also create a project directly. A child planning budget cannot make the sum of its siblings exceed the parent budget. These numbers are not spending controls.

`request_payment` takes `team`, an approved `agreementId`, and a caller-generated `idempotencyKey`. The stored policy checks the fixed amount, remaining budget, transaction limit, recipient allowlist, and expiry. `get_payment_request` returns the request status. A signing URL appears only after policy authorization and any required owner review. A matching confirmed Devnet receipt consumes budget permanently; unconfirmed reservations expire after at most 24 hours.

Agent-requested payments write an `allot:v3` memo containing the immutable published-share ID and payment-request ID. The payer's transaction signature therefore binds the transfer to both references. Confirmation rejects a receipt whose memo or parsed USDC instructions do not match.

`POST /api/agent/token` creates a token for the signed-in team owner; `DELETE /api/agent/token` revokes all tokens for that team. Both require same-origin requests. There is no API for an agent to create credentials.

## Local MCP adapter

Run `npm run mcp` with `ALLOT_API_BASE_URL` and `ALLOT_AGENT_TOKEN` set in the local process environment. The token comes from the team owner's screen. The stdio server also exposes `request_payment` and `get_payment_request`. It delegates authorization to `/api/agent`; no private key is used. Do not put the token in a committed client config.

## Not yet implemented

- No automatic signing, private-key custody, autonomous supplier selection, hosted MCP endpoint, or x402 fee.
- A payer can bypass an agent request by opening the original approved share link. The policy governs agent-created requests, not every public payment-link use.
- Receipt confirmation requires the signed-in team owner. If another payer signs, the transfer succeeds but the owner must reconcile it before the policy records it as confirmed.
- Database logic was exercised with rollback fixtures, and the app is deployed. The browser flow still needs real accounts and a funded Devnet wallet.

## Product sequence

People use agreements first. Agents may later propose through the same contract. Only after real usage justifies it should Allot add constrained execution, MCP as a thin adapter, then machine-to-machine billing. Pix remains a future payment rail, not a feature of this API.

## Research choice

AP2 uses signed mandates to bind user authority to exact purchase terms. Solana's current agent-payment guidance requires expiry, durable replay prevention, strict transfer verification, and constrained signing. The Allot v3 memo applies the smallest relevant part now: it binds the human-signed transaction to the approved agreement and policy request. x402/MPP remain later options for charging API resources; they do not replace recipient approval.

- https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol
- https://solana.com/docs/payments/agentic-payments
- https://solana.com/docs/payments/agentic-payments/x402
- https://ts.sdk.modelcontextprotocol.io/v2/serving/authorization
