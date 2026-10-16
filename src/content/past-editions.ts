export type EditionMarqueeItem =
  | { type: "image"; id: string; src: string; alt: string }
  | { type: "edition"; id: string; year: string; title: string };

type Edition = { year: string; title: string; labelRow: "top" | "bottom"; photos: readonly string[] };

// Photos are deliberately reused until the remaining edition assets are supplied.
// Column-major order: top, bottom, then the next column, as in the reference.
export const pastEditions: readonly Edition[] = [
  { year: "2025", title: "The interactive era.", labelRow: "top", photos: ["imagerow2", "imagew", "imagerow2-2", "image-2", "imagerow2-3"] },
  { year: "2024", title: "Finding alpha.", labelRow: "bottom", photos: ["image-3", "image-4", "imagerow2-4", "imagew", "imagerow2-2"] },
  { year: "2023", title: "India’s digital destiny.", labelRow: "top", photos: ["imagerow2", "imagew", "image-2", "image-3", "imagerow2-4"] },
  { year: "2022", title: "Let the games begin.", labelRow: "bottom", photos: ["image-4", "imagerow2-3", "image-2", "imagerow2"] },
];

const descriptions: Record<string, string> = {
  imagew: "Audience watching an Insignia ballroom session",
  "image-2": "Guests at the Insignia red carpet",
  "image-3": "Speakers in conversation on stage",
  "image-4": "Guests talking at the gathering",
  imagerow2: "Industry leaders participating in a stage session",
  "imagerow2-2": "A speaker addressing the audience",
  "imagerow2-3": "Guests in conversation at the reception",
  "imagerow2-4": "A guest trying a virtual reality headset",
};

export function editionCells(edition: Edition): (EditionMarqueeItem | null)[] {
  const label: EditionMarqueeItem = { type: "edition", id: edition.year, year: edition.year, title: edition.title };
  const photos: EditionMarqueeItem[] = edition.photos.map((name, index) => ({
    type: "image", id: `${edition.year}-${index}`, src: `/assets/insignia/past-editions/${name}.png`, alt: descriptions[name],
  }));
  if (edition.labelRow === "top") return [label, ...photos];
  if (photos.length === 4) {
    const closingPhoto = { ...photos[0], id: `${edition.year}-closing` };
    return [photos[0], label, ...photos.slice(1), closingPhoto];
  }
  return [photos[0], label, ...photos.slice(1)];
}
