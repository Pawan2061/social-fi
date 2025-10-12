import {
  generateSigner,
  keypairIdentity,
  publicKey as UMIPublicKey,
  Umi,
  percentAmount,
} from "@metaplex-foundation/umi";

import {
  createNft,
  findMetadataPda,
  verifyCollectionV1,
} from "@metaplex-foundation/mpl-token-metadata";
import { createGenericFile } from "@metaplex-foundation/umi";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import idl from "../idl/contract.json";

const PROGRAM_ID = new PublicKey(
  "BqHTWrkNFvj9ZA24yFkcTiXdczrNuQpspknnt3tWabVF"
);

export function generateCreatorPoolVaultAddress(
  creatorPublicKey: string
): string {
  try {
    const creatorKey = new PublicKey(creatorPublicKey);

    const [vaultAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("usdc_vault"), creatorKey.toBuffer()],
      PROGRAM_ID
    );

    console.log(
      "🏦 Generated creator pool vault address:",
      vaultAddress.toString()
    );
    return vaultAddress.toString();
  } catch (error) {
    console.error("❌ Error generating vault address:", error);
    throw new Error("Failed to generate creator pool vault address");
  }
}

export function generateCreatorPoolAddress(creatorPublicKey: string): string {
  try {
    const creatorKey = new PublicKey(creatorPublicKey);

    const [poolAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("creator_pool"), creatorKey.toBuffer()],
      PROGRAM_ID
    );

    console.log("🏦 Generated creator pool address:", poolAddress.toString());
    return poolAddress.toString();
  } catch (error) {
    console.error("❌ Error generating pool address:", error);
    throw new Error("Failed to generate creator pool address");
  }
}

export function generateFactoryAddress(): string {
  try {
    const [factoryAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("factory")],
      PROGRAM_ID
    );

    console.log("🏭 Generated factory address:", factoryAddress.toString());
    return factoryAddress.toString();
  } catch (error) {
    console.error("❌ Error generating factory address:", error);
    throw new Error("Failed to generate factory address");
  }
}

