"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { requestNonce, verifySignature } from "@/lib/api";
import Image from "next/image";
import dynamic from "next/dynamic";

// Dynamically import WalletMultiButton to prevent hydration issues
const DynamicWalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((mod) => ({
      default: mod.WalletMultiButton,
    })),
  {
    ssr: false,
    loading: () => (
      <button className="wallet-adapter-button wallet-adapter-button-trigger">
        <span>Loading...</span>
      </button>
    ),
  }
);

export default function WalletAuthButton() {
  const router = useRouter();
  const { publicKey, signMessage, connected } = useWallet();
  const { token, user, setToken, logout, isLoading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [walletInitialized, setWalletInitialized] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  useEffect(() => {
    const login = async () => {
      // Wait for auth context to initialize and don't login if already has token
      if (!connected || !publicKey || !signMessage || token || isLoading)
        return;

      try {
        const address = publicKey.toBase58();

        const { nonce } = await requestNonce(address);

        const encoded = new TextEncoder().encode(nonce);
        const sigBytes = await signMessage(encoded);
        const signature = bs58.encode(sigBytes);

        const { token: newToken } = await verifySignature(address, signature);
        setToken(newToken);
        setJustLoggedIn(true);
        console.log("✅ Logged in");
      } catch (error) {
        console.error("❌ Login failed:", error);
      }
    };

    login();
  }, [connected, publicKey, signMessage, token, setToken, isLoading]);

  useEffect(() => {
    if (user?.onboarded && justLoggedIn) {
      router.push("/feed");
      setJustLoggedIn(false);
    }
  }, [user, router, justLoggedIn]);

  useEffect(() => {
    if (connected || publicKey) {
      setWalletInitialized(true);
    }
  }, [connected, publicKey]);

  useEffect(() => {
    if (!connected && token && walletInitialized) {
      logout();
      router.push("/");
      console.log("❌ Wallet disconnected, logged out");
    }
  }, [connected, token, logout, router, walletInitialized]);

  const handleLogout = () => {
    logout();
    router.push("/");
    setShowDropdown(false);
  };

  return (
    <div className="flex items-center gap-3">
      {token && user?.onboarded && (
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 bg-white border-2 border-foreground px-3 py-1.5 shadow-[3px_3px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform"
          >
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || "User"}
                width={24}
                height={24}
                className="w-6 h-6 border-2 border-foreground rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 bg-yellow-300 border-2 border-foreground rounded-full flex items-center justify-center">
                <span className="text-xs font-extrabold">
                  {user.name?.charAt(0).toUpperCase() || "?"}
                </span>
              </div>
            )}
            <span className="text-sm font-bold hidden sm:block">
              {user.name}
            </span>
          </button>

          {/* {showDropdown && (
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
          )} */}
        </div>
      )}

      <DynamicWalletMultiButton />
    </div>
  );
}
