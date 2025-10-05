import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  PUBLIC_BUCKET_URL,
  getSignedUrlForMedia,
  getSignedUploadUrl,
} from "../lib/storage";
import { AuthRequest } from "../middleware/auth-middleware";

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req?.user?.userId;

    const { caption, isPremium, media } = req.body;

    const post = await prisma.post.create({
      data: {
        creatorId: userId as number,
        caption: caption || null,
        isPremium: Boolean(isPremium),
        media: {
          create: (media || []).map((m: any) => ({
            type: m.type,
            url: m.url,
            thumbnail: m.thumbnail,
            needsSignedUrl: true,
          })),
        },
      },
      include: { media: true },
    });

    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create post" });
  }
};

export const getPost = async (req: AuthRequest, res: Response) => {
  try {
    const postId = Number(req.params.id);
    const userId = req.user?.userId;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { media: true, creator: true },
    });
    if (!post) return res.status(404).json({ error: "Post not found" });

    let ownsPass = false;
    if (post.isPremium) {
      const ownership = await prisma.ownership.findFirst({
        where: { userId, creatorId: post.creatorId },
      });
      ownsPass = !!ownership;
    }

    const transformed = await Promise.all(
      post.media.map(async (m) => {
        if (!post.isPremium || ownsPass) {
          return {
            ...m,
            // url: m.needsSignedUrl
            //   ? await getSignedUrlForMedia(m.url)
            url: m.url ? `${PUBLIC_BUCKET_URL}/${m.url}` : null,
            locked: false,
          };
        }
        return { ...m, url: null, locked: true };
      })
    );

    res.json({ ...post, media: transformed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch post" });
  }
};

export const getFeed = async (req: AuthRequest, res: Response) => {
  try {
    const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const userId = req.user?.userId;

    const ownerships = await prisma.ownership.findMany({
      where: { userId },
      select: { creatorId: true },
    });
    const ownedCreatorIds = ownerships.map((o) => o.creatorId);

    const posts = await prisma.post.findMany({
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
      include: { media: true, creator: true },
    });

    const hasMore = posts.length > limit;

    const items = await Promise.all(
      posts.slice(0, limit).map(async (post) => {
        const ownsPass = ownedCreatorIds.includes(post.creatorId);
        const creator = {
          ...post.creator,
          // image: post.creator.image
          //   ? await getSignedUrlForMedia(post.creator.image)
          //   : null,
          image: `${PUBLIC_BUCKET_URL}/${post.creator.image}`,
        };

        const media = await Promise.all(
          post.media.map(async (m) => {
            if (!post.isPremium || ownsPass) {
              return {
                ...m,
                // url: m.needsSignedUrl
                //   ? await getSignedUrlForMedia(m.url)
                //   : `${PUBLIC_BUCKET_URL}/${m.url}`,
                url: m.url ? `${PUBLIC_BUCKET_URL}/${m.url}` : null,

                locked: false,
              };
            }
            return { ...m, url: null, locked: true };
          })
        );

        return { ...post, media, creator };
      })
    );

    res.json({ items, nextCursor: hasMore ? posts[limit].id : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch feed" });
  }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const postId = Number(req.params.id);
    const userId = req.user?.userId;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.creatorId !== userId) {
      return res.status(403).json({ error: "Not allowed" });
    }

    await prisma.post.delete({ where: { id: postId } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete post" });
  }
};

export const signUpload = async (req: Request, res: Response) => {
  try {
    const { fileName, fileType } = req.body;
    const { uploadUrl, key } = await getSignedUploadUrl(fileName, fileType);
    res.json({ uploadUrl, key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get signed upload url" });
  }
};
