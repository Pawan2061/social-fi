"use client";

import { useMemo } from "react";
import { useUserProfileById } from "@/hooks/use-user-profile-by-id";
import UserProfileComponent from "@/components/profile/user-profile";
import { PostCard } from "@/components/feed/post-card";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";

// Relative time helper (kept identical to /profile)
function getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ProfileByIdPage() {
    const params = useParams<{ userId: string }>();
    const userId = useMemo(() => (Array.isArray(params?.userId) ? params.userId[0] : params?.userId), [params]);
    const { data: userProfile, isLoading, error, refetch } = useUserProfileById(userId || "");

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-8 transform rotate-1">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent mx-auto mb-4" />
                        <p className="font-extrabold text-xl">Loading profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="bg-red-50 border-4 border-red-500 shadow-[6px_6px_0_0_#ef4444] p-8 transform rotate-1">
                        <h3 className="font-extrabold text-xl mb-2 text-red-700">Error Loading Profile</h3>
                        <p className="text-red-600 font-bold mb-4">{error instanceof Error ? error.message : "Failed to load profile"}</p>
                        <Button onClick={() => refetch()} className="bg-red-500 text-white border-4 border-red-700 shadow-[4px_4px_0_0_#b91c1c] hover:shadow-[6px_6px_0_0_#b91c1c] hover:-translate-x-1 hover:-translate-y-1 font-extrabold">Retry</Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!userProfile) {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="bg-yellow-100 border-4 border-black shadow-[6px_6px_0_0_#000] p-8 transform rotate-1">
                        <h3 className="font-extrabold text-xl mb-2">No Profile Data</h3>
                        <p className="font-bold">Profile data not found.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-black mb-2 transform -rotate-1 inline-block bg-yellow-300 border-4 border-black px-6 py-2 shadow-[8px_8px_0_0_#000]">
                    {userProfile.name.split(" ")[0]}&apos;s Profile
                </h1>
                <p className="text-lg font-bold mt-4">View passes and posts by this creator</p>
            </div>

            {/* Profile header card */}
            <UserProfileComponent user={userProfile} />

            {/* Passes owned by this user (as a user) */}
            {/* Show if available; pass empty array fallback */}
            {/* <PassesComponent passes={userProfile.passes ?? []} /> */}

            {/* Posts by this user */}
            {((userProfile.posts ?? []).filter(p => !(p.media?.some(m => m.locked)))).length > 0 && (
                <div className="space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-black mb-2 transform rotate-1 inline-block bg-blue-300 border-4 border-black px-6 py-2 shadow-[8px_8px_0_0_#000]">
                            Posts by {userProfile.name} ({(userProfile.posts ?? []).filter(p => !(p.media?.some(m => m.locked))).length})
                        </h2>
                    </div>

                    <div className="space-y-6">
                        {(userProfile.posts ?? []).filter(p => !(p.media?.some(m => m.locked))).map((post, index) => {
                            const transformedPost = {
                                id: post.id.toString(),
                                author: {
                                    id: userProfile.id.toString(),
                                    name: userProfile.name,
                                    username: userProfile.wallet.slice(0, 8) + "...",
                                    verified: userProfile.emailVerified,
                                    avatar: userProfile.image || undefined,
                                },
                                content: post.caption || "",
                                timestamp: getRelativeTime(new Date(post.createdAt)),
                                initialLikes: Math.floor(Math.random() * 200),
                                initialRetweets: Math.floor(Math.random() * 50),
                                initialComments: Math.floor(Math.random() * 30),
                                isPremium: post.isPremium,
                                media: (() => {
                                    const supportedMedia = post.media?.filter((m) => (m.type === "image" || m.type === "video") && !m.locked) || [];
                                    return supportedMedia.length > 0
                                        ? supportedMedia.map((m) => ({
                                            id: m.id.toString(),
                                            type: m.type as "image" | "video",
                                            url: m.url || "",
                                            thumbnail: m.thumbnail || undefined,
                                            alt: `${m.type} content`,
                                            aspectRatio: "landscape" as const,
                                        }))
                                        : undefined;
                                })(),
                            };

                            return (
                                <div key={post.id} className={`transform ${index % 2 === 0 ? "rotate-1" : "-rotate-1"} hover:rotate-0 transition-transform`}>
                                    <PostCard {...transformedPost} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

