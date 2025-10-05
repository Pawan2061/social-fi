"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { completeOnboarding } from "@/lib/api";
import { Button } from "@/components/ui/button";

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

  const onboardMutation = useMutation({
    mutationFn: (data: { name: string; email: string }) =>
      completeOnboarding(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      onClose();
      router.push("/feed");
    },
  });

  if (!isOpen) return null;

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
        {/* Decorations */}
        <div className="absolute -top-4 -left-4 w-16 h-16 bg-yellow-300 border-4 border-foreground shadow-[8px_8px_0_0_#000] rotate-12" />
        <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-cyan-300 border-4 border-foreground shadow-[8px_8px_0_0_#000] -rotate-12" />

        {/* Modal content */}
        <div className="relative bg-white border-4 border-foreground shadow-[12px_12px_0_0_#000] p-6 sm:p-8">
          {/* Header */}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Input */}
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

            {/* Email Input */}
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

            {/* Error Message */}
            {onboardMutation.isError && (
              <div className="bg-red-100 border-4 border-red-500 p-4 shadow-[4px_4px_0_0_#000]">
                <p className="text-red-700 font-bold text-sm">
                  {onboardMutation.error instanceof Error
                    ? onboardMutation.error.message
                    : "Failed to complete onboarding"}
                </p>
              </div>
            )}

            {/* Action Buttons */}
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
