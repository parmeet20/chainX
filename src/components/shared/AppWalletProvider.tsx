"use client";

import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

// imports here

export default function AppWalletProvider({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const endpoint = useMemo(() => "http://localhost:8899", []);
    const wallets = useMemo(
      () => [
        // manually add any wallet adapters you plan to use here
        // e.g., new UnsafeBurnerWalletAdapter(),
      ],
      []
    );
    return (
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    );
  }