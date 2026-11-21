import type { ImageSourcePropType } from 'react-native';

const ASSETS: ImageSourcePropType[] = [
  require('../../assets/images/placeholders/hostel-1.png'),
  require('../../assets/images/placeholders/hostel-2.png'),
  require('../../assets/images/placeholders/hostel-3.png'),
  require('../../assets/images/placeholders/hostel-4.png'),
];

const PREFIX = 'local:';

export const FALLBACK_PHOTO: ImageSourcePropType = ASSETS[0];

export function placeholderFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return `${PREFIX}${hash % ASSETS.length}`;
}

export function isOldPhoto(src?: string): boolean {
  return Boolean(src && src.includes('picsum.photos'));
}

export function photoSource(photo?: string): ImageSourcePropType {
  if (photo?.startsWith(PREFIX)) {
    const index = Number(photo.slice(PREFIX.length));
    return ASSETS[index] || FALLBACK_PHOTO;
  }
  if (!photo || isOldPhoto(photo)) return FALLBACK_PHOTO;
  return { uri: photo };
}
