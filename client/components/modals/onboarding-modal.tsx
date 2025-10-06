"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  completeOnboarding,
  getProfilePictureUploadUrl,
  uploadProfilePicture,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({
  isOpen,
  onClose,
}: OnboardingModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");

  const onboardMutation = useMutation({
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
      return completeOnboarding(token!, onboardingData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      onClose();
      router.push("/feed");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !token) {
      return;
    }

    onboardMutation.mutate({
      name: name.trim(),
      email: email.trim(),
    });
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
              Complete Your Profile
            </h2>
            <p className="text-gray-600 font-medium">
              Join the Creator Insurance DAO community
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col items-center">
              <label htmlFor="profile-picture" className="cursor-pointer group">
                <Avatar className="w-24 h-24 border-4 border-foreground shadow-[6px_6px_0_0_#000] group-hover:-translate-x-1 group-hover:-translate-y-1 transition-transform">
                  <AvatarImage src={previewUrl || undefined} alt="Profile" />
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
                  disabled={onboardMutation.isPending}
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
                disabled={onboardMutation.isPending}
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
                disabled={onboardMutation.isPending}
                required
              />
            </div>

            {onboardMutation.isError && (
              <div className="bg-red-100 border-4 border-red-500 p-4 shadow-[4px_4px_0_0_#000]">
                <p className="text-red-700 font-bold text-sm">
                  {onboardMutation.error instanceof Error
                    ? onboardMutation.error.message
                    : "Failed to complete onboarding"}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={onClose}
                disabled={onboardMutation.isPending}
                className="flex-1 bg-white hover:bg-gray-50 text-black border-4 border-foreground shadow-[6px_6px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 transition-transform font-extrabold disabled:opacity-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={onboardMutation.isPending}
                className="flex-1 bg-yellow-300 hover:bg-yellow-400 text-black border-4 border-foreground shadow-[6px_6px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 transition-transform font-extrabold disabled:opacity-50"
              >
                {onboardMutation.isPending ? "Setting up..." : "Get Started"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
