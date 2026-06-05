import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const UPLOAD_TTL = 900;   // 15 min
const DOWNLOAD_TTL = 3600; // 1 hr

let cached = null;

function envOrThrow(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function getR2Client() {
  if (cached) return cached;
  const accountId = envOrThrow("R2_ACCOUNT_ID");
  const endpoint = process.env.R2_ENDPOINT ?? `https://${accountId}.r2.cloudflarestorage.com`;
  cached = new S3Client({
    region: "auto",
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: envOrThrow("R2_ACCESS_KEY_ID"),
      secretAccessKey: envOrThrow("R2_SECRET_ACCESS_KEY"),
    },
    // Disable auto-checksum — presigned PUT would get CRC32 hash of empty body
    // baked in, causing 403 when browser PUTs the actual video.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return cached;
}

const BUCKET = () => process.env.R2_BUCKET ?? "union-videos";

export function generateR2Key(kind, aspect, filename) {
  const ext = (filename.split(".").pop() ?? "mp4").toLowerCase();
  const uuid = crypto.randomUUID();
  return `videos/${kind}/${aspect}/${uuid}.${ext}`;
}

export async function presignUpload({ key, contentType }) {
  const cmd = new PutObjectCommand({ Bucket: BUCKET(), Key: key, ContentType: contentType });
  return getSignedUrl(getR2Client(), cmd, { expiresIn: UPLOAD_TTL });
}

export async function presignDownload({ key }) {
  const cmd = new GetObjectCommand({ Bucket: BUCKET(), Key: key });
  return getSignedUrl(getR2Client(), cmd, { expiresIn: DOWNLOAD_TTL });
}

export async function deleteR2Object({ key }) {
  await getR2Client().send(new DeleteObjectCommand({ Bucket: BUCKET(), Key: key }));
}
