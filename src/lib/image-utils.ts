/**
 * Utility to compress and resize images client-side before uploading to Firebase Storage.
 * Ensures images stay under the 300KB limit while maintaining quality.
 */
export async function compressImage(base64Str: string, maxWidth = 1000, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert to compressed JPEG
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
}

/**
 * Converts a data URL (Base64) to a Blob for Firebase Storage upload.
 */
export async function dataURLToBlob(dataURL: string): Promise<Blob> {
  const res = await fetch(dataURL);
  return await res.blob();
}
