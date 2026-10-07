import { address, type Address, type ClusterUrl } from "@solana/kit";

export const SOLANA_CHAIN = "solana:devnet" as const;
export const RPC_URL = (
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com"
) as ClusterUrl;
export const USDC_MINT: Address = address(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
);
export const USDC_DECIMALS = 6;
export const MIN_PAYMENT_UNITS = 1_000_000n;
export const MAX_RECIPIENTS = 5;
