export type EditionMarqueeItem =
  | { type: "image"; id: string; src: string; alt: string; narrow?: boolean }
  | { type: "edition"; id: string; year: string; title: string };

export const topRowItems: readonly EditionMarqueeItem[] = [
  { type: "edition", id: "2025", year: "2025", title: "The Interactive Era" },
  { type: "image", id: "2025-red-carpet", src: "/assets/insignia/past-editions/image-2.png", alt: "Guests at the Lumikai Insignia 2025 red carpet" },
  { type: "image", id: "2025-panel", src: "/assets/insignia/past-editions/image-3.png", alt: "Speakers in conversation on the Insignia stage" },
  { type: "image", id: "2025-conversation", src: "/assets/insignia/past-editions/image-4.png", alt: "Insignia guests speaking during the gathering", narrow: true },
  { type: "image", id: "2025-ballroom", src: "/assets/insignia/past-editions/imagew.png", alt: "Insignia audience attending a ballroom session" },
];

export const bottomRowItems: readonly EditionMarqueeItem[] = [
  { type: "image", id: "2024-stage", src: "/assets/insignia/past-editions/imagerow2.png", alt: "Industry leaders participating in an Insignia stage session" },
  { type: "image", id: "2024-speaker", src: "/assets/insignia/past-editions/imagerow2-2.png", alt: "An Insignia speaker addressing the audience" },
  { type: "edition", id: "2024", year: "2024", title: "Finding Alpha" },
  { type: "image", id: "2024-reception", src: "/assets/insignia/past-editions/imagerow2-3.png", alt: "Guests in conversation at the Insignia reception" },
  { type: "image", id: "2024-vr", src: "/assets/insignia/past-editions/imagerow2-4.png", alt: "An Insignia guest trying a virtual reality headset", narrow: true },
];
