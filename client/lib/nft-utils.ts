// claim-section245
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
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import idl from "../idl/contract.json";
import {
  uploadImageToIPFS,
  uploadJSONToIPFS,
  uploadNFTProfileMetadata,
} from "./ipfs-utils";

const PROGRAM_ID = new PublicKey(
  "BqHTWrkNFvj9ZA24yFkcTiXdczrNuQpspknnt3tWabVF"
);

export async function getOrCreateTokenAccount(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey,
  signTransaction: (transaction: Transaction) => Promise<Transaction>
): Promise<PublicKey> {
  try {
    const tokenAccount = await getAssociatedTokenAddress(mint, payer);

    const existingAccount = await findTokenAccountWithRetries(
      connection,
      tokenAccount
    );
    if (existingAccount) {
      return tokenAccount;
    }

    console.log("🔧 Creating new token account:", tokenAccount.toString());

    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(payer, tokenAccount, payer, mint)
    );

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payer;

    const signedTransaction = await signTransaction(transaction);
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize()
    );

    const confirmation = await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed"
    );

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    const verifiedAccount = await findTokenAccountWithRetries(
      connection,
      tokenAccount
    );
    if (!verifiedAccount) {
      throw new Error(
        "Token account creation failed - account not found after creation"
      );
    }

    console.log(
      "✅ Token account created and verified:",
      tokenAccount.toString()
    );
    return tokenAccount;
  } catch (error) {
    console.error("❌ Error in getOrCreateTokenAccount:", error);
    throw new Error(
      `Failed to get/create token account: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

async function findTokenAccountWithRetries(
  connection: Connection,
  tokenAccount: PublicKey,
  maxRetries: number = 15,
  delayMs: number = 2000
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const account = await getAccount(connection, tokenAccount);
      console.log("🔍 Account details:", {
        address: tokenAccount.toString(),
        mint: account.mint.toString(),
        owner: account.owner.toString(),
        amount: account.amount.toString(),
      });
      return account;
    } catch (error) {
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        console.error("❌ Error finding token account:", error);
        return null;
      }
    }
  }
  return null;
}
// This function is no longer used - vault addresses are now stored in the database

export function generateCreatorPoolAddress(creatorPublicKey: string): string {
  try {
    const creatorKey = new PublicKey(creatorPublicKey);

    const [poolAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("creator_pool"), creatorKey.toBuffer()],
      PROGRAM_ID
    );

    return poolAddress.toString();
  } catch (error) {
    console.error("❌ Error generating pool address:", error);
    throw new Error("Failed to generate creator pool address");
  }
}

export function generateSolVaultAddress(creatorPublicKey: string): string {
  try {
    const creatorKey = new PublicKey(creatorPublicKey);

    const [vaultAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("sol_vault"), creatorKey.toBuffer()],
      PROGRAM_ID
    );

    return vaultAddress.toString();
  } catch (error) {
    console.error("❌ Error generating SOL vault address:", error);
    throw new Error("Failed to generate SOL vault address");
  }
}

export function generateClaimAddress(
  creatorPoolAddress: string,
  claimCount: number
): string {
  try {
    if (!creatorPoolAddress) {
      throw new Error("creatorPoolAddress is required");
    }

    if (typeof claimCount !== "number" || isNaN(claimCount)) {
      throw new Error("claimCount must be a valid number");
    }

    const poolKey = new PublicKey(creatorPoolAddress);

    const claimCountBuffer = Buffer.alloc(8);
    claimCountBuffer.writeUInt32LE(claimCount, 0);

    const [claimAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("claim"), poolKey.toBuffer(), claimCountBuffer],
      PROGRAM_ID
    );

    return claimAddress.toString();
  } catch (error) {
    console.error("❌ Error generating claim address:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      creatorPoolAddress,
      claimCount,
      creatorPoolAddressType: typeof creatorPoolAddress,
      claimCountType: typeof claimCount,
    });
    throw new Error(
      `Failed to generate claim address: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export function generateCreatorCollectionMint(creatorAddress: string): string {
  try {
    const creatorKey = new PublicKey(creatorAddress);

    const [collectionMint] = PublicKey.findProgramAddressSync(
      [Buffer.from("creator_collection"), creatorKey.toBuffer()],
      PROGRAM_ID
    );

    return collectionMint.toString();
  } catch (error) {
    console.error("❌ Error generating creator collection mint:", error);
    throw new Error(
      `Failed to generate creator collection mint: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export function generateNftOwnershipAddress(
  userAddress: string,
  creatorAddress: string
): string {
  try {
    const userKey = new PublicKey(userAddress);
    const creatorKey = new PublicKey(creatorAddress);
    const [nftOwnershipAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("nft_ownership"), userKey.toBuffer(), creatorKey.toBuffer()],
      PROGRAM_ID
    );
    return nftOwnershipAddress.toString();
  } catch (error) {
    throw new Error(
      `Failed to generate NFT ownership address: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function getCreatorPoolData(creatorPoolAddress: string): Promise<{
  claimCount: number;
  votingQuorum: number;
  votingWindow: number;
}> {
  try {
    const connection = new Connection(clusterApiUrl("devnet"));
    const creatorPoolPublicKey = new PublicKey(creatorPoolAddress);

    const accountInfo = await connection.getAccountInfo(creatorPoolPublicKey);
    if (!accountInfo) {
      throw new Error("Creator pool account not found");
    }

    const dummyWallet = {
      publicKey: new PublicKey("11111111111111111111111111111111"),
      signTransaction: async () => {
        throw new Error("Not implemented");
      },
      signAllTransactions: async () => {
        throw new Error("Not implemented");
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const provider = new AnchorProvider(connection, dummyWallet as any, {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = new Program(idl as any, provider);
    const creatorPoolData = program.coder.accounts.decode(
      "CreatorPool",
      accountInfo.data
    );

    return {
      claimCount: creatorPoolData.claimCount.toNumber(),
      votingQuorum: creatorPoolData.votingQuorum.toNumber(),
      votingWindow: creatorPoolData.votingWindow.toNumber(),
    };
  } catch (error) {
    console.error("❌ Error getting creator pool data:", error);
    throw new Error(
      `Failed to get creator pool data: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export function generateFactoryAddress(): string {
  try {
    const [factoryAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("factory")],
      PROGRAM_ID
    );

    return factoryAddress.toString();
  } catch (error) {
    console.error("❌ Error generating factory address:", error);
    throw new Error("Failed to generate factory address");
  }
}

export async function getVaultBalance(vaultAddress: string): Promise<number> {
  try {
    const connection = new Connection(clusterApiUrl("devnet"));
    const balance = await connection.getBalance(new PublicKey(vaultAddress));
    const balanceInSOL = balance / 1e9;
    return balanceInSOL;
  } catch (error) {
    console.error("❌ Error getting vault balance:", error);
    return 0;
  }
}

export async function getVaultInfo(vaultAddress: string) {
  try {
    const balance = await getVaultBalance(vaultAddress);

    return {
      vaultAddress,
      balance,
      balanceFormatted: `${balance.toFixed(6)} SOL`,
      balanceLamports: Math.floor(balance * 1e9),
    };
  } catch (error) {
    console.error("❌ Error getting vault info:", error);
    return {
      vaultAddress: "",
      balance: 0,
      balanceFormatted: "0.000000 SOL",
      balanceLamports: 0,
    };
  }
}

export async function initializeFactory(
  creatorWallet: {
    publicKey: { toBase58(): string };
    signTransaction: (transaction: unknown) => Promise<unknown>;
  },
  defaultQuorum: number = 1,
  defaultVotingWindow: number = 2 * 60, // 2 minutes
  platformFeePercentage: number = 5
): Promise<{
  factoryAddress: string;
  transactionSignature: string;
}> {
  try {
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
      "So11111111111111111111111111111111111111112"
    );

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

// This function is no longer used - vault addresses are now generated during pool creation

export async function createCreatorPoolOnChain(
  creatorWallet: {
    publicKey: { toBase58(): string };
    signTransaction: (transaction: unknown) => Promise<unknown>;
  },
  votingQuorum: number = 0,
  votingWindow: number = 2 * 60 // 2 minutes
): Promise<{
  creatorPoolAddress: string;
  vaultAddress: string;
  transactionSignature: string;
}> {
  try {
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
    // const vaultAddress = generateCreatorPoolVaultAddress(
    //   creatorWallet.publicKey.toBase58()
    // );
    const factoryAddress = generateFactoryAddress();

    // No longer using USDC mint or token program for native SOL

    const factoryAccount = await connection.getAccountInfo(
      new PublicKey(factoryAddress)
    );

    if (!factoryAccount) {
      try {
        await initializeFactory(creatorWallet, 1, 2 * 60, 5); // 2 minutes

        const verifyFactory = await connection.getAccountInfo(
          new PublicKey(factoryAddress)
        );
        if (!verifyFactory) {
          throw new Error(
            "Factory initialization failed - account not found after creation"
          );
        }
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
    }
    // Generate SOL vault PDA address
    const vaultAddress = generateSolVaultAddress(
      creatorWallet.publicKey.toBase58()
    );
    console.log("✅ Using SOL vault PDA:", vaultAddress);

    try {
      const tx = await program.methods
        .createPool(new anchor.BN(votingQuorum), new anchor.BN(votingWindow))
        .accounts({
          creatorPool: new PublicKey(creatorPoolAddress),
          creator: wallet.publicKey,
          solVault: new PublicKey(vaultAddress), // Use SOL vault PDA
          factory: new PublicKey(factoryAddress),
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return {
        creatorPoolAddress,
        vaultAddress,
        transactionSignature: tx,
      };
    } catch (createError) {
      const existingAccount = await connection.getAccountInfo(
        new PublicKey(creatorPoolAddress)
      );
      if (existingAccount) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const program = new Program(idl as any, provider);
          await program.coder.accounts.decode(
            "CreatorPool",
            existingAccount.data
          );

          return {
            creatorPoolAddress,
            vaultAddress,
            transactionSignature: "existing-valid-pool",
          };
        } catch (decodeError) {
          throw new Error(
            "Creator pool account exists but is corrupted. Please contact support or try with a different wallet. " +
              decodeError
          );
        }
      } else {
        throw createError;
      }
    }
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
      const connection = new Connection(endpoint, "confirmed");
      await connection.getVersion();

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

  const umi = createUmi(rpcEndpoint).use(mplTokenMetadata()).use(ipfsUploader);

  return umi;
}

export async function uploadImage(umi: Umi, imageFile: File): Promise<string> {
  try {
    // Use IPFS for image upload
    return await uploadImageToIPFS(imageFile);
  } catch (error) {
    console.error(
      "❌ IPFS upload failed, falling back to mock uploader:",
      error
    );
    // Fallback to mock uploader if IPFS fails
    const buffer = await imageFile.arrayBuffer();
    const file = createGenericFile(new Uint8Array(buffer), imageFile.name, {
      contentType: imageFile.type,
    });

    const [imageUri] = await umi.uploader.upload([file]);
    return imageUri;
  }
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
  try {
    // Use IPFS for metadata upload
    return await uploadNFTProfileMetadata(metadata);
  } catch (error) {
    console.error(
      "❌ IPFS metadata upload failed, falling back to mock uploader:",
      error
    );
    // Fallback to mock uploader if IPFS fails
    const uri = await umi.uploader.uploadJson(metadata);
    return uri;
  }
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
  metadataUri: string;
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

    const imageUri = await uploadImage(umi, collectionData.image);

    // Upload metadata to IPFS
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

    console.log("📄 Created metadata URI:", metadataUri);

    const collectionMint = generateSigner(umi);

    try {
      await createNft(umi, {
        mint: collectionMint,
        name: collectionData.name,
        symbol: collectionData.symbol || "PASS",
        uri: metadataUri,
        sellerFeeBasisPoints: percentAmount(0),
        isCollection: true,
        collection: {
          key: collectionMint.publicKey,
          verified: false,
        },
      }).sendAndConfirm(umi);

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
        metadataUri: metadataUri,
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

    const metadataUri = await uploadMetadata(umi, {
      name: nftData.name,
      description: nftData.description,
      image: imageUri,
      symbol: nftData.symbol || "PASS",
    });

    const nftMint = generateSigner(umi);
    await createNft(umi, {
      mint: nftMint,
      name: nftData.name,
      symbol: nftData.symbol || "PASS",
      uri: metadataUri,
      sellerFeeBasisPoints: percentAmount(0),
    }).sendAndConfirm(umi);

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
    const creatorKeypair = walletToUmiKeypair(creatorWallet);
    umi.use(keypairIdentity(creatorKeypair));

    const metadata = findMetadataPda(umi, { mint: UMIPublicKey(nftMint) });

    await verifyCollectionV1(umi, {
      metadata: metadata[0],
      collectionMint: UMIPublicKey(collectionMint),
      authority: umi.identity,
    }).sendAndConfirm(umi);
  } catch (error) {
    console.error("❌ Error verifying collection:", error);
    throw new Error(
      `Failed to verify collection: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function buyCreatorPass(
  buyerWallet: {
    publicKey: { toBase58(): string };
    signTransaction: (transaction: unknown) => Promise<unknown>;
  },
  passData: {
    tokenMint: string;
    price: number; // in USDC
    creatorPublicKey: string;
    vaultAddress: string;
  }
): Promise<{
  transactionSignature: string;
  nftMint: string;
  metadataUri: string;
}> {
  try {
    console.log("🛒 Starting Creator Pass purchase...");
    console.log("📝 Pass data:", {
      tokenMint: passData.tokenMint,
      price: passData.price,
      creator: passData.creatorPublicKey,
      vault: passData.vaultAddress,
    });

    const connection = new Connection(clusterApiUrl("devnet"));

    const programAccount = await connection.getAccountInfo(PROGRAM_ID);
    if (!programAccount) {
      throw new Error("Program is not deployed to devnet");
    }

    const creatorPoolAddress = generateCreatorPoolAddress(
      passData.creatorPublicKey
    );

    const usdcMint = new PublicKey(
      "So11111111111111111111111111111111111111112"
    );

    const totalAmount = Math.floor(passData.price * 1e9);

    console.log("💰 Purchase details:", {
      totalAmount: totalAmount,
      priceInUSDC: passData.price,
      creatorPool: creatorPoolAddress,
      vault: passData.vaultAddress,
      usdcMint: usdcMint.toString(),
    });

    const umi = createUmiInstance();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    umi.use(walletAdapterIdentity(buyerWallet as any));

    const nftMint = generateSigner(umi);
    const collectionMint = UMIPublicKey(passData.tokenMint);

    console.log("🪙 Creating individual NFT for buyer...");

    // Create metadata for the individual NFT
    const individualMetadata = {
      name: `Creator Pass #${Date.now()}`,
      description:
        "A unique Creator Pass NFT that grants access to exclusive content and benefits.",
      image:
        "https://via.placeholder.com/400x400/6366f1/ffffff?text=Creator+Pass", // Placeholder image
      symbol: "PASS",
      attributes: [
        { trait_type: "Type", value: "Creator Pass" },
        { trait_type: "Rarity", value: "Common" },
        { trait_type: "Access Level", value: "Premium" },
      ],
    };

    // Upload individual NFT metadata to IPFS
    const individualMetadataUri = await uploadNFTProfileMetadata(
      individualMetadata
    );
    console.log(
      "📄 Individual NFT metadata uploaded to IPFS:",
      individualMetadataUri
    );

    await createNft(umi, {
      mint: nftMint,
      name: individualMetadata.name,
      symbol: individualMetadata.symbol,
      uri: individualMetadataUri,
      sellerFeeBasisPoints: percentAmount(0),
      collection: {
        key: collectionMint,
        verified: false,
      },
    }).sendAndConfirm(umi);

    console.log("✅ NFT created for buyer:", nftMint.publicKey);

    console.log("🔍 Checking vault balance before transfer...");
    const vaultInfoBefore = await getVaultInfo(passData.vaultAddress);
    console.log("📊 Vault before transfer:", vaultInfoBefore);

    console.log("💰 Simulating revenue distribution...");

    const totalAmountLamports = Math.floor(passData.price * 1e9);
    const vaultAmount = Math.floor((totalAmountLamports * 70) / 100);
    const creatorAmount = totalAmountLamports - vaultAmount;

    console.log("📊 Revenue distribution:", {
      totalAmount: totalAmountLamports,
      vaultAmount: vaultAmount,
      creatorAmount: creatorAmount,
      vaultPercentage: 70,
      creatorPercentage: 30,
    });

    const transaction = new Transaction();

    // For now, use direct transfers - the program instruction needs to be called by the creator
    // This is a temporary solution until we implement proper program integration
    const vaultTransferInstruction = SystemProgram.transfer({
      fromPubkey: new PublicKey(buyerWallet.publicKey.toBase58()),
      toPubkey: new PublicKey(passData.vaultAddress),
      lamports: vaultAmount,
    });
    transaction.add(vaultTransferInstruction);

    const creatorTransferInstruction = SystemProgram.transfer({
      fromPubkey: new PublicKey(buyerWallet.publicKey.toBase58()),
      toPubkey: new PublicKey(passData.creatorPublicKey),
      lamports: creatorAmount,
    });
    transaction.add(creatorTransferInstruction);

    console.log("🔗 Setting recent blockhash...");
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(buyerWallet.publicKey.toBase58());

    console.log("🔐 Signing and sending transaction...");
    const signedTransaction = (await buyerWallet.signTransaction(
      transaction
    )) as Transaction;
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize()
    );
    await connection.confirmTransaction(signature, "confirmed");

    console.log("✅ Revenue distribution completed!");
    console.log("📋 Transaction signature:", signature);

    const vaultInfoAfter = await getVaultInfo(passData.vaultAddress);

    const vaultIncrease = vaultInfoAfter.balance - vaultInfoBefore.balance;

    return {
      transactionSignature: signature,
      nftMint: nftMint.publicKey,
      metadataUri: individualMetadataUri,
    };
  } catch (error) {
    console.error("❌ Error buying creator pass:", error);
    throw new Error(
      `Failed to buy creator pass: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function fileClaimOnChain(
  creatorWallet: {
    publicKey: { toBase58(): string };
    signTransaction: (transaction: unknown) => Promise<unknown>;
  },
  claimData: {
    evidenceIpfsHash: string;
    creatorPoolAddress: string;
    vaultAddress: string;
    creatorUsdcAccount: string;
  }
): Promise<{
  claimAddress: string;
  transactionSignature: string;
}> {
  try {
    console.log("📝 Filing claim on-chain...");

    const connection = new Connection(clusterApiUrl("devnet"));
    const wallet = {
      publicKey: new PublicKey(creatorWallet.publicKey.toBase58()),
      signTransaction: creatorWallet.signTransaction,
      signAllTransactions: async (transactions: unknown[]) => {
        return await Promise.all(
          transactions.map((tx) => creatorWallet.signTransaction(tx))
        );
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const provider = new AnchorProvider(connection, wallet as any, {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = new Program(idl as any, provider);

    const creatorPoolPublicKey = new PublicKey(claimData.creatorPoolAddress);

    // Get CreatorPool data to get claim count
    const creatorPoolAccount = await connection.getAccountInfo(
      creatorPoolPublicKey
    );
    if (!creatorPoolAccount) {
      throw new Error("CreatorPool account not found");
    }

    let claimCount;
    try {
      const creatorPoolData = await program.coder.accounts.decode(
        "CreatorPool",
        creatorPoolAccount.data
      );

      claimCount = creatorPoolData.claimCount;
    } catch (decodeError) {
      let foundClaimCount = 0;
      const maxAttempts = 10;

      for (let i = 0; i < maxAttempts; i++) {
        const testClaimCount = new anchor.BN(i);
        const testClaimCountBuffer = Buffer.alloc(8);
        testClaimCountBuffer.writeUInt32LE(i, 0);
        const [testClaimAddress] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("claim"),
            creatorPoolPublicKey.toBuffer(),
            testClaimCountBuffer,
          ],
          PROGRAM_ID
        );

        try {
          const testAccount = await connection.getAccountInfo(testClaimAddress);
          if (!testAccount) {
            foundClaimCount = i;
            break;
          }
        } catch (error) {
          foundClaimCount = i;
          break;
        }
      }

      claimCount = new anchor.BN(foundClaimCount);
    }

    const claimCountBuffer = Buffer.alloc(8);
    claimCountBuffer.writeUInt32LE(claimCount.toNumber(), 0);

    const [generatedClaimAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("claim"), creatorPoolPublicKey.toBuffer(), claimCountBuffer],
      PROGRAM_ID
    );

    const factoryAddress = generateFactoryAddress();
    const usdcMint = new PublicKey(
      "So11111111111111111111111111111111111111112"
    );

    const creatorUsdcAccount = await getOrCreateTokenAccount(
      connection,
      wallet.publicKey,
      usdcMint,
      wallet.signTransaction as (
        transaction: Transaction
      ) => Promise<Transaction>
    );

    try {
      await connection.getAccountInfo(creatorUsdcAccount);
    } catch (error) {
      console.error("❌ Error verifying token account:", error);
    }

    const tx = await program.methods
      .fileClaim(
        claimData.evidenceIpfsHash,
        new anchor.BN(claimCount.toNumber()),
        creatorPoolPublicKey
      )
      .accounts({
        claim: generatedClaimAddress,
        creatorPool: creatorPoolPublicKey,
        creator: wallet.publicKey,
        creatorUsdcAccount: creatorUsdcAccount,
        creatorPoolVault: new PublicKey(claimData.vaultAddress),
        usdcMint: usdcMint,
        factory: new PublicKey(factoryAddress),
        tokenProgram: new PublicKey(
          "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        ),
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return {
      claimAddress: generatedClaimAddress.toString(),
      transactionSignature: tx,
    };
  } catch (error) {
    console.error("❌ Error filing claim:", error);
    throw new Error(
      `Failed to file claim: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function voteOnClaimOnChain(
  voterWallet: {
    publicKey: { toBase58(): string };
    signTransaction: (transaction: unknown) => Promise<unknown>;
  },
  voteData: {
    claimAddress: string;
    creatorPoolAddress: string;
    voteChoice: "Yes" | "No";
  }
): Promise<{
  voteAddress: string;
  transactionSignature: string;
}> {
  try {
    const connection = new Connection(clusterApiUrl("devnet"));
    const wallet = {
      publicKey: new PublicKey(voterWallet.publicKey.toBase58()),
      signTransaction: voterWallet.signTransaction,
      signAllTransactions: async (transactions: unknown[]) => {
        return await Promise.all(
          transactions.map((tx) => voterWallet.signTransaction(tx))
        );
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const provider = new AnchorProvider(connection, wallet as any, {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = new Program(idl as any, provider);

    const claimPublicKey = new PublicKey(voteData.claimAddress);
    const creatorPoolPublicKey = new PublicKey(voteData.creatorPoolAddress);

    const [voteAddress] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote"),
        claimPublicKey.toBuffer(),
        wallet.publicKey.toBuffer(),
      ],
      PROGRAM_ID
    );

    const voteChoice = voteData.voteChoice === "Yes" ? { yes: {} } : { no: {} };

    const tx = await program.methods
      .vote(voteChoice)
      .accounts({
        claim: claimPublicKey,
        creatorPool: creatorPoolPublicKey,
        voteAccount: voteAddress,
        fan: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return {
      voteAddress: voteAddress.toString(),
      transactionSignature: tx,
    };
  } catch (error) {
    console.error("❌ Error voting on claim:", error);
    throw new Error(
      `Failed to vote on claim: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function getClaimData(claimAddress: string) {
  try {
    const connection = new Connection(clusterApiUrl("devnet"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = new Program(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      idl as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new AnchorProvider(connection, {} as any, {})
    );

    const claimAccount = await connection.getAccountInfo(
      new PublicKey(claimAddress)
    );
    if (!claimAccount) {
      throw new Error("Claim account not found");
    }

    const claimData = await program.coder.accounts.decode(
      "Claim",
      claimAccount.data
    );

    return {
      creatorPool: claimData.creatorPool.toString(),
      creator: claimData.creator.toString(),
      poolAmountAtClaim: claimData.poolAmountAtClaim.toString(),
      evidenceIpfsHash: claimData.evidenceIpfsHash,
      status: claimData.status,
      yesVotes: claimData.yesVotes.toString(),
      noVotes: claimData.noVotes.toString(),
      votingStartedAt: new Date(claimData.votingStartedAt.toNumber() * 1000),
      votingEndsAt: new Date(claimData.votingEndsAt.toNumber() * 1000),
      createdAt: new Date(claimData.createdAt.toNumber() * 1000),
    };
  } catch (error) {
    console.error("❌ Error getting claim data:", error);
    throw new Error(
      `Failed to get claim data: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function verifyNftOwnership(
  voterWallet: {
    publicKey: { toBase58(): string };
    signTransaction: (transaction: unknown) => Promise<unknown>;
  },
  nftMintAddress: string,
  creatorAddress: string
): Promise<{
  nftOwnershipAddress: string;
  creatorCollectionAddress: string;
  isOwner: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nftOwnershipData?: any;
}> {
  try {
    console.log("🔍 Verifying NFT ownership for voting...");
    console.log("  - Voter:", voterWallet.publicKey.toBase58());
    console.log("  - NFT Mint:", nftMintAddress);
    console.log("  - Creator:", creatorAddress);

    const connection = new Connection(clusterApiUrl("devnet"));
    const nftMint = new PublicKey(nftMintAddress);
    const creator = new PublicKey(creatorAddress);

    const [nftOwnershipAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("nft_ownership"), nftMint.toBuffer()],
      PROGRAM_ID
    );

    const [creatorCollectionAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("creator_collection"), nftMint.toBuffer()],
      PROGRAM_ID
    );

    try {
      const nftOwnershipAccount = await connection.getAccountInfo(
        nftOwnershipAddress
      );
      if (!nftOwnershipAccount) {
        return {
          nftOwnershipAddress: nftOwnershipAddress.toString(),
          creatorCollectionAddress: creatorCollectionAddress.toString(),
          isOwner: false,
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const program = new Program(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        idl as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new AnchorProvider(connection, {} as any, {})
      );
      const nftOwnershipData = await program.coder.accounts.decode(
        "NftOwnership",
        nftOwnershipAccount.data
      );

      const isOwner =
        nftOwnershipData.owner.toString() ===
          voterWallet.publicKey.toBase58() &&
        nftOwnershipData.creator.toString() === creatorAddress;

      return {
        nftOwnershipAddress: nftOwnershipAddress.toString(),
        creatorCollectionAddress: creatorCollectionAddress.toString(),
        isOwner,
        nftOwnershipData,
      };
    } catch (error) {
      return {
        nftOwnershipAddress: nftOwnershipAddress.toString(),
        creatorCollectionAddress: creatorCollectionAddress.toString(),
        isOwner: false,
      };
    }
  } catch (error) {
    console.error("❌ Error in verifyNftOwnership:", error);
    throw new Error(
      `Failed to verify NFT ownership: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function createNftOwnershipAccount(
  voterWallet: {
    publicKey: { toBase58(): string };
    signTransaction: (transaction: unknown) => Promise<unknown>;
  },
  nftMintAddress: string,
  creatorAddress: string
): Promise<{
  nftOwnershipAddress: string;
  creatorCollectionAddress: string;
  transactionSignature: string;
}> {
  try {
    const connection = new Connection(clusterApiUrl("devnet"));
    const wallet = {
      publicKey: new PublicKey(voterWallet.publicKey.toBase58()),
      signTransaction: voterWallet.signTransaction,
      signAllTransactions: async (transactions: unknown[]) => {
        return await Promise.all(
          transactions.map((tx) => voterWallet.signTransaction(tx))
        );
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const provider = new AnchorProvider(connection, wallet as any, {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = new Program(idl as any, provider);

    const nftMint = new PublicKey(nftMintAddress);
    const creator = new PublicKey(creatorAddress);

    const [nftOwnershipAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("nft_ownership"), nftMint.toBuffer()],
      PROGRAM_ID
    );

    const [creatorCollectionAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("creator_collection"), nftMint.toBuffer()],
      PROGRAM_ID
    );

    const tx = await program.methods
      .verifyFanPass()
      .accounts({
        fan: wallet.publicKey,
        nftMint: nftMint,
        creatorCollection: creatorCollectionAddress,
        nftOwnership: nftOwnershipAddress,
      })
      .rpc();

    return {
      nftOwnershipAddress: nftOwnershipAddress.toString(),
      creatorCollectionAddress: creatorCollectionAddress.toString(),
      transactionSignature: tx,
    };
  } catch (error) {
    console.error("❌ Error creating NFT ownership account:", error);
    throw new Error(
      `Failed to create NFT ownership account: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function finalizeClaimOnChain(
  creatorWallet: {
    publicKey: { toBase58(): string };
    signTransaction: (transaction: unknown) => Promise<unknown>;
  },
  claimAddress: string
): Promise<{ transactionSignature: string }> {
  try {
    const connection = new Connection(clusterApiUrl("devnet"));
    const wallet = {
      publicKey: new PublicKey(creatorWallet.publicKey.toBase58()),
      signTransaction: creatorWallet.signTransaction,
      signAllTransactions: async (transactions: unknown[]) => {
        return await Promise.all(
          transactions.map((tx) => creatorWallet.signTransaction(tx))
        );
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const provider = new AnchorProvider(connection, wallet as any, {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = new Program(idl as any, provider);

    const claimPublicKey = new PublicKey(claimAddress);

    const claimAccount = await connection.getAccountInfo(claimPublicKey);
    if (!claimAccount) {
      throw new Error("Claim account not found");
    }

    const claimData = await program.coder.accounts.decode(
      "Claim",
      claimAccount.data
    );
    const creatorPoolPublicKey = new PublicKey(
      claimData.creatorPool.toString()
    );

    const tx = await program.methods
      .finalizeClaim()
      .accounts({
        creator: wallet.publicKey,
        claim: claimPublicKey,
        creatorPool: creatorPoolPublicKey,
      })
      .rpc();

    return { transactionSignature: tx };
  } catch (error) {
    console.error("❌ Error finalizing claim:", error);
    throw new Error(
      `Failed to finalize claim: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function payoutClaimOnChain(
  creatorWallet: {
    publicKey: { toBase58(): string };
    signTransaction: (transaction: unknown) => Promise<unknown>;
  },
  claimAddress: string
): Promise<{ transactionSignature: string }> {
  try {
    const connection = new Connection(clusterApiUrl("devnet"));
    const wallet = {
      publicKey: new PublicKey(creatorWallet.publicKey.toBase58()),
      signTransaction: creatorWallet.signTransaction,
      signAllTransactions: async (transactions: unknown[]) => {
        return await Promise.all(
          transactions.map((tx) => creatorWallet.signTransaction(tx))
        );
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const provider = new AnchorProvider(connection, wallet as any, {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = new Program(idl as any, provider);

    const claimPublicKey = new PublicKey(claimAddress);

    const claimAccount = await connection.getAccountInfo(claimPublicKey);
    if (!claimAccount) {
      throw new Error("Claim account not found");
    }

    const claimData = await program.coder.accounts.decode(
      "Claim",
      claimAccount.data
    );
    const creatorPoolPublicKey = new PublicKey(
      claimData.creatorPool.toString()
    );

    const tx = await program.methods
      .payoutClaim()
      .accounts({
        creator: wallet.publicKey,
        claim: claimPublicKey,
        creatorPool: creatorPoolPublicKey,
      })
      .rpc();

    return { transactionSignature: tx };
  } catch (error) {
    console.error("❌ Error processing claim payout:", error);
    throw new Error(
      `Failed to process claim payout: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function refundClaimOnChain(
  creatorWallet: {
    publicKey: { toBase58(): string };
    signTransaction: (transaction: unknown) => Promise<unknown>;
  },
  claimAddress: string
): Promise<{ transactionSignature: string }> {
  try {
    const connection = new Connection(clusterApiUrl("devnet"));
    const wallet = {
      publicKey: new PublicKey(creatorWallet.publicKey.toBase58()),
      signTransaction: creatorWallet.signTransaction,
      signAllTransactions: async (transactions: unknown[]) => {
        return await Promise.all(
          transactions.map((tx) => creatorWallet.signTransaction(tx))
        );
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const provider = new AnchorProvider(connection, wallet as any, {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = new Program(idl as any, provider);

    const claimPublicKey = new PublicKey(claimAddress);

    const claimAccount = await connection.getAccountInfo(claimPublicKey);
    if (!claimAccount) {
      throw new Error("Claim account not found");
    }

    const claimData = await program.coder.accounts.decode(
      "Claim",
      claimAccount.data
    );
    const creatorPoolPublicKey = new PublicKey(
      claimData.creatorPool.toString()
    );

    const tx = await program.methods
      .refundClaim()
      .accounts({
        creator: wallet.publicKey,
        claim: claimPublicKey,
        creatorPool: creatorPoolPublicKey,
      })
      .rpc();

    return { transactionSignature: tx };
  } catch (error) {
    console.error(" Error processing claim refund:", error);
    throw new Error(
      `Failed to process claim refund: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

const ipfsUploader = {
  install(umi: Umi) {
    umi.uploader = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      upload: async (files: any[]) => {
        try {
          const uploadPromises = files.map(async (file) => {
            // Convert Umi file to File object for IPFS upload
            const fileObj = new File([file.buffer], file.name, {
              type: file.contentType,
            });
            return await uploadImageToIPFS(fileObj);
          });

          return await Promise.all(uploadPromises);
        } catch (error) {
          console.error("❌ IPFS upload failed, using mock URLs:", error);
          // Fallback to mock URLs if IPFS fails
          return files.map(
            (file, index) =>
              `https://mock-storage.com/${file.name}-${Date.now()}-${index}`
          );
        }
      },

      uploadJson: async <T>(json: T) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return await uploadJSONToIPFS(json as Record<string, any>);
        } catch (error) {
          console.error("❌ IPFS JSON upload failed, using mock URL:", error);
          // Fallback to mock URL if IPFS fails
          return `https://mock-storage.com/metadata-${Date.now()}.json`;
        }
      },

      getUploadPrice: async () => {
        return { basisPoints: BigInt(0), identifier: "SOL", decimals: 9 };
      },
    };
  },
};

export async function finalizeClaimWithDistributionOnChain(
  creatorWallet: {
    publicKey: { toBase58(): string };
    signTransaction: (transaction: unknown) => Promise<unknown>;
  },
  claimAddress: string,
  creatorPoolAddress: string,
  vaultAddress: string
): Promise<{
  transactionSignature: string;
  result: "approved" | "rejected";
  distributedAmount: number;
}> {
  try {
    const connection = new Connection(clusterApiUrl("devnet"));
    const wallet = {
      publicKey: new PublicKey(creatorWallet.publicKey.toBase58()),
      signTransaction: creatorWallet.signTransaction,
      signAllTransactions: async (transactions: unknown[]) => {
        return await Promise.all(
          transactions.map((tx) => creatorWallet.signTransaction(tx))
        );
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const provider = new AnchorProvider(connection, wallet as any, {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = new Program(idl as any, provider);

    const factoryAddress = generateFactoryAddress();

    // Generate the correct SOL vault PDA address
    const correctVaultAddress = generateSolVaultAddress(
      wallet.publicKey.toBase58()
    );
    console.log("🔧 Generated correct SOL vault PDA:", correctVaultAddress);
    console.log("🔍 Provided vault address:", vaultAddress);

    // Use the correct SOL vault PDA as the source and creator's wallet as destination
    const creatorUsdcAccount = wallet.publicKey;

    // Check if the correct vault exists
    const vaultAccount = await connection.getAccountInfo(
      new PublicKey(correctVaultAddress)
    );

    if (!vaultAccount) {
      throw new Error(
        `SOL vault PDA does not exist at ${correctVaultAddress}. ` +
          `The creator pool was created without a vault. ` +
          `Please recreate the creator pool with the updated contract that includes vault creation.`
      );
    }

    let vaultBalance = 0;
    if (vaultAccount) {
      // For native SOL vault, get the lamports
      vaultBalance = vaultAccount.lamports;
      console.log("💰 Vault balance before transfer:", vaultBalance);
    } else {
      throw new Error("Failed to create or access SOL vault PDA");
    }

    // Call the program's finalize_claim_with_distribution instruction
    let tx = "fallback-transaction";
    try {
      tx = await program.methods
        .finalizeClaimWithDistribution()
        .accounts({
          claim: new PublicKey(claimAddress),
          creatorPool: new PublicKey(creatorPoolAddress),
          creatorPoolVault: new PublicKey(correctVaultAddress), // Use correct vault address
          creatorUsdcAccount: creatorUsdcAccount,
          creator: wallet.publicKey,
          factory: new PublicKey(factoryAddress),
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Claim finalized with distribution:", tx);
    } catch (error) {
      console.error(
        "❌ Error calling finalize_claim_with_distribution:",
        error
      );
      throw new Error(
        `On-chain finalization failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    return {
      transactionSignature: tx,
      result: "approved",
      distributedAmount: vaultBalance,
    };
  } catch (error) {
    console.error("❌ Error finalizing claim with distribution:", error);
    throw new Error(
      `Failed to finalize claim with distribution: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
