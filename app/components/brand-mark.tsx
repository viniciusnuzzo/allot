import Link from "next/link";

export function BrandLogo({ className = "brand-logo" }: { className?: string }) {
  return <span className={className} role="img" aria-label="Allot" />;
}

export function BrandLink() {
  return <Link href="/" className="brand-lockup" aria-label="Allot — home"><BrandLogo /></Link>;
}
