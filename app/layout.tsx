import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";

const allotSans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-allot",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Allot — agree the split, get paid together",
  description: "A payment link for freelance teams that unlocks after every recipient accepts the same split. Current demo: test USDC on Solana Devnet.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${allotSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
