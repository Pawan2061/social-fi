import { createHelia } from "helia";
import { unixfs } from "@helia/unixfs";
import { CID } from "multiformats/cid";
import { IPFS_CONFIG, isValidImageType, isValidFileSize } from "./ipfs-config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let heliaInstance: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let unixfsInstance: any = null;

export async function initIPFS() {
  if (heliaInstance) {
    return { helia: heliaInstance, unixfs: unixfsInstance };
  }

  try {
    heliaInstance = await createHelia();
    unixfsInstance = unixfs(heliaInstance);

    console.log("✅ IPFS initialized successfully");
    return { helia: heliaInstance, unixfs: unixfsInstance };
  } catch (error) {
    console.error("❌ Failed to initialize IPFS:", error);
    throw new Error("Failed to initialize IPFS client");
  }
}

export async function uploadToIPFS(file: File): Promise<string> {
  try {
    const { unixfs } = await initIPFS();

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const cid = await unixfs.addFile({
      path: file.name,
      content: uint8Array,
      mode: 0o644,
    });

    const ipfsUrl = `${IPFS_CONFIG.GATEWAY_URL}${cid.toString()}`;
    console.log("✅ File uploaded to IPFS:", ipfsUrl);

    return ipfsUrl;
  } catch (error) {
    console.error("❌ Failed to upload file to IPFS:", error);
    throw new Error(
      `Failed to upload file to IPFS: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function uploadJSONToIPFS(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>
): Promise<string> {
  try {
    const { unixfs } = await initIPFS();

    const jsonString = JSON.stringify(metadata, null, 2);
    const uint8Array = new TextEncoder().encode(jsonString);

    const cid = await unixfs.addFile({
      path: "metadata.json",
      content: uint8Array,
      mode: 0o644,
    });

    const ipfsUrl = `${IPFS_CONFIG.GATEWAY_URL}${cid.toString()}`;
    console.log("✅ JSON metadata uploaded to IPFS:", ipfsUrl);

    return ipfsUrl;
  } catch (error) {
    console.error("❌ Failed to upload JSON to IPFS:", error);
    throw new Error(
      `Failed to upload JSON to IPFS: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function uploadNFTProfileMetadata(profileData: {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}): Promise<string> {
  try {
    const metadata = {
      name: profileData.name,
      description: profileData.description,
      image: profileData.image,
      external_url: profileData.external_url || "",
      attributes: profileData.attributes || [],
      symbol: "PROFILE",
      seller_fee_basis_points: 0,
      collection: {
        name: profileData.name,
        family: "SocialFi Profiles",
      },
    };

    return await uploadJSONToIPFS(metadata);
  } catch (error) {
    console.error("❌ Failed to upload NFT profile metadata:", error);
    throw new Error(
      `Failed to upload NFT profile metadata: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function uploadImageToIPFS(imageFile: File): Promise<string> {
  try {
    if (!isValidImageType(imageFile.type)) {
      throw new Error(
        `Unsupported image type: ${
          imageFile.type
        }. Supported types: ${IPFS_CONFIG.SUPPORTED_IMAGE_TYPES.join(", ")}`
      );
    }

    if (!isValidFileSize(imageFile.size, IPFS_CONFIG.MAX_IMAGE_SIZE)) {
      throw new Error(
        `Image file too large. Maximum size is ${
          IPFS_CONFIG.MAX_IMAGE_SIZE / (1024 * 1024)
        }MB`
      );
    }

    return await uploadToIPFS(imageFile);
  } catch (error) {
    console.error("❌ Failed to upload image to IPFS:", error);
    throw new Error(
      `Failed to upload image to IPFS: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function getFromIPFS(cid: string): Promise<Uint8Array> {
  try {
    const { unixfs } = await initIPFS();

    const parsedCid = CID.parse(cid);

    const chunks = [];
    for await (const chunk of unixfs.cat(parsedCid)) {
      chunks.push(chunk);
    }

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  } catch (error) {
    console.warn("❌ IPFS direct fetch failed, trying HTTP fallback:", error);

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
          const arrayBuffer = await response.arrayBuffer();
          console.log(`✅ Successfully fetched from ${gateway}`);
          return new Uint8Array(arrayBuffer);
        }
      } catch (gatewayError) {
        console.warn(`❌ Gateway ${gateway} failed:`, gatewayError);
        continue;
      }
    }

    throw new Error(
      `Failed to get content from IPFS and all gateways: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function getJSONFromIPFS(
  cid: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>> {
  try {
    console.log("🔍 Attempting to get JSON from IPFS with CID:", cid);

    // Check if IPFS is available first
    const isAvailable = await isIPFSAvailable();
    if (!isAvailable) {
      throw new Error("IPFS is not available");
    }

    const content = await getFromIPFS(cid);
    console.log("📄 Retrieved content from IPFS, length:", content.length);

    const jsonString = new TextDecoder().decode(content);
    console.log(
      "📝 Decoded JSON string:",
      jsonString.substring(0, 200) + "..."
    );

    const parsed = JSON.parse(jsonString);
    console.log("✅ Successfully parsed JSON from IPFS");
    return parsed;
  } catch (error) {
    console.error("❌ Failed to get JSON from IPFS:", error);
    throw new Error(
      `Failed to get JSON from IPFS: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Pin content to IPFS (optional - for persistence)
 */
export async function pinToIPFS(cid: string): Promise<boolean> {
  try {
    const { helia } = await initIPFS();

    // Pin the content
    await helia.pins.add(CID.parse(cid));

    console.log("✅ Content pinned to IPFS:", cid);
    return true;
  } catch (error) {
    console.error("❌ Failed to pin content to IPFS:", error);
    return false;
  }
}

/**
 * Check if IPFS is available
 */
export async function isIPFSAvailable(): Promise<boolean> {
  try {
    await initIPFS();
    return true;
  } catch (error) {
    console.error("❌ IPFS not available:", error);
    return false;
  }
}

/**
 * Clean up IPFS instance
 */
export async function cleanupIPFS() {
  if (heliaInstance) {
    try {
      await heliaInstance.stop();
      heliaInstance = null;
      unixfsInstance = null;
      console.log("✅ IPFS instance cleaned up");
    } catch (error) {
      console.error("❌ Error cleaning up IPFS:", error);
    }
  }
}
