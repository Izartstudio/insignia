import { createClient, defineQuery } from 'next-sanity';
import { automaticGalleryPlacement, galleryStates, type GalleryPhoto, type GalleryState, type Placement } from '@/content/spatial-gallery';

export type GalleryCopy = { dialogTitle: string; explorePrompt: string; touchExplorePrompt: string; nextLabel: string; learnMoreLabel: string; entryTitle: string; entryNote: string; enterLabel: string; copyLinkLabel: string };
export type SpatialGalleryContent = { desktop: GalleryState[]; mobile: GalleryState[]; desktopCopy: GalleryCopy; mobileCopy: GalleryCopy };
export const fallbackGalleryCopy: GalleryCopy = {
  dialogTitle: 'Who has been at Insignia', explorePrompt: 'Move to explore the canvas.', touchExplorePrompt: 'Swipe here to scroll',
  nextLabel: 'NEXT', learnMoreLabel: 'LEARN MORE',
  entryTitle: 'Who has been at Insignia', entryNote: 'Designed to adapt across devices, with an experience best enjoyed on the desktop.', enterLabel: 'ENTER TO EXPERIENCE', copyLinkLabel: 'COPY LINK',
};

const query = defineQuery(`*[_id in ["spatialGalleryDesktop", "spatialGalleryMobile"]]{
  _id,dialogTitle,explorePrompt,touchExplorePrompt,nextLabel,learnMoreLabel,entryTitle,entryNote,enterLabel,copyLinkLabel,
  leaders{category,label,heading,subtitle,radius,photos[]{"src":image.asset->url,alt,placement,depthOffset,referenceCrop,name,bio,learnMoreUrl}},
  founders{category,label,heading,subtitle,radius,photos[]{"src":image.asset->url,alt,placement,depthOffset,referenceCrop,name,bio,learnMoreUrl}},
  experts{category,label,heading,subtitle,radius,photos[]{"src":image.asset->url,alt,placement,depthOffset,referenceCrop,name,bio,learnMoreUrl}},
  investors{category,label,heading,subtitle,radius,photos[]{"src":image.asset->url,alt,placement,depthOffset,referenceCrop,name,bio,learnMoreUrl}}
}`);

const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown, fallback: string) => typeof value === 'string' && value.trim() ? value : fallback;

function placement(value: unknown): Placement | null {
  if (!isObject(value)) return null;
  const numbers = [value.x, value.y, value.width, value.height];
  if (!numbers.every(number => typeof number === 'number' && Number.isFinite(number)) || Number(value.width) <= 0 || Number(value.height) <= 0) return null;
  return numbers as unknown as Placement;
}

function normalize(document: unknown, mobile: boolean): GalleryState[] {
  if (!isObject(document)) return galleryStates;
  const states = galleryStates.map(defaultState => {
    const raw = document[defaultState.id];
    if (!isObject(raw) || !Array.isArray(raw.photos) || raw.photos.length === 0) return null;
    const photos = raw.photos.slice(0, 10).map((item, index): GalleryPhoto | null => {
      if (!isObject(item) || typeof item.src !== 'string' || !item.src.startsWith('https://')) return null;
      const position = placement(item.placement) ?? automaticGalleryPlacement(index);
      return {
        src: item.src,
        alt: text(item.alt, text(item.name, 'Insignia attendee')),
        layout: position,
        ...(mobile ? { mobileLayout: position } : {}),
        depthOffset: typeof item.depthOffset === 'number' && Number.isFinite(item.depthOffset) ? item.depthOffset : 0,
        referenceCrop: item.referenceCrop === true,
        name: text(item.name, ''),
        bio: text(item.bio, ''),
        learnMoreUrl: typeof item.learnMoreUrl === 'string' && /^https?:\/\//.test(item.learnMoreUrl) ? item.learnMoreUrl : undefined,
      };
    }).filter((photo): photo is GalleryPhoto => photo !== null);
    if (!photos.length) return null;
    return {
      ...defaultState,
      category: text(raw.category, defaultState.category),
      label: text(raw.label, defaultState.label),
      heading: text(raw.heading, defaultState.heading),
      subtitle: typeof raw.subtitle === 'string' ? raw.subtitle : undefined,
      radius: typeof raw.radius === 'number' && raw.radius > 0 ? raw.radius : defaultState.radius,
      photos: photos as GalleryPhoto[],
    };
  });
  return states.map((state, index) => state ?? galleryStates[index]);
}

function normalizeCopy(document: unknown): GalleryCopy {
  if (!isObject(document)) return fallbackGalleryCopy;
  return {
    dialogTitle: text(document.dialogTitle, fallbackGalleryCopy.dialogTitle),
    explorePrompt: text(document.explorePrompt, fallbackGalleryCopy.explorePrompt),
    touchExplorePrompt: text(document.touchExplorePrompt, fallbackGalleryCopy.touchExplorePrompt),
    nextLabel: text(document.nextLabel, fallbackGalleryCopy.nextLabel),
    learnMoreLabel: text(document.learnMoreLabel, fallbackGalleryCopy.learnMoreLabel),
    entryTitle: text(document.entryTitle, fallbackGalleryCopy.entryTitle),
    entryNote: text(document.entryNote, fallbackGalleryCopy.entryNote),
    enterLabel: text(document.enterLabel, fallbackGalleryCopy.enterLabel),
    copyLinkLabel: text(document.copyLinkLabel, fallbackGalleryCopy.copyLinkLabel),
  };
}

export async function getSpatialGalleryContent(): Promise<SpatialGalleryContent> {
  const fallback = { desktop: galleryStates, mobile: galleryStates, desktopCopy: fallbackGalleryCopy, mobileCopy: fallbackGalleryCopy };
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  if (!projectId) return fallback;
  try {
    const client = createClient({
      projectId,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
      apiVersion: '2026-10-01',
      useCdn: true,
      perspective: 'published',
    });
    const documents = await client.fetch(query, {}, { next: { revalidate: 60 } });
    const byId = Object.fromEntries((Array.isArray(documents) ? documents : []).map(item => [item._id, item]));
    return {
      desktop: normalize(byId.spatialGalleryDesktop, false),
      mobile: normalize(byId.spatialGalleryMobile, true),
      desktopCopy: normalizeCopy(byId.spatialGalleryDesktop),
      mobileCopy: normalizeCopy(byId.spatialGalleryMobile),
    };
  } catch (error) {
    console.error('Unable to load Sanity spatial gallery:', error);
    return fallback;
  }
}
