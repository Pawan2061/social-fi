"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {
  getClaims,
  createClaim,
  voteOnClaim,
  finalizeClaimWithDistribution,
  Claim,
  getVoteCounts,
} from "@/lib/api";
import {
  fileClaimOnChain,
  voteOnClaimOnChain,
  finalizeClaimWithDistributionOnChain,
  generateCreatorPoolAddress,
  generateClaimAddress,
} from "@/lib/nft-utils";
import { useAuth } from "../../contexts/AuthContext";

export default function ClaimsPage() {
  const { publicKey, signTransaction } = useWallet();
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [voteCounts, setVoteCounts] = useState<
    Record<
      number,
      {
        yesVotes: number;
        noVotes: number;
        userVote: { approve: boolean } | null;
        timeRemaining?: number;
      }
    >
  >({});
  const [newClaim, setNewClaim] = useState({
    reason: "",
    amount: 0,
    evidenceIpfsHash: "",
  });

  useEffect(() => {
    loadClaims();
  }, []);

  // Update countdown timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setVoteCounts((prevCounts) => {
        const updatedCounts = { ...prevCounts };
        let hasChanges = false;

        Object.keys(updatedCounts).forEach((claimId) => {
          const claimIdNum = parseInt(claimId);
          const claim = claims.find((c) => c.id === claimIdNum);
          if (
            claim &&
            updatedCounts[claimIdNum]?.timeRemaining &&
            updatedCounts[claimIdNum].timeRemaining > 0
          ) {
            const votingWindow = 2 * 60 * 1000; // 2 minutes
            const timeRemaining = Math.max(
              0,
              votingWindow - (Date.now() - new Date(claim.createdAt).getTime())
            );

            if (timeRemaining !== updatedCounts[claimIdNum].timeRemaining) {
              updatedCounts[claimIdNum] = {
                ...updatedCounts[claimIdNum],
                timeRemaining,
              };
              hasChanges = true;
            }
          }
        });

        return hasChanges ? updatedCounts : prevCounts;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [claims]);

  const loadClaims = async () => {
    try {
      setLoading(true);
      const claimsData = await getClaims();
      setClaims(claimsData);

      const voteCountPromises = claimsData.map(async (claim) => {
        try {
          const counts = await getVoteCounts(claim.id);
          return { claimId: claim.id, counts };
        } catch (err) {
          console.error(
            `Failed to load vote counts for claim ${claim.id}:`,
            err
          );
          return {
            claimId: claim.id,
            counts: { yesVotes: 0, noVotes: 0, userVote: null },
          };
        }
      });

      const voteCountResults = await Promise.all(voteCountPromises);
      const voteCountsMap: Record<
        number,
        {
          yesVotes: number;
          noVotes: number;
          userVote: { approve: boolean } | null;
          timeRemaining: number;
        }
      > = {};

      voteCountResults.forEach(({ claimId, counts }) => {
        const votingWindow = 3 * 60 * 1000; // 3 minutes
        const timeRemaining = Math.max(
          0,
          votingWindow -
            (Date.now() -
              new Date(
                claimsData.find((c) => c.id === claimId)?.createdAt || 0
              ).getTime())
        );

        voteCountsMap[claimId] = {
          ...counts,
          timeRemaining: timeRemaining > 0 ? timeRemaining : 0,
        };
      });

      setVoteCounts(voteCountsMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load claims");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !signTransaction) {
      setError("Wallet not connected");
      return;
    }

    try {
      setLoading(true);

      console.log("🔧 Creating claim with real addresses...");
      console.log("  - Creator:", publicKey.toBase58());
      console.log("  - Reason:", newClaim.reason);
      console.log("  - Amount:", newClaim.amount);

      const creatorPoolAddress = generateCreatorPoolAddress(
        publicKey.toBase58()
      );

      // Get the actual vault address from the user's pass data
      if (!user?.pass?.vault_address) {
        throw new Error("No vault address found in user pass data");
      }
      const vaultAddress = user.pass.vault_address;

      const evidenceIpfsHash =
        newClaim.evidenceIpfsHash || `ipfs://claim-${Date.now()}`;

      console.log("🔍 Using actual addresses:", {
        creatorPool: creatorPoolAddress,
        vault: vaultAddress,
        evidence: evidenceIpfsHash,
      });

      try {
        const onchainResult = await fileClaimOnChain(
          {
            publicKey,
            signTransaction: signTransaction as (
              transaction: unknown
            ) => Promise<unknown>,
          },
          {
            evidenceIpfsHash,
            creatorPoolAddress,
            vaultAddress,
            creatorUsdcAccount: publicKey.toBase58(),
          }
        );

        console.log("✅ On-chain claim filed:", onchainResult);

        await createClaim({
          reason: JSON.stringify({
            reason: newClaim.reason,
            amount: newClaim.amount,
            evidenceIpfsHash,
            creatorPoolAddress,
            vaultAddress,
            onchainClaimAddress: onchainResult.claimAddress,
          }),
          amount: newClaim.amount,
          evidenceIpfsHash,
        });

        console.log("✅ Backend claim created successfully");
      } catch (onchainError) {
        console.error("❌ On-chain claim filing failed:", onchainError);
        throw new Error(
          `Failed to file claim on-chain: ${
            onchainError instanceof Error
              ? onchainError.message
              : "Unknown error"
          }`
        );
      }

      setNewClaim({ reason: "", amount: 0, evidenceIpfsHash: "" });
      setShowCreateForm(false);
      await loadClaims();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create claim");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (claimId: number, choice: "Yes" | "No") => {
    if (!publicKey || !signTransaction) {
      setError("Wallet not connected");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const claim = claims.find((c) => c.id === claimId);
      if (!claim) {
        throw new Error("Claim not found");
      }

      let creatorPoolAddress, vaultAddress;
      try {
        console.log("🔍 Claim reason data:", claim.reason);
        const reasonData = JSON.parse(claim.reason);
        console.log("🔍 Parsed reason data:", reasonData);

        if (reasonData.creatorPoolAddress) {
          creatorPoolAddress = reasonData.creatorPoolAddress;
          vaultAddress = reasonData.vaultAddress;
        } else if (
          reasonData.onchainData &&
          reasonData.onchainData.creatorPoolAddress
        ) {
          creatorPoolAddress = reasonData.onchainData.creatorPoolAddress;
          vaultAddress = reasonData.onchainData.vaultAddress;
        } else if (reasonData.originalReason) {
          try {
            const originalReasonData = JSON.parse(reasonData.originalReason);
            creatorPoolAddress = originalReasonData.creatorPoolAddress;
            vaultAddress = originalReasonData.vaultAddress;
          } catch (nestedParseError) {
            console.log("❌ Failed to parse originalReason:", nestedParseError);
            throw new Error("Could not parse nested originalReason data");
          }
        } else {
          throw new Error("No recognized data structure found");
        }

        console.log("🔍 Extracted addresses:", {
          creatorPoolAddress,
          vaultAddress,
          claimId,
        });

        if (!creatorPoolAddress) {
          console.log(
            "⚠️ creatorPoolAddress not found, generating from creator..."
          );
          if (claim.creator && claim.creator.wallet) {
            creatorPoolAddress = generateCreatorPoolAddress(
              claim.creator.wallet
            );
            console.log("🔧 Generated creatorPoolAddress:", creatorPoolAddress);
          } else {
            throw new Error(
              "creatorPoolAddress not found in claim data and no creator wallet address available"
            );
          }
        }
      } catch (parseError) {
        console.error("❌ Error parsing claim data:", parseError);
        if (claim.creator && claim.creator.wallet) {
          console.log("🔄 Fallback: generating addresses from creator wallet");
          creatorPoolAddress = generateCreatorPoolAddress(claim.creator.wallet);
          vaultAddress = "unknown";
          console.log(
            "🔧 Generated fallback creatorPoolAddress:",
            creatorPoolAddress
          );
        } else {
          throw new Error(
            "Invalid claim data - missing creator pool information and no creator wallet address"
          );
        }
      }

      let claimAddress;
      try {
        const reasonData = JSON.parse(claim.reason);
        if (reasonData.onchainClaimAddress) {
          claimAddress = reasonData.onchainClaimAddress;
        } else {
          let foundClaimAddress = null;
          let foundClaimCount = -1;

          for (let i = 0; i < 10; i++) {
            const testClaimAddress = generateClaimAddress(
              creatorPoolAddress,
              i
            );
            try {
              const connection = new Connection(clusterApiUrl("devnet"));
              const accountInfo = await connection.getAccountInfo(
                new PublicKey(testClaimAddress)
              );
              if (accountInfo) {
                foundClaimAddress = testClaimAddress;
                foundClaimCount = i;
                break;
              }
            } catch (error) {
              console.log(`Claim at count ${i} doesn't exist:`, error);
              continue;
            }
          }

          if (foundClaimAddress) {
            claimAddress = foundClaimAddress;
            console.log(
              "✅ Found existing on-chain claim address:",
              claimAddress,
              "at count:",
              foundClaimCount
            );
          } else {
            throw new Error(
              "Could not find corresponding on-chain claim account"
            );
          }
        }
      } catch (parseError) {
        console.error(
          "❌ Error parsing claim data for claim address:",
          parseError
        );
        throw new Error(
          "Invalid claim data - could not determine on-chain claim address"
        );
      }

      console.log("🔧 Generating PDA addresses for NFT verification...");

      const creatorWalletAddress = claim.creator.wallet;
      if (!creatorWalletAddress) {
        throw new Error("Creator wallet address not found");
      }

      const onChainResult = await voteOnClaimOnChain(
        {
          publicKey,
          signTransaction: signTransaction as (
            transaction: unknown
          ) => Promise<unknown>,
        },
        {
          claimAddress,
          creatorPoolAddress,
          voteChoice: choice,
        }
      );

      await voteOnClaim(claimId, {
        choice,
        transactionSignature: onChainResult.transactionSignature,
        onchainClaimAddress: claimAddress,
        creatorPoolAddress,
      });

      setSuccess(`Vote recorded successfully!`);
      await loadClaims();
    } catch (err) {
      console.error("❌ Error voting:", err);
      setError(err instanceof Error ? err.message : "Failed to vote");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async (claimId: number) => {
    if (!publicKey || !signTransaction) {
      setError("Wallet not connected");
      return;
    }

    try {
      setLoading(true);

      const claim = claims.find((c) => c.id === claimId);
      if (!claim) {
        throw new Error("Claim not found");
      }

      const voteData = voteCounts[claimId];
      const yesVotes = voteData?.yesVotes || 0;
      const noVotes = voteData?.noVotes || 0;
      const result = yesVotes > noVotes ? "approved" : "rejected";

      let creatorPoolAddress, vaultAddress, claimAddress;

      try {
        const reasonData = JSON.parse(claim.reason);
        console.log("🔍 Raw reasonData:", reasonData);

        // Try to get addresses from the reason data first
        if (reasonData.creatorPoolAddress && reasonData.vaultAddress) {
          creatorPoolAddress = reasonData.creatorPoolAddress;
          vaultAddress = reasonData.vaultAddress;
          console.log("✅ Extracted from reasonData:", {
            creatorPoolAddress,
            vaultAddress,
          });
        } else if (reasonData.originalReason) {
          const originalReasonData = JSON.parse(reasonData.originalReason);
          creatorPoolAddress = originalReasonData.creatorPoolAddress;
          vaultAddress = originalReasonData.vaultAddress;
          console.log("✅ Extracted from originalReason:", {
            creatorPoolAddress,
            vaultAddress,
          });
        } else {
          throw new Error(
            "Cannot determine creator pool addresses - vault address not found in claim data"
          );
        }

        if (creatorPoolAddress) {
          console.log("🔍 Searching for claimAddress on-chain...");

          for (let i = 0; i < 10; i++) {
            const testClaimAddress = generateClaimAddress(
              creatorPoolAddress,
              i
            );
            try {
              const connection = new Connection(clusterApiUrl("devnet"));
              const accountInfo = await connection.getAccountInfo(
                new PublicKey(testClaimAddress)
              );
              if (accountInfo) {
                claimAddress = testClaimAddress;
                console.log(
                  "✅ Found claimAddress:",
                  claimAddress,
                  "at count:",
                  i
                );
                break;
              }
            } catch (error) {
              console.log(`Claim at count ${i} doesn't exist:`, error);
              continue;
            }
          }
        }
      } catch (parseError) {
        console.error("❌ Error parsing claim data:", parseError);
        throw new Error("Cannot parse claim data - vault address not found");
      }

      console.log("🔍 Final addresses:", {
        claimAddress,
        creatorPoolAddress,
        vaultAddress,
        claimId,
      });

      if (!claimAddress || !creatorPoolAddress || !vaultAddress) {
        throw new Error("Missing required on-chain addresses");
      }
      console.log("🔧 Finalizing claim with real on-chain transfer:", {
        claimAddress,
        creatorPoolAddress,
        vaultAddress,
        result,
      });

      const onchainResult = await finalizeClaimWithDistributionOnChain(
        {
          publicKey,
          signTransaction: signTransaction as (
            transaction: unknown
          ) => Promise<unknown>,
        },
        claimAddress,
        creatorPoolAddress,
        vaultAddress
      );

      console.log(
        "✅ On-chain claim finalized with distribution:",
        onchainResult
      );

      await finalizeClaimWithDistribution(claimId, {
        transactionSignature: onchainResult.transactionSignature,
        onchainClaimAddress: claimAddress,
        creatorPoolAddress,
        result: onchainResult.result,
        distributedAmount: onchainResult.distributedAmount,
      });

      setSuccess(
        `Claim ${onchainResult.result}! ${
          onchainResult.result === "approved"
            ? `Creator received ${onchainResult.distributedAmount} SOL`
            : `Funds distributed to NFT holders`
        }`
      );

      await loadClaims();
    } catch (err) {
      console.error("❌ Error finalizing claim:", err);
      setError(err instanceof Error ? err.message : "Failed to finalize claim");
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (milliseconds: number) => {
    if (milliseconds <= 0) return "Voting ended";

    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, "0")} remaining`;
  };

  const isVotingActive = (claimId: number) => {
    const voteData = voteCounts[claimId];
    return voteData && voteData.timeRemaining && voteData.timeRemaining > 0;
  };

  const hasUserVoted = (claimId: number) => {
    const voteData = voteCounts[claimId];
    return voteData && voteData.userVote !== null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading claims...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Claims</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {showCreateForm ? "Cancel" : "Create Claim"}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Create New Claim</h2>
            <form onSubmit={handleCreateClaim} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  value={newClaim.reason}
                  onChange={(e) =>
                    setNewClaim({ ...newClaim, reason: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (SOL)
                </label>
                <input
                  type="number"
                  value={newClaim.amount}
                  onChange={(e) =>
                    setNewClaim({
                      ...newClaim,
                      amount: parseFloat(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Evidence IPFS Hash
                </label>
                <input
                  type="text"
                  value={newClaim.evidenceIpfsHash}
                  onChange={(e) =>
                    setNewClaim({
                      ...newClaim,
                      evidenceIpfsHash: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ipfs://..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Create Claim
              </button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {claims.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-yellow-800 mb-2">
                  No Claims Available
                </h3>
                <p className="text-yellow-700 mb-4">
                  You don&apos;t have any NFTs from creators who have filed
                  claims.
                </p>
                <p className="text-sm text-yellow-600">
                  To see claims, you need to own NFTs from creators who have
                  created claims.
                </p>
              </div>
            </div>
          ) : (
            claims.map((claim) => (
              <div key={claim.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Claim #{claim.id}
                    </h3>
                    <p className="text-sm text-gray-500">
                      by {claim.creator.name || "Unknown Creator"}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      claim.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : claim.status === "REJECTED"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {claim.status}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 mb-2">
                    <strong>Reason:</strong> {claim.reason}
                  </p>
                  <p className="text-gray-700 mb-2">
                    <strong>Amount:</strong> {claim.amount} SOL
                  </p>

                  {voteCounts[claim.id] && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex space-x-4">
                          <span className="text-green-600 font-medium">
                            Yes: {voteCounts[claim.id].yesVotes}
                          </span>
                          <span className="text-red-600 font-medium">
                            No: {voteCounts[claim.id].noVotes}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatTimeRemaining(
                            voteCounts[claim.id].timeRemaining || 0
                          )}
                        </div>
                      </div>

                      {hasUserVoted(claim.id) && (
                        <div className="text-sm text-blue-600 font-medium">
                          ✓ You voted:{" "}
                          {voteCounts[claim.id].userVote?.approve
                            ? "Yes"
                            : "No"}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleVote(claim.id, "Yes")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      !isVotingActive(claim.id) ||
                      hasUserVoted(claim.id) ||
                      claim.status !== "PENDING"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                    disabled={
                      !isVotingActive(claim.id) ||
                      hasUserVoted(claim.id) ||
                      claim.status !== "PENDING"
                    }
                  >
                    {hasUserVoted(claim.id) ? "Already Voted" : "Vote Yes"}
                  </button>
                  <button
                    onClick={() => handleVote(claim.id, "No")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      !isVotingActive(claim.id) ||
                      hasUserVoted(claim.id) ||
                      claim.status !== "PENDING"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                    disabled={
                      !isVotingActive(claim.id) ||
                      hasUserVoted(claim.id) ||
                      claim.status !== "PENDING"
                    }
                  >
                    {hasUserVoted(claim.id) ? "Already Voted" : "Vote No"}
                  </button>
                  {claim.creatorId === user?.id &&
                    claim.status === "PENDING" && ( // Mock check for creator
                      <button
                        onClick={() => handleFinalize(claim.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Finalize & Transfer SOL
                      </button>
                    )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
