import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Allot",
  description: "How the Allot Devnet demo handles payment links, wallet data, and public blockchain records.",
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="legal-date">Last updated: October 7, 2026</p>
      <p>This policy covers the current Allot test website. Allot creates USDC payment splits on Solana Devnet. It does not support real-money payments.</p>

      <h2>Information used by the demo</h2>
      <p>You enter a payment title, recipient names, wallet addresses, percentages, and optionally an amount. The app encodes this information in the payment link in your browser. Encoding does not encrypt it: anyone with the link can read and copy it. Shared links can also appear in browser history and hosting request logs.</p>
      <p>When you connect a wallet, the app uses its public address and wallet connection to display balances and request transaction approval. Allot does not ask for your seed phrase or private key. Your wallet controls signing.</p>
      <p>When you view a receipt, the app uses the transaction signature to retrieve public transaction data. New team-backed links identify approved requests stored in our database. Older links still contain request data directly.</p>

      <h2>Accounts and teams</h2>
      <p>Supabase Auth processes your email, password, email confirmation, and password recovery. Allot forwards credentials to Supabase and does not store passwords in its application tables. Session cookies keep you signed in.</p>
      <p>Supabase Postgres stores team names, membership, display names, invitation hashes and expiry, split versions, wallet addresses, decisions, and requested percentages. Active members can see the workspace and negotiations. We use this information to provide accounts, team access, and approval workflows.</p>
      <p>Anyone possessing an invitation code/link can join after confirming an account. Codes expire after seven days and the owner can replace them. Share invitations only with intended members. Published payment details are public to link holders; account emails and internal negotiations are excluded.</p>

      <h2>Public blockchain records</h2>
      <p>Submitted transactions expose wallet addresses, token amounts, transaction signatures, and a memo containing the payment title on Solana Devnet. Blockchain records can be copied and indexed by others. Allot cannot edit or delete those records. Avoid personal, confidential, or sensitive information in payment titles and recipient labels.</p>

      <h2>Why information is processed</h2>
      <p>The app uses payment details to prepare a split, wallet information to request your approval, and blockchain data to display balances and receipts. Hosting infrastructure processes technical request data to deliver and protect the website. These technical records may include IP addresses, requested URLs, timestamps, and browser information.</p>

      <h2>Service providers and external services</h2>
      <p>Vercel hosts the website. Supabase provides authentication and database storage. Solana RPC services receive requests for balances, transactions, and receipts; the default endpoint is api.devnet.solana.com. Your wallet provider and any explorer you open handle information under their own policies. These services may process data outside your country.</p>
      <p>See <a href="https://vercel.com/legal/privacy-policy" rel="noreferrer">Vercel’s Privacy Notice</a> and <a href="https://supabase.com/privacy" rel="noreferrer">Supabase’s Privacy Policy</a> for their data practices. We have not added advertising trackers or analytics tools to this version.</p>

      <h2>Cookies and browser storage</h2>
      <p>The app uses essential account-session cookies to keep you signed in and complete email confirmation or password recovery. It does not set advertising cookies. Wallet software and hosting infrastructure may use their own storage or security mechanisms. Your browser may retain payment and invitation URLs. You can manage cookies, storage, and history in browser settings; removing session cookies logs you out.</p>

      <h2>Retention and security</h2>
      <p>Account, team, approval, and payment records are retained to operate the workspace. A fixed retention period and self-service deletion/export flow have not yet been established for this test demo. Hosting logs follow the provider’s configured retention. Public blockchain records and independent copies remain outside Allot’s control.</p>
      <p>No website, wallet, or network is risk-free. Share links only with intended recipients and review addresses before signing. Never send a password, private key, or seed phrase in a support request.</p>

      <h2>Your privacy rights</h2>
      <p>Depending on applicable law, you may request information about processing, access, correction, or deletion of personal data under our control, and object to processing where available. These requests cannot remove public blockchain records or copies held independently by others.</p>
      <p>For users in Brazil, the <a href="https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados/direito-dos-titulares">ANPD explains data-subject rights</a> and complaint channels.</p>

      <h2>Contact</h2>
      <p>A dedicated public privacy contact has not yet been designated for this test demo. Do not submit sensitive personal information through payment links.</p>

      <h2>Changes</h2>
      <p>We will update this page when data practices change. The date above identifies this version. See also our <Link href="/terms">Terms of Use</Link>.</p>
    </>
  );
}
