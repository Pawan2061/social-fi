import { PUBLIC_BUCKET_URL } from "./storage";

export const resolveMediaUrl = (url?: string | null): string | null => {
  if (!url) return null;
  const lower = url.toLowerCase();

  const allowedPrefixes = [
    "https://unsplash.com",
    "https://images.unsplash.com",
    "https://cdn.jsdelivr.net",
    "https://avatars.githubusercontent.com",
    // IPFS URLs
    "https://ipfs.io/ipfs/",
    "https://gateway.pinata.cloud/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://dweb.link/ipfs/",
    "ipfs://",
  ];

  if (allowedPrefixes.some((prefix) => lower.startsWith(prefix))) {
    return url;
  }

  return `${PUBLIC_BUCKET_URL}/${url}`;
};
