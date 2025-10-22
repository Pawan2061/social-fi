"use client";

import { useUserProfile } from "@/hooks/use-user-profile";
import UserProfileComponent from "@/components/profile/user-profile";
import PassesComponent from "@/components/profile/passes-component";
import { PostCard } from "@/components/feed/post-card";
import { Button } from "@/components/ui/button";
import { useDeletePost } from "@/hooks/use-delete-post";
import { useState, useMemo } from "react";
import WidgetFeed from "@/components/widgets/widget-feed";
import type { WidgetListItem } from "@/types/widget/widget-types";

// Minimal shape of widgets returned on profile endpoint
interface ProfileWidgetOptionFromApi {
  id: number;
  text: string;
  _count?: { PollVote: number };
}

interface ProfileWidgetFromApi {
  id: number;
  type: "GOAL" | "POLL";
  title: string;
  description?: string | null;
  createdAt?: string;
  expiresAt?: string | null;
  targetValue?: number | null;
  currentValue?: number | null;
  metric?: "PASS_COUNT" | null;
  pollOptions?: ProfileWidgetOptionFromApi[];
}

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

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function ProfilePage() {
  const { data: userProfile, isLoading, error, refetch } = useUserProfile();

  console.log("userProfile", userProfile);
  const deleteMutation = useDeletePost();

  const [activeTab, setActiveTab] = useState<"posts" | "widgets">("posts");

  const myWidgets: WidgetListItem[] = useMemo(() => {
    if (!userProfile) return [];
    const widgets = Array.isArray(userProfile.Widget)
      ? (userProfile.Widget as ProfileWidgetFromApi[])
      : [];
    return widgets
      .map((w: ProfileWidgetFromApi) => {
        const isPoll = w.type === "POLL";
        const base = {
          id: w.id as number,
          type: w.type as "GOAL" | "POLL",
          title: w.title as string,
          description: (w.description as string) ?? null,
          createdAt: (w.createdAt as string) ?? new Date().toISOString(),
          expiresAt: (w.expiresAt as string) ?? null,
          creator: {
            id: userProfile.id,
            name: userProfile.name,
            image: userProfile.image,
          },
        };

        if (isPoll) {
          const pollOptions = Array.isArray(w.pollOptions)
            ? w.pollOptions.map((p: ProfileWidgetOptionFromApi) => ({
                id: p.id,
                text: p.text,
                _count: { PollVote: p?._count?.PollVote ?? 0 },
              }))
            : [];
          return {
            ...base,
            type: "POLL" as const,
            pollOptions,
            hasVoted: undefined,
            votedOptionId: undefined,
          };
        }

        return {
          ...base,
          type: "GOAL" as const,
          targetValue: (w.targetValue ?? undefined) as number | undefined,
          metric: (w.metric ?? undefined) as "PASS_COUNT" | undefined,
          currentValue: (w.currentValue ?? undefined) as number | undefined,
          progress: undefined,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [userProfile]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-8 transform rotate-1">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent mx-auto mb-4"></div>
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
            <h3 className="font-extrabold text-xl mb-2 text-red-700">
              Error Loading Profile
            </h3>
            <p className="text-red-600 font-bold mb-4">
              {error instanceof Error
                ? error.message
                : "Failed to load profile"}
            </p>
            <Button
              onClick={() => refetch()}
              className="bg-red-500 text-white border-4 border-red-700 shadow-[4px_4px_0_0_#b91c1c] hover:shadow-[6px_6px_0_0_#b91c1c] hover:-translate-x-1 hover:-translate-y-1 font-extrabold"
            >
              Retry
            </Button>
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
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black mb-2 transform -rotate-1 inline-block bg-yellow-300 border-4 border-black px-6 py-2 shadow-[8px_8px_0_0_#000]">
          My Profile
        </h1>
        <p className="text-lg font-bold mt-4">
          Manage your account, view your passes, and track your activity
        </p>
      </div>

      <UserProfileComponent user={userProfile} />

      <PassesComponent passes={userProfile.passes ?? []} />

      <div className="space-y-6">
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={() => setActiveTab("posts")}
            className={`px-4 py-2 font-extrabold border-4 border-black shadow-[4px_4px_0_0_#000] ${
              activeTab === "posts" ? "bg-blue-300" : "bg-white"
            }`}
          >
            Posts
          </Button>
          <Button
            onClick={() => setActiveTab("widgets")}
            className={`px-4 py-2 font-extrabold border-4 border-black shadow-[4px_4px_0_0_#000] ${
              activeTab === "widgets" ? "bg-pink-300" : "bg-white"
            }`}
          >
            Widgets
          </Button>
        </div>

        {activeTab === "posts" ? (
          <>
            {(userProfile.posts ?? []).filter(
              (p) => !p.media?.some((m) => m.locked)
            ).length > 0 ? (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-black mb-2 transform rotate-1 inline-block bg-blue-300 border-4 border-black px-6 py-2 shadow-[8px_8px_0_0_#000]">
                    Your Posts (
                    {
                      (userProfile.posts ?? []).filter(
                        (p) => !p.media?.some((m) => m.locked)
                      ).length
                    }
                    )
                  </h2>
                  <p className="text-lg font-bold mt-4">
                    All the amazing content you&apos;ve shared
                  </p>
                </div>

                <div className="space-y-6">
                  {(userProfile.posts ?? [])
                    .filter((p) => !p.media?.some((m) => m.locked))
                    .map((post, index) => {
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
                          const supportedMedia =
                            post.media?.filter(
                              (media) =>
                                (media.type === "image" ||
                                  media.type === "video") &&
                                !media.locked
                            ) || [];

                          return supportedMedia.length > 0
                            ? supportedMedia.map((media) => ({
                                id: media.id.toString(),
                                type: media.type as "image" | "video",
                                url: media.url || "",
                                thumbnail: media.thumbnail || undefined,
                                alt: `${media.type} content`,
                                aspectRatio: "landscape" as const,
                              }))
                            : undefined;
                        })(),
                      };

                      return (
                        <div
                          key={post.id}
                          className={`transform ${
                            index % 2 === 0 ? "rotate-1" : "-rotate-1"
                          } hover:rotate-0 transition-transform`}
                        >
                          <PostCard
                            {...transformedPost}
                            isOwner
                            onDelete={(id) => deleteMutation.mutate(id)}
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-8 transform rotate-1">
                  <h3 className="font-extrabold text-xl mb-2">No Posts Yet</h3>
                  <p className="text-gray-600 font-bold">
                    You haven&apos;t created any posts yet. Start sharing your
                    thoughts!
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {myWidgets.length > 0 ? (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-black mb-2 transform rotate-1 inline-block bg-pink-300 border-4 border-black px-6 py-2 shadow-[8px_8px_0_0_#000]">
                    Your Widgets ({myWidgets.length})
                  </h2>
                  <p className="text-lg font-bold mt-4">
                    Manage your goals and polls
                  </p>
                </div>
                <WidgetFeed items={myWidgets} />
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-8 transform rotate-1">
                  <h3 className="font-extrabold text-xl mb-2">
                    No Widgets Yet
                  </h3>
                  <p className="text-gray-600 font-bold">
                    Create a goal or a poll to engage your community.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
