export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  symbol?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
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
  const patterns = [
    /^https:\/\/ipfs\.io\/ipfs\/(.+)$/,
    /^https:\/\/gateway\.pinata\.cloud\/ipfs\/(.+)$/,
    /^https:\/\/cloudflare-ipfs\.com\/ipfs\/(.+)$/,
    /^https:\/\/dweb\.link\/ipfs\/(.+)$/,
    /^ipfs:\/\/(.+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

async function getJSONFromIPFS(cid: string): Promise<NFTMetadata> {
  try {
    console.log("🔍 Attempting to get JSON from IPFS with CID:", cid);

    const gateways = [
      `https://ipfs.io/ipfs/${cid}`,
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
      `https://dweb.link/ipfs/${cid}`,
    ];

    for (const gateway of gateways) {
      try {
        console.log(`🔍 Trying gateway: ${gateway}`);
        const response = await fetch(gateway);
        if (response.ok) {
          const metadata = await response.json();
          console.log(`✅ Successfully fetched from ${gateway}`);
          return metadata;
        }
      } catch (gatewayError) {
        console.warn(`❌ Gateway ${gateway} failed:`, gatewayError);
        continue;
      }
    }

    throw new Error("All IPFS gateways failed");
  } catch (error) {
    console.error("❌ Failed to get JSON from IPFS:", error);
    throw new Error(
      `Failed to get JSON from IPFS: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
