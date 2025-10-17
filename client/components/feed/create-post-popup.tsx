"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Upload, Video, Lock, Globe, Loader2 } from "lucide-react";
import Image from "next/image";
import { useInvalidateFeed } from "@/hooks/use-feed";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-extrabold text-black">
      {children}
    </label>
  );
}

function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }
) {
  const { className, error, ...rest } = props;
  return (
    <div className="flex flex-col gap-1">
      <textarea
        className={cn(
          "w-full min-h-28 resize-y px-3 py-2 border-4 border-black rounded-md shadow-[4px_4px_0_0_#000] focus:outline-none focus:-translate-x-0.5 focus:-translate-y-0.5 transition-transform bg-white text-black font-bold placeholder:text-black/60",
          className
        )}
        {...rest}
      />
      {error ? (
        <span className="text-red-600 font-extrabold text-xs">{error}</span>
      ) : null}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 border-4 border-black rounded-md shadow-[4px_4px_0_0_#000] font-extrabold",
        checked ? "bg-yellow-300 text-black" : "bg-white text-black"
      )}
    >
      {checked ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
      <span>{label}</span>
    </button>
  );
}

export type CreatedMedia = {
  id: number;
  postId: number | null;
  type: string;
  url: string | null;
  thumbnail?: string | null;
  needsSignedUrl: boolean;
  claimId?: number | null;
};

export type CreatedPost = {
  id: number;
  creatorId: number;
  caption: string | null;
  isPremium: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  media: CreatedMedia[];
};

type SelectedMedia = {
  id: string;
  file: File;
  type: "image" | "video";
  previewUrl: string;
  thumbnail?: string | null;
  uploadedKey?: string;
};

// API helpers
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

async function fetchWithAuth(path: string, init: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  console.log(token)
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

async function signUpload(file: File): Promise<{ uploadUrl: string; key: string }> {
  const res = await fetchWithAuth("/posts/media/sign-upload", {
    method: "POST",
    body: JSON.stringify({ fileName: file.name, fileType: file.type }),
  });
  if (!res.ok) throw new Error("Failed to get signed upload url");
  return res.json();
}

async function putFileToSignedUrl(uploadUrl: string, file: File) {
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!putRes.ok) throw new Error("Failed to upload file to storage");
}

async function createPost(payload: { caption?: string; isPremium?: boolean; media?: Array<{ type: string; url: string; thumbnail?: string | null }> }): Promise<CreatedPost> {
  console.log(JSON.stringify(payload))
  const res = await fetchWithAuth("/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create post");
  return res.json();
}

// Component
export default function CreatePostPopup({ onClose, onCreated }: { onClose: () => void; onCreated?: (post: CreatedPost) => void }) {
  const [caption, setCaption] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [selected, setSelected] = useState<SelectedMedia[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const invalidateFeed = useInvalidateFeed();

  const canSubmit = useMemo(() => {
    return caption.trim().length > 0 || selected.length > 0;
  }, [caption, selected]);

  useEffect(() => {
    setMounted(true);
    return () => {
      selected.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onPickFilesClick() {
    inputRef.current?.click();
  }

  function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const items: SelectedMedia[] = files.map((file, idx) => {
      const type = file.type.startsWith("video") ? "video" : "image";
      return {
        id: `${Date.now()}-${idx}`,
        file,
        type,
        previewUrl: URL.createObjectURL(file),
        thumbnail: null,
      };
    });
    setSelected((prev) => [...prev, ...items]);
    e.target.value = "";
  }

  function removeSelected(id: string) {
    setSelected((prev) => prev.filter((m) => m.id !== id));
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      // 1) Upload media if any
      const uploaded: Array<{ type: string; url: string; thumbnail?: string | null }> = [];

      for (const item of selected) {
        const { uploadUrl, key } = await signUpload(item.file);
        await putFileToSignedUrl(uploadUrl, item.file);
        uploaded.push({ type: item.type, url: key, thumbnail: item.thumbnail || undefined });
      }

      // 2) Create post
      const post = await createPost({
        caption: caption.trim() || undefined,
        isPremium,
        media: uploaded.length ? uploaded : undefined,
      });

      // 3) Invalidate feed cache to refresh the feed
      invalidateFeed();

      // 4) Notify and close
      onCreated?.(post);
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal Card */}
      <Card className="relative w-full max-w-2xl mx-auto border-4 border-black bg-white shadow-[12px_12px_0_0_#000]">
        <CardHeader className="pb-3 border-b-4 border-black bg-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-black">Create a Post</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-10 w-10 border-3 border-black bg-red-400 hover:bg-red-500 shadow-[3px_3px_0_0_#000] hover:shadow-[5px_5px_0_0_#000] transform hover:-translate-x-1 hover:-translate-y-1"
              onClick={onClose}
            >
              <X className="h-5 w-5 text-black" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4 bg-white">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                placeholder="What's on your mind?"
                maxLength={500}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
              <div className="text-xs text-black font-extrabold opacity-70">
                {caption.length}/500
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onPickFilesClick}
                  className="inline-flex items-center gap-2 bg-white text-black border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1"
                >
                  <Upload className="w-4 h-4" />
                  <span className="font-extrabold">Add media</span>
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  hidden
                  onChange={onFilesSelected}
                />
              </div>

              <Toggle
                checked={isPremium}
                onChange={setIsPremium}
                label={isPremium ? "Premium" : "Public"}
              />
            </div>

            {selected.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {selected.map((m) => (
                  <div
                    key={m.id}
                    className="relative border-4 border-black shadow-[6px_6px_0_0_#000] bg-white"
                  >
                    {m.type === "image" ? (
                      <Image
                        src={m.previewUrl}
                        alt={m.file.name}
                        width={600}
                        height={400}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-black text-white flex items-center justify-center">
                        <Video className="w-6 h-6 mr-2" />
                        <span className="font-extrabold">{m.file.name}</span>
                      </div>
                    )}

                    <button
                      className="absolute top-2 right-2 bg-white border-2 border-black p-1 shadow-[2px_2px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform"
                      onClick={() => removeSelected(m.id)}
                      aria-label="Remove media"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error ? (
              <div className="bg-red-200 text-black border-4 border-black p-3 font-extrabold shadow-[4px_4px_0_0_#000]">
                {error}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={onClose}
                className="bg-white text-black border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit || submitting}
                className="bg-yellow-300 text-black border-4 border-black shadow-[6px_6px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1 font-extrabold"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Posting...
                  </span>
                ) : (
                  "Post"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>,
    document.body
  );
}
