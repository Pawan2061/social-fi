"use client";

import { UserProfile } from "@/types/profile/profile-types";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../ui/button";
import { BuyPassButton } from "../ui/buy-pass-button";
import { getVaultInfo } from "@/lib/nft-utils";
import { useEffect, useState, useCallback } from "react";

interface UserProfileProps {
  user: UserProfile;
}

export default function UserProfileComponent({ user }: UserProfileProps) {
  const [vaultInfo, setVaultInfo] = useState<{
    vaultAddress: string;
    balance: number;
    balanceFormatted: string;
    balanceLamports: number;
  } | null>(null);
  const [loadingVault, setLoadingVault] = useState(false);

  const loadVaultBalance = useCallback(async () => {
    if (user.pass && user.wallet) {
      setLoadingVault(true);
      try {
        const vault = await getVaultInfo(user.wallet);
        setVaultInfo(vault);
      } catch (error) {
        console.error("Failed to load vault balance:", error);
      } finally {
        setLoadingVault(false);
      }
    }
  }, [user.pass, user.wallet]);

  useEffect(() => {
    loadVaultBalance();
  }, [loadVaultBalance]);

  return (
    <Card className="border-4 border-black shadow-[6px_6px_0_0_#000] bg-white transform rotate-1 hover:rotate-0 transition-transform">
      <CardHeader className="border-b-4 border-black bg-yellow-300 pb-3">
        <CardTitle className="font-black text-xl flex items-center gap-3">
          <div className="relative">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name}
                width={60}
                height={60}
                className="w-15 h-15 border-3 border-black rounded-full object-cover shadow-[3px_3px_0_0_#000]"
              />
            ) : (
              <div className="w-15 h-15 bg-white border-3 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0_0_#000]">
                <span className="text-xl font-extrabold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {user.emailVerified && (
              <div className="absolute -top-1 -right-1 bg-green-400 border-2 border-black rounded-full w-5 h-5 flex items-center justify-center">
                <span className="text-xs font-extrabold">✓</span>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-black">{user.name}</h1>
            <p className="text-sm font-bold text-black/70">{user.email}</p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Stats Cards */}
          <div className="bg-blue-200 border-3 border-black p-3 shadow-[3px_3px_0_0_#000] transform -rotate-1">
            <h3 className="font-extrabold text-sm">Posts</h3>
            <p className="text-2xl font-black">{user.posts?.length ?? 0}</p>
          </div>

          <div className="bg-green-200 border-3 border-black p-3 shadow-[3px_3px_0_0_#000]">
            <h3 className="font-extrabold text-sm">Passes Owned</h3>
            <p className="text-2xl font-black">{user.pass ? "Yes" : "No"}</p>
          </div>

          {user.pass && (
            <div className="bg-purple-200 border-3 border-black p-3 shadow-[3px_3px_0_0_#000] transform rotate-1 col-span-2 md:col-span-1">
              <h3 className="font-extrabold text-sm">Pass Price</h3>
              <p className="text-2xl font-black">
                ${user.pass.price.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Wallet Info */}
        <div className="bg-gray-100 border-3 border-black p-3 shadow-[3px_3px_0_0_#000]">
          <h3 className="font-extrabold text-base mb-2">Wallet Address</h3>
          <p className="font-mono text-xs bg-white border-2 border-black p-2 shadow-[2px_2px_0_0_#000] break-all">
            {user.wallet}
          </p>
        </div>

        {user.pass && (
          <div className="bg-yellow-100 border-3 border-black p-3 shadow-[3px_3px_0_0_#000]">
            <h3 className="font-extrabold text-base mb-2">
              Creator&apos;s Pass
            </h3>
            <div className="space-y-1">
              <p className="font-bold text-sm">
                Token:{" "}
                <span className="font-mono text-xs">
                  {user.pass.tokenMint.slice(0, 20)}...
                </span>
              </p>
              <p className="font-bold text-sm">
                Vault:{" "}
                <span className="font-mono text-xs">
                  {user.pass.vault_address.slice(0, 20)}...
                </span>
              </p>
              <p className="font-bold text-sm">
                Created: {new Date(user.pass.createdAt).toLocaleDateString()}
              </p>

              <div className="bg-white border-2 border-black p-2 shadow-[2px_2px_0_0_#000] mt-2">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-extrabold text-sm">🏦 Vault Balance</h4>
                  <Button
                    onClick={loadVaultBalance}
                    disabled={loadingVault}
                    className="text-xs px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white border-2 border-black shadow-[2px_2px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-transform font-bold disabled:opacity-50"
                  >
                    {loadingVault ? "..." : "🔄"}
                  </Button>
                </div>
                {loadingVault ? (
                  <p className="text-sm font-bold text-gray-600">Loading...</p>
                ) : vaultInfo ? (
                  <div className="space-y-1">
                    <p className="font-bold text-lg text-green-600">
                      {vaultInfo.balanceFormatted}
                    </p>
                    <p className="text-xs font-mono text-gray-600">
                      Address: {vaultInfo.vaultAddress.slice(0, 20)}...
                    </p>
                    <p className="text-xs font-bold text-gray-700">
                      Lamports: {vaultInfo.balanceLamports.toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-red-600">
                    Failed to load
                  </p>
                )}
              </div>
            </div>
            <BuyPassButton
              passId={user.pass.id}
              tokenMint={user.pass.tokenMint}
              price={user.pass.price}
              creatorPublicKey={user.wallet}
              vaultAddress={user.pass.vault_address}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
