// Use relative path for Vercel proxy (default: "/api")
// For local dev, set NEXT_PUBLIC_API_URL=http://localhost:4000/api
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface User {
  id: number;
  name: string | null;
  email: string | null;
  wallet: string | null;
  image: string | null;
  onboarded: boolean;
  createdAt: string;
  updatedAt: string;
  pass: Pass | null;
}

export interface Pass {
  id: number;
  creatorId: number;
  title: string;
  description: string;
  price: number;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function requestNonce(
  address: string
): Promise<{ nonce: string }> {
  const res = await fetch(`${API_URL}/auth/request-nonce`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  if (!res.ok) throw new Error("Failed to request nonce");
  return res.json();
}

export async function verifySignature(
  address: string,
  signature: string
): Promise<{ token: string }> {
  const res = await fetch(`${API_URL}/auth/verify-signature`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, signature }),
  });
  if (!res.ok) throw new Error("Failed to verify signature");
  return res.json();
}

export async function getCurrentUser(token: string): Promise<User> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to get user");
  return res.json();
}

export async function completeOnboarding(
  token: string,
  data: { name: string; email: string; image?: string }
): Promise<User> {
  const res = await fetch(`${API_URL}/users/onboard`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to complete onboarding");
  }
  return res.json();
}

export async function getProfilePictureUploadUrl(
  token: string,
  fileName: string,
  fileType: string
): Promise<{ uploadUrl: string; key: string }> {
  const res = await fetch(`${API_URL}/users/profile-picture/sign-upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fileName, fileType }),
  });
  if (!res.ok) throw new Error("Failed to get upload URL");
  return res.json();
}

export async function uploadProfilePicture(
  file: File,
  uploadUrl: string
): Promise<void> {
  try {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
      mode: "cors",
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Upload failed:", res.status, errorText);
      throw new Error(`Upload failed: ${res.status}`);
    }
  } catch (error) {
    console.error("Upload error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to upload image"
    );
  }
}

export interface Pass {
  id: number;
  creatorId: number;
  tokenMint: string;
  vault_address: string | null;
  price: number;
  createdAt: string;
  creator: User;
  owned?: boolean;
}

export async function createPass(
  token: string,
  data: {
    tokenMint: string;
    price: number;
    vault_address?: string;
    metadataUri?: string;
    name?: string;
    description?: string;
  }
): Promise<Pass> {
  const res = await fetch(`${API_URL}/pass`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.text();
    console.log("Failed to create pass", res);
    throw new Error(error || "Failed to create pass");
  }
  return res.json();
}

export async function buyPass(
  token: string,
  data: {
    passId: number;
    txId: string;
    nftMint: string;
  }
): Promise<{ message: string; nftMint: string; txId: string }> {
  const res = await fetch(`${API_URL}/pass/buy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to buy pass");
  }
  return res.json();
}

export const storage = {
  getToken: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("authToken");
  },
  setToken: (token: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("authToken", token);
  },
  removeToken: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("authToken");
  },
};

// Posts API
export async function deletePost(postId: number | string): Promise<void> {
  const token = storage.getToken();
  if (!token) throw new Error("No authentication token found");

  const res = await fetch(`${API_URL}/posts/${postId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to delete post");
  }
}

// Claims API
export interface Claim {
  id: number;
  creatorId: number;
  reason: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  validTill: string;
  createdAt: string;
  updatedAt: string;
  media: unknown[];
  creator: User;
  onchainClaimAddress?: string;
  onchainTransactionSignature?: string;

  votes?: { approve: boolean }[];
}

export async function createClaim(claimData: {
  reason: string;
  amount: number;
  evidenceIpfsHash?: string;
  validTill?: string;
  media?: unknown[];
  creatorPoolAddress?: string;
  vaultAddress?: string;
  creatorUsdcAccount?: string;
}): Promise<Claim> {
  const token = storage.getToken();

  if (!token) throw new Error("No authentication token found");

  const res = await fetch(`${API_URL}/claim`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(claimData),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create claim");
  }

  return res.json();
}

export async function getClaims(): Promise<Claim[]> {
  const token = storage.getToken();
  // if (!token) throw new Error("No authentication token found");

  const res = await fetch(`${API_URL}/claim`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to get claims");
  }

  return res.json();
}

export async function getClaim(claimId: number): Promise<Claim> {
  const token = storage.getToken();
  if (!token) throw new Error("No authentication token found");

  const res = await fetch(`${API_URL}/claim/${claimId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to get claim");
  }

  return res.json();
}

export async function voteOnClaim(
  claimId: number,
  voteData: {
    choice: "Yes" | "No";
    transactionSignature: string;
    onchainClaimAddress?: string;
    creatorPoolAddress?: string;
    nftOwnershipAddress?: string;
    creatorCollectionAddress?: string;
  }
): Promise<{ message: string }> {
  const token = storage.getToken();
  if (!token) throw new Error("No authentication token found");

  // Convert choice to boolean for backend
  const approve = voteData.choice === "Yes";

  const res = await fetch(`${API_URL}/votes/${claimId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      approve,
      txSig: voteData.transactionSignature,
    }),
  });

  if (!res.ok) {
    console.log("Failed to vote on claim", res);
    const error = await res.json();
    throw new Error(error.error || error.message || "Failed to vote on claim");
  }

  return res.json();
}

export async function getVoteCounts(claimId: number): Promise<{
  yesVotes: number;
  noVotes: number;
  userVote: { approve: boolean } | null;
}> {
  const token = storage.getToken();
  if (!token) throw new Error("No authentication token found");

  const res = await fetch(`${API_URL}/votes/${claimId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to get vote counts");
  }

  return res.json();
}

export async function finalizeClaim(
  claimId: number,
  finalizeData: {
    transactionSignature: string;
    onchainClaimAddress?: string;
    creatorPoolAddress?: string;
  }
): Promise<{ message: string; status: string }> {
  const token = storage.getToken();
  if (!token) throw new Error("No authentication token found");

  const res = await fetch(`${API_URL}/claims/${claimId}/finalize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(finalizeData),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to finalize claim");
  }

  return res.json();
}

export async function finalizeClaimWithDistribution(
  claimId: number,
  finalizeData: {
    transactionSignature: string;
    onchainClaimAddress?: string;
    creatorPoolAddress?: string;
    result: "approved" | "rejected";
    distributedAmount: number;
  }
): Promise<{
  message: string;
  status: string;
  result: "approved" | "rejected";
  distributedAmount: number;
  distributionResult?: {
    success: boolean;
    message: string;
    distributedAmount: number;
  };
}> {
  const token = storage.getToken();
  if (!token) throw new Error("No authentication token found");

  const res = await fetch(
    `${API_URL}/claim/${claimId}/finalize-with-distribution`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(finalizeData),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(
      error.message || "Failed to finalize claim with distribution"
    );
  }

  return res.json();
}

export async function payoutClaim(
  claimId: number
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_URL}/claim/${claimId}/payout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${storage.getToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to process claim payout");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error processing claim payout:", error);
    throw error;
  }
}

export async function refundClaim(
  claimId: number
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_URL}/claims/${claimId}/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${storage.getToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to process claim refund");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error processing claim refund:", error);
    throw error;
  }
}
