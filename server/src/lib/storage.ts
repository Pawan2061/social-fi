import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSignedUrl as getCloudFrontSignedUrl } from "@aws-sdk/cloudfront-signer";

export const PUBLIC_BUCKET_URL = process.env.CLOUDFRONT_URL!;

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;

export async function getSignedUploadUrl(fileName: string, fileType: string) {
  const key = `uploads/${Date.now()}-${fileName}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: fileType,
  });
  const uploadUrl = await getS3SignedUrl(s3, command, { expiresIn: 300 });
  return { uploadUrl, key };
}

export function getSignedUrlForMedia(key: string) {
  const url = `${process.env.CLOUDFRONT_URL}/${key}`;

  const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY!.replace(/\\n/g, "\n");

  return getCloudFrontSignedUrl({
    url,
    keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID!,
    privateKey,
    dateLessThan: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
  });
}




