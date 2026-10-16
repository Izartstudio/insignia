export type Placement = readonly [x: number, y: number, width: number, height: number];
export type GalleryPhoto = { src: string; alt: string; layout: Placement; depthOffset: number; referenceCrop?: boolean; mobileLayout?: Placement };
export type GalleryState = { id: string; category: string; label: string; heading: string; subtitle?: string; depth: number; tile: { width: number; height: number }; radius: number; photos: GalleryPhoto[] };
export type GalleryMotionProfile = {
  readonly scrollViewports: number;
  readonly scrub: number;
  readonly stops: readonly number[];
  readonly exits: readonly number[];
  readonly travelEase: 'none' | 'power1.inOut';
};

export const galleryConfig = {
  reference: { width: 1440, height: 900 },
  fov: 40,
  distance: 8,
  depthStep: 16,
  scrollViewports: 4.5,
  scrub: 0.7,
  drag: { intentPixels: 6 },
  exploration: { damping: 18 },
  // Each stop is followed by a hold, then a forward travel phase.
  stops: [0, 0.3, 0.55, 0.8],
  exits: [0.15, 0.4, 0.65, 1],
} as const;

// Rectangles measured from the supplied 1440 × 3600 SVG, local to each 900px state.
// Available portraits are intentionally reused across categories as requested.
export const galleryStates: GalleryState[] = [
  { id: 'leaders', category: 'LEADERS', label: 'Leaders', heading: "Who's Been At Insignia", subtitle: 'Leaders Shaping The Interactive Media Industry', depth: 0, tile: { width: 1600, height: 1100 }, radius: 1075.5 / 900, photos: [
    { src: "/assets/insignia/people/leaders-reference-1.png", alt: "An attendee in conversation at Insignia", layout: [113, 125, 160, 185], mobileLayout: [40, 200, 310, 270], depthOffset: 0.3, referenceCrop: true },
    { src: "/assets/insignia/people/leaders-reference-2.png", alt: "Guests speaking at a reception", layout: [1222, 219, 130, 150], mobileLayout: [1040, 220, 280, 245], depthOffset: -0.3, referenceCrop: true },
    { src: "/assets/insignia/people/leaders-reference-3.png", alt: "A speaker holding a microphone", layout: [448, 280, 51.7574, 59.72], mobileLayout: [540, 270, 140, 123], depthOffset: -0.7, referenceCrop: true },
    { src: "/assets/insignia/people/leaders-reference-4.png", alt: "A panel speaker gesturing with his hand", layout: [226.737, 419.799, 51.7574, 59.72], mobileLayout: [110, 510, 140, 123], depthOffset: 0.2, referenceCrop: true },
    { src: "/assets/insignia/people/leaders-reference-5.png", alt: "A seated speaker at the summit", layout: [938.699, 372.384, 33.3722, 38.5064], mobileLayout: [1060, 450, 100, 87], depthOffset: -1, referenceCrop: true },
    { src: "/assets/insignia/people/leaders-reference-6.png", alt: "Guests in conversation", layout: [814.699, 549.384, 33.3722, 38.5064], mobileLayout: [720, 630, 100, 87], depthOffset: -0.6, referenceCrop: true },
    { src: "/assets/insignia/people/leaders-reference-7.png", alt: "Portrait of an Insignia guest", layout: [436.68, 531.34, 127.254, 146.831], mobileLayout: [410, 570, 240, 210], depthOffset: 0.1, referenceCrop: true },
    { src: "/assets/insignia/people/leaders-reference-8.png", alt: "An attendee seated at the summit", layout: [1063, 544.852, 209.11, 241.281], mobileLayout: [990, 620, 330, 288], depthOffset: 0.5, referenceCrop: true },
    { src: "/assets/insignia/people/leaders-reference-9.png", alt: "An attendee at an Insignia gathering", layout: [59, 654, 161, 185], mobileLayout: [40, 680, 260, 227], depthOffset: 0.4, referenceCrop: true },
  ] },
  { id: 'founders', category: 'FOUNDERS', label: 'Founders', heading: 'Founders Driving Innovation', depth: -16, tile: { width: 1600, height: 1100 }, radius: 732 / 900, photos: [
    { src: "/assets/insignia/people/founders-reference-1.png", alt: "A seated summit attendee", layout: [1316.0, 562.0, 203.0, 235.0], mobileLayout: [1065.05, 562.00, 334.95, 235.00], depthOffset: 0.2, referenceCrop: true },
    { src: "/assets/insignia/people/founders-reference-2.png", alt: "A speaker holding a microphone", layout: [628.0, 156.0, 207.0, 239.0], mobileLayout: [560.73, 160.00, 341.55, 239.00], depthOffset: 0.4, referenceCrop: true },
    { src: "/assets/insignia/people/founders-reference-3.png", alt: "A panel speaker gesturing", layout: [61.0, 397.0, 127.0, 147.0], mobileLayout: [35.00, 397.00, 209.55, 147.00], depthOffset: -0.4, referenceCrop: true },
    { src: "/assets/insignia/people/founders-reference-4.png", alt: "A seated panel speaker", layout: [1032.0, 311.0, 96.0, 111.0], mobileLayout: [1000.80, 311.00, 158.40, 111.00], depthOffset: 0.1, referenceCrop: true },
    { src: "/assets/insignia/people/founders-reference-5.png", alt: "Guests in conversation", layout: [870.0, 548.0, 114.0, 132.0], mobileLayout: [832.95, 548.00, 188.10, 132.00], depthOffset: 0.3, referenceCrop: true },
    { src: "/assets/insignia/people/founders-reference-6.png", alt: "Portrait of a summit guest", layout: [394.0, 566.0, 210.0, 243.0], mobileLayout: [325.75, 566.00, 346.50, 243.00], depthOffset: -0.8, referenceCrop: true },
  ] },
  { id: 'experts', category: 'EXPERTS', label: 'Industry Experts', heading: 'Industry Experts Defining Trends', depth: -32, tile: { width: 1600, height: 1100 }, radius: 626 / 900, photos: [
    { src: "/assets/insignia/people/experts-reference-1.png", alt: "A speaker holding a microphone", layout: [947.0, 411.0, 157.0, 181.0], mobileLayout: [895.98, 411.00, 259.05, 181.00], depthOffset: 0.2, referenceCrop: true },
    { src: "/assets/insignia/people/experts-reference-2.png", alt: "A panel speaker gesturing", layout: [56.0, 141.0, 234.0, 270.0], mobileLayout: [35.00, 160.00, 370.00, 270.00], depthOffset: 0.4, referenceCrop: true },
    { src: "/assets/insignia/people/experts-reference-3.png", alt: "A seated panel speaker", layout: [1215.0, 70.0, 175.0, 202.0], mobileLayout: [1111.25, 160.00, 288.75, 202.00], depthOffset: -0.4, referenceCrop: true },
    { src: "/assets/insignia/people/experts-reference-4.png", alt: "Guests in conversation", layout: [1146.0, 601.0, 137.0, 158.0], mobileLayout: [1101.47, 601.00, 226.05, 158.00], depthOffset: 0.1, referenceCrop: true },
    { src: "/assets/insignia/people/experts-reference-5.png", alt: "Two guests at a reception", layout: [281.0, 660.0, 252.0, 291.0], mobileLayout: [222.00, 660.00, 370.00, 291.00], depthOffset: 0.3, referenceCrop: true },
    { src: "/assets/insignia/people/experts-reference-6.png", alt: "Guests in conversation", layout: [530.0, 392.0, 33.3722, 38.5064], mobileLayout: [519.15, 392.00, 55.06, 38.51], depthOffset: -0.8, referenceCrop: true },
    { src: "/assets/insignia/people/experts-reference-7.png", alt: "A seated summit attendee", layout: [263.0, 487.0, 56.0, 65.0], mobileLayout: [244.80, 487.00, 92.40, 65.00], depthOffset: -0.3, referenceCrop: true },
  ] },
  { id: 'investors', category: 'INVESTORS', label: 'Investors', heading: 'Investors Catalysing Change', depth: -48, tile: { width: 1600, height: 1100 }, radius: .5, photos: [
    { src: "/assets/insignia/people/investors-reference-1.png", alt: "Guests at a reception", layout: [1355.0, 92.0, 169.0, 194.0], mobileLayout: [1121.15, 160.00, 278.85, 194.00], depthOffset: 0.2, referenceCrop: true },
    { src: "/assets/insignia/people/investors-reference-2.png", alt: "A speaker holding a microphone", layout: [659.757, 230.0, 134.333, 155.0], mobileLayout: [616.10, 230.00, 221.65, 155.00], depthOffset: 0.4, referenceCrop: true },
    { src: "/assets/insignia/people/investors-reference-3.png", alt: "A panel speaker gesturing", layout: [142.757, 444.0, 111.0, 128.0], mobileLayout: [106.68, 444.00, 183.15, 128.00], depthOffset: -0.4, referenceCrop: true },
    { src: "/assets/insignia/people/investors-reference-4.png", alt: "A seated panel speaker", layout: [986.757, 370.0, 84.0, 97.0], mobileLayout: [959.46, 370.00, 138.60, 97.00], depthOffset: 0.1, referenceCrop: true },
    { src: "/assets/insignia/people/investors-reference-5.png", alt: "Guests in conversation", layout: [845.757, 576.0, 100.0, 115.0], mobileLayout: [813.26, 576.00, 165.00, 115.00], depthOffset: 0.3, referenceCrop: true },
    { src: "/assets/insignia/people/investors-reference-6.png", alt: "Two guests at a reception", layout: [432.757, 592.0, 183.0, 211.0], mobileLayout: [373.28, 592.00, 301.95, 211.00], depthOffset: -0.8, referenceCrop: true },
  ] },
];

