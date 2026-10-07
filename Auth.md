# Authentication and Teams

Status: implemented on 2026-10-07 against Supabase project `gjixddthtgibbkceraya`. Unit, database-role, and local HTTP checks passed. Live email confirmation/recovery and deployment settings still need verification.

## Requested outcome

Replace the no-login positioning with accounts and teams. Add separate **Log in** and **Sign up** buttons. Keep all product interfaces in English.

Supabase Auth manages accounts and cookie sessions. Postgres stores teams and approvals. `/criar` requires a confirmed account and redirects to `/teams`. Wallet connection authorizes transaction signing only; it is not an Allot account session.

## Implementation

Use Supabase Auth for email/password accounts and Postgres for team data. Use its maintained Next.js session integration and row-level security rather than implementing password storage or a session service inside Allot.

Alternatives considered:

- A separate auth provider plus database would add another operational boundary without a demonstrated requirement.
- Custom password and session handling would add security-sensitive code that the product does not need.

The founder confirmed owner/member teams, authenticated creation, public payment/receipts, and individual percentage negotiation. The latest instruction replaces email-bound invitations with reusable codes/links. The project URL and publishable key are configured locally; no privileged key is used by the application.

## User flow

1. The header exposes **Log in** and **Sign up** when signed out.
2. Sign-up requires a display name, email, password of 12–128 characters, and email confirmation before team access. The form and server enforce length; matching provider password rules remain a dashboard configuration requirement.
3. Log-in creates the provider session. Invalid credentials return a generic message.
4. Signed-in users can create a team, view their teams, and open a team's workspace.
5. An owner creates a random 128-bit code and a `/join?code=...` link. Anyone possessing it can join with a confirmed account for seven days. Only its SHA-256 hash is stored. Replacing the code or removing a member revokes the previous invitation. Joining is idempotent and does not consume the shared code.
6. The owner creates a draft with 2 to 5 recipient employees, their wallet addresses, percentages, a title, and an optional fixed amount. Percentages must total 100% before submission for approval.
7. Every included employee reviews the complete split and can accept, reject, or propose a different percentage for their own share. They can see the other shares while deciding.
8. The owner reviews counterproposals and adjusts the draft. Employees cannot unilaterally change other shares or make the proposed percentages total more than 100%.
9. A new submission creates a new immutable version and resets all decisions. A rejected or pending decision blocks link generation.
10. Only the owner can publish a payment link, and only when every included recipient has accepted that exact version.
11. Log-out clears the session through the provider. Password recovery uses expiring provider links and a dedicated reset form.

Confirmed route boundary: creation and team management require login; paying a shared request and reading a blockchain receipt remain public.

## Access model

| Action | Signed out | Team member | Team owner |
| --- | --- | --- | --- |
| View landing, public payment, public receipt | Yes | Yes | Yes |
| Create a team | No | Yes, as its new owner | Yes |
| Read a team's workspace and requests | No | Own teams only | Owned teams only |
| Create/revise a split proposal | No | No | Owned teams only |
| Accept/reject/counter a proposed share | No | Own recipient decision only | Own recipient decision if included |
| Publish a payment link | No | No | Only after unanimous acceptance of that version |
| Invite or remove a member | No | No | Yes |
| Access another team's private data | No | No | No |

An owner cannot remove the team's sole ownership through a member-removal operation. Ownership transfer and team deletion are outside the proposed first increment and require separate rules before being exposed.

## Data model requirements

- `allot_teams`: stable ID, name, owner account ID, creation timestamp.
- `allot_members`: unique team/account membership and display name. Ownership comes from the team record, never user-editable metadata.
- `allot_private.invites`: one hashed invitation per team, with expiry. Plaintext appears only when the owner creates/rotates it.
- `allot_splits`: immutable payment payload and ordered recipient account IDs; pending/superseded/published state; unique random public share ID. Each revision creates a new row and supersedes the previous pending row.
- `allot_decisions`: split version/account pair, accepted/rejected/countered decision, and optional requested basis points. Absence means pending.

Team creation and owner access are atomic. Mutations serialize on the team row; joins cannot duplicate membership. Exposed tables have RLS and read-only authenticated grants. Mutations use a private function with explicit permission checks, fixed search path, and restricted execution grants, reached through a SECURITY INVOKER public RPC.

Public payment reads must expose only the fields necessary to review and pay the request. They must not expose account emails, invitation records, team membership, or internal team metadata.

## Approval state machine and publication invariant

