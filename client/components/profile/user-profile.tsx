"use client";

// TODO : fix the profile image upload issue

import { UserProfile } from "@/types/profile/profile-types";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../ui/button";
import { BuyPassButton } from "../ui/buy-pass-button";
import { getVaultInfo } from "@/lib/nft-utils";
import { useEffect, useState, useCallback } from "react";
import ClaimsSection from "../claims/claims-section";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfileProps {
  user: UserProfile;
}

export default function UserProfileComponent({ user }: UserProfileProps) {
  const { user: authUser } = useAuth();
  const [vaultInfo, setVaultInfo] = useState<{
    vaultAddress: string;
    balance: number;
    balanceFormatted: string;
    balanceLamports: number;
  } | null>(null);
  const [loadingVault, setLoadingVault] = useState(false);

  // Edit state (local-only so we don't disturb other usages of `user`)
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(user.name || "");
  const [displayImage, setDisplayImage] = useState<string | null>(
    user.image || null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Debug logging
  console.log("UserProfileComponent - user.pass:", user.pass);
  console.log(
    "UserProfileComponent - user.passSalesStats:",
    user.passSalesStats
  );

  const initial = (displayName || "").trim().charAt(0).toUpperCase();
  const isOwnProfile = authUser?.id === user.id;

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "";
  const api = (path: string) => {
    // If no API_BASE, we expect a Next.js rewrite for the same-origin path
    if (!API_BASE && !path.startsWith("/"))
      throw new Error("API path must start with /");
    return `${API_BASE}${path}`;
  };

  const signUpload = async (file: File) => {
    const token = localStorage.getItem("authToken");
    const r = await fetch(api("/users/profile-picture/sign-upload"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({ fileName: file.name, fileType: file.type }),
    });
    if (!r.ok) throw new Error("Failed to sign upload URL");
    return (await r.json()) as { uploadUrl: string; key: string };
  };

  const putToSignedUrl = async (uploadUrl: string, file: File) => {
    const token = localStorage.getItem("authToken");

    const r = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type, Authorization: `Bearer ${token}` },
      body: file,
    });
    if (!r.ok) throw new Error("Failed to upload file");
  };

  const updateProfile = async (payload: {
    name?: string;
    image?: string | null;
  }) => {
    const token = localStorage.getItem("authToken");
    const r = await fetch(api("/users/me"), {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error("Failed to update profile");
    return await r.json();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setSaveError(null);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const onSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);

      let imageKey: string | undefined = undefined;
      if (selectedFile) {
        const { uploadUrl, key } = await signUpload(selectedFile);
        await putToSignedUrl(uploadUrl, selectedFile);
        imageKey = key; // send this to backend; server resolves URL
      }

      const payload: { name?: string; image?: string | null } = {};
      if (displayName && displayName !== user.name) payload.name = displayName;
      if (imageKey) payload.image = imageKey;

      if (Object.keys(payload).length === 0) {
        setEditMode(false);
        return;
      }

      const updated = await updateProfile(payload);

      // Update local display only (do not alter other `user` usages)
      setDisplayName(updated.name || displayName);
      setDisplayImage(updated.image ?? displayImage);
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setEditMode(false);
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : typeof e === "string"
          ? e
          : "Failed to save changes";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    setEditMode(false);
    setSaveError(null);
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setDisplayName(user.name || "");
  };

  const loadVaultBalance = useCallback(async () => {
    if (user.pass && user.pass.vault_address) {
      setLoadingVault(true);
      try {
        const vault = await getVaultInfo(user.pass.vault_address);
        setVaultInfo(vault);
      } catch (error) {
        console.error("Failed to load vault balance:", error);
      } finally {
        setLoadingVault(false);
      }
    }
  }, [user.pass]);

  useEffect(() => {
    loadVaultBalance();
  }, [loadVaultBalance]);

  return (
    <Card className="border-4 border-black shadow-[6px_6px_0_0_#000] bg-white transform rotate-1 hover:rotate-0 transition-transform">
      <CardHeader className="border-b-4 border-black bg-yellow-300 pb-3">
        <CardTitle className="font-black text-xl flex items-center gap-3">
          <div className="relative">
            {displayImage ? (
              <Image
                src={previewUrl || displayImage}
                alt={displayName || "User"}
                width={60}
                height={60}
                className="w-15 h-15 border-3 border-black rounded-full object-cover shadow-[3px_3px_0_0_#000]"
              />
            ) : previewUrl ? (
              <Image
                src={previewUrl}
                alt={displayName || "User"}
                width={60}
                height={60}
                className="w-15 h-15 border-3 border-black rounded-full object-cover shadow-[3px_3px_0_0_#000]"
              />
            ) : (
              <div className="w-15 h-15 bg-white border-3 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0_0_#000]">
                <span className="text-xl font-extrabold">{initial || "?"}</span>
              </div>
            )}
            {user.emailVerified && (
              <div className="absolute -top-1 -right-1 bg-green-400 border-2 border-black rounded-full w-5 h-5 flex items-center justify-center">
                <span className="text-xs font-extrabold">✓</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-black truncate">{displayName}</h1>
            <p className="text-sm font-bold text-black/70 truncate">
              {user.email}
            </p>
          </div>
          <Button
            onClick={() => setEditMode((v) => !v)}
            className="text-xs px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white border-2 border-black shadow-[2px_2px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-transform font-bold"
          >
            {editMode ? "Close" : "Edit"}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {editMode && (
          <div className="bg-white border-3 border-black p-3 shadow-[3px_3px_0_0_#000] -mt-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-extrabold mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full border-3 border-black p-2 rounded-sm outline-none focus:ring-0"
                  placeholder="Enter your name"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-extrabold mb-1">
                  Profile Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="w-full border-3 border-black p-2 rounded-sm bg-white"
                />
              </div>
            </div>

            {saveError && (
              <p className="text-sm font-bold text-red-600 mt-2">
                Error: {saveError}
              </p>
            )}

            <div className="flex gap-2 mt-3">
              <Button
                onClick={onSave}
                disabled={saving}
                className="text-xs px-3 py-1 bg-green-500 hover:bg-green-600 text-white border-2 border-black shadow-[2px_2px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-transform font-bold disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                onClick={onCancel}
                disabled={saving}
                className="text-xs px-3 py-1 bg-gray-300 hover:bg-gray-400 text-black border-2 border-black shadow-[2px_2px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-transform font-bold disabled:opacity-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Stats (compact chips) */}
        <div className="flex flex-wrap gap-2">
          <div className="px-2 py-1 bg-blue-200 border-2 border-black text-xs font-black shadow-[2px_2px_0_0_#000]">
            <span className="opacity-70">Posts:</span>
            <span className="ml-1 font-mono text-[11px]">
              {user.posts?.length ?? 0}
            </span>
          </div>

          <div className="px-2 py-1 bg-green-200 border-2 border-black text-xs font-black shadow-[2px_2px_0_0_#000]">
            <span className="opacity-70">Pass Owned:</span>
            <span className="ml-1 text-[11px]">{user.pass ? "Yes" : "No"}</span>
          </div>

          {user.pass && (
            <div className="px-2 py-1 bg-purple-200 border-2 border-black text-xs font-black shadow-[2px_2px_0_0_#000]">
              <span className="opacity-70">Price:</span>
              <span className="ml-1 text-[11px]">
                ${user.pass.price.toFixed(2)}
              </span>
            </div>
          )}

          {user.pass && (
            <div className="px-2 py-1 bg-orange-200 border-2 border-black text-xs font-black shadow-[2px_2px_0_0_#000]">
              <span className="opacity-70">Sold:</span>
              <span className="ml-1 text-[11px]">
                {user.passSalesStats?.totalPassesSold ?? 0}
              </span>
            </div>
          )}

          {user.pass && (
            <div className="px-2 py-1 bg-pink-200 border-2 border-black text-xs font-black shadow-[2px_2px_0_0_#000]">
              <span className="opacity-70">Holders:</span>
              <span className="ml-1 text-[11px]">
                {user.passSalesStats?.uniqueHolders ?? 0}
              </span>
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
          <div className="bg-yellow-100 border-4 border-black rounded-md p-3 shadow-[4px_4px_0_0_#000] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-black text-sm text-black uppercase tracking-wide">
                🎟️ Creator&apos;s Pass
              </h3>
              {!isOwnProfile && (
                <div className="shrink-0">
                  <BuyPassButton
                    passId={user.pass.id}
                    tokenMint={user.pass.tokenMint}
                    price={user.pass.price}
                    creatorPublicKey={user.wallet}
                    vaultAddress={user.pass.vault_address}
                  />
                </div>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <div className="px-2 py-1 bg-white border-2 border-black text-xs font-bold shadow-[2px_2px_0_0_#000]">
                <span className="opacity-70">Token:</span>
                <span className="ml-1 font-mono text-[10px] text-gray-800">
                  {user.pass.tokenMint.slice(0, 20)}...
                </span>
              </div>
              <div className="px-2 py-1 bg-white border-2 border-black text-xs font-bold shadow-[2px_2px_0_0_#000]">
                <span className="opacity-70">Vault:</span>
                <span className="ml-1 font-mono text-[10px] text-gray-800">
                  {user.pass.vault_address.slice(0, 20)}...
                </span>
              </div>
              <div className="px-2 py-1 bg-white border-2 border-black text-xs font-black shadow-[2px_2px_0_0_#000]">
                ${user.pass.price.toFixed(2)}
              </div>
              <div className="px-2 py-1 bg-white border-2 border-black text-xs font-bold shadow-[2px_2px_0_0_#000]">
                <span className="opacity-70">Created:</span>
                <span className="ml-1 text-[10px]">
                  {new Date(user.pass.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Vault (compact) */}
            <div className="mt-3 bg-white border-3 border-black p-2 rounded-sm shadow-[3px_3px_0_0_#000]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold">🏦 Vault</span>
                  <span className="px-2 py-0.5 bg-green-200 border-2 border-black text-[11px] font-black shadow-[2px_2px_0_0_#000]">
                    {loadingVault
                      ? "Loading..."
                      : vaultInfo
                      ? vaultInfo.balanceFormatted
                      : "—"}
                  </span>
                </div>
                <Button
                  onClick={loadVaultBalance}
                  disabled={loadingVault}
                  className="h-7 text-[11px] px-2 bg-blue-600 hover:bg-blue-700 text-white border-2 border-black shadow-[2px_2px_0_0_#000] font-bold rounded-sm transition-all active:translate-x-0 active:translate-y-0 disabled:opacity-60"
                >
                  {loadingVault ? "..." : "🔄"}
                </Button>
              </div>

              {vaultInfo && !loadingVault && (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <p className="text-[11px] font-mono text-gray-700">
                    Addr: {vaultInfo.vaultAddress.slice(0, 20)}...
                  </p>
                  <p className="text-[11px] font-mono text-gray-700">
                    Lamports: {vaultInfo.balanceLamports.toLocaleString()}
                  </p>
                </div>
              )}
              {!vaultInfo && !loadingVault && (
                <p className="mt-2 text-[11px] font-bold text-red-600">
                  Failed to load
                </p>
              )}
            </div>
          </div>
        )}

        {user.pass && vaultInfo && (
          <div className="mt-4">
            <ClaimsSection
              creatorWallet={user.wallet}
              vaultBalance={vaultInfo.balance}
              vaultAddress={vaultInfo.vaultAddress}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