// Intentional mobile arrangement, with clear space for centered type and bottom UI.
export const mobilePlacements: readonly Placement[] = [
  [35,180,340,360], [1040,190,340,360], [570,240,155,177],
  [60,560,340,360], [1030,560,340,360], [570,670,175,200],
  [420,550,210,240], [760,510,210,240], [680,140,160,180],
];

// The original pacing remains available through SpatialGalleryOriginal.
export const originalGalleryMotionProfile: GalleryMotionProfile = {
  scrollViewports: galleryConfig.scrollViewports,
  scrub: galleryConfig.scrub,
  stops: galleryConfig.stops,
  exits: galleryConfig.exits,
  travelEase: 'power1.inOut',
};

// Give each depth passage enough scroll to see photographs approaching and receding.
// The short holds preserve a clear resting frame for every category.
const categoryScrollViewports = 2.8;
const categoryHoldViewports = 0.65;
const extendedScrollViewports = categoryScrollViewports * (galleryStates.length - 1) + categoryHoldViewports;

export const extendedGalleryMotionProfile: GalleryMotionProfile = {
  scrollViewports: extendedScrollViewports,
  scrub: galleryConfig.scrub,
  stops: galleryStates.map((_, index) => index * categoryScrollViewports / extendedScrollViewports),
  exits: galleryStates.map((_, index) => index === galleryStates.length - 1
    ? 1
    : (index * categoryScrollViewports + categoryHoldViewports) / extendedScrollViewports),
  travelEase: 'none',
};
