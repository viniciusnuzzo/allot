import Link from "next/link";
import { BrandLink } from "./components/brand-mark";
import { BuyMeCoffee } from "./components/buy-me-coffee";
import { AccountNavigation } from "./components/account-navigation";
import { AgreementPreview } from "./components/agreement-preview";
import { AtomicSplitArt } from "./components/payment-story-art";

export default function Home() {
  return (
    <main>
      <div className="home-nav-wrap site-width">
        <nav className="floating-nav" aria-label="Main navigation">
          <BrandLink />
          <div className="flex min-w-0 items-center gap-3">
            <div className="home-nav-links"><a href="#como-funciona">How it works</a><a href="#pix">Pix</a><a href="#faq">FAQ</a></div>
            <AccountNavigation />
          </div>
        </nav>
      </div>
      <section id="hero" className="hero-home">
        <div className="site-width hero-grid">
          <div className="hero-message">
            <p className="audience-label">For human + AI collaboration</p>
            <h1 className="display-title"><span className="title-line"><span>Agree first.</span></span><span className="title-line"><span>Paid together.</span></span></h1>
            <p className="hero-copy">Work moves between people, agents, agencies, and suppliers. Allot keeps one financial agreement versioned, approved, and tied to payment.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/criar" className="button-coral">Start an agreement</Link><a href="#como-funciona" className="button-secondary">See the workflow</a></div>
            <p className="hero-footnote">Agents can propose. People keep approval and payment authority.</p>
            <div className="trust-strip" aria-label="Demo limitations"><span>Solana Devnet</span><span>Test USDC</span><span>No real money</span></div>
          </div>
          <AgreementPreview />
        </div>
      </section>
      <section id="como-funciona" className="workflow-section" aria-labelledby="workflow-title">
        <div className="site-width workflow-layout">
          <div><p className="section-eyebrow">The agreement comes first</p><h2 id="workflow-title">One project.<br />Many contributors.</h2><p className="workflow-intro">A company runs a campaign with an agency, an AI operator, and specialist suppliers. Everyone sees the complete agreement before payment.</p></div>
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
          <div className="feature-heading"><h2 id="feature-title">Nobody forwards the whole payment.</h2><p>The team agrees before collection. In the test flow, the client pays the approved recipients directly.</p></div>
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
          <div className="split-example-copy"><p className="section-eyebrow">The current payment demo</p><h2 id="example-title">100 in.<br />50, 30, 20 out.</h2><p>Example: 100 test USDC becomes three transfers in one transaction. The producer gets 50 USDC, the editor 30 USDC, and the designer 20 USDC.</p><p>Supports 2–5 recipients. One signature. Test funds only.</p></div>
          <AtomicSplitArt />
        </div>
      </section>
      <section id="pix" className="pix-section" aria-labelledby="pix-title">
        <div className="site-width workflow-layout">
          <div><p className="section-eyebrow">Next payment rail · not live</p><h2 id="pix-title">The client should<br />be able to pay Pix.</h2></div>
          <div className="pix-copy"><p>For Brazilian companies, agencies, and platforms, the next step is payment in reais after the agreement is approved.</p><p>Pix is not available in Allot yet. The current demo requires a Solana wallet and test USDC. No real-money payment is accepted.</p><p className="text-sm">Pix will need verified recipient accounts, clear fees, and confirmed settlement. It will not carry the Solana demo’s atomic-transaction guarantee.</p></div>
        </div>
      </section>
      <section id="sobre" className="positioning-section" aria-labelledby="positioning-title">
        <div className="site-width"><p className="section-eyebrow">Why Allot</p><h2 id="positioning-title">Financial agreements for human + AI work.</h2><p className="positioning-copy">Payments are easy to trigger and hard to govern. Allot keeps proposals, revisions, permissions, approvals, and receipts in one flow. In the local agent prototype, software can suggest a draft; a person still submits it, recipients approve, and a payer signs in their own wallet.</p><p className="positioning-note">The agent integration is not live on this site. We still need validation with real companies, agencies, and agent platforms. Pix support, customer adoption, and commercial results remain unproven.</p></div>
      </section>
      <section id="precos" className="pricing-section" aria-labelledby="pricing-title">
        <div className="site-width pricing-layout"><div><h2 id="pricing-title">No subscription.</h2><p>Allot does not require a monthly subscription. The planned price is US$0.80 per completed transaction, with no recurring fee.</p></div><div className="pricing-detail"><strong>Transparent pricing</strong><p>The current demo still uses test USDC on Solana Devnet. Network fees are separate and paid by the wallet.</p></div></div>
      </section>
      <section id="faq" className="faq-section" aria-labelledby="faq-title">
        <div className="site-width faq-layout"><div><h2 id="faq-title">Before you start.</h2></div><div className="faq-list">
          <details><summary>Who decides each share?</summary><p>The owner proposes the complete split. Each included recipient accepts, rejects, or requests a change. The owner cannot accept for somebody else.</p></details>
          <details><summary>Can the owner change an accepted split?</summary><p>A revision gets a new version and fresh approvals. A published link keeps its original accepted terms. Published links remain reusable; a new version does not revoke an old link.</p></details>
          <details><summary>Does Allot move real money?</summary><p>No. Allot uses Solana Devnet and test USDC. Pix and real-money payments are not available.</p></details>
          <details><summary>Do I need a subscription?</summary><p>No. Allot is planned without a monthly subscription: US$0.80 per completed transaction. The current Devnet demo does not charge this fee.</p></details>
          <details><summary>Do I need an account or a wallet?</summary><p>An account is required to create or join teams and decide on shares. Payment links and receipts are public. Paying the current demo requires a compatible Solana wallet.</p></details>
          <details><summary>Can an AI agent spend my money?</summary><p>No. The local agent prototype can read an agreement and suggest a draft for the owner to review. It cannot approve for a person, publish a payment link, or sign a transaction. This integration is not live on the site yet.</p></details>
          <details><summary>Is Allot an employment or payroll system?</summary><p>No. It is a financial-agreement and payment demo for collaborative work. Approval does not replace contracts, invoices, taxes, or employment rights.</p></details>
        </div></div>
      </section>
      <section className="closing-banner"><div className="site-width flex flex-col items-start justify-between gap-8 md:flex-row md:items-end"><h2>Keep the split<br />out of the group chat.</h2><Link href="/criar" className="button-primary">Start a team split</Link></div></section>
      <section className="support-section" aria-labelledby="support-title"><div className="site-width support-layout"><BuyMeCoffee href="#support-details" /><div id="support-details" className="support-details" tabIndex={-1}><h2 id="support-title">Good work grows through people.</h2><p>Share useful feedback, contribute an improvement, or test Allot with a collaborative team. This section does not accept payments.</p></div></div></section>
      <footer id="rodape" className="site-footer"><div className="site-width footer-layout"><div><BrandLink /><p>Agree the split. Get paid together.</p></div><nav aria-label="Footer navigation"><a href="#como-funciona">How it works</a><a href="#pix">Pix roadmap</a><a href="#faq">FAQ</a><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Use</Link></nav><div className="footer-status"><span>In testing</span><p>Solana Devnet · Test USDC<br />No real money.</p></div></div></footer>
    </main>
  );
}
