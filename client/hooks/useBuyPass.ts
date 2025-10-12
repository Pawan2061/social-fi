import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/contexts/AuthContext";
import { buyPass } from "@/lib/api";
import { buyCreatorPass } from "@/lib/nft-utils";

interface BuyPassData {
  passId: number;
  tokenMint: string;
  price: number;
  creatorPublicKey: string;
  vaultAddress: string;
}

export function useBuyPass() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { publicKey, signTransaction } = useWallet();

  return useMutation({
    mutationFn: async (data: BuyPassData) => {
      if (!publicKey || !signTransaction || !token) {
        throw new Error("Wallet not connected or user not authenticated");
      }

      console.log("🛒 Starting pass purchase process...");
      console.log("📝 Pass data:", data);

      console.log("💰 Executing on-chain purchase and revenue distribution...");
      const { transactionSignature, nftMint } = await buyCreatorPass(
        {
          publicKey,
          signTransaction: signTransaction as (
            transaction: unknown
          ) => Promise<unknown>,
        },
        {
          tokenMint: data.tokenMint,
          price: data.price,
          creatorPublicKey: data.creatorPublicKey,
          vaultAddress: data.vaultAddress,
        }
      );

      console.log("✅ On-chain purchase completed:", {
        transactionSignature,
        nftMint,
      });

      // Step 2: Update backend with purchase record
      console.log("📝 Updating backend with purchase record...");
      const result = await buyPass(token, {
        passId: data.passId,
        txId: transactionSignature,
        nftMint: nftMint,
      });

      console.log("✅ Backend updated successfully:", result);

      return {
        ...result,
        nftMint,
        transactionSignature,
      };
    },
    onSuccess: (data) => {
      console.log("🎉 Pass purchase completed successfully!", data);

      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["passes"] });

      // You could also show a success toast here
    },
    onError: (error) => {
      console.error("❌ Pass purchase failed:", error);

      // You could show an error toast here
    },
  });
}
