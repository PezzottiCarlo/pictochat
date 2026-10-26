/**
 * Client-side image preparation for personal pictograms: photos are scaled down to fit
 * MAX_EDGE px and re-encoded as JPEG, so IndexedDB and Telegram uploads stay small.
 */

export const MAX_EDGE = 512;
export const JPEG_QUALITY = 0.85;

/** Size that fits inside max×max keeping the aspect ratio; never upscales, never below 1px. */
export function fitWithin(width: number, height: number, max = MAX_EDGE): { width: number; height: number } {
  if (!(width > 0) || !(height > 0)) return { width: 0, height: 0 };
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** True when an image already fits and is light enough to store as it is. */
export function canKeepAsIs(width: number, height: number, bytes: number, type: string, max = MAX_EDGE): boolean {
  return Math.max(width, height) <= max && bytes <= 300_000 && /^image\/(png|jpeg|webp|gif)$/.test(type);
}

async function decode(blob: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; close(): void }> {
  if ('createImageBitmap' in window) {
    try {
      const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      // HEIC and friends: fall through to <img>, which may still decode them (Safari).
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

export class ImageError extends Error {}

/** Scales a photo down to ≤ MAX_EDGE and compresses it (white background for transparent images). */
export async function prepareImage(blob: Blob, max = MAX_EDGE): Promise<Blob> {
  let image: Awaited<ReturnType<typeof decode>>;
  try {
    image = await decode(blob);
  } catch {
    throw new ImageError('Non riesco ad aprire questa immagine. Prova con una foto diversa.');
  }
  try {
    if (canKeepAsIs(image.width, image.height, blob.size, blob.type, max)) return blob;
    const { width, height } = fitWithin(image.width, image.height, max);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new ImageError('Il telefono non riesce a preparare l’immagine.');
    // Pictogram cards are white: flatten transparency on white instead of JPEG's black.
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image.source, 0, 0, width, height);
    const out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!out) throw new ImageError('Il telefono non riesce a preparare l’immagine.');
    return out;
  } finally {
    image.close();
  }
}

/** Downloads an image (e.g. an ARASAAC pictogram) as a Blob. */
export async function fetchImage(url: string): Promise<Blob> {
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new ImageError('Non riesco a scaricare il pittogramma. Controlla internet.');
  return res.blob();
}

/** File name for sending: "nonna.jpg". */
export function fileNameFor(word: string, type: string): string {
  const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : type === 'image/gif' ? 'gif' : 'jpg';
  const base = word
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return `${base || 'pittogramma'}.${ext}`;
}
