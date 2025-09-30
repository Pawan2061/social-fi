"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";

export default function WalletAuthButton() {
  const { publicKey, signMessage, connected } = useWallet();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const login = async () => {
      if (!publicKey || !signMessage || loggedIn) return;

      try {
        const address = publicKey.toBase58();

        // 1️⃣ Request nonce from backend
        const res = await fetch("http://localhost:4000/auth/request-nonce", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });
        const { nonce } = await res.json();

        // 2️⃣ Sign nonce with wallet
        const encoded = new TextEncoder().encode(nonce);
        const sigBytes = await signMessage(encoded);
        const signature = bs58.encode(sigBytes);

        // 3️⃣ Verify with backend
        const verify = await fetch(
          "http://localhost:4000/auth/verify-signature",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address, signature }),
          }
        );

        if (verify.ok) {
          console.log("✅ Logged in successfully");
          setLoggedIn(true);
        } else {
          console.error("❌ Login failed");
        }
      } catch (err) {
        console.error("Login error:", err);
      }
    };

    if (connected) {
      login();
    }
  }, [connected, publicKey, signMessage, loggedIn]);

  return <WalletMultiButton />;
}
