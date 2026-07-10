import fs from 'fs/promises';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

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
const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim() || '';
const hasUrl = Boolean(process.env.CLOUDINARY_URL?.trim());
const hasParts = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
    process.env.CLOUDINARY_API_KEY?.trim() &&
    process.env.CLOUDINARY_API_SECRET?.trim()
);
const hasUnsignedPreset = Boolean(cloudName && uploadPreset);
const isConfigured = hasUnsignedPreset || Boolean(cloudName && (hasUrl || hasParts));

if (isConfigured) {
  if (hasUrl) {
    cloudinary.config({ secure: true });
  } else if (hasParts) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!.trim(),
      api_key: process.env.CLOUDINARY_API_KEY!.trim(),
      api_secret: process.env.CLOUDINARY_API_SECRET!.trim(),
      secure: true,
    });
  } else if (hasUnsignedPreset) {
    cloudinary.config({
      cloud_name: cloudName,
      secure: true,
    });
  }
}

let credentialsVerified: boolean | null = null;

export function isCloudinaryConfigured() {
  return isConfigured;
}

export function getCloudinaryStatus() {
  return {
    configured: isConfigured,
    cloudName: cloudName || null,
    mode: hasUnsignedPreset
      ? 'unsigned_preset'
      : hasUrl
        ? 'url'
        : hasParts
          ? 'parts'
          : 'none',
    uploadPreset: uploadPreset || null,
    verified: credentialsVerified,
  };
}

export async function verifyCloudinaryCredentials(): Promise<boolean> {
  if (!isConfigured || hasUnsignedPreset) {
    credentialsVerified = hasUnsignedPreset ? true : false;
    return credentialsVerified;
  }

  try {
    await cloudinary.api.ping();
    credentialsVerified = true;
    return true;
  } catch (error) {
    credentialsVerified = false;
    console.error('Cloudinary credential check failed:', error);
    return false;
  }
}

async function uploadBuffer(
  buffer: Buffer,
  folder: string,
  resourceType: 'image' | 'video'
): Promise<UploadApiResponse> {
  const options: Record<string, unknown> = {
    folder,
    resource_type: resourceType,
  };

  if (hasUnsignedPreset) {
    options.upload_preset = uploadPreset;
  } else {
    options.use_filename = true;
    options.unique_filename = true;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) reject(error);
        else if (result) resolve(result);
        else reject(new Error('Cloudinary upload returned no result'));
      }
    );
    stream.end(buffer);
  });
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
  const buffer = await fs.readFile(file.path);

  try {
    const result = await uploadBuffer(buffer, folder, resourceType);
    await fs.unlink(file.path).catch(() => {});
    return result.secure_url;
  } catch (error: any) {
    const message = error?.message || 'Cloudinary upload failed';
    if (message.includes('Invalid Signature')) {
      throw new Error(
        'Cloudinary credentials are invalid on the server. Set CLOUDINARY_URL or use CLOUDINARY_UPLOAD_PRESET with an unsigned preset.'
      );
    }
    throw error;
  }
}
