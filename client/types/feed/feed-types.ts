export interface FeedResponse {
    items: FeedItem[];
    nextCursor: string | null;
}

export interface FeedItem {
    id: number;
    creatorId: number;
    caption: string;
    isPremium: boolean;
    createdAt: string;
    updatedAt: string;
    media: Media[];
    creator: Creator;
}

export interface Media {
    id: number;
    postId: number;
    type: 'image' | 'video' | 'audio' | 'other'; // extend if needed
    url: string;
    thumbnail: string | null;
    needsSignedUrl: boolean;
    claimId: string | null;
    locked: boolean;
}

export interface Creator {
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
}
