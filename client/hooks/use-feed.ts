import {
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { FeedResponse, FeedItem } from "@/types/feed/feed-types";

const API_URL = `${
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
}/posts/`;

export function useFeed() {
  return useQuery<FeedResponse>({
    queryKey: ["feed"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const res = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch feed: ${res.statusText}`);
      }

      return res.json();
    },
    staleTime: 1000 * 60, // 1 min cache
    retry: 1, // retry once on failure
  });
}

export function useInvalidateFeed() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["feed"] });
  };
}

export function useOptimisticFeedUpdate() {
  const queryClient = useQueryClient();

  return (newPost: FeedItem) => {
    queryClient.setQueryData(["feed"], (oldData: FeedResponse | undefined) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        items: [newPost, ...(oldData.items || [])],
      };
    });
  };
}

// Infinite feed with cursor-based pagination
export function useInfiniteFeed(limit: number = 10) {
  return useInfiniteQuery<FeedResponse>({
    queryKey: ["feed", "infinite", limit],
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    queryFn: async ({ pageParam }) => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;
      if (!token) throw new Error("No authentication token found");

      const url = new URL(API_URL);
      if (pageParam) url.searchParams.set("cursor", String(pageParam));
      if (limit) url.searchParams.set("limit", String(limit));

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`Failed to fetch feed: ${res.statusText}`);
      return res.json();
    },
    staleTime: 60_000,
    retry: 1,
  });
}
