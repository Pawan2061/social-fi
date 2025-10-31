export interface UserProfile {
  id: number;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  wallet: string;
  nonce: string | null;
  onboarded: boolean;
  createdAt: string;
  updatedAt: string;
  pass?: UserPass;
  posts: UserPost[];
  passes?: UserPassOwnership[];
  Widget: unknown[];
  ownsPass?: boolean;
  passSalesStats?: {
    totalPassesSold: number;
    uniqueHolders: number;
  };
}

export interface UserPass {
  id: string; // UUID string from database
  creatorId: string; // UUID string from database
  tokenMint: string;
  vault_address: string;
  price: number;
  createdAt: string;
}

export interface UserPost {
  id: number;
  creatorId: number;
  caption: string;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
  media: PostMedia[];
}

export interface PostMedia {
  id: number;
  postId: number;
  type: string;
  url: string;
  thumbnail: string | null;
  needsSignedUrl: boolean;
  claimId: number | null;
  locked: boolean;
}

export interface UserPassOwnership {
  id: string; // UUID string from database
  userId: string; // UUID string from database
  passId: string; // UUID string from database
  creatorId: string; // UUID string from database
  createdAt: string;
  pass: UserPass;
}
