import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth-middleware";
import { resolveMediaUrl } from "../lib/image-helper";

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        pass: true,
        posts: { include: { media: true } },
        passes: { include: { pass: true } },
        Widget: true,
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const posts = await Promise.all(
      user.posts.map(async (post) => {
        const media = await Promise.all(
          post.media.map(async (m) => ({
            ...m,
            // url:
            //   m.needsSignedUrl
            //   ? await getSignedUrlForMedia(m.url)
            //   :
            //   `${PUBLIC_BUCKET_URL}/${m.url}`,
            url: m.url ? resolveMediaUrl(m.url) : null,

            locked: false,
          }))
        );
        return { ...post, media };
      })
    );

    res.status(200).json({
      ...user,
      // image: user.image ? await getSignedUrlForMedia(user.image) : null,
      image: user.image ? resolveMediaUrl(user.image) : null,

      posts,
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: {
        pass: true,
        posts: { include: { media: true } },
        Widget: true,
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const ownership = await prisma.ownership.findFirst({
      where: { userId, creatorId: user.id },
    });
    const ownsPass = !!ownership;

    const posts = await Promise.all(
      user.posts.map(async (post) => {
        const media = await Promise.all(
          post.media.map(async (m) => {
            if (!post.isPremium || ownsPass) {
              return {
                ...m,
                // url: m.needsSignedUrl
                //   ? await getSignedUrlForMedia(m.url)
                //   : `${PUBLIC_BUCKET_URL}/${m.url}`,
                url: m.url ? resolveMediaUrl(m.url) : null,

                locked: false,
              };
            }
            return {
              ...m,
              url: null,
              locked: true,
              widget: ownsPass ? user.Widget : null,
            };
          })
        );
        return { ...post, media };
      })
    );

    res.status(200).json({
      ...user,
      // image: user.image ? await getSignedUrlForMedia(user.image) : null,
      image: user.image ? resolveMediaUrl(user.image) : null,

      posts,
      ownsPass,
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { name, image } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        image,
        updatedAt: new Date(),
      },
    });

    res.status(200).json({
      ...updated,
      // image: updated.image ? await getSignedUrlForMedia(updated.image) : null,
      // image: user.image ? await getSignedUrlForMedia(user.image) : null,
      image: updated.image ? resolveMediaUrl(updated.image) : null,
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
};
export const onboardUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { name, email, image } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.onboarded) {
      return res.status(400).json({ error: "User is already onboarded" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        image,
        onboarded: true,
        updatedAt: new Date(),
      },
    });

    res.status(200).json({
      ...updatedUser,
      // image: updatedUser.image
      //   ? await getSignedUrlForMedia(updatedUser.image)
      //   : null,
      // image: user.image ? await getSignedUrlForMedia(user.image) : null,
      image: updatedUser.image ? resolveMediaUrl(updatedUser.image) : null,
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
};
