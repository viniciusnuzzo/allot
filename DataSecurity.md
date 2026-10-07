# Data Security

Status: current inventory for the implemented Supabase accounts and teams subsystem. SQL access controls and local HTTP sessions have been tested; email delivery, retention, and backup settings remain unverified.

## Data inventory

| Data | Current location and recipients | Classification and handling |
| --- | --- | --- |
| Payment title, recipient names, wallet addresses, shares, amount | Encoded in the shared payment URL; available to anyone who receives it | Public to link holders. Encoding is not encryption. Do not place confidential data here. |
| Transaction title | Sanitized into an on-chain memo when a payment is submitted | Public blockchain data. Treat it as permanently exposed. |
| Transaction addresses, amounts, signature, time | Solana Devnet and RPC/Explorer services | Public blockchain data. Deleting application data cannot erase it. |
| Wallet approval and private keys | Managed by the user's wallet | Allot must never obtain or persist private keys or seed phrases. |
| Account email and password | Allot auth route forwards credentials to Supabase Auth over TLS | Private. Password hashes are managed by the provider, never by application tables. |
| Session credentials | HttpOnly, SameSite=Lax cookies; Secure in production | Secret. Exclude from URLs, analytics, error reports, and logs. |
| Team names and memberships | Supabase Postgres | Private to active members; display names are visible to teammates. |
| Split versions, employee decisions, and counterproposals | Supabase Postgres | Private team negotiation data; only accepted published payment payloads are public. |
| Invitation token | Invitation URL/code; SHA-256 hash stored in a private table | 128-bit bearer token, reusable for seven days by confirmed accounts. Owner rotation/removal revokes it. It is not bound to an email and must be shared carefully. |
| Deployment credentials | Local or hosting environment | Secret. Never expose through browser bundles or repository files. |

Current source evidence: `app/components/create-payment-form.tsx`, `app/lib/payment-link.ts`, `app/lib/split-transaction.ts`, `app/lib/receipt.ts`, and `app/lib/solana-client.ts`.

## Storage and access requirements

All exposed team tables have RLS and authenticated read-only grants. Mutations use a public SECURITY INVOKER RPC wrapping a private SECURITY DEFINER function with explicit identity, verified-email, membership, and owner/recipient checks. A caller changing a `team_id` or record ID must not gain access.

Derive the current account from a verified session. Derive roles from controlled membership/ownership records. Do not authorize with user-editable profile metadata, a hidden form input, or a wallet address alone.

Grant only the operations each role needs. Do not use a privileged service key for routine member queries. If a privileged operation is unavoidable, validate identity and authorization before executing it and document why it needs elevated access.

Use TLS for deployed provider and database connections. Verify actual encryption, backup, and restore settings in the selected provider project before making claims about them.

## Public data boundary

Anyone with a current payment link can inspect the encoded request. The link's canonical encoding check detects malformed data; it does not authenticate the creator or conceal the payload.

New team-backed payment requests require a minimal public projection: title, token/network, amount, and recipient addresses/shares/names needed for payment. Do not join account emails, memberships, invitations, or private workspace data into this response.

Publish the projection only after unanimous acceptance of its exact immutable version. Keep rejection reasons, requested percentages, pending decisions, and account identity details within the authorized workspace. A revised draft must not mutate a previously published snapshot.

Wallet and blockchain data may identify people when combined with other sources. Avoid collecting extra account-to-wallet associations without a product need. Explain public memo disclosure before payment submission.

## Logs and observability

- Never log passwords, authorization headers, cookies, session tokens, invitation tokens, or privileged provider credentials.
- Redact payment and invitation query strings from request logs and third-party analytics where possible.
- Log minimal security events: login outcomes, invitation creation/redemption/revocation, member removal, split submission/revision, recipient decisions, publication, and denied writes. Use identifiers rather than copied personal data.
- Restrict log access and set a documented retention period before launch. Hosting and provider log retention must be verified separately.
- Do not expose raw provider/database errors to users.

## Retention, deletion, and backups

Retention periods, deletion/export workflow, backup schedule, restore objectives, and region remain founder decisions. No fixed period or deletion guarantee is established by this document.

Before launch, specify retention for accounts, team records, expired invitations, and security logs. Define what happens when an owner requests account deletion while still owning teams. Verify deletion covers application rows and provider identities while communicating that public blockchain data cannot be removed.

Verify a restore in an isolated environment. A backup setting or successful build is not restore evidence.

## Configuration

`NEXT_PUBLIC_SOLANA_RPC_URL` is browser-visible configuration. Never put a secret RPC credential in it. The current fallback is the public Solana Devnet endpoint.

Proposed Supabase configuration must distinguish the project URL/publishable key from secret administrative keys. Environment files are ignored by Git except `.env.example`; this reduces accidental commits but does not prove credentials have never leaked.

See [Auth.md](Auth.md) for session controls and [Securitychecklist.md](Securitychecklist.md) for required proof.
