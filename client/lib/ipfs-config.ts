// IPFS Configuration
export const IPFS_CONFIG = {
  GATEWAY_URL:
    process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || "https://ipfs.io/ipfs/",

  API_URL: process.env.NEXT_PUBLIC_IPFS_API_URL || "https://ipfs.io/api/v0",

  FALLBACK_GATEWAYS: [
    "https://gateway.pinata.cloud/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://dweb.link/ipfs/",
    "https://ipfs.io/ipfs/",
  ],

  MAX_FILE_SIZE: 10 * 1024 * 1024,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,

  SUPPORTED_IMAGE_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],

  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};

export function getRandomFallbackGateway(): string {
  const gateways = IPFS_CONFIG.FALLBACK_GATEWAYS;
  return gateways[Math.floor(Math.random() * gateways.length)];
}

export function isValidImageType(fileType: string): boolean {
  return IPFS_CONFIG.SUPPORTED_IMAGE_TYPES.includes(fileType);
}

export function isValidFileSize(
  fileSize: number,
  maxSize: number = IPFS_CONFIG.MAX_FILE_SIZE
): boolean {
  return fileSize <= maxSize;
}
