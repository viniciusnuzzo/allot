import Link from "next/link";
import { BrandLink } from "@/app/components/brand-mark";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="app-shell">
      <div className="site-width">
        <nav className="floating-nav" aria-label="Navigation">
          <BrandLink /><Link href="/" className="back-link">Back to home</Link>
        </nav>
        <article className="legal-document">{children}</article>
        <nav className="legal-links" aria-label="Legal navigation">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Use</Link>
        </nav>
      </div>
    </main>
  );
}
