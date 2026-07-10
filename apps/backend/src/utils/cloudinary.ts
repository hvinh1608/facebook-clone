import fs from 'fs/promises';
import { v2 as cloudinary } from 'cloudinary';

function getCloudinaryCloudName(): string | undefined {
  if (process.env.CLOUDINARY_URL?.trim()) {
    try {
      const parsed = new URL(process.env.CLOUDINARY_URL.trim());
      return parsed.hostname || undefined;
    } catch {
      return undefined;
    }
  }

  return process.env.CLOUDINARY_CLOUD_NAME?.trim() || undefined;
}

const cloudName = getCloudinaryCloudName();
const hasUrl = Boolean(process.env.CLOUDINARY_URL?.trim());
const hasParts = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
    process.env.CLOUDINARY_API_KEY?.trim() &&
    process.env.CLOUDINARY_API_SECRET?.trim()
);
const isConfigured = Boolean(cloudName && (hasUrl || hasParts));

if (isConfigured) {
  if (hasUrl) {
    cloudinary.config({ secure: true });
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!.trim(),
      api_key: process.env.CLOUDINARY_API_KEY!.trim(),
      api_secret: process.env.CLOUDINARY_API_SECRET!.trim(),
      secure: true,
    });
  }
}

export function isCloudinaryConfigured() {
  return isConfigured;
}

export function getCloudinaryStatus() {
  return {
    configured: isConfigured,
    cloudName: cloudName || null,
    mode: hasUrl ? 'url' : hasParts ? 'parts' : 'none',
  };
}

export async function uploadMediaFile(
  file: Express.Multer.File,
  folder: string
): Promise<string> {
  if (!isConfigured) {
    return `/uploads/${file.filename}`;
  }

  const isVideo = file.mimetype.startsWith('video/');
  const resourceType = isVideo ? 'video' : 'image';

  const result = await cloudinary.uploader.upload(file.path, {
    folder,
    resource_type: resourceType,
    use_filename: true,
    unique_filename: true,
  });

  await fs.unlink(file.path).catch(() => {});
  return result.secure_url;
}
