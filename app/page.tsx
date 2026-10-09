import Link from "next/link";
import { BrandLink, BrandLogo } from "./components/brand-mark";
import { AccountNavigation } from "./components/account-navigation";
import { AgreementPreview } from "./components/agreement-preview";

export default function Home() {
  return (
    <main className="allot-home">
      <div className="home-nav-wrap">
        <nav className="floating-nav site-width" aria-label="Main navigation">
          <BrandLink />
          <div className="home-nav-right">
            <div className="home-nav-links"><a href="#como-funciona">How it works</a><a href="#sobre">Agents</a><a href="#faq">FAQ</a></div>
            <AccountNavigation />
          </div>
        </nav>
      </div>

      <section id="hero" className="hero-home">
        <div className="site-width hero-grid">
          <div className="hero-message">
            <p className="hero-overline">A shared agreement before a shared payment.</p>
            <h1 className="display-title">Agree first.<br />Paid together.</h1>
            <p className="hero-copy">One payment link for a whole team. Propose the split, get everyone on the same version, then let the client pay each share in one transaction.</p>
            <div className="hero-actions"><Link href="/criar" className="button-primary">Start an agreement</Link><a href="#como-funciona" className="text-link">See the process</a></div>
          </div>
          <AgreementPreview />
        </div>
        <div className="site-width hero-baseline"><div><strong>For human + AI collaboration</strong><p>Agents can propose and request within policy. People keep approval and wallet authority.</p></div><div className="trust-strip" aria-label="Demo limitations"><span>Solana Devnet</span><span>Test USDC</span><span>No real money</span></div></div>
      </section>

      <section id="como-funciona" className="workflow-section" aria-labelledby="workflow-title">
        <div className="site-width workflow-layout">
          <div className="section-intro"><p className="section-kicker">The agreement</p><h2 id="workflow-title">One project.<br />Many contributors.</h2><p>A company runs a campaign with an agency, an AI operator, and specialist suppliers. Everyone sees the complete agreement before payment.</p></div>
          <ol className="workflow-list">
            <li><h3>The owner proposes</h3><p>Invite teammates by code or link. Set each recipient, wallet, percentage, and payment amount.</p></li>
            <li><h3>Each recipient decides</h3><p>Accept, reject, or request another percentage. Asking for 20% instead of 10% keeps the link locked.</p></li>
            <li><h3>Revisions start fresh</h3><p>Changing any term creates a new version. Everyone must accept that version before it can be published.</p></li>
            <li><h3>The client pays once</h3><p>In the Devnet demo, a single wallet transaction sends every share. Failed transactions move no test funds.</p></li>
          </ol>
        </div>
      </section>

      <section id="recursos" className="feature-section" aria-labelledby="feature-title">
        <div className="site-width">
          <div className="feature-heading"><p className="section-kicker">Why the order matters</p><h2 id="feature-title">Nobody forwards the whole payment.</h2><p>The team agrees before collection. In the test flow, the client pays the approved recipients directly.</p></div>
          <ul className="feature-list">
            <li><h3>Agreed shares</h3><p>The owner proposes. Every included recipient has their own decision. One rejection blocks publication.</p></li>
            <li><h3>Addresses in view</h3><p>Review the full split and every wallet address before accepting. Account approval does not prove wallet ownership.</p></li>
            <li><h3>Non-custodial demo</h3><p>Allot never holds wallet keys or forwards test funds. The payer signs in their own wallet.</p></li>
            <li><h3>Verifiable receipt</h3><p>Check transaction status and net USDC balance changes on Devnet. A receipt does not prove team approval.</p></li>
          </ul>
        </div>
      </section>

      <section id="numeros" className="split-example" aria-labelledby="example-title">
        <div className="site-width story-layout">
          <div className="split-example-copy"><p className="section-kicker">The current payment demo</p><h2 id="example-title">100 in.<br />50, 30, 20 out.</h2><p>Example: 100 test USDC becomes three transfers in one transaction. The producer gets 50 USDC, the editor 30 USDC, and the designer 20 USDC.</p><p>Supports 2–5 recipients. One signature. Test funds only.</p></div>
          <div className="split-ledger" aria-label="Example allocation of 100 test USDC to three recipients"><div className="split-ledger-head"><span>Illustrative transfer sheet</span><span>Devnet / USDC</span></div><div className="split-ledger-total"><span>Incoming</span><strong>100.00</strong></div><div className="split-ledger-row"><span>Producer</span><strong>50.00</strong></div><div className="split-ledger-row"><span>Editor</span><strong>30.00</strong></div><div className="split-ledger-row"><span>Designer</span><strong>20.00</strong></div><div className="split-ledger-foot"><span>Three transfers</span><strong>One signature</strong></div></div>
        </div>
      </section>

      <section id="sobre" className="positioning-section" aria-labelledby="positioning-title">
        <div className="site-width positioning-layout"><div><p className="section-kicker">Human authority</p><h2 id="positioning-title">Financial agreements for human + AI work.</h2><p className="positioning-copy">Payments are easy to trigger and hard to govern. Allot keeps proposals, revisions, permissions, approvals, and receipts in one flow. Agents can suggest drafts and request approved payments within a stored policy; recipients approve terms, and a person signs in their own wallet.</p><p className="positioning-note">The agent integration is an early Devnet workflow, not autonomous custody. We still need validation with real companies, agencies, and agent platforms. Pix support, customer adoption, and commercial results remain unproven.</p></div><div className="authority-sheet"><div className="authority-sheet-top"><BrandLogo className="brand-logo authority-logo" /><span>Control record</span></div><ol><li><span>Agent</span><strong>Propose</strong></li><li><span>Team</span><strong>Accept terms</strong></li><li><span>Owner</span><strong>Approve request</strong></li><li><span>Payer</span><strong>Sign in wallet</strong></li></ol><p>Each action has its own authority.</p></div></div>
      </section>

      <section id="pix" className="pix-section" aria-labelledby="pix-title"><div className="site-width pix-layout"><div><p className="section-kicker">Next payment rail · not live</p><h2 id="pix-title">The client should<br />be able to pay Pix.</h2></div><div className="pix-copy"><p>For Brazilian companies, agencies, and platforms, the next step is payment in reais after the agreement is approved.</p><p>Pix is not available in Allot yet. The current demo requires a Solana wallet and test USDC. No real-money payment is accepted.</p><p>Pix will need verified recipient accounts, clear fees, and confirmed settlement. It will not carry the Solana demo’s atomic-transaction guarantee.</p></div></div></section>

      <section id="precos" className="pricing-section" aria-labelledby="pricing-title"><div className="site-width pricing-layout"><div><p className="section-kicker">Pricing direction</p><h2 id="pricing-title">No subscription.</h2><p>Allot does not require a monthly subscription. The planned price is US$0.80 per completed transaction, with no recurring fee.</p></div><div className="pricing-detail"><strong>US$0.80</strong><span>planned per completed transaction</span><p>The current demo still uses test USDC on Solana Devnet. Network fees are separate and paid by the wallet.</p></div></div></section>

      <section id="faq" className="faq-section" aria-labelledby="faq-title"><div className="site-width faq-layout"><div><p className="section-kicker">Details</p><h2 id="faq-title">Before you start.</h2></div><div className="faq-list">
        <details><summary>Who decides each share?</summary><p>The owner proposes the complete split. Each included recipient accepts, rejects, or requests a change. The owner cannot accept for somebody else.</p></details>
        <details><summary>Can the owner change an accepted split?</summary><p>A revision gets a new version and fresh approvals. A published link keeps its original accepted terms. Published links remain reusable; a new version does not revoke an old link.</p></details>
        <details><summary>Does Allot move real money?</summary><p>No. Allot uses Solana Devnet and test USDC. Pix and real-money payments are not available.</p></details>
        <details><summary>Do I need a subscription?</summary><p>No. Allot is planned without a monthly subscription: US$0.80 per completed transaction. The current Devnet demo does not charge this fee.</p></details>
        <details><summary>Do I need an account or a wallet?</summary><p>An account is required to create or join teams and decide on shares. Payment links and receipts are public. Paying the current demo requires a compatible Solana wallet.</p></details>
        <details><summary>Can an AI agent spend my money?</summary><p>No. An agent can propose agreements and request an approved fixed payment within your stored limits. It cannot approve for a person or sign a transaction. A human keeps the wallet.</p></details>
        <details><summary>Is Allot an employment or payroll system?</summary><p>No. It is a financial-agreement and payment demo for collaborative work. Approval does not replace contracts, invoices, taxes, or employment rights.</p></details>
      </div></div></section>

      <section className="closing-banner"><div className="site-width closing-layout"><h2>Keep the split<br />out of the group chat.</h2><Link href="/criar" className="button-primary">Start a team split</Link></div></section>
      <footer id="rodape" className="site-footer"><div className="site-width footer-layout"><div><BrandLink /><p>Agree the split. Get paid together.</p></div><nav aria-label="Footer navigation"><a href="#como-funciona">How it works</a><a href="#pix">Pix roadmap</a><a href="#faq">FAQ</a><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Use</Link></nav><div className="footer-status"><strong>In testing</strong><p>Solana Devnet · Test USDC<br />No real money.</p></div></div></footer>
    </main>
  );
}
