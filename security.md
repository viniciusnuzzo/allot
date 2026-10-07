# Allot Security Policy

Status: implemented controls and remaining release requirements for authentication and teams.
Reviewed against local source on 2026-10-07. This document is not a completed security audit or a production certification. The formal Codex Security report remains incomplete after a finalization error; source review and the checks below are separate evidence.

## Scope and present implementation

Allot is a Next.js application that builds atomic test-USDC payments on Solana Devnet. The application provides a landing page, payment-link creation, wallet-based payment, and public blockchain receipts.

The source implements Supabase email/password accounts, cookie sessions, team membership, code/link invitations, versioned split approvals, and immutable public payment records. The schema is applied to project `gjixddthtgibbkceraya`. [Auth.md](Auth.md) describes implementation and remaining provider setup.

Covered boundaries:

- Browser inputs and payment-link decoding.
- Next.js server rendering and public receipt lookups.
- Wallet approval and Solana RPC responses.
- Account sessions, team membership, invitations, and persisted payments.
- Deployment configuration, dependencies, and secret handling.

## Required security invariants

1. Allot must never request, store, or log seed phrases or wallet private keys.
2. Account authentication must not authorize a wallet transfer. Payment requires a separate approval from the connected wallet.
3. Monetary calculations must use integer token units and preserve the total exactly.
4. Transfers in a split must remain in one transaction. An uncertain confirmation must not trigger an automatic retry.
5. The MVP must clearly identify Devnet and test funds. Mainnet requires a separate product and security decision.
6. Every private team read and mutation must verify the current account and membership on the server and at the database boundary.
7. A client-supplied team ID, role, email, or wallet address must never grant authority by itself.
8. Only a team's owner may manage invitations and remove members under the proposed access model.
9. Credentials, sessions, invitation tokens, and private team data must not appear in public payment projections or logs.
10. Protected operations must fail closed when authentication or authorization cannot be verified.
11. A team payment link must not be published until every included recipient has explicitly accepted the same immutable split version.
12. A change to payment terms or recipients must reset acceptance. Counterproposals and rejections must block publication; a stale decision must never approve a revised split.

Database regression tests verify team isolation, owner-only operations, unanimous acceptance, stale-version rejection, and idempotent publication. Email delivery, provider password rules, deployment configuration, and real wallet payment need separate evidence.

## Improvements verified on 2026-10-07

- Auth/team request bodies are streamed with a 16 KiB limit before JSON parsing.
- Legacy encoded links are capped at 8 KiB; amount strings are bounded before BigInt conversion.
- Database and application payment ceilings agree at one billion test USDC. Direct RPC rejects numeric titles and oversized amounts, and exact keys prevent adding private metadata to public payloads.
- Global response headers deny framing, disable MIME sniffing, avoid referrer transmission, restrict object embedding/base URI, and disable unused camera/microphone/location permissions. This is not a full script CSP or an XSS certification.
- Receipts explicitly show net USDC balance changes. Self-directed shares cannot be mistaken for net money received; receipts do not prove team acceptance.
- 68 local tests, API origin/body/auth checks, live rollback database regression, and empty Supabase security advisors provide bounded evidence.
- Five high npm audit entries remain in the development-only ESLint/glob chain, caused by the braces advisory. The registry's latest braces is 3.0.3 with no patched release at verification time. A forced downgrade of Next's ESLint configuration was not applied. Recheck when a compatible fix is published.
- `npm audit --omit=dev` reported zero production dependency advisories. This does not establish absence of application vulnerabilities.

Pix remains disabled. Its provider settlement, webhook authentication/idempotency, fees, and account ownership require a separate implementation and evidence before real payments.

## Review criteria

Report reachable failures that enable account takeover, session theft, unauthorized team access, privilege escalation, invitation misuse, private data disclosure, unauthorized payment changes, forged employee acceptance, or premature link publication. Payment-integrity failures and misleading confirmation states are also in scope.

Assess impact using the actual entry point, attacker privileges, deployment prerequisites, and affected data. A disabled button or a hidden navigation link is not authorization. Passing unit tests is not proof that database policies or provider settings work remotely.

No vulnerability classes or deployment risks have been accepted or excluded by the founder in this document. Missing controls must remain visible until implemented and verified.

## Reporting and response

No public security-reporting address has been configured. Before public account registration opens, the founder must designate a private reporting channel and an incident owner.

Reports should include the affected route, prerequisites, expected behavior, actual behavior, and sanitized reproduction steps. Do not include credentials or other users' personal data in public issues.

For an incident: restrict affected operations, revoke compromised sessions or credentials, preserve sanitized evidence, determine the affected scope, and verify the fix before restoring access. Never publish exploit details containing secrets or identifiable user data.

## Release evidence

Use [Securitychecklist.md](Securitychecklist.md) as the release gate. Record local checks separately from live provider, database, email, and multi-user verification.

Related documents: [Auth.md](Auth.md), [DataSecurity.md](DataSecurity.md), [ThreatModel.md](ThreatModel.md).
