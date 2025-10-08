const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

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
