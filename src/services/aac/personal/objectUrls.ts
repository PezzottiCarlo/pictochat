/** One object URL per personal pictogram, recreated only when its Blob changes. */
const cache = new Map<string, { blob: Blob; url: string }>();

export function objectUrlFor(id: string, blob: Blob): string {
  const cached = cache.get(id);
  if (cached?.blob === blob) return cached.url;
  if (cached) URL.revokeObjectURL(cached.url);
  const url = URL.createObjectURL(blob);
  cache.set(id, { blob, url });
  return url;
}

export function releaseObjectUrl(id: string): void {
  const cached = cache.get(id);
  if (!cached) return;
  URL.revokeObjectURL(cached.url);
  cache.delete(id);
}