The browser draft becomes a `pending` immutable snapshot on submission. Revising supersedes that snapshot and creates a new pending version. Only unanimous acceptance permits `published`. The workspace shows each decision and requested adjustment.

An acceptance belongs to a recipient account and one immutable version. It does not belong merely to a team or a proposal ID. A decision endpoint derives the account from the session and checks that the account is a recipient in that version.

Changes to title, amount rules, recipient identities, wallet addresses, or percentages require a new version and fresh acceptance from every included recipient. Membership removal before publication must invalidate the proposal's eligibility. Only listed recipients must approve; unrelated team members do not create extra approval requirements.

Publication must run in one database transaction that locks the proposal, confirms its current version, rechecks owner authority and active memberships, validates the 100% total, checks acceptance from every included recipient, and creates the immutable public record. Direct API calls must enforce this invariant even if the Generate link button is bypassed.

Concurrent revision, decision, removal, and publication operations must follow consistent locking rules. A stale acceptance or counterproposal must be rejected instead of silently applying to a newer version. A unique published-version constraint makes repeated publication return the same record rather than duplicate links.

When the owner is also a recipient, the owner must explicitly accept their own share. A counterproposal records a requested percentage only; the owner resolves the full split and submits it again. The first increment does not auto-rebalance everyone else's shares.

Published payment snapshots cannot be edited. A later adjustment starts a new draft and approval round. Existing published links continue to identify their original approved snapshot; they must never silently switch to a revised split. Product behavior for revoking old links or collecting a payment only once requires a separate rule before either guarantee is advertised.

For an optional payment amount, recipients approve fixed percentages with an amount chosen later by the payer. The approval screen must state this clearly. If a fixed amount is specified, changing it requires a new approval round.

## Session and authorization requirements

- Validate sessions using the provider's documented server verification API; never trust a browser-supplied user ID or an unverified session object.
- Use cookie-based server integration with documented refresh behavior. Set secure production cookie attributes and prevent session-bearing pages from entering shared caches.
- Recheck membership from persistent state on each protected operation so removal takes effect without relying on stale role claims.
- Revalidate all mutation inputs on the server. Apply origin/CSRF protection to cookie-authenticated writes.
- Allow only known local return paths after authentication. Reject absolute URLs and protocol-relative redirects.
- Never expose privileged provider keys in browser bundles or `NEXT_PUBLIC_` variables.
- Handle missing provider configuration visibly and fail closed.
- Configure provider rate limits and abuse protection. A per-process in-memory counter is not a distributed protection guarantee.

## Payment compatibility

Existing encoded payment links are public, editable data. They do not prove who created the request or which team owns it.

New authenticated team requests should be persisted on the server and loaded by a public share identifier. Any team provenance must come from that record, not a browser-supplied team field. Preserve existing public links as legacy requests without attaching an unverified team identity.

Account login does not prove ownership of a recipient wallet. A wallet ownership claim would require a separate signature challenge if that feature is introduced.

## Verification and remaining setup

Required evidence: independent owner and employee browser sessions; email confirmation; login/logout; password reset; invitations; rejected cross-team API access; expired/replayed invitation rejection; and public payment/receipt access. Exercise an employee refusing 10% and proposing 20%, owner redistribution to 100%, all prior decisions resetting, all recipients accepting the new version, and publication succeeding only then. Race tests must cover stale decisions, revision/removal versus publication, and repeated publication.

Evidence: `npm test` passed 64 tests; lint/build passed. `db/teams-check.sql` passed against the live database with transaction rollback, switching authenticated/anonymous roles and testing owner/member/outsider access, code rotation, negotiation, fresh acceptance, direct write denial, and public projection. `scripts/check-account-flow.mjs` passed against the local app using a temporary confirmed account: login cookies, protected pages, team creation, origin checks, safe redirects, and logout.

Provider configuration: Site URL is `https://allot-three.vercel.app`; authorized callbacks are that origin and `http://localhost:3000`, restricted to `/auth/callback**`. Email confirmation is enabled; minimum password length is 12. Project URL/publishable key are set in Vercel Production, Preview, and Development. Preview callback origins are not authorized.

Remaining: custom SMTP and real confirmation/reset email delivery, simultaneous-request stress checks, retention/deletion policy, and real wallet payment. The default SMTP sends only to pre-authorized Supabase organization accounts, so public registration is not open. See [Securitychecklist.md](Securitychecklist.md). Public links are reusable; published snapshots cannot be revoked through this increment.
