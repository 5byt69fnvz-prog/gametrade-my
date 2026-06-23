import "server-only";
import { randomUUID } from "crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function client() {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) throw new Error("Object storage is not configured");
  return new S3Client({
    endpoint,
    region: process.env.S3_REGION || "auto",
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey }
  });
}

export async function createPaymentProofUpload(userId: string, contentType: string) {
  if (!new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]).has(contentType)) throw new Error("UNSUPPORTED_FILE_TYPE");
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET is not configured");
  const extension = contentType === "application/pdf" ? "pdf" : contentType.split("/")[1];
  const key = `payment-proofs/${userId}/${randomUUID()}.${extension}`;
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  return { fileKey: key, uploadUrl: await getSignedUrl(client(), command, { expiresIn: 300 }) };
}

export async function createPrivateDownload(fileKey: string) {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET is not configured");
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: bucket, Key: fileKey }), { expiresIn: 120 });
}
