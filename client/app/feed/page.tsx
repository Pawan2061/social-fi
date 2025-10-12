"use client";
import { PostCard } from "@/components/feed/post-card";
import {
  PostFilterToggle,
  PostFilter,
} from "@/components/ui/post-filter-toggle";
import { useState } from "react";
import CreatePostPopup from "@/components/feed/create-post-popup";
import { Button } from "@/components/ui/button";
import { useInfiniteFeed } from "@/hooks/use-feed";
import { FeedItem } from "@/types/feed/feed-types";
import WidgetFeed from "@/components/widgets/widget-feed";
import { useQueryClient } from "@tanstack/react-query";
import { fetchWidgets } from "@/hooks/use-fetch-widgets";

// Helper function to format relative time
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

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

export default function FeedPage() {
  const [activeFilter, setActiveFilter] = useState<PostFilter>("all");
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteFeed(10);

  // Flatten and de-duplicate posts across pages by id to avoid duplicate React keys
  //   I deduplicated items by id before rendering in page.tsx:
  // Flatten pages → keep a Set of seen ids → render only unique posts.
  // This prevents duplicate keys even if the server overlaps pages.
  const allItems = (() => {
    const flat = (data?.pages ?? []).flatMap(page => page.items ?? []);
    const seen = new Set<string>();
    const unique: FeedItem[] = [];
    for (const item of flat) {
      const key = String(item.id);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }
    return unique;
  })();

  const transformedPosts = allItems.filter((item: FeedItem) => {
    if (item.isPremium && item.media?.some(media => media.locked)) {
      return false;
    }
    return true;
  }).map((item: FeedItem) => ({
    id: item.id.toString(),
    author: {
      id: item.creator.id.toString(),
      name: item.creator.name,
      username: item.creator.wallet.slice(0, 8) + "...",
      verified: item.creator.emailVerified,
      avatar: item.creator.image || undefined,
    },
    content: item.caption || "",
    timestamp: getRelativeTime(new Date(item.createdAt)),
    initialLikes: Math.floor(Math.random() * 200),
    initialRetweets: Math.floor(Math.random() * 50),
    initialComments: Math.floor(Math.random() * 30),
    isPremium: item.isPremium,
    media: (() => {
      const supportedMedia = item.media?.filter(media =>
        (media.type === 'image' || media.type === 'video') && !media.locked
      ) || [];

      return supportedMedia.length > 0 ? supportedMedia.map(media => ({
        id: media.id.toString(),
        type: media.type as "image" | "video",
        url: media.url || "",
        thumbnail: media.thumbnail || undefined,
        alt: `${media.type} content`,
        aspectRatio: "landscape" as const
      })) : undefined;
    })()
  })) || [];

  const allPosts = transformedPosts;

  // Filter posts based on active filter (widgets handled separately)
  const filteredPosts = allPosts;

  // For now, widgets count is unknown (handled inside WidgetFeed). We'll pass 0 or omit.
  const premiumPostsCount = 0;
  const allPostsCount = allPosts.length;

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-8 relative">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-8 transform rotate-1">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent mx-auto mb-4"></div>
            <p className="font-extrabold text-xl">Loading feed...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8 relative">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-red-50 border-4 border-red-500 shadow-[6px_6px_0_0_#ef4444] p-8 transform rotate-1">
            <h3 className="font-extrabold text-xl mb-2 text-red-700">Error Loading Feed</h3>
            <p className="text-red-600 font-bold mb-4">
              {error instanceof Error ? error.message : "Failed to load posts"}
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

  return (
    <div className="max-w-2xl mx-auto py-8 relative">
      <div className="mb-6 px-4">
        <PostFilterToggle
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          showCounts={true}
          allCount={allPostsCount}
          premiumCount={premiumPostsCount}
          onHoverWidgets={() => {
            queryClient.prefetchQuery({ queryKey: ["widgets"], queryFn: fetchWidgets });
          }}
          className="transform rotate-1"
        />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="space-y-6">
          {activeFilter === "widgets" ? (
            <WidgetFeed />
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((post, index) => (
              <div
                key={post.id}
                className={`transform ${index % 2 === 0 ? "rotate-1" : "-rotate-1"
                  } hover:rotate-0 transition-transform`}
              >
                <PostCard {...post} />
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] p-8 transform rotate-1">
                <h3 className="font-extrabold text-xl mb-2">
                  No Posts Found
                </h3>
                <p className="text-gray-600 font-bold">
                  No posts available at the moment.
                </p>
              </div>
            </div>
          )}

          {/* Load More */}
          {activeFilter !== "widgets" && filteredPosts.length > 0 && (
            <div className="flex justify-center pt-2">
              <Button
                onClick={() => fetchNextPage()}
                disabled={!hasNextPage || isFetchingNextPage}
                className="bg-white text-black border-4 border-black shadow-[6px_6px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1 font-extrabold"
              >
                {isFetchingNextPage ? 'Loading…' : hasNextPage ? 'Load more' : 'No more posts'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Floating create post button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-yellow-300 text-black border-4 border-black shadow-[6px_6px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1 font-extrabold"
        >
          Create Post
        </Button>
      </div>

      {showCreate && (
        <CreatePostPopup
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            // Feed will automatically refresh via query invalidation
          }}
        />
      )}
    </div>
  );
}
