"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function WalletAuthButton() {
  const router = useRouter();
  const { publicKey, signMessage, connected } = useWallet();
  const { token, user, setToken, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  // Auto-login when wallet connects
  useEffect(() => {
    const login = async () => {
      if (!connected || !publicKey || !signMessage || token) return;

      try {
        const address = publicKey.toBase58();

        // Request nonce
        const res = await fetch("http://localhost:4000/auth/request-nonce", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });
        const { nonce } = await res.json();

        // Sign nonce
        const encoded = new TextEncoder().encode(nonce);
        const sigBytes = await signMessage(encoded);
        const signature = bs58.encode(sigBytes);

        // Verify signature and get token
        const verify = await fetch(
          "http://localhost:4000/auth/verify-signature",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address, signature }),
          }
        );

        if (verify.ok) {
          const data = await verify.json();
          setToken(data.token);
          console.log("✅ Logged in");
        }
      } catch (error) {
        console.error("❌ Login failed:", error);
      }
    };

    login();
  }, [connected, publicKey, signMessage, token, setToken]);

  // Redirect to feed when authenticated and onboarded
  useEffect(() => {
    if (token && user?.onboarded) {
      router.push("/feed");
    }
  }, [token, user, router]);

  // Auto-logout when wallet disconnects
  useEffect(() => {
    if (!connected && token) {
      logout();
      router.push("/");
      console.log("❌ Wallet disconnected, logged out");
    }
  }, [connected, token, logout, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
    setShowDropdown(false);
  };

  return (
    <div className="flex items-center gap-3">
      {/* User dropdown when authenticated and onboarded */}
      {token && user?.onboarded && (
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 bg-white border-2 border-foreground px-3 py-1.5 shadow-[3px_3px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform"
          >
            <div className="w-6 h-6 bg-yellow-300 border-2 border-foreground rounded-full flex items-center justify-center">
              <span className="text-xs font-extrabold">
                {user.name?.charAt(0).toUpperCase() || "?"}
              </span>
            </div>
            <span className="text-sm font-bold hidden sm:block">
              {user.name}
            </span>
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white border-4 border-foreground shadow-[6px_6px_0_0_#000] z-20">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left font-bold hover:bg-red-100 transition-colors border-b-2 border-foreground"
                >
                  🚪 Logout
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <WalletMultiButton />
    </div>
  );
}
