import { useQuery } from "@tanstack/react-query";
import { UserProfile } from "@/types/profile/profile-types";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "/api"}/users`;

export function useUserProfileById(userId: string) {
  return useQuery<UserProfile>({
    queryKey: ["userProfileById", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;
      if (!token) throw new Error("No authentication token found");

      const res = await fetch(`${API_BASE}/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch user profile: ${res.statusText}`);
      }

      return res.json();
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
