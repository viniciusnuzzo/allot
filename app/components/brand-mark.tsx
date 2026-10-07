import Link from "next/link";

export function BrandSymbol({ className = "brand-symbol" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" role="img" aria-label="Allot symbol">
      <path d="M19 4a16 16 0 1 0 0 32V4Z" fill="#2c2e2a" />
      <path d="M23 4.5a16 16 0 0 1 0 31V4.5Z" fill="#f37460" />
      <path d="M21 4v32" stroke="#fffef7" strokeWidth="3" />
      <path d="M31 9a16 16 0 0 1 0 22V9Z" fill="#579af0" />
    </svg>
  );
}

export function BrandLink() {
  return (
    <Link href="/" className="brand-lockup" aria-label="Allot — home">
      <BrandSymbol />
      <span>allot</span>
    </Link>
  );
}
