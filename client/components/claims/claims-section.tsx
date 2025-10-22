"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { getClaims, createClaim, voteOnClaim, Claim } from "@/lib/api";
import {
  fileClaimOnChain,
  voteOnClaimOnChain,
  generateCreatorPoolAddress,
  verifyNftOwnership,
  createNftOwnershipAccount,
} from "@/lib/nft-utils";

interface ClaimsSectionProps {
  creatorWallet: string;
  vaultBalance: number;
  vaultAddress: string;
}

interface NftData {
  mint: string;
  name: string;
  image: string;
}

export default function ClaimsSection({
  creatorWallet,
  vaultBalance,
  vaultAddress,
}: ClaimsSectionProps) {
  const { publicKey, signTransaction } = useWallet();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [userNfts, setUserNfts] = useState<NftData[]>([]);
  const [selectedNft, setSelectedNft] = useState<string>("");
  const [votingOnClaim, setVotingOnClaim] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [claimForm, setClaimForm] = useState({
    reason: "",
    evidenceIpfsHash: "",
  });

  const loadClaims = async () => {
    try {
      setLoading(true);
      const claimsData = await getClaims();
      setClaims(claimsData);
    } catch (err) {
      console.error("❌ Error loading claims:", err);
      setError(err instanceof Error ? err.message : "Failed to load claims");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadUserNfts = async () => {
      if (!publicKey) return;

      try {
        // Mock NFTs for now - in production, fetch from wallet
        const mockNfts = [
          {
            mint: "mock-nft-1",
            name: "Creator Pass #1",
            image: "https://via.placeholder.com/150",
          },
          {
            mint: "mock-nft-2",
            name: "Creator Pass #2",
            image: "https://via.placeholder.com/150",
          },
        ];
        setUserNfts(mockNfts);
        if (mockNfts.length > 0) {
          setSelectedNft(mockNfts[0].mint);
        }
      } catch (err) {
        console.error("❌ Error loading user NFTs:", err);
      }
    };

    loadClaims();
    loadUserNfts();
  }, [publicKey]);

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !signTransaction) {
      setError("Please connect your wallet");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      console.log("🔧 Creating claim for full vault amount...");
      console.log("  - Creator:", publicKey.toBase58());
      console.log("  - Vault Balance:", vaultBalance);
      console.log("  - Reason:", claimForm.reason);

      // Generate addresses
      const creatorPoolAddress = await generateCreatorPoolAddress(
        publicKey.toBase58()
      );
      // Use the actual vault address from props

      // File claim on-chain for FULL vault amount
      const onChainResult = await fileClaimOnChain(
        {
          publicKey,
          signTransaction: signTransaction as (
            transaction: unknown
          ) => Promise<unknown>,
        },
        {
          evidenceIpfsHash: claimForm.evidenceIpfsHash,
          creatorPoolAddress,
          vaultAddress,
          creatorUsdcAccount: publicKey.toBase58(),
        }
      );

      console.log("✅ On-chain claim filed:", onChainResult);

      // Create claim in backend for FULL vault amount
      const backendResult = await createClaim({
        reason: JSON.stringify({
          reason: claimForm.reason,
          amount: vaultBalance, // Full vault amount
          evidenceIpfsHash: claimForm.evidenceIpfsHash,
          creatorPoolAddress,
          vaultAddress,
          isFullVaultClaim: true,
        }),
        amount: vaultBalance, // Full vault amount
        evidenceIpfsHash: claimForm.evidenceIpfsHash,
      });

      console.log("✅ Backend claim created:", backendResult);

      setSuccess("Claim created successfully! NFT holders can now vote.");
      setClaimForm({ reason: "", evidenceIpfsHash: "" });
      setShowCreateForm(false);
      loadClaims();
    } catch (err) {
      console.error("❌ Error creating claim:", err);
      setError(err instanceof Error ? err.message : "Failed to create claim");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (claimId: string, choice: "Yes" | "No") => {
    if (!publicKey || !signTransaction) {
      setError("Please connect your wallet");
      return;
    }

    if (!selectedNft) {
      setError("Please select an NFT to vote with");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setVotingOnClaim(claimId);

      console.log("🗳️ Voting on claim:", claimId);
      console.log("  - Choice:", choice);
      console.log("  - NFT:", selectedNft);

      // Find the claim to get creator info
      const claim = claims.find((c) => c.id.toString() === claimId);
      if (!claim) {
        throw new Error("Claim not found");
      }

      // Parse the reason to get creator pool and vault addresses
      let creatorPoolAddress;
      try {
        const reasonData = JSON.parse(claim.reason);
        creatorPoolAddress = reasonData.creatorPoolAddress;
      } catch {
        throw new Error(
          "Invalid claim data - missing creator pool information"
        );
      }

      // Verify NFT ownership
      console.log("🔍 Verifying NFT ownership...");
      const nftVerification = await verifyNftOwnership(
        {
          publicKey,
          signTransaction: signTransaction as (
            transaction: unknown
          ) => Promise<unknown>,
        },
        selectedNft,
        creatorWallet // Vote for this creator's claim
      );

      if (!nftVerification.isOwner) {
        // Try to create NFT ownership account
        console.log("🔧 Creating NFT ownership account...");
        await createNftOwnershipAccount(
          {
            publicKey,
            signTransaction: signTransaction as (
              transaction: unknown
            ) => Promise<unknown>,
          },
          selectedNft,
          creatorWallet
        );
      }

      // Vote on-chain
      const onChainResult = await voteOnClaimOnChain(
        {
          publicKey,
          signTransaction: signTransaction as (
            transaction: unknown
          ) => Promise<unknown>,
        },
        {
          claimAddress: claimId,
          creatorPoolAddress,
          voteChoice: choice,
          //   nftOwnershipAddress: nftVerification.nftOwnershipAddress,
          //   creatorCollectionAddress: nftVerification.creatorCollectionAddress,
        }
      );

      console.log("✅ On-chain vote cast:", onChainResult);

      // Record vote in backend
      const backendResult = await voteOnClaim(Number(claimId), {
        choice,
        transactionSignature: onChainResult.transactionSignature,
        onchainClaimAddress: claimId,
        creatorPoolAddress,
        nftOwnershipAddress: nftVerification.nftOwnershipAddress,
        creatorCollectionAddress: nftVerification.creatorCollectionAddress,
      });

      console.log("✅ Backend vote recorded:", backendResult);

      setSuccess(
        `Vote cast successfully! Transaction: ${onChainResult.transactionSignature}`
      );
      loadClaims();
    } catch (err) {
      console.error("❌ Error voting:", err);
      setError(err instanceof Error ? err.message : "Failed to vote");
    } finally {
      setLoading(false);
      setVotingOnClaim(null);
    }
  };

  const getClaimStatus = (claim: Claim) => {
    try {
      const reasonData = JSON.parse(claim.reason);
      return reasonData.status || "Pending";
    } catch {
      return "Pending";
    }
  };

  const getClaimVotes = (claim: Claim) => {
    try {
      const reasonData = JSON.parse(claim.reason);
      return {
        yesVotes: reasonData.yesVotes || 0,
        noVotes: reasonData.noVotes || 0,
      };
    } catch {
      return { yesVotes: 0, noVotes: 0 };
    }
  };

  const getTimeRemaining = (claim: Claim) => {
    try {
      const reasonData = JSON.parse(claim.reason);
      if (reasonData.votingEndsAt) {
        const endTime = new Date(reasonData.votingEndsAt).getTime();
        const now = Date.now();
        const remaining = endTime - now;

        if (remaining <= 0) return "Voting ended";

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor(
          (remaining % (1000 * 60 * 60)) / (1000 * 60)
        );

        return `${hours}h ${minutes}m remaining`;
      }
      return "Voting in progress";
    } catch {
      return "Voting in progress";
    }
  };

  const activeClaim = claims.find(
    (claim) => getClaimStatus(claim) === "Pending"
  );

  // Prevent hydration issues by not rendering until mounted
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black">Claims & Voting</h2>
        </div>
        <div className="bg-gray-100 border-2 border-black p-6">
          <p className="text-center font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-black">Claims & Voting</h2>
        {/* {!activeClaim && vaultBalance > 0 && ( */}
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-6 py-3 bg-black text-white font-bold border-2 border-black hover:bg-white hover:text-black transition-all duration-200"
        >
          {showCreateForm ? "Cancel" : "Create Claim"}
        </button>
        {/* )} */}
      </div>

      {showCreateForm && (
        <div className="bg-yellow-100 border-2 border-black p-6">
          <h3 className="text-xl font-bold mb-4">Create New Claim</h3>
          <p className="text-sm mb-4 text-gray-700">
            You are claiming the{" "}
            <strong>entire vault amount ({vaultBalance} SOL)</strong>. NFT
            holders will vote on this claim.
          </p>
          <form onSubmit={handleCreateClaim} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Reason for Claim
              </label>
              <textarea
                value={claimForm.reason}
                onChange={(e) =>
                  setClaimForm({ ...claimForm, reason: e.target.value })
                }
                className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                rows={3}
                placeholder="Why do you need to withdraw the entire vault amount?"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Evidence (IPFS Hash)
              </label>
              <input
                type="text"
                value={claimForm.evidenceIpfsHash}
                onChange={(e) =>
                  setClaimForm({
                    ...claimForm,
                    evidenceIpfsHash: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="ipfs://..."
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-500 text-white font-bold border-2 border-black hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Claim"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2 bg-red-500 text-white font-bold border-2 border-black hover:bg-red-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Claim */}
      {/* {activeClaim && (
        <div className="bg-blue-100 border-2 border-black p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold">
              Active Claim #{activeClaim.id}
            </h3>
            <span className="px-3 py-1 bg-yellow-400 text-black font-bold border-2 border-black">
              {getClaimStatus(activeClaim)}
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-sm">
              <strong>Amount:</strong> {activeClaim.amount} SOL (Full Vault)
            </p>
            <p className="text-sm">
              <strong>Reason:</strong> {activeClaim.reason}
            </p>
            <p className="text-sm">
              <strong>Time Remaining:</strong> {getTimeRemaining(activeClaim)}
            </p>

            <div className="flex justify-between items-center text-sm">
              <span className="text-green-600 font-bold">
                Yes: {getClaimVotes(activeClaim).yesVotes}
              </span>
              <span className="text-red-600 font-bold">
                No: {getClaimVotes(activeClaim).noVotes}
              </span>
            </div>
          </div>
        </div>
      )} */}

      {/* NFT Selection for Voting */}
      {/* {activeClaim && userNfts.length > 0 && (
        <div className="bg-green-100 border-2 border-black p-6">
          <h3 className="text-xl font-bold mb-4">Select NFT to Vote</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {userNfts.map((nft) => (
              <div
                key={nft.mint}
                className={`p-3 border-2 rounded cursor-pointer transition-all ${
                  selectedNft === nft.mint
                    ? "border-black bg-yellow-400"
                    : "border-gray-400 hover:border-black"
                }`}
                onClick={() => setSelectedNft(nft.mint)}
              >
                <Image
                  src={nft.image}
                  alt={nft.name}
                  width={80}
                  height={80}
                  className="w-full h-20 object-cover rounded mb-2"
                />
                <p className="font-bold text-sm">{nft.name}</p>
              </div>
            ))}
          </div>

          {selectedNft && (
            <div className="flex gap-3">
              <button
                onClick={() => handleVote(activeClaim.id.toString(), "Yes")}
                disabled={
                  loading || votingOnClaim === activeClaim.id.toString()
                }
                className="px-6 py-2 bg-green-500 text-white font-bold border-2 border-black hover:bg-green-600 disabled:opacity-50"
              >
                {votingOnClaim === activeClaim.id.toString()
                  ? "Voting..."
                  : "Vote YES"}
              </button>
              <button
                onClick={() => handleVote(activeClaim.id.toString(), "No")}
                disabled={
                  loading || votingOnClaim === activeClaim.id.toString()
                }
                className="px-6 py-2 bg-red-500 text-white font-bold border-2 border-black hover:bg-red-600 disabled:opacity-50"
              >
                {votingOnClaim === activeClaim.id.toString()
                  ? "Voting..."
                  : "Vote NO"}
              </button>
            </div>
          )}
        </div>
      )} */}

      {/* Past Claims */}
      {/* {claims.filter((claim) => getClaimStatus(claim) !== "Pending").length >
        0 && (
        <div className="bg-gray-100 border-2 border-black p-6">
          <h3 className="text-xl font-bold mb-4">Past Claims</h3>
          <div className="space-y-3">
            {claims
              .filter((claim) => getClaimStatus(claim) !== "Pending")
              .map((claim) => {
                const votes = getClaimVotes(claim);
                const status = getClaimStatus(claim);
                return (
                  <div
                    key={claim.id}
                    className="p-4 bg-white border-2 border-black"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold">Claim #{claim.id}</h4>
                      <span
                        className={`px-2 py-1 text-xs font-bold ${
                          status === "Approved" ? "bg-green-400" : "bg-red-400"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{claim.reason}</p>
                    <div className="flex justify-between text-sm">
                      <span>Amount: {claim.amount} SOL</span>
                      <span>
                        Yes: {votes.yesVotes} | No: {votes.noVotes}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )} */}

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-100 border-2 border-red-500 text-red-700 font-bold">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-100 border-2 border-green-500 text-green-700 font-bold">
          {success}
        </div>
      )}
    </div>
  );
}
