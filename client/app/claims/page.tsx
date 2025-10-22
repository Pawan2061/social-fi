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

  // Pagination and filtering states
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const claimsPerPage = 5;

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

      // Check if vault exists before finalization
      const connection = new Connection(clusterApiUrl("devnet"));
      const vaultAccountInfo = await connection.getAccountInfo(
        new PublicKey(vaultAddress)
      );

      if (!vaultAccountInfo) {
        throw new Error(
          `Vault account does not exist at ${vaultAddress}. ` +
            `The creator pool was created without a vault. ` +
            `Please recreate the creator pool with the updated contract.`
        );
      }

      console.log("✅ Vault account exists, proceeding with finalization...");

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

  // Filter and paginate claims
  const filteredClaims = claims.filter((claim) => {
    const matchesStatus =
      statusFilter === "ALL" || claim.status === statusFilter;
    const matchesSearch =
      searchTerm === "" ||
      claim.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.creator.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.id.toString().includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredClaims.length / claimsPerPage);
  const startIndex = (currentPage - 1) * claimsPerPage;
  const endIndex = startIndex + claimsPerPage;
  const currentClaims = filteredClaims.slice(startIndex, endIndex);

  // Check if user is a creator (has a pass)
  const isCreator = user?.pass !== null && user?.pass !== undefined;

  // Helper function to parse claim reason and extract clean text
  const parseClaimReason = (reason: string) => {
    try {
      const reasonData = JSON.parse(reason);
      // If it's nested JSON, try to parse the originalReason
      if (reasonData.originalReason) {
        const originalData = JSON.parse(reasonData.originalReason);
        return originalData.reason || reason;
      }
      return reasonData.reason || reason;
    } catch {
      // If JSON parsing fails, return the original reason
      return reason;
    }
  };

  // Helper function to parse claim amount from reason JSON
  const parseClaimAmount = (reason: string, fallbackAmount: number) => {
    try {
      const reasonData = JSON.parse(reason);
      if (reasonData.originalReason) {
        const originalData = JSON.parse(reasonData.originalReason);
        return originalData.amount || fallbackAmount;
      }
      return reasonData.amount || fallbackAmount;
    } catch {
      return fallbackAmount;
    }
  };

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

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
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2 transform -rotate-1 inline-block bg-yellow-300 border-4 border-black px-6 py-2 shadow-[8px_8px_0_0_#000]">
            Claims & Voting
          </h1>
          <p className="text-lg font-bold mt-4">
            Vote on creator claims and manage your own claims
          </p>
        </div>

        {/* Create Claim Button - Only for Creators */}
        {isCreator ? (
          <div className="text-center mb-8">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 text-white px-8 py-4 text-lg font-extrabold border-4 border-black shadow-[6px_6px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1 transition-all"
            >
              {showCreateForm ? "Cancel" : "Create New Claim"}
            </button>
          </div>
        ) : (
          <div className="text-center mb-8">
            <div className="bg-yellow-100 border-4 border-yellow-500 shadow-[6px_6px_0_0_#000] p-6 max-w-md mx-auto transform -rotate-1">
              <h3 className="text-lg font-extrabold text-yellow-800 mb-2">
                Creator Access Required
              </h3>
              <p className="text-yellow-700 font-bold">
                Only creators with a pass can create claims. You can still vote
                on existing claims!
              </p>
            </div>
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-6 mb-8 transform rotate-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Bar */}
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-2">
                Search Claims
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border-4 border-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold"
                placeholder="Search by reason, creator, or claim ID..."
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as
                      | "ALL"
                      | "PENDING"
                      | "APPROVED"
                      | "REJECTED"
                  )
                }
                className="w-full border-4 border-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold"
              >
                <option value="ALL">All Claims</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 text-center">
            <p className="text-lg font-bold text-gray-700">
              Showing {currentClaims.length} of {filteredClaims.length} claims
              {statusFilter !== "ALL" && ` (${statusFilter.toLowerCase()})`}
            </p>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-100 border-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4 transform rotate-1">
            <div className="font-extrabold text-lg">⚠️ Error</div>
            <p className="font-bold">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border-4 border-green-500 text-green-700 px-4 py-3 rounded mb-4 transform -rotate-1">
            <div className="font-extrabold text-lg">✅ Success</div>
            <p className="font-bold">{success}</p>
          </div>
        )}

        {/* Create Claim Form */}
        {showCreateForm && (
          <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-8 mb-8 transform -rotate-1">
            <h2 className="text-2xl font-extrabold mb-6 text-center">
              Create New Claim
            </h2>
            <form onSubmit={handleCreateClaim} className="space-y-6">
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  Reason for Claim
                </label>
                <textarea
                  value={newClaim.reason}
                  onChange={(e) =>
                    setNewClaim({ ...newClaim, reason: e.target.value })
                  }
                  className="w-full border-4 border-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold"
                  rows={4}
                  placeholder="Explain why you need to withdraw funds from your vault..."
                  required
                />
              </div>
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">
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
                  className="w-full border-4 border-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  Evidence IPFS Hash (Optional)
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
                  className="w-full border-4 border-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold"
                  placeholder="ipfs://..."
                />
              </div>
              <div className="text-center">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-8 py-4 text-lg font-extrabold border-4 border-black shadow-[6px_6px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1 transition-all"
                >
                  Create Claim
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Claims List */}
        <div className="space-y-6">
          {filteredClaims.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-yellow-100 border-4 border-yellow-500 shadow-[6px_6px_0_0_#000] p-8 max-w-md mx-auto transform rotate-1">
                <h3 className="text-xl font-extrabold text-yellow-800 mb-2">
                  {claims.length === 0
                    ? "No Claims Available"
                    : "No Claims Match Your Filter"}
                </h3>
                <p className="text-yellow-700 font-bold mb-4">
                  {claims.length === 0
                    ? "You don't have any NFTs from creators who have filed claims."
                    : "Try adjusting your search or filter criteria."}
                </p>
                <p className="text-sm font-bold text-yellow-600">
                  {claims.length === 0
                    ? "To see claims, you need to own NFTs from creators who have created claims."
                    : "Clear your search or change the status filter to see more claims."}
                </p>
              </div>
            </div>
          ) : (
            currentClaims.map((claim, index) => (
              <div
                key={claim.id}
                className={`bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-6 transform ${
                  index % 2 === 0 ? "rotate-1" : "-rotate-1"
                } hover:rotate-0 transition-transform overflow-hidden`}
              >
                {/* Claim Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-200 border-3 border-black p-3 shadow-[3px_3px_0_0_#000] transform -rotate-2">
                      <span className="text-2xl font-black">#{claim.id}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-black">
                        Claim #{claim.id}
                      </h3>
                      <p className="text-sm font-bold text-gray-600">
                        by {claim.creator.name || "Unknown Creator"}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-4 py-2 border-3 border-black shadow-[3px_3px_0_0_#000] font-extrabold text-sm ${
                      claim.status === "APPROVED"
                        ? "bg-green-200 text-green-800"
                        : claim.status === "REJECTED"
                        ? "bg-red-200 text-red-800"
                        : "bg-yellow-200 text-yellow-800"
                    }`}
                  >
                    {claim.status}
                  </div>
                </div>

                {/* Claim Details */}
                <div className="mb-6 space-y-4">
                  <div className="bg-gray-100 border-3 border-black p-4 shadow-[3px_3px_0_0_#000] max-w-full">
                    <h4 className="font-extrabold text-lg mb-2">Reason</h4>
                    <div className="text-gray-800 font-bold leading-relaxed break-words overflow-wrap-anywhere max-w-full">
                      {parseClaimReason(claim.reason)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-200 border-3 border-black p-4 shadow-[3px_3px_0_0_#000] transform rotate-1">
                      <h4 className="font-extrabold text-sm mb-1">Amount</h4>
                      <p className="text-2xl font-black text-green-800">
                        {parseClaimAmount(claim.reason, claim.amount)} SOL
                      </p>
                    </div>

                    {voteCounts[claim.id] && (
                      <div className="bg-purple-200 border-3 border-black p-4 shadow-[3px_3px_0_0_#000] transform -rotate-1">
                        <h4 className="font-extrabold text-sm mb-2">
                          Voting Status
                        </h4>
                        <div className="flex justify-between items-center">
                          <div className="flex space-x-4">
                            <span className="text-green-600 font-extrabold text-lg">
                              Yes: {voteCounts[claim.id].yesVotes}
                            </span>
                            <span className="text-red-600 font-extrabold text-lg">
                              No: {voteCounts[claim.id].noVotes}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-gray-700 mt-2">
                          {formatTimeRemaining(
                            voteCounts[claim.id].timeRemaining || 0
                          )}
                        </div>
                        {hasUserVoted(claim.id) && (
                          <div className="text-sm font-extrabold text-blue-600 mt-2">
                            ✓ You voted:{" "}
                            {voteCounts[claim.id].userVote?.approve
                              ? "Yes"
                              : "No"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleVote(claim.id, "Yes")}
                    className={`px-6 py-3 text-sm font-extrabold border-3 border-black shadow-[3px_3px_0_0_#000] transition-all ${
                      !isVotingActive(claim.id) ||
                      hasUserVoted(claim.id) ||
                      claim.status !== "PENDING"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-200 text-green-800 hover:bg-green-300 hover:shadow-[5px_5px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1"
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
                    className={`px-6 py-3 text-sm font-extrabold border-3 border-black shadow-[3px_3px_0_0_#000] transition-all ${
                      !isVotingActive(claim.id) ||
                      hasUserVoted(claim.id) ||
                      claim.status !== "PENDING"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-red-200 text-red-800 hover:bg-red-300 hover:shadow-[5px_5px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1"
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
                    claim.status === "PENDING" && (
                      <button
                        onClick={() => handleFinalize(claim.id)}
                        className="bg-blue-200 text-blue-800 px-6 py-3 text-sm font-extrabold border-3 border-black shadow-[3px_3px_0_0_#000] hover:bg-blue-300 hover:shadow-[5px_5px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1 transition-all"
                      >
                        Finalize & Transfer SOL
                      </button>
                    )}
                </div>
              </div>
            ))
          )}

          {/* Pagination Controls */}
          {filteredClaims.length > claimsPerPage && (
            <div className="flex justify-center items-center space-x-4 mt-8">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="bg-gray-200 text-gray-800 px-4 py-2 text-sm font-extrabold border-3 border-black shadow-[3px_3px_0_0_#000] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 hover:shadow-[5px_5px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1 transition-all"
              >
                Previous
              </button>

              <div className="flex space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-extrabold border-3 border-black shadow-[3px_3px_0_0_#000] transition-all ${
                        currentPage === page
                          ? "bg-blue-200 text-blue-800"
                          : "bg-white text-gray-800 hover:bg-gray-100 hover:shadow-[5px_5px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="bg-gray-200 text-gray-800 px-4 py-2 text-sm font-extrabold border-3 border-black shadow-[3px_3px_0_0_#000] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 hover:shadow-[5px_5px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1 transition-all"
              >
                Next
              </button>
            </div>
          )}

          {/* Page Info */}
          {filteredClaims.length > 0 && (
            <div className="text-center mt-4">
              <p className="text-sm font-bold text-gray-600">
                Page {currentPage} of {totalPages} • Showing {startIndex + 1}-
                {Math.min(endIndex, filteredClaims.length)} of{" "}
                {filteredClaims.length} claims
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
