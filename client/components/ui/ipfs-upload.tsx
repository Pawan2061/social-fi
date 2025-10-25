"use client";

import React, { useRef, useState } from "react";
import { useIPFS } from "../../hooks/use-ipfs";
import { Button } from "./button";
import { Card } from "./card";

interface IPFSUploadProps {
  onUploadComplete?: (url: string) => void;
  onError?: (error: string) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
}

export function IPFSUpload({
  onUploadComplete,
  onError,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024,
  className = "",
}: IPFSUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const { uploadImage, isUploading, error, isAvailable, checkAvailability } =
    useIPFS();

  React.useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    if (file.size > maxSize) {
      const errorMsg = `File too large. Maximum size is ${
        maxSize / (1024 * 1024)
      }MB`;
      onError?.(errorMsg);
      return;
    }

    if (accept !== "*/*" && !file.type.match(accept.replace("*", ".*"))) {
      const errorMsg = `Invalid file type. Expected: ${accept}`;
      onError?.(errorMsg);
      return;
    }

    const result = await uploadImage(file);

    if (result.success && result.url) {
      onUploadComplete?.(result.url);
    } else {
      onError?.(result.error || "Upload failed");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (!isAvailable) {
    return (
      <Card className={`p-6 text-center ${className}`}>
        <div className="text-red-500 mb-2">⚠️ IPFS Not Available</div>
        <p className="text-sm text-gray-600 mb-4">
          IPFS service is not available. Please check your connection or try
          again later.
        </p>
        <Button onClick={checkAvailability} variant="outline" size="sm">
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }
          ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-600">Uploading to IPFS...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">📁</div>
            <p className="text-lg font-medium">Upload to IPFS</p>
            <p className="text-sm text-gray-600">
              Drag and drop a file here, or click to select
            </p>
            <p className="text-xs text-gray-500">
              Max size: {maxSize / (1024 * 1024)}MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </Card>
  );
}

export default IPFSUpload;
