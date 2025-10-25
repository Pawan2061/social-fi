import { useState, useEffect } from "react";
import { fetchNFTMetadata, NFTMetadata } from "../lib/nft-metadata-simple";

export interface UseNFTMetadataResult {
  metadata: NFTMetadata | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useNFTMetadata(
  metadataUri?: string | null
): UseNFTMetadataResult {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = async () => {
    if (!metadataUri) {
      setMetadata(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedMetadata = await fetchNFTMetadata(metadataUri);

      if (fetchedMetadata) {
        setMetadata(fetchedMetadata);
      } else {
        setMetadata(null);
        setError("Failed to fetch metadata from IPFS");
      }
    } catch (err) {
      console.error("Error fetching NFT metadata:", err);
      setMetadata(null);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, [metadataUri]);

  return {
    metadata,
    loading,
    error,
    refetch: fetchMetadata,
  };
}
