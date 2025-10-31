"use client";

import { useState } from "react";
import { useBuyPass } from "@/hooks/useBuyPass";
import { Button } from "@/components/ui/button";

interface BuyPassButtonProps {
  passId: string;
  tokenMint: string;
  price: number;
  creatorPublicKey: string;
  vaultAddress: string;
  className?: string;
}

export function BuyPassButton({
  passId,
  tokenMint,
  price,
  creatorPublicKey,
  vaultAddress,
  className,
}: BuyPassButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const buyPassMutation = useBuyPass();

  const handleBuyPass = async () => {
    if (isConfirming) {
      try {
        await buyPassMutation.mutateAsync({
          passId,
          tokenMint,
          price,
          creatorPublicKey,
          vaultAddress,
        });
        setIsConfirming(false);
      } catch (error) {
        console.error("Purchase failed:", error);
        setIsConfirming(false);
      }
    } else {
      // First click, show confirmation
      setIsConfirming(true);
    }
  };

  const handleCancel = () => {
    setIsConfirming(false);
  };

  if (buyPassMutation.isPending) {
    return (
      <Button
        disabled
        className={`bg-yellow-300 hover:bg-yellow-400 text-black border-4 border-foreground shadow-[6px_6px_0_0_#000] font-extrabold ${className}`}
      >
        Processing Purchase...
      </Button>
    );
  }

  if (isConfirming) {
    return (
      <div className="space-y-2">
        <div className="bg-yellow-100 border-4 border-yellow-500 p-3 shadow-[4px_4px_0_0_#000]">
          <p className="text-yellow-800 font-bold text-sm">
            Confirm Purchase: {price} USDC
          </p>
          <p className="text-yellow-700 text-xs mt-1">
            This will create an NFT and distribute revenue (70% to creator
            vault)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleBuyPass}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white border-4 border-foreground shadow-[6px_6px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 transition-transform font-extrabold"
          >
            Confirm Buy
          </Button>
          <Button
            onClick={handleCancel}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white border-4 border-foreground shadow-[6px_6px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 transition-transform font-extrabold"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={handleBuyPass}
      className={`bg-yellow-300 hover:bg-yellow-400 text-black border-4 border-foreground shadow-[6px_6px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 transition-transform font-extrabold ${className}`}
    >
      Buy Pass - {price} USDC
    </Button>
  );
}
