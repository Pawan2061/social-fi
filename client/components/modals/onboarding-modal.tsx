"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  completeOnboarding,
  getProfilePictureUploadUrl,
  uploadProfilePicture,
  createPass,
} from "@/lib/api";
import {
  createUmiInstance,
  createCreatorPassCollection,
  testNetworkConnection,
  createCreatorPoolAddresses,
} from "@/lib/nft-utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType?: "creator" | "fan";
}

export default function OnboardingModal({
  isOpen,
  onClose,
  userType = "fan",
}: OnboardingModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { publicKey, signTransaction } = useWallet();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");

  const [currentStep, setCurrentStep] = useState(1);
  const [isUserOnboarded, setIsUserOnboarded] = useState(false);
  const [onboardedUser, setOnboardedUser] = useState<{
    id: number;
    name: string;
    email: string;
  } | null>(null);

  const [collectionName, setCollectionName] = useState("");
  const [collectionDescription, setCollectionDescription] = useState("");
  const [collectionImage, setCollectionImage] = useState<File | null>(null);
  const [collectionPreviewUrl, setCollectionPreviewUrl] = useState<
    string | null
  >(null);
  const [passPrice, setPassPrice] = useState(0.1);
  const [nftError, setNftError] = useState("");

  const userOnboardMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      image?: string;
    }) => {
      let imageKey: string | undefined;

      if (profileImage && token) {
        try {
          console.log("Starting image upload...", profileImage.name);
          const { uploadUrl, key } = await getProfilePictureUploadUrl(
            token,
            profileImage.name,
            profileImage.type
          );
          console.log("Got upload URL:", uploadUrl);
          await uploadProfilePicture(profileImage, uploadUrl);
          imageKey = key;
          console.log("Image uploaded successfully, key:", key);
        } catch (error) {
          console.error("Image upload failed:", error);
          console.log("Continuing onboarding without profile picture...");
        }
      } else {
        console.log("No profile image selected or no token");
      }

      const onboardingData = {
        name: data.name,
        email: data.email,
        image: imageKey,
      };
      console.log("Sending onboarding data:", onboardingData);
      const user = await completeOnboarding(token!, onboardingData);
      console.log("✅ User onboarding completed:", user);
      return user;
    },
    onSuccess: (user) => {
      setIsUserOnboarded(true);
      setOnboardedUser(user);
      if (userType === "fan") {
        queryClient.invalidateQueries({ queryKey: ["user"] });
        onClose();
        router.push("/feed");
      } else {
        setCurrentStep(2);
      }
    },
  });

  const nftCreationMutation = useMutation({
    mutationFn: async () => {
      if (!publicKey || !signTransaction) {
        throw new Error("Wallet not connected");
      }

      if (
        !collectionName.trim() ||
        !collectionDescription.trim() ||
        !collectionImage
      ) {
        throw new Error(
          "Collection name, description, and image are required for creators"
        );
      }

      console.log("🔍 Testing network connection...");
      const isConnected = await testNetworkConnection();
      if (!isConnected) {
        throw new Error(
          "Unable to connect to Solana network. Please check your internet connection and try again."
        );
      }

      console.log("🏦 Generating creator pool addresses...");
      const { vaultAddress } = await createCreatorPoolAddresses({
        publicKey,
        signTransaction: signTransaction as (
          transaction: unknown
        ) => Promise<unknown>,
      });
      console.log(
        "✅ Creator pool addresses generated, vault address:",
        vaultAddress
      );

      const collectionData = {
        name: collectionName.trim(),
        description: collectionDescription.trim(),
        image: collectionImage,
        symbol: "PASS",
      };

      const collection = await createCreatorPassCollection(
        {
          publicKey,
          signTransaction: signTransaction as (
            transaction: unknown
          ) => Promise<unknown>,
        },
        collectionData
      );
      console.log("✅ NFT collection created:", collection);

      console.log("🏦 Creating pass in backend...");
      console.log("Pass data:", {
        tokenMint: collection.collectionMint,
        price: passPrice,
        vault_address: vaultAddress,
      });

      const pass = await createPass(token!, {
        tokenMint: collection.collectionMint,
        price: passPrice,
        vault_address: vaultAddress,
      });
      console.log("✅ Pass created successfully:", pass);

      return { collection, pass };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      onClose();
      router.push("/feed");
    },
    onError: (error) => {
      console.error("❌ NFT creation failed:", error);
      setNftError(
        error instanceof Error ? error.message : "Failed to create creator pass"
      );
    },
  });

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("File must be an image");
      return;
    }

    setUploadError("");
    setProfileImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleCollectionImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setNftError("Image must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setNftError("File must be an image");
      return;
    }

    setNftError("");
    setCollectionImage(file);
    setCollectionPreviewUrl(URL.createObjectURL(file));
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !token) {
      return;
    }

    userOnboardMutation.mutate({
      name: name.trim(),
      email: email.trim(),
    });
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !collectionName.trim() ||
      !collectionDescription.trim() ||
      !collectionImage
    ) {
      setNftError(
        "Collection name, description, and image are required for creators"
      );
      return;
    }

    nftCreationMutation.mutate();
  };

  const handleBackToStep1 = () => {
    setCurrentStep(1);
    setNftError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg">
        <div className="absolute -top-4 -left-4 w-16 h-16 bg-yellow-300 border-4 border-foreground shadow-[8px_8px_0_0_#000] rotate-12" />
        <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-cyan-300 border-4 border-foreground shadow-[8px_8px_0_0_#000] -rotate-12" />

        <div className="relative bg-white border-4 border-foreground shadow-[12px_12px_0_0_#000] p-6 sm:p-8">
          <div className="mb-6">
            <div className="inline-block bg-yellow-300 text-black px-3 py-1 border-4 border-foreground shadow-[4px_4px_0_0_#000] mb-4">
              <span className="text-xs font-bold uppercase tracking-wider">
                Welcome!
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">
              {currentStep === 1
                ? "Complete Your Profile"
                : "Create Your Creator Pass"}
            </h2>
            <p className="text-gray-600 font-medium">
              {currentStep === 1
                ? "Join the Creator Insurance DAO community"
                : "Set up your NFT collection and creator pass"}
            </p>

            {userType === "creator" && (
              <div className="flex items-center justify-center mt-4 mb-2">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      currentStep >= 1
                        ? "bg-yellow-300 text-black"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    1
                  </div>
                  <div className="w-8 h-1 bg-gray-300"></div>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      currentStep >= 2
                        ? "bg-yellow-300 text-black"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    2
                  </div>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={currentStep === 1 ? handleStep1Submit : handleStep2Submit}
            className="space-y-5"
          >
            {currentStep === 1 && (
              <>
                <div className="flex flex-col items-center">
                  <label
                    htmlFor="profile-picture"
                    className="cursor-pointer group"
                  >
                    <Avatar className="w-24 h-24 border-4 border-foreground shadow-[6px_6px_0_0_#000] group-hover:-translate-x-1 group-hover:-translate-y-1 transition-transform">
                      <AvatarImage
                        src={previewUrl || undefined}
                        alt="Profile"
                      />
                      <AvatarFallback className="bg-yellow-300 text-foreground text-2xl font-extrabold">
                        {name.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <input
                      type="file"
                      id="profile-picture"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={userOnboardMutation.isPending}
                    />
                  </label>
                  <p className="text-sm text-gray-600 mt-2 font-medium">
                    Click to upload profile picture (optional)
                  </p>
                  {uploadError && (
                    <p className="text-xs text-red-600 mt-1 font-bold">
                      {uploadError}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-bold mb-2 uppercase"
                  >
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border-4 border-foreground shadow-[4px_4px_0_0_#000] focus:shadow-[6px_6px_0_0_#000] focus:-translate-x-0.5 focus:-translate-y-0.5 transition-all outline-none font-medium"
                    placeholder="Enter your name"
                    disabled={nftCreationMutation.isPending}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-bold mb-2 uppercase"
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border-4 border-foreground shadow-[4px_4px_0_0_#000] focus:shadow-[6px_6px_0_0_#000] focus:-translate-x-0.5 focus:-translate-y-0.5 transition-all outline-none font-medium"
                    placeholder="your@email.com"
                    disabled={nftCreationMutation.isPending}
                    required
                  />
                </div>
              </>
            )}

            {currentStep === 2 && userType === "creator" && (
              <>
                <div className="border-t-4 border-foreground pt-5">
                  <h3 className="text-lg font-extrabold mb-4 text-center">
                    🎨 Create Your Creator Pass NFT Collection
                  </h3>

                  <div className="flex flex-col items-center mb-4">
                    <label
                      htmlFor="collection-image"
                      className="cursor-pointer group"
                    >
                      <div className="w-32 h-32 border-4 border-foreground shadow-[6px_6px_0_0_#000] group-hover:-translate-x-1 group-hover:-translate-y-1 transition-transform bg-gray-100 flex items-center justify-center">
                        {collectionPreviewUrl ? (
                          <img
                            src={collectionPreviewUrl}
                            alt="Collection"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl">🖼️</span>
                        )}
                      </div>
                      <input
                        type="file"
                        id="collection-image"
                        accept="image/*"
                        onChange={handleCollectionImageChange}
                        className="hidden"
                        disabled={userOnboardMutation.isPending}
                      />
                    </label>
                    <p className="text-sm text-gray-600 mt-2 font-medium text-center">
                      Collection Image *
                    </p>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="collection-name"
                      className="block text-sm font-bold mb-2 uppercase"
                    >
                      Collection Name *
                    </label>
                    <input
                      type="text"
                      id="collection-name"
                      value={collectionName}
                      onChange={(e) => setCollectionName(e.target.value)}
                      className="w-full px-4 py-3 border-4 border-foreground shadow-[4px_4px_0_0_#000] focus:shadow-[6px_6px_0_0_#000] focus:-translate-x-0.5 focus:-translate-y-0.5 transition-all outline-none font-medium"
                      placeholder="My Awesome Collection"
                      disabled={userOnboardMutation.isPending}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="collection-description"
                      className="block text-sm font-bold mb-2 uppercase"
                    >
                      Collection Description *
                    </label>
                    <textarea
                      id="collection-description"
                      value={collectionDescription}
                      onChange={(e) => setCollectionDescription(e.target.value)}
                      className="w-full px-4 py-3 border-4 border-foreground shadow-[4px_4px_0_0_#000] focus:shadow-[6px_6px_0_0_#000] focus:-translate-x-0.5 focus:-translate-y-0.5 transition-all outline-none font-medium resize-none"
                      placeholder="Describe your collection..."
                      rows={3}
                      disabled={userOnboardMutation.isPending}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="pass-price"
                      className="block text-sm font-bold mb-2 uppercase"
                    >
                      Pass Price (SOL) *
                    </label>
                    <input
                      type="number"
                      id="pass-price"
                      value={passPrice}
                      onChange={(e) =>
                        setPassPrice(parseFloat(e.target.value) || 0)
                      }
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-3 border-4 border-foreground shadow-[4px_4px_0_0_#000] focus:shadow-[6px_6px_0_0_#000] focus:-translate-x-0.5 focus:-translate-y-0.5 transition-all outline-none font-medium"
                      placeholder="0.1"
                      disabled={userOnboardMutation.isPending}
                      required
                    />
                  </div>

                  {nftError && (
                    <div className="bg-red-100 border-4 border-red-500 p-3 shadow-[4px_4px_0_0_#000] mb-4">
                      <p className="text-red-700 font-bold text-sm">
                        {nftError}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {(userOnboardMutation.isError || nftCreationMutation.isError) && (
              <div className="bg-red-100 border-4 border-red-500 p-4 shadow-[4px_4px_0_0_#000]">
                <p className="text-red-700 font-bold text-sm">
                  {currentStep === 1
                    ? userOnboardMutation.error instanceof Error
                      ? userOnboardMutation.error.message
                      : "Failed to complete onboarding"
                    : nftCreationMutation.error instanceof Error
                    ? nftCreationMutation.error.message
                    : "Failed to create NFT collection"}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {currentStep === 1 ? (
                <>
                  <Button
                    type="button"
                    onClick={onClose}
                    disabled={userOnboardMutation.isPending}
                    className="flex-1 bg-white hover:bg-gray-50 text-black border-4 border-foreground shadow-[6px_6px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 transition-transform font-extrabold disabled:opacity-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={userOnboardMutation.isPending}
                    className="flex-1 bg-yellow-300 hover:bg-yellow-400 text-black border-4 border-foreground shadow-[6px_6px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 transition-transform font-extrabold disabled:opacity-50"
                  >
                    {userOnboardMutation.isPending
                      ? "Setting up..."
                      : "Continue"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={handleBackToStep1}
                    disabled={nftCreationMutation.isPending}
                    className="flex-1 bg-white hover:bg-gray-50 text-black border-4 border-foreground shadow-[6px_6px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 transition-transform font-extrabold disabled:opacity-50"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={nftCreationMutation.isPending}
                    className="flex-1 bg-yellow-300 hover:bg-yellow-400 text-black border-4 border-foreground shadow-[6px_6px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 transition-transform font-extrabold disabled:opacity-50"
                  >
                    {nftCreationMutation.isPending
                      ? "Creating NFT Collection..."
                      : "Create Collection & Pass"}
                  </Button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
