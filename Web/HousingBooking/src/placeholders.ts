const PLACEHOLDERS = [
  "/placeholders/hostel-1.svg",
  "/placeholders/hostel-2.svg",
  "/placeholders/hostel-3.svg",
  "/placeholders/hostel-4.svg",
];

export const FALLBACK_PHOTO = PLACEHOLDERS[0];

export function placeholderFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PLACEHOLDERS[hash % PLACEHOLDERS.length];
}

export function isOldPhoto(src?: string): boolean {
  return Boolean(src && src.includes("picsum.photos"));
}
