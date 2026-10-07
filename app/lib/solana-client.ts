import { memoProgram } from "@solana-program/memo";
import { tokenProgram } from "@solana-program/token";
import { createClient } from "@solana/kit";
import { solanaRpc } from "@solana/kit-plugin-rpc";
import { walletSigner } from "@solana/kit-plugin-wallet";
import { RPC_URL, SOLANA_CHAIN } from "@/app/lib/config";

export const client = createClient()
  .use(walletSigner({ chain: SOLANA_CHAIN }))
  .use(
    solanaRpc({
      rpcUrl: RPC_URL,
      transactionConfig: { version: 1 },
    }),
  )
  .use(tokenProgram())
  .use(memoProgram());

export type AppClient = typeof client;
