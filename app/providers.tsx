"use client";

import { ClientProvider } from "@solana/react";
import type { ReactNode } from "react";
import { client } from "@/app/lib/solana-client";

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  return <ClientProvider client={client}>{children}</ClientProvider>;
}
