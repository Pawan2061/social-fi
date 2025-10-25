import { useState, useCallback } from "react";
import {
  uploadImageToIPFS,
  uploadJSONToIPFS,
  uploadNFTProfileMetadata,
  isIPFSAvailable,
  cleanupIPFS,
} from "../lib/ipfs-utils";

export interface IPFSUploadState {
  isUploading: boolean;
  error: string | null;
  isAvailable: boolean;
}

export interface IPFSUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export function useIPFS() {
  const [state, setState] = useState<IPFSUploadState>({
    isUploading: false,
    error: null,
    isAvailable: false,
  });

  const checkAvailability = useCallback(async () => {
    try {
      const available = await isIPFSAvailable();
      setState((prev) => ({ ...prev, isAvailable: available }));
      return available;
    } catch (error) {
      console.error("❌ IPFS availability check failed:", error);
      setState((prev) => ({
        ...prev,
        isAvailable: false,
        error: error instanceof Error ? error.message : "IPFS not available",
      }));
      return false;
    }
  }, []);

  const uploadImage = useCallback(
    async (file: File): Promise<IPFSUploadResult> => {
      setState((prev) => ({ ...prev, isUploading: true, error: null }));

      try {
        const url = await uploadImageToIPFS(file);
        setState((prev) => ({ ...prev, isUploading: false }));
        return { success: true, url };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to upload image";
        setState((prev) => ({
          ...prev,
          isUploading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  const uploadJSON = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (metadata: any): Promise<IPFSUploadResult> => {
      setState((prev) => ({ ...prev, isUploading: true, error: null }));

      try {
        const url = await uploadJSONToIPFS(metadata);
        setState((prev) => ({ ...prev, isUploading: false }));
        return { success: true, url };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to upload JSON";
        setState((prev) => ({
          ...prev,
          isUploading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  const uploadProfileMetadata = useCallback(
    async (profileData: {
      name: string;
      description: string;
      image: string;
      external_url?: string;
      attributes?: Array<{ trait_type: string; value: string | number }>;
    }): Promise<IPFSUploadResult> => {
      setState((prev) => ({ ...prev, isUploading: true, error: null }));

      try {
        const url = await uploadNFTProfileMetadata(profileData);
        setState((prev) => ({ ...prev, isUploading: false }));
        return { success: true, url };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to upload profile metadata";
        setState((prev) => ({
          ...prev,
          isUploading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const cleanup = useCallback(async () => {
    try {
      await cleanupIPFS();
    } catch (error) {
      console.error("❌ Error cleaning up IPFS:", error);
    }
  }, []);

  return {
    ...state,
    uploadImage,
    uploadJSON,
    uploadProfileMetadata,
    checkAvailability,
    clearError,
    cleanup,
  };
}
