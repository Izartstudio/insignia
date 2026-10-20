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
  { id: 'leaders', category: 'LEADERS', label: 'Leaders', heading: "Who's been at Insignia.", subtitle: 'Leaders shaping the interactive media industry.', depth: 0, tile: { width: 1600, height: 1100 }, radius: 1075.5 / 900, photos: [
    { src: "/assets/insignia/people/leaders-reference-1.webp", alt: "An attendee in conversation at Insignia", layout: [113, 125, 160, 185], mobileLayout: [-204.094, 298.442, 333.354, 113.501], depthOffset: 0.3, referenceCrop: true },
    { src: "/assets/insignia/people/leaders-reference-2.webp", alt: "Guests speaking at a reception", layout: [1222, 219, 130, 150], mobileLayout: [1508.031, 240.356, 267.591, 90.801], depthOffset: -0.3, referenceCrop: true },
    { src: "/assets/insignia/people/leaders-reference-3.webp", alt: "A speaker holding a microphone", layout: [448, 280, 51.7574, 59.72], mobileLayout: [492.094, 393.249, 108.850, 36.721], depthOffset: -0.7, referenceCrop: true },
    { src: "/assets/insignia/people/leaders-reference-4.webp", alt: "A panel speaker gesturing with his hand", layout: [226.737, 419.799, 51.7574, 59.72], mobileLayout: [31.748, 480.045, 106.583, 36.053], depthOffset: 0.2, referenceCrop: true },
    { src: "/assets/insignia/people/leaders-reference-5.webp", alt: "A seated speaker at the summit", layout: [938.699, 372.384, 33.3722, 38.5064], mobileLayout: [1508.031, 373.887, 68.031, 23.368], depthOffset: -1, referenceCrop: true },
    { src: "/assets/insignia/people/leaders-reference-6.webp", alt: "Guests in conversation", layout: [814.699, 549.384, 33.3722, 38.5064], mobileLayout: [1256.315, 558.828, 70.299, 23.368], depthOffset: -0.6, referenceCrop: true },
    { src: "/assets/insignia/people/leaders-reference-7.webp", alt: "Portrait of an Insignia guest", layout: [436.68, 531.34, 127.254, 146.831], mobileLayout: [469.417, 547.478, 265.323, 90.134], depthOffset: 0.1, referenceCrop: true },
    { src: "/assets/insignia/people/leaders-reference-8.webp", alt: "An attendee seated at the summit", layout: [1063, 544.852, 209.11, 241.281], mobileLayout: [1542.047, 527.448, 435.402, 148.220], depthOffset: 0.5, referenceCrop: true },
    { src: "/assets/insignia/people/leaders-reference-9.webp", alt: "An attendee at an Insignia gathering", layout: [59, 654, 161, 185], mobileLayout: [-319.748, 622.923, 335.622, 114.169], depthOffset: 0.4, referenceCrop: true },
  ] },
  { id: 'founders', category: 'FOUNDERS', label: 'Founders', heading: 'Founders driving innovation.', depth: -16, tile: { width: 1600, height: 1100 }, radius: 732 / 900, photos: [
    { src: "/assets/insignia/people/founders-reference-1.webp", alt: "A seated summit attendee", layout: [1316.0, 562.0, 203.0, 235.0], mobileLayout: [978.199, 500.600, 391.280, 134.258], depthOffset: 0.2, referenceCrop: true },
    { src: "/assets/insignia/people/founders-reference-2.webp", alt: "A speaker holding a microphone", layout: [628.0, 156.0, 207.0, 239.0], mobileLayout: [-443.602, 202.399, 391.280, 134.258], depthOffset: 0.4, referenceCrop: true },
    { src: "/assets/insignia/people/founders-reference-3.webp", alt: "A panel speaker gesturing", layout: [61.0, 397.0, 127.0, 147.0], mobileLayout: [-341.232, 394.678, 241.137, 82.984], depthOffset: -0.4, referenceCrop: true },
    { src: "/assets/insignia/people/founders-reference-4.webp", alt: "A seated panel speaker", layout: [1032.0, 311.0, 96.0, 111.0], mobileLayout: [743.886, 404.123, 61.422, 21.589], depthOffset: 0.1, referenceCrop: true },
    { src: "/assets/insignia/people/founders-reference-5.webp", alt: "Guests in conversation", layout: [870.0, 548.0, 114.0, 132.0], mobileLayout: [511.848, 502.624, 65.972, 22.264], depthOffset: 0.3, referenceCrop: true },
    { src: "/assets/insignia/people/founders-reference-6.webp", alt: "Portrait of a summit guest", layout: [394.0, 566.0, 210.0, 243.0], mobileLayout: [-195.640, 493.178, 238.863, 82.309], depthOffset: -0.8, referenceCrop: true },
  ] },
  { id: 'experts', category: 'EXPERTS', label: 'Experts', heading: 'Industry experts defining trends.', depth: -32, tile: { width: 1600, height: 1100 }, radius: 626 / 900, photos: [
    { src: "/assets/insignia/people/experts-reference-1.webp", alt: "A speaker holding a microphone", layout: [947.0, 411.0, 157.0, 181.0], mobileLayout: [890.769, 435.660, 175.385, 59.408], depthOffset: 0.2, referenceCrop: true },
    { src: "/assets/insignia/people/experts-reference-2.webp", alt: "A panel speaker gesturing", layout: [56.0, 141.0, 234.0, 270.0], mobileLayout: [-96.923, 346.889, 258.462, 88.771], depthOffset: 0.4, referenceCrop: true },
    { src: "/assets/insignia/people/experts-reference-3.webp", alt: "A seated panel speaker", layout: [1215.0, 70.0, 175.0, 202.0], mobileLayout: [1188.462, 323.672, 193.846, 66.237], depthOffset: -0.4, referenceCrop: true },
    { src: "/assets/insignia/people/experts-reference-4.webp", alt: "Guests in conversation", layout: [1146.0, 601.0, 137.0, 158.0], mobileLayout: [1112.308, 497.800, 152.308, 52.580], depthOffset: 0.1, referenceCrop: true },
    { src: "/assets/insignia/people/experts-reference-5.webp", alt: "Two guests at a reception", layout: [281.0, 660.0, 252.0, 291.0], mobileLayout: [150.000, 517.602, 281.538, 95.599], depthOffset: 0.3, referenceCrop: true },
    { src: "/assets/insignia/people/experts-reference-6.webp", alt: "Guests in conversation", layout: [530.0, 392.0, 33.3722, 38.5064], mobileLayout: [429.231, 429.514, 36.923, 12.291], depthOffset: -0.8, referenceCrop: true },
    { src: "/assets/insignia/people/experts-reference-7.webp", alt: "A seated summit attendee", layout: [263.0, 487.0, 56.0, 65.0], mobileLayout: [131.538, 460.926, 64.615, 21.168], depthOffset: -0.3, referenceCrop: true },
  ] },
  { id: 'investors', category: 'INVESTORS', label: 'Investors', heading: 'Investors catalysing change.', depth: -48, tile: { width: 1600, height: 1100 }, radius: .5, photos: [
    { src: "/assets/insignia/people/investors-reference-1.webp", alt: "Guests at a reception", layout: [1355.0, 92.0, 169.0, 194.0], mobileLayout: [1587.220, 188.341, 230.032, 77.354], depthOffset: 0.2, referenceCrop: true },
    { src: "/assets/insignia/people/investors-reference-2.webp", alt: "A speaker holding a microphone", layout: [659.757, 230.0, 134.333, 155.0], mobileLayout: [1009.840, 258.969, 285.240, 97.534], depthOffset: 0.4, referenceCrop: true },
    { src: "/assets/insignia/people/investors-reference-3.webp", alt: "A panel speaker gesturing", layout: [142.757, 444.0, 111.0, 128.0], mobileLayout: [-96.613, 394.170, 232.332, 78.027], depthOffset: -0.4, referenceCrop: true },
    { src: "/assets/insignia/people/investors-reference-4.webp", alt: "A seated panel speaker", layout: [986.757, 370.0, 84.0, 97.0], mobileLayout: [1541.214, 376.682, 161.022, 54.484], depthOffset: 0.1, referenceCrop: true },
    { src: "/assets/insignia/people/investors-reference-5.webp", alt: "Guests in conversation", layout: [845.757, 576.0, 100.0, 115.0], mobileLayout: [1405.495, 476.233, 213.930, 72.646], depthOffset: 0.3, referenceCrop: true },
    { src: "/assets/insignia/people/investors-reference-6.webp", alt: "Two guests at a reception", layout: [432.757, 592.0, 183.0, 211.0], mobileLayout: [519.872, 486.323, 395.655, 133.184], depthOffset: -0.8, referenceCrop: true },
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
