# Allot agent layer — database installed, app not deployed

The agent is a proposer, not a payer. The team owner creates a 7-day credential in the team workspace. It is scoped to that team, can read agreement status and submit draft proposals, and can be revoked by the owner. A credential cannot call human approval or payment endpoints. The owner reviews/edit-submits each draft using the existing versioned agreement flow; recipients then approve the new version themselves. Payment still requires a browser-wallet signature.

## Database status

`db/agent-drafts.sql`, `db/decision-audit.sql`, `db/projects.sql`, and `db/agent-projects.sql` were applied to the Allot Supabase project and their tables, RLS status, and principal function grants were checked. The four migrations are recorded remotely. This does **not** prove that the authenticated owner/agent workflow succeeds end to end; there are no team rows or test credentials. No secret should be pasted into chat, committed, or included in a video.

`db/agent-activity.sql` is the next incremental migration. It has **not** been applied. Until then, `request_approval` and the Agent activity view remain unavailable in the deployed database schema.

`db/decision-audit.sql` records future acceptance, rejection, and counterproposal changes. Earlier overwritten decisions cannot be reconstructed.

`db/projects.sql` adds planning projects and subprojects with test-USDC budgets. `db/agent-projects.sql` adds project drafts suggested by an agent and accepted or rejected by the owner. The budgets do **not** reserve funds, constrain payments, or authorize agents to spend.

## API contract

`POST /api/agent` takes `Authorization: Bearer <team credential>` and JSON:

```json
{"action":"get_agreement","team":"<team UUID>","agreementId":"<split UUID>"}
```

`create_agreement` takes `team`, a normal payment-link `payload`, and `recipientIds` matching the recipient order. It returns a **draft ID**, not a published agreement. `propose_change` takes those fields plus `agreementId` as the base version. `request_approval` records a request for owner review; it does not submit or approve the draft. The owner must review and submit the draft; that submission creates a new version and resets prior approvals. Direct calls to `approve_agreement` and `execute_payment` are rejected. Human approval remains the existing authenticated `/api/teams` action, and payment remains wallet-signed in `/pagar`.

`create_project` takes `team`, optional `parent`, a title and optional test-USDC `budget`. It returns a draft requiring explicit owner acceptance. The owner can also create a project directly. A child planning budget cannot make the sum of its siblings exceed the parent budget. These numbers are not spending controls.

`POST /api/agent/token` creates a token for the signed-in team owner; `DELETE /api/agent/token` revokes all tokens for that team. Both require same-origin requests. There is no API for an agent to create credentials.

## Local MCP adapter

Run `npm run mcp` with `ALLOT_API_BASE_URL` and `ALLOT_AGENT_TOKEN` set in the local process environment. The token comes from the team owner's screen. The stdio server exposes `create_project`, `get_agreement`, `create_agreement`, `propose_change`, `request_approval`, and public `get_payment_receipt`. After the activity migration, successful authenticated actions appear in the owner's Agent activity view. It delegates validation and authorization to `/api/agent`; no private key is used. Do not put the token in a client config committed to Git. The receipt tool reads the public chain only; it does not establish that the memo's claimed agreement was approved.

## Not yet implemented

- The standalone `checkAgentPaymentPolicy` is not enforced at the signing boundary. It has no trusted, atomic budget ledger or replay store. Do **not** describe it as spending protection.
- No `execute_payment` agent permission, automatic signing, autonomous supplier selection, hosted MCP endpoint, or x402 fee. These require a separate review of consent, policy, replay prevention, settlement verification and key custody.
- Schema objects and grants were verified against the migrated Allot database, but the owner/agent flow has not been exercised with real authenticated accounts, and this app code has not been deployed. Do not claim a live agent integration.

## Product sequence

People use agreements first. Agents may later propose through the same contract. Only after real usage justifies it should Allot add constrained execution, MCP as a thin adapter, then machine-to-machine billing. Pix remains a future payment rail, not a feature of this API.