export async function initializeFactory(
  creatorWallet: {
    publicKey: { toBase58(): string };
    signTransaction: (transaction: unknown) => Promise<unknown>;
  },
  defaultQuorum: number = 1000,
  defaultVotingWindow: number = 7 * 24 * 60 * 60,
  platformFeePercentage: number = 5 // 5%
): Promise<{
  factoryAddress: string;
  transactionSignature: string;
}> {
  try {
    console.log("🏭 Initializing factory...");

    const connection = new Connection(clusterApiUrl("devnet"));
    const wallet = {
      publicKey: new PublicKey(creatorWallet.publicKey.toBase58()),
      signTransaction: creatorWallet.signTransaction,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signAllTransactions: async (transactions: any[]) => {
        return await Promise.all(
          transactions.map((tx) => creatorWallet.signTransaction(tx))
        );
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const provider = new AnchorProvider(connection, wallet as any, {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = new Program(idl as any, provider);

    try {
      const programAccount = await connection.getAccountInfo(
        new PublicKey("BqHTWrkNFvj9ZA24yFkcTiXdczrNuQpspknnt3tWabVF")
      );
      if (!programAccount) {
        throw new Error("Program is not deployed to devnet");
      }
      console.log("✅ Program found on devnet");
    } catch (error) {
      console.error("❌ Program check failed:", error);
      throw new Error(
        "Program is not deployed to devnet. Please deploy the contract first."
      );
    }

    const factoryAddress = generateFactoryAddress();

    const usdcMint = new PublicKey(
      "So11111111111111111111111111111111111111112" // Wrapped SOL (WSOL) - always exists
    );

    console.log("🔧 Using WSOL as test token for development");

    console.log("📋 Factory initialization:", {
      factory: factoryAddress,
      usdcMint: usdcMint.toString(),
      defaultQuorum,
      defaultVotingWindow,
      platformFeePercentage,
    });

    const tx = await program.methods
      .initializeFactory(
        new anchor.BN(defaultQuorum),
        new anchor.BN(defaultVotingWindow),
        new anchor.BN(platformFeePercentage)
      )
      .accounts({
        factory: new PublicKey(factoryAddress),
        authority: wallet.publicKey,
        usdcMint: usdcMint,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Factory initialized successfully!");
    console.log("📋 Transaction signature:", tx);
    console.log("🏭 Factory address:", factoryAddress);

    return {
      factoryAddress,
      transactionSignature: tx,
    };
  } catch (error) {
    console.error("❌ Error initializing factory:", error);
    throw new Error(
      `Failed to initialize factory: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function createCreatorPoolAddresses(creatorWallet: {
  publicKey: { toBase58(): string };
  signTransaction: (transaction: unknown) => Promise<unknown>;
}): Promise<{
  creatorPoolAddress: string;
  vaultAddress: string;
  transactionSignature: string;
}> {
  try {
    console.log("🏦 Generating creator pool addresses...");

    const creatorPoolAddress = generateCreatorPoolAddress(
      creatorWallet.publicKey.toBase58()
    );
    const vaultAddress = generateCreatorPoolVaultAddress(
      creatorWallet.publicKey.toBase58()
    );

    console.log("📋 Generated addresses:", {
      creatorPool: creatorPoolAddress,
      vault: vaultAddress,
    });

    console.log(
      "⚠️  Note: This is a development workaround - addresses are generated but not deployed on-chain"
    );
    console.log(
      "🔧 The actual creator pool creation will be implemented once the program ID mismatch is resolved"
    );

    return {
      creatorPoolAddress,
      vaultAddress,
      transactionSignature: "dev-workaround-tx-signature",
    };
  } catch (error) {
    console.error("❌ Error generating creator pool addresses:", error);
    throw new Error(
      `Failed to generate creator pool addresses: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function createCreatorPoolOnChain(
  creatorWallet: {
    publicKey: { toBase58(): string };
    signTransaction: (transaction: unknown) => Promise<unknown>;
  },
  votingQuorum: number = 0,
  votingWindow: number = 0
): Promise<{
  creatorPoolAddress: string;
  vaultAddress: string;
  transactionSignature: string;
}> {
  try {
    console.log("🏦 Creating creator pool on-chain...");

    const connection = new Connection(clusterApiUrl("devnet"));
    const wallet = {
      publicKey: new PublicKey(creatorWallet.publicKey.toBase58()),
      signTransaction: creatorWallet.signTransaction,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signAllTransactions: async (transactions: any[]) => {
        return await Promise.all(
          transactions.map((tx) => creatorWallet.signTransaction(tx))
        );
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const provider = new AnchorProvider(connection, wallet as any, {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = new Program(idl as any, provider);

    try {
      const programAccount = await connection.getAccountInfo(
        new PublicKey("BqHTWrkNFvj9ZA24yFkcTiXdczrNuQpspknnt3tWabVF")
      );
      if (!programAccount) {
        throw new Error("Program is not deployed to devnet");
      }
      console.log("✅ Program found on devnet");
    } catch (error) {
      console.error("❌ Program check failed:", error);
      throw new Error(
        "Program is not deployed to devnet. Please deploy the contract first."
      );
    }

    const creatorPoolAddress = generateCreatorPoolAddress(
      creatorWallet.publicKey.toBase58()
    );
    const vaultAddress = generateCreatorPoolVaultAddress(
      creatorWallet.publicKey.toBase58()
    );
    const factoryAddress = generateFactoryAddress();

    const usdcMint = new PublicKey(
      "So11111111111111111111111111111111111111112"
    );

    const tokenProgram = new PublicKey(
      "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
    );

    console.log("🔧 Using WSOL as test token for development");

    console.log("📋 Account addresses:", {
      creatorPool: creatorPoolAddress,
      vault: vaultAddress,
      factory: factoryAddress,
      usdcMint: usdcMint.toString(),
    });

    console.log(
      "🔍 Checking if creator pool already exists:",
      creatorPoolAddress
    );
    const existingCreatorPool = await connection.getAccountInfo(
      new PublicKey(creatorPoolAddress)
    );

    if (existingCreatorPool) {
      console.log(
        "⚠️ Creator pool already exists! Returning existing addresses."
      );
      console.log("📊 Existing creator pool details:", {
        address: creatorPoolAddress,
        owner: existingCreatorPool.owner.toString(),
        executable: existingCreatorPool.executable,
        lamports: existingCreatorPool.lamports,
        dataLength: existingCreatorPool.data.length,
      });

      return {
        creatorPoolAddress,
        vaultAddress,
        transactionSignature: "existing-pool",
      };
    }

    console.log("✅ Creator pool does not exist, proceeding with creation...");

    console.log("🔍 Checking factory account:", factoryAddress);
    const factoryAccount = await connection.getAccountInfo(
      new PublicKey(factoryAddress)
    );

    if (!factoryAccount) {
      console.log(
        "🏭 Factory account does not exist. Initializing factory first..."
      );
      try {
        const factoryResult = await initializeFactory(creatorWallet);
        console.log("✅ Factory initialized successfully:", factoryResult);

        const verifyFactory = await connection.getAccountInfo(
          new PublicKey(factoryAddress)
        );
        if (!verifyFactory) {
          throw new Error(
            "Factory initialization failed - account not found after creation"
          );
        }
        console.log("✅ Factory account verified");
      } catch (factoryError) {
        console.error("❌ Factory initialization failed:", factoryError);
        throw new Error(
          `Factory initialization failed: ${
            factoryError instanceof Error
              ? factoryError.message
              : "Unknown error"
          }`
        );
      }
    } else {
      console.log("✅ Factory account found");
      console.log("📊 Factory account details:", {
        address: factoryAddress,
        owner: factoryAccount.owner.toString(),
        executable: factoryAccount.executable,
        lamports: factoryAccount.lamports,
        dataLength: factoryAccount.data.length,
      });
    }

    const tx = await program.methods
      .createPool(new anchor.BN(votingQuorum), new anchor.BN(votingWindow))
      .accounts({
        creatorPool: new PublicKey(creatorPoolAddress),
        creator: wallet.publicKey,
        usdcMint: usdcMint,
        usdcVault: new PublicKey(vaultAddress),
        factory: new PublicKey(factoryAddress),
        systemProgram: SystemProgram.programId,
        tokenProgram: tokenProgram,
      })
      .rpc();

    console.log("✅ Creator pool created successfully!");
    console.log("📋 Transaction signature:", tx);
    console.log("🏦 Creator pool address:", creatorPoolAddress);
    console.log("💰 Vault address:", vaultAddress);

    return {
      creatorPoolAddress,
      vaultAddress,
      transactionSignature: tx,
    };
  } catch (error) {
    console.error("❌ Error creating creator pool:", error);
    throw new Error(
      `Failed to create creator pool: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export function walletToUmiKeypair(wallet: {
  publicKey: { toBase58(): string };
  signTransaction: (transaction: unknown) => Promise<unknown>;
}) {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected");
  }

  const mockKeypair = {
    publicKey: UMIPublicKey(wallet.publicKey.toBase58()),
    secretKey: new Uint8Array(64),
  };

  return mockKeypair;
}

export async function testNetworkConnection(rpcUrl?: string): Promise<boolean> {
  const rpcEndpoints = rpcUrl
    ? [rpcUrl]
    : [
        clusterApiUrl("devnet"),
        "https://api.devnet.solana.com",
        "https://devnet.helius-rpc.com/?api-key=your-api-key",
      ];

  for (const endpoint of rpcEndpoints) {
    try {
      console.log("🔍 Testing network connection to:", endpoint);

      const connection = new Connection(endpoint, "confirmed");
      const version = await connection.getVersion();

      console.log("✅ Network connection successful!");
      console.log("📊 Solana version:", version);
      console.log("🌐 Working RPC endpoint:", endpoint);
      return true;
    } catch (error) {
      console.warn(`❌ Failed to connect to ${endpoint}:`, error);
      continue;
    }
  }

  console.error("❌ All RPC endpoints failed");
  return false;
}

export function createUmiInstance(rpcUrl?: string): Umi {
  const rpcEndpoint = rpcUrl || clusterApiUrl("devnet");
  console.log("🔗 Connecting to Solana RPC:", rpcEndpoint);

  const umi = createUmi(rpcEndpoint).use(mplTokenMetadata()).use(mockUploader);
  console.log("✅ Umi instance created successfully");
  return umi;
}

export async function uploadImage(umi: Umi, imageFile: File): Promise<string> {
  const buffer = await imageFile.arrayBuffer();
  const file = createGenericFile(new Uint8Array(buffer), imageFile.name, {
    contentType: imageFile.type,
  });

  const [imageUri] = await umi.uploader.upload([file]);
  return imageUri;
}

export async function uploadMetadata(
  umi: Umi,
  metadata: {
    name: string;
    description: string;
    image: string;
    symbol?: string;
    attributes?: Array<{ trait_type: string; value: string }>;
  }
): Promise<string> {
  const uri = await umi.uploader.uploadJson(metadata);
  return uri;
}

export async function createCreatorPassCollection(
  creatorWallet: {
    publicKey: { toBase58(): string };
    signTransaction: (transaction: unknown) => Promise<unknown>;
  },
  collectionData: {
    name: string;
    description: string;
    image: File;
    symbol?: string;
  }
): Promise<{
  collectionMint: string;
  collectionMetadata: string;
  collectionMasterEdition: string;
}> {
  try {
    console.log("🎨 Starting Creator Pass NFT collection creation...");
    console.log("📝 Collection data:", {
      name: collectionData.name,
      description: collectionData.description,
      imageName: collectionData.image.name,
      symbol: collectionData.symbol || "PASS",
    });

    const umi = createUmiInstance();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    umi.use(walletAdapterIdentity(creatorWallet as any));
    console.log("✅ Creator identity set");

    console.log("📤 Uploading collection image...");
    const imageUri = await uploadImage(umi, collectionData.image);
    console.log("✅ Collection image uploaded:", imageUri);

    console.log("📤 Uploading collection metadata...");
    const metadataUri = await uploadMetadata(umi, {
      name: collectionData.name,
      description: collectionData.description,
      image: imageUri,
      symbol: collectionData.symbol || "PASS",
      attributes: [
        { trait_type: "Type", value: "Creator Pass" },
        { trait_type: "Collection", value: collectionData.name },
      ],
    });
    console.log("✅ Collection metadata uploaded:", metadataUri);

    console.log("🪙 Creating Creator Pass NFT collection on-chain...");
    const collectionMint = generateSigner(umi);

    try {
      const createNftResult = await createNft(umi, {
        mint: collectionMint,
        name: collectionData.name,
        symbol: collectionData.symbol || "PASS",
        uri: metadataUri,
        sellerFeeBasisPoints: percentAmount(0),
        isCollection: true,
      }).sendAndConfirm(umi);

      console.log("✅ Creator Pass NFT collection created successfully!");
      console.log("🪙 Collection mint address:", collectionMint.publicKey);
      console.log("📋 Transaction signature:", createNftResult.signature);

      const collectionMetadata = findMetadataPda(umi, {
        mint: collectionMint.publicKey,
      });

      const collectionMasterEdition = findMetadataPda(umi, {
        mint: collectionMint.publicKey,
      });

      return {
        collectionMint: collectionMint.publicKey,
        collectionMetadata: collectionMetadata[0],
        collectionMasterEdition: collectionMasterEdition[0],
      };
    } catch (nftError) {
      console.error("❌ NFT creation transaction failed:", nftError);
      throw new Error(
        `NFT creation transaction failed: ${
          nftError instanceof Error ? nftError.message : "Unknown error"
        }`
      );
    }
  } catch (error) {
    console.error("❌ Error creating Creator Pass NFT collection:", error);

    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    throw new Error(
      `Failed to create Creator Pass NFT collection: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
export async function createNftInCollection(
  umi: Umi,
  creatorWallet: {
    publicKey: { toBase58(): string };
    signTransaction: (transaction: unknown) => Promise<unknown>;
  },
  collectionMint: string,
  nftData: {
    name: string;
    description: string;
    image: File;
    symbol?: string;
  }
): Promise<{
  nftMint: string;
  nftMetadata: string;
}> {
  try {
    console.log("🎨 Creating individual NFT in collection...");

    const creatorKeypair = walletToUmiKeypair(creatorWallet);
    umi.use(keypairIdentity(creatorKeypair));

    const imageUri = await uploadImage(umi, nftData.image);
    console.log("✅ NFT image uploaded:", imageUri);

    const metadataUri = await uploadMetadata(umi, {
      name: nftData.name,
      description: nftData.description,
      image: imageUri,
      symbol: nftData.symbol || "PASS",
    });
    console.log("✅ NFT metadata uploaded:", metadataUri);

    const nftMint = generateSigner(umi);
    await createNft(umi, {
      mint: nftMint,
      name: nftData.name,
      symbol: nftData.symbol || "PASS",
      uri: metadataUri,
      sellerFeeBasisPoints: percentAmount(0),
    }).sendAndConfirm(umi);

    console.log("✅ Individual NFT created:", nftMint.publicKey);

    await verifyCollection(
      umi,
      creatorWallet,
      collectionMint,
      nftMint.publicKey
    );

    const nftMetadata = findMetadataPda(umi, {
      mint: nftMint.publicKey,
    });

    return {
      nftMint: nftMint.publicKey,
      nftMetadata: nftMetadata[0],
    };
  } catch (error) {
    console.error("❌ Error creating NFT in collection:", error);
    throw new Error(
      `Failed to create NFT in collection: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function verifyCollection(
  umi: Umi,
  creatorWallet: {
    publicKey: { toBase58(): string };
    signTransaction: (transaction: unknown) => Promise<unknown>;
  },
  collectionMint: string,
  nftMint: string
): Promise<void> {
  try {
    console.log("🔍 Verifying collection for NFT...");

    const creatorKeypair = walletToUmiKeypair(creatorWallet);
    umi.use(keypairIdentity(creatorKeypair));

    const metadata = findMetadataPda(umi, { mint: UMIPublicKey(nftMint) });

    await verifyCollectionV1(umi, {
      metadata: metadata[0],
      collectionMint: UMIPublicKey(collectionMint),
      authority: umi.identity,
    }).sendAndConfirm(umi);

    console.log("✅ Collection verified successfully");
  } catch (error) {
    console.error("❌ Error verifying collection:", error);
    throw new Error(
      `Failed to verify collection: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

const mockUploader = {
  install(umi: Umi) {
    umi.uploader = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      upload: async (files: any[]) => {
        return files.map(
          (file, index) =>
            `https://mock-storage.com/${file.name}-${Date.now()}-${index}`
        );
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      uploadJson: async (json: any) => {
        return `https://mock-storage.com/metadata-${Date.now()}.json`;
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getUploadPrice: async (files: any[]) => {
        return { basisPoints: BigInt(0), identifier: "SOL", decimals: 9 };
      },
    };
  },
};
