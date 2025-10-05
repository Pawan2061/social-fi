const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface User {
  id: number;
  name: string | null;
  email: string | null;
  wallet: string | null;
  image: string | null;
  onboarded: boolean;
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
  data: { name: string; email: string }
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
