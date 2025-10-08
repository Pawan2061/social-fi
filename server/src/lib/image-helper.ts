import { PUBLIC_BUCKET_URL } from "./storage";

export const resolveMediaUrl = (url?: string | null): string | null => {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (
    lower.startsWith("https://unsplash.com") ||
    lower.startsWith("https://images.unsplash.com")
  ) {
    return url;
  }
  return `${PUBLIC_BUCKET_URL}/${url}`;
};
