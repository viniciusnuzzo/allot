import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use | Allot",
  description: "Conditions for using the Allot experimental payment-splitting demo on Solana Devnet.",
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Use</h1>
      <p className="legal-date">Last updated: October 7, 2026</p>
      <p>These terms describe use of the current Allot test website. By using the demo, you agree to these terms. If you do not agree, do not use it.</p>

      <h2>Test environment only</h2>
      <p>Allot is an experimental payment-splitting interface for Solana Devnet using test USDC and test SOL. These test assets are not offered as money or redeemable value. Do not use the demo for wages, purchases, debts, or other real financial obligations. Mainnet payments are not supported.</p>

      <h2>Your wallet and transaction approval</h2>
      <p>Allot prepares transfers for your wallet to review and sign. It does not hold your private keys, take custody of your assets, or receive the total payment to forward it later. You control whether to approve a transaction.</p>
      <p>Before signing, check the network, token, amount, recipient addresses, shares, and wallet instructions. You are responsible for the details you enter and the transactions you authorize. A payment link is not proof of its creator’s identity, an agreed entitlement, or a verified business relationship.</p>

      <h2>Public links and receipts</h2>
      <p>New team payment links identify saved splits accepted by every listed recipient. Older encoded links remain available but do not verify creator identity or recipient approval. Someone can create a different legacy link with changed details. Always review the actual payment screen and wallet request.</p>
      <p>Transactions and receipts are public. The payment title is included in a blockchain memo. Only enter and share information you are authorized to disclose. See our <Link href="/privacy">Privacy Policy</Link>.</p>

      <h2>Network behavior and fees</h2>
      <p>Recipient transfers are submitted in a single Solana transaction. If the transaction fails, recipient transfers are not applied, although the network may still charge a fee. Test SOL may also be needed to create token accounts.</p>
      <p>Confirmation can be delayed or uncertain when a wallet or RPC service fails. Check the transaction signature and receipt before retrying. The same link can be paid more than once; the demo does not enforce one-time collection. Allot cannot reverse a confirmed transaction or guarantee recovery.</p>

      <h2>Acceptable use</h2>
      <p>Do not use Allot to deceive others, impersonate a person or organization, disclose someone else’s private information without authority, distribute malicious links, attempt unauthorized access, or disrupt the service. Follow laws applicable to your use.</p>

      <h2>Availability and limitations</h2>
      <p>The demo is provided as available, with no promise of uninterrupted access, error-free operation, or suitability for real financial activity. Wallets, RPC providers, explorers, and Solana are independent services. Their own terms apply.</p>
      <p>Features may change or become unavailable during testing. No Allot platform fee is charged in this test version; this does not remove network costs. These terms do not exclude rights or responsibilities that applicable law does not allow us to exclude.</p>

      <h2>Accounts and teams</h2>
      <p>Creating or joining a team requires an account with a confirmed email. An owner shares an invitation code/link; anyone possessing it can join while it remains valid. Team display names and negotiation records are visible to active members.</p>
      <p>The owner proposes a split. Every included recipient can accept, reject, or request a different percentage. Changing payment details creates a new version requiring fresh approval. Only the owner can generate a link, after everyone accepts that version. Published links keep their original split and can be paid repeatedly.</p>
      <p>Account approval is not a wallet-ownership check, an employment agreement, or confirmation that payment satisfies legal obligations. Devnet remains a test environment and must not be used for real wages or payments.</p>

      <h2>Contact and updates</h2>
      <p>A dedicated public support contact has not yet been designated for this test demo. We will update this page when the service or these terms change. Review the date above before relying on a previous copy.</p>
    </>
  );
}
