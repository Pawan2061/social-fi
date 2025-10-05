import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth-middleware";
import { PUBLIC_BUCKET_URL } from "../lib/storage";

const JWT_SECRET = process.env.JWT_SECRET!;

export const requestNonce = async (req: Request, res: Response) => {
  const { address } = req.body;
  const nonce = crypto.randomBytes(16).toString("hex");

  await prisma.user.upsert({
    where: { wallet: address },
    update: { nonce },
    create: { wallet: address, nonce },
  });

  res.json({ nonce });
};

export const verifySignature = async (req: Request, res: Response) => {
  const { address, signature } = req.body;
  console.log(address, signature);

  const user = await prisma.user.findUnique({ where: { wallet: address } });
  if (!user || !user.nonce) return res.status(401).send("Unauthorized");

  const message = new TextEncoder().encode(user.nonce);
  const sigBytes = bs58.decode(signature);
  const pubKeyBytes = bs58.decode(address);

  const valid = nacl.sign.detached.verify(message, sigBytes, pubKeyBytes);
  if (!valid) return res.status(401).send("Invalid signature");

  await prisma.user.update({
    where: { wallet: address },
    data: { nonce: null },
  });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

  res.json({ token });
};

export const me = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).send("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  });
  const data = {
    ...user,
    image: user?.image ? `${PUBLIC_BUCKET_URL}/${user.image}` : null,
  };

  res.json(data);
};
