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
}

export interface UserPass {
  id: number;
  creatorId: number;
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
  id: number;
  userId: number;
  passId: number;
  creatorId: number;
  createdAt: string;
  pass: UserPass;
}
