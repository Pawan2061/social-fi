"use client";

import WalletAuthButton from "@/components/ui/wallet-login-button";

export default function TestWalletPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center space-y-6">
      <h1 className="text-2xl font-bold">🔐 Wallet Login Test</h1>

      {/* Single button = connect + login */}
      <WalletAuthButton />
    </main>
  );
}
