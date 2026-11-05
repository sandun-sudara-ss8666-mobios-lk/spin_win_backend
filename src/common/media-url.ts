const mediaFields = new Set(['logoUrl', 'videoUrl', 'iconUrl']);

function publicMediaUrl(value: string): string {
  // Only rewrite uploads owned by this application; external URLs stay intact.
  const match = value.match(/^(?:\/api\/v1\/|\/?)(merchant-logos|reward-videos)\/([^/?#]+)$/);
  if (!match) return value;
  const base = process.env.PUBLIC_MEDIA_BASE_URL || `http://localhost:${process.env.PORT || 3000}/`;
  return new URL(`${match[1]}/${match[2]}`, `${base.replace(/\/+$/, '')}/`).href;
}

/** Serialize media for HTTP and socket clients without changing stored paths. */
export function resolveMediaUrls<T>(data: T): T {
  if (Array.isArray(data)) return data.map(resolveMediaUrls) as T;
  if (!data || typeof data !== 'object' || Object.getPrototypeOf(data) !== Object.prototype) return data;
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [
    key,
    mediaFields.has(key) && typeof value === 'string'
      ? publicMediaUrl(value)
      : resolveMediaUrls(value),
  ])) as T;
}
