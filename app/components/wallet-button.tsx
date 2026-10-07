"use client";

import {
  useConnect,
  useConnectedWallet,
  useDisconnect,
  useWalletStatus,
  useWallets,
} from "@solana/kit-plugin-wallet/react";
import { useSyncExternalStore } from "react";
import { client } from "@/app/lib/solana-client";

function truncateAddress(value: string) {
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export function WalletButton() {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const wallets = useWallets(client);
  const connected = useConnectedWallet(client);
  const status = useWalletStatus(client);
  const connect = useConnect(client);
  const disconnect = useDisconnect(client);

  if (!mounted || status === "pending" || status === "reconnecting") {
    return <span className="text-muted text-sm">Loading wallets…</span>;
  }

  if (connected) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <code className="notice-neutral px-4 py-2 text-sm">
          {truncateAddress(connected.account.address)}
        </code>
        <button
          type="button"
          disabled={disconnect.isRunning}
          onClick={() => disconnect.dispatch()}
          className="button-secondary text-sm"
        >
          Disconnect
        </button>
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <p className="text-muted text-sm">
        Install a compatible Solana wallet to continue.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {wallets.map((wallet) => (
        <button
          key={wallet.name}
          type="button"
          disabled={connect.isRunning}
          onClick={() => connect.dispatch(wallet)}
          className="button-coral text-sm"
        >
          Connect {wallet.name}
        </button>
      ))}
    </div>
  );
}
