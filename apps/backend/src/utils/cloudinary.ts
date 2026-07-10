import fs from 'fs/promises';
import { v2 as cloudinary } from 'cloudinary';

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!.trim(),
    api_key: process.env.CLOUDINARY_API_KEY!.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET!.trim(),
  });
}

export function isCloudinaryConfigured() {
  return isConfigured;
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
