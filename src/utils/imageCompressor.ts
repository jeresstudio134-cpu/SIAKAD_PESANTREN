/**
 * Client-side Image Compression & File Validation Utility
 * Compresses images using HTML Canvas before uploading to Cloudflare R2
 * Validates file MIME types and size limits
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateUpload(
  file: File,
  allowedMimeTypes: string[],
  maxSizeBytes: number
): ValidationResult {
  if (!file) {
    return { valid: false, error: 'File tidak dipilih' };
  }

  // Cek MIME type
  const isTypeAllowed = allowedMimeTypes.some((type) => {
    if (type.endsWith('/*')) {
      const prefix = type.replace('/*', '');
      return file.type.startsWith(prefix);
    }
    return file.type === type;
  });

  if (!isTypeAllowed) {
    const readableTypes = allowedMimeTypes
      .map((t) => t.replace('image/', '.').replace('application/', '.'))
      .join(', ');
    return {
      valid: false,
      error: `Format file tidak diizinkan. Harap unggah format: ${readableTypes}`,
    };
  }

  // Cek ukuran file
  if (file.size > maxSizeBytes) {
    const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
    const actualMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Ukuran file (${actualMb} MB) melebihi batas maksimum (${maxMb} MB)`,
    };
  }

  return { valid: true };
}

export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    outputType?: 'image/jpeg' | 'image/webp';
  } = {}
): Promise<File> {
  // If not an image (e.g. PDF), return original
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const {
    maxWidth = 1000,
    maxHeight = 1000,
    quality = 0.8,
    outputType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // fallback
          return;
        }

        // Draw image with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const ext = outputType === 'image/webp' ? 'webp' : 'jpg';
            const compressedFilename = file.name.replace(/\.[^/.]+$/, '') + `_compressed.${ext}`;
            const compressedFile = new File([blob], compressedFilename, {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          outputType,
          quality
        );
      };

      img.onerror = () => resolve(file); // fallback on image decode error
      img.src = e.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
