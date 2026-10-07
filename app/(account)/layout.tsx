import Link from "next/link";
import { BrandLink } from "@/app/components/brand-mark";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <main className="app-shell"><div className="site-width"><nav className="floating-nav" aria-label="Navigation"><BrandLink /><Link href="/" className="back-link">Back to home</Link></nav>{children}</div></main>;
}
