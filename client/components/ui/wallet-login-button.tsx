import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";

// This is for test matra aaile lai 

export default function WalletAuthButton() {
  const { publicKey, signMessage, connected, disconnect, wallet } = useWallet();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("authToken");
    if (stored) setToken(stored);
  }, []);

  useEffect(() => {
    const login = async () => {
      if (!connected || !publicKey || !signMessage || token) return;

      const address = publicKey.toBase58();
      const res = await fetch("http://localhost:4000/auth/request-nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const { nonce } = await res.json();

      const encoded = new TextEncoder().encode(nonce);
      const sigBytes = await signMessage(encoded);
      const signature = bs58.encode(sigBytes);

      const verify = await fetch("http://localhost:4000/auth/verify-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature }),
      });

      if (verify.ok) {
        const data = await verify.json();
        localStorage.setItem("authToken", data.token);
        setToken(data.token);
        console.log("✅ Logged in");
      }
    };

    login();
  }, [connected, publicKey, signMessage, token]);

  useEffect(() => {
    if (!connected && token) {
      localStorage.removeItem("authToken");
      setToken(null);
      console.log("❌ Wallet disconnected, token cleared");
    }
  }, [connected]);

  return (
    <div className="flex flex-col items-center">
      <WalletMultiButton />
      <p className="mt-2 text-sm">{token ? " Logged in" : " Not logged in"}</p>
    </div>
  );
}
