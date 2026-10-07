# Security Release Checklist

Status: accounts and teams implemented on 2026-10-07. Checked items have local HTTP or database-role regression evidence. Unchecked items need further verification; this checklist does not certify a production release.

## Authentication

- [ ] Separate Log in and Sign up entry points work in English on desktop and mobile. Desktop navigation was inspected; mobile review remains pending.
- [ ] Verified email is required before access to private team operations.
- [ ] Password rules are enforced by the provider, not only by browser validation.
- [ ] Invalid login and recovery requests do not reveal whether an email is registered.
- [ ] Server code verifies the provider session before every private read and mutation.
- [ ] Expired/forged sessions fail closed; valid sessions refresh according to the provider integration.
- [x] Log-out clears access; protected routes remain inaccessible after logout and refresh.
- [ ] Password recovery works with a real expiring link; reuse and invalid links are rejected.
- [x] Redirect targets allow only known local paths.
- [ ] Authenticated responses and session refresh responses do not enter a shared public cache.
- [ ] Provider rate limits and abuse protection are configured and tested.

## Teams and invitations

- [x] Creating a team atomically establishes its owner and authorized access.
- [x] Members read only their teams; only owners submit requests.
- [x] Owners alone can invite; removal uses the same owner guard and requires its own regression check.
- [ ] Browser-supplied role, owner, user, and team fields cannot grant authority.
- [ ] Membership removal takes effect on the next protected operation, including direct API calls.
- [ ] Owner membership/ownership cannot be removed accidentally through member removal.
- [ ] Invitations use random tokens, stored only as hashes, with expiry and revocation.
- [x] Invitation entry requires a confirmed account; codes are bearer invitations, not bound to an email, per the latest product instruction.
- [x] Repeated joining produces one membership; a shared code remains reusable until expiry/rotation.
- [ ] Wrong-team, expired, and revoked invitation tests pass. Code rotation rejection was tested.

## Database and API

- [x] Every exposed table has RLS enabled and explicit least-privilege grants.
- [ ] SELECT, INSERT, UPDATE, and DELETE policies reflect the confirmed permission matrix.
- [ ] UPDATE policies prevent moving records to another team or changing protected ownership fields.
- [ ] No recursive membership policy or privileged function silently bypasses intended isolation.
- [x] Privileged team functions have fixed search paths, caller checks, and restricted grants; the public payment helper deliberately exposes only approved payloads.
- [x] Authenticated mutations validate input server-side and enforce origin/CSRF protections.
- [x] Public payment responses exclude account emails, invitations, and private negotiation records.
- [ ] Cross-team direct API tests run with two real accounts in separate teams, without privileged test credentials.
- [x] Provider security advisors reviewed after applying schema and hardening: no lints returned.

## Employee approval and percentage negotiation

- [x] Only the owner can submit/revise; recipients decide only their own share.
- [x] Employees can accept, reject, or counter with a different requested percentage.
- [ ] The complete split and optional/fixed amount rules are visible before acceptance.
- [x] Submitted payloads are immutable; decisions are bound to account and exact version.
- [x] Any revised submission creates a new version with fresh decisions.
- [x] Pending, rejected, or countered decisions block publication through the database API.
- [ ] Publication checks owner authority, current version, all active recipient memberships, total of 100%, and unanimous acceptance in one transaction.
- [ ] Removing a required recipient member before publication blocks that proposal.
- [ ] Owner acceptance is required if the owner receives a share.
- [ ] Stale decisions are rejected; publication cannot race a revision or member removal into an invalid state.
- [x] Repeated publication returns the same immutable record for the approved version.
- [ ] Published links never change to a revised split; counterproposal details stay private.
- [ ] End-to-end case passes: employee rejects 10%, requests 20%, owner redistributes, all approve the new version, then link generation succeeds.

## Payments

- [ ] Account login is never treated as wallet-transfer approval or recipient-wallet ownership proof.
- [ ] Integer arithmetic, valid unique recipients, exact total, and atomic transaction tests still pass.
- [ ] Devnet and test funds remain clear throughout creation, review, wallet approval, and receipt.
- [ ] New team requests use canonical server records; legacy links do not claim verified team provenance.
- [ ] Payer sees full recipient addresses, shares, amount, and network before signing.
- [ ] Failed or uncertain confirmation preserves any known signature and does not automatically retry payment.
- [ ] Public memo/title disclosure is communicated before submission.
- [ ] A real Devnet wallet payment and receipt reconciliation are recorded independently of local tests.

## Data and operations

- [ ] No secrets, session tokens, passwords, or invitation tokens appear in source, client bundles, URLs used for analytics, or logs.
- [ ] Browser configuration uses only public project keys; privileged credentials stay server-side.
- [ ] Deployed provider connections use TLS and correct origins/redirect allowlists.
- [ ] Retention, account deletion, team ownership on deletion, and export behavior are defined.
- [ ] Backup configuration and an isolated restore are verified.
- [ ] A private security-reporting channel and incident owner are designated.
- [ ] Dependencies are pinned where added, lockfile is preserved, and actionable advisories are reviewed.
- [ ] Missing provider configuration produces a clear unavailable state and cannot bypass protection.
- [ ] Every auth/team form has loading, success, validation, and failure states, keyboard access, and visible focus.

## Evidence log

| Check | Evidence | Status |
| --- | --- | --- |
| Existing payment application tests | Prior translation increment ran 63 tests successfully; this is not auth/team evidence | Historical baseline |
| Existing application lint/build | Passed during the preceding translation increment | Historical baseline |
| Accounts and teams local checks | 64 unit tests passed; lint/build passed; HTTP check exercised login cookies, protected routes, create team, origin rejection, safe redirect, and logout | Passed locally |
| Live auth/email/session verification | Temporary confirmed account successfully logged in through local app; real confirmation/reset email and production configuration still need verification | Partial |
| Live database RLS and cross-team access | `db/teams-check.sql` passed against configured project under authenticated/anonymous roles with rollback; no security advisor lints after hardening | Role-level checks passed; real multi-browser API and concurrency proof pending |
| Real wallet payment for this increment | Not performed | Pending |
| Input hardening, 2026-10-07 | 68 tests passed; local HTTP rejects unauthenticated mutation (401), wrong Origin (403), and oversized JSON (400); framing/referrer/CSP headers present | Passed locally |
| Direct RPC validation, 2026-10-07 | Applied `allot_bounded_typed_inputs`; rollback regression rejects numeric titles, oversized amount strings, root/recipient private extra keys and preserves approval negotiation; security advisors returned no lints | Passed in configured database |
| Mobile landing, 2026-10-07 | 375 px page width equals document width; login/signup visible; illustrative request/approval controls exercised | Passed in browser preview |
| Receipt interpretation, 2026-10-07 | Self-recipient regression verifies net values and prevents the gross-transfer label | Passed locally |
| Formal security scan | Source review retained; finalization failed because latest saved draft remained incomplete | Incomplete, not a certification |
| Development dependency advisory | Five high audit entries in ESLint/glob dependency chain; latest braces 3.0.3 has no available patch | Pending compatible fix |
| Production release, 2026-10-07 | Vercel deployment `dpl_CxYynYKdNB9wcta9qVa9Sw9KpWoe` reached Ready; canonical public homepage shows new headline and interactive adjustment example | Published; email delivery and real wallet/Pix proof remain pending |

For each release, replace historical entries with dated commands/results and sanitized multi-user test evidence. A checked box requires evidence of the actual control, not only the presence of this document.
