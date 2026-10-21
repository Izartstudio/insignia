export type EditionMarqueeItem =
  | { type: "image"; id: string; src: string; alt: string }
  | { type: "edition"; id: string; year: string; title: string };

export type PastEdition = {
  year: string;
  title: string;
  photos: { id: string; src: string; alt: string }[];
};
export type PastEditionsContent = {
  eyebrow: string;
  heading: string;
  editions: PastEdition[];
};

const fallbackPhotoDetails: Record<string, { src: string; alt: string }> = {
  imagew: { src: 'imagew.png', alt: 'Audience watching an Insignia ballroom session' },
  'image-2': { src: 'image-2.png', alt: 'Guests at the Insignia red carpet' },
  'image-3': { src: 'image-3.png', alt: 'Speakers in conversation on stage' },
  'image-4': { src: 'image-4.png', alt: 'Guests talking at the gathering' },
  imagerow2: { src: 'imagerow2.png', alt: 'Industry leaders participating in a stage session' },
  'imagerow2-2': { src: 'imagerow2-2.png', alt: 'A speaker addressing the audience' },
  'imagerow2-3': { src: 'imagerow2-3.png', alt: 'Guests in conversation at the reception' },
  'imagerow2-4': { src: 'imagerow2-4.png', alt: 'A guest trying a virtual reality headset' },
};

const fallbackEditionData: { year: string; title: string; photos: string[] }[] = [
  { year: '2025', title: 'The interactive era.', photos: ['imagerow2', 'imagew', 'imagerow2-2', 'image-2', 'imagerow2-3'] },
  { year: '2024', title: 'Finding alpha.', photos: ['image-3', 'image-4', 'imagerow2-4', 'imagew', 'imagerow2-2'] },
  { year: '2023', title: 'India’s digital destiny.', photos: ['imagerow2', 'imagew', 'image-2', 'image-3', 'imagerow2-4'] },
  { year: '2022', title: 'Let the games begin.', photos: ['image-4', 'imagerow2-3', 'image-2', 'imagerow2', 'image-4'] },
];

export const pastEditions: PastEdition[] = fallbackEditionData.map(edition => ({
  ...edition,
  photos: edition.photos.map((photo, index) => ({
    id: `${edition.year}-${index}`,
    src: `/assets/insignia/past-editions/${fallbackPhotoDetails[photo].src}`,
    alt: fallbackPhotoDetails[photo].alt,
  })),
}));

export function editionCells(edition: PastEdition): EditionMarqueeItem[] {
  const label: EditionMarqueeItem = { type: "edition", id: edition.year, year: edition.year, title: edition.title };
  return [label, ...edition.photos.map(photo => ({ type: 'image' as const, ...photo }))];
}
