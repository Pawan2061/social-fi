import { getJSONFromIPFS } from "./ipfs-utils";

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  symbol?: string;
  seller_fee_basis_points?: number;
  collection?: {
    name: string;
    family: string;
  };
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export async function fetchNFTMetadata(
  metadataUri: string
): Promise<NFTMetadata | null> {
  try {
    if (!metadataUri) {
      console.warn("No metadata URI provided");
      return null;
    }

    console.log("🔍 Fetching NFT metadata from:", metadataUri);

    if (metadataUri.startsWith("data:application/json;base64,")) {
      try {
        const base64Data = metadataUri.split(",")[1];
        const jsonString = atob(base64Data);
        const metadata = JSON.parse(jsonString);
        console.log("✅ Successfully parsed data URL metadata:", metadata);
        return metadata as NFTMetadata;
      } catch (dataError) {
        console.error("❌ Failed to parse data URL:", dataError);
        throw dataError;
      }
    }

    const API_BASE =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
    if (metadataUri.startsWith(`${API_BASE}/metadata/`)) {
      try {
        const response = await fetch(metadataUri);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const metadata = await response.json();
        console.log(
          "✅ Successfully fetched metadata from our endpoint:",
          metadata
        );
        return metadata as NFTMetadata;
      } catch (endpointError) {
        console.warn(
          "❌ Our metadata endpoint failed, using fallback:",
          endpointError
        );
        return {
          name: "Creator Pass NFT",
          description:
            "A unique Creator Pass NFT that grants access to exclusive content and benefits.",
          image:
            "https://via.placeholder.com/400x400/6366f1/ffffff?text=Creator+Pass",
          symbol: "PASS",
          attributes: [
            { trait_type: "Type", value: "Creator Pass" },
            { trait_type: "Rarity", value: "Common" },
            { trait_type: "Access Level", value: "Premium" },
            { trait_type: "Collection", value: "SocialFi Creators" },
          ],
        };
      }
    }

    if (metadataUri === "https://arweave.net/placeholder") {
      console.log("⚠️ Using placeholder metadata for testing");
      return {
        name: "Creator Pass NFT",
        description:
          "A unique Creator Pass NFT that grants access to exclusive content and benefits.",
        image:
          "https://via.placeholder.com/400x400/6366f1/ffffff?text=Creator+Pass",
        symbol: "PASS",
        attributes: [
          { trait_type: "Type", value: "Creator Pass" },
          { trait_type: "Rarity", value: "Common" },
          { trait_type: "Access Level", value: "Premium" },
          { trait_type: "Collection", value: "SocialFi Creators" },
        ],
      };
    }

    try {
      const response = await fetch(metadataUri);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const metadata = await response.json();
      console.log("✅ Successfully fetched metadata via HTTP:", metadata);
      return metadata as NFTMetadata;
    } catch (httpError) {
      console.warn("❌ HTTP fetch failed, trying IPFS fallback:", httpError);

      try {
        const cid = extractCIDFromIPFSUrl(metadataUri);
        if (!cid) {
          throw new Error("Invalid IPFS URL");
        }

        console.log("📄 Extracted CID:", cid);
        const metadata = await getJSONFromIPFS(cid);
        console.log("✅ Successfully fetched metadata from IPFS:", metadata);
        return metadata as NFTMetadata;
      } catch (ipfsError) {
        console.error("❌ Both HTTP and IPFS failed:", {
          httpError,
          ipfsError,
        });

        console.log("⚠️ Using fallback mock metadata");
        return {
          name: "Creator Pass NFT",
          description:
            "A unique Creator Pass NFT that grants access to exclusive content and benefits.",
          image:
            "https://via.placeholder.com/400x400/6366f1/ffffff?text=Creator+Pass",
          symbol: "PASS",
          attributes: [
            { trait_type: "Type", value: "Creator Pass" },
            { trait_type: "Rarity", value: "Common" },
            { trait_type: "Access Level", value: "Premium" },
            { trait_type: "Collection", value: "SocialFi Creators" },
          ],
        };
      }
    }
  } catch (error) {
    console.error("Failed to fetch NFT metadata:", error);
    return null;
  }
}

function extractCIDFromIPFSUrl(url: string): string | null {
  try {
    const patterns = [
      /https:\/\/ipfs\.io\/ipfs\/([a-zA-Z0-9]+)/,
      /https:\/\/gateway\.pinata\.cloud\/ipfs\/([a-zA-Z0-9]+)/,
      /https:\/\/cloudflare-ipfs\.com\/ipfs\/([a-zA-Z0-9]+)/,
      /https:\/\/dweb\.link\/ipfs\/([a-zA-Z0-9]+)/,
      /ipfs:\/\/([a-zA-Z0-9]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    if (/^[a-zA-Z0-9]+$/.test(url)) {
      return url;
    }

    return null;
  } catch (error) {
    console.error("Error extracting CID from URL:", error);
    return null;
  }
}

/**
 * Get fallback metadata if IPFS fetch fails
 */
export function getFallbackMetadata(): NFTMetadata {
  return {
    name: "Unknown NFT",
    description: "Metadata not available",
    image: "/placeholder-nft.png",
    symbol: "NFT",
    attributes: [],
  };
}
