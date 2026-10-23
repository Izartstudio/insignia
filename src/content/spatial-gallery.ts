export type Placement = readonly [x: number, y: number, width: number, height: number];
export type GalleryPhoto = { src: string; alt: string; layout: Placement; depthOffset: number; referenceCrop?: boolean; mobileLayout?: Placement; name?: string; bio?: string; learnMoreUrl?: string };
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

// Attendee copy from the Insignia source sheet (22 October 2026).
// Neutral placeholders remain until each attendee portrait is supplied in Sanity.
export const galleryStates: GalleryState[] = [
  {
    "id": "leaders",
    "category": "LEADERS",
    "label": "Leaders",
    "heading": "Who has been at Insignia.",
    "subtitle": "Leaders shaping the interactive media industry.",
    "depth": 0,
    "tile": {
      "width": 1600,
      "height": 1100
    },
    "radius": 1.195,
    "photos": [
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Padma Shri SS Rajamouli",
        "layout": [
          113,
          125,
          160,
          185
        ],
        "mobileLayout": [
          90,
          68,
          240,
          278
        ],
        "depthOffset": 0.3,
        "referenceCrop": true,
        "name": "Padma Shri SS Rajamouli",
        "bio": "Award Winning Indian Filmmaker & Time's List Of The 100 Most Influential People In The World\nDirector - Baahbali Franchise",
        "learnMoreUrl": "https://en.wikipedia.org/wiki/S._S._Rajamouli"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Raja Koduri",
        "layout": [
          1222,
          219,
          130,
          150
        ],
        "mobileLayout": [
          84,
          660,
          200,
          232
        ],
        "depthOffset": -0.3,
        "referenceCrop": true,
        "name": "Raja Koduri",
        "bio": "Ex-EVP - Intel\nFounder - OXMIQ Labs",
        "learnMoreUrl": "https://en.wikipedia.org/wiki/Raja_Koduri"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Rajeev Chandrasekhar",
        "layout": [
          448,
          280,
          51.7574,
          59.72
        ],
        "mobileLayout": [
          -370,
          210,
          215,
          250
        ],
        "depthOffset": -0.7,
        "referenceCrop": true,
        "name": "Rajeev Chandrasekhar",
        "bio": "State President - BJP, Kerala\nFormer Union Minister Of State For Electronics & IT",
        "learnMoreUrl": "https://rajeev.in/"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Amarjit Singh Batra",
        "layout": [
          226.737,
          419.799,
          51.7574,
          59.72
        ],
        "mobileLayout": [
          -355,
          490,
          215,
          250
        ],
        "depthOffset": 0.2,
        "referenceCrop": true,
        "name": "Amarjit Singh Batra",
        "bio": "General Manager, SAMEA & MD - Spotify India",
        "learnMoreUrl": "https://www.linkedin.com/in/amarjitbatra/"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Gaurav Gandhi",
        "layout": [
          938.699,
          372.384,
          33.3722,
          38.5064
        ],
        "mobileLayout": [
          1580,
          330,
          200,
          232
        ],
        "depthOffset": -1,
        "referenceCrop": true,
        "name": "Gaurav Gandhi",
        "bio": "Vice President, Asia-Pacific & ANZ - Prime Video",
        "learnMoreUrl": "https://www.linkedin.com/in/gaurav-gandhi-1961822/"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Kiran Mani",
        "layout": [
          814.699,
          549.384,
          33.3722,
          38.5064
        ],
        "mobileLayout": [
          1580,
          630,
          200,
          232
        ],
        "depthOffset": -0.6,
        "referenceCrop": true,
        "name": "Kiran Mani",
        "bio": "Managing Director, APAC & Japan - OpenAI",
        "learnMoreUrl": "https://www.linkedin.com/in/kiranmani/"
      }
    ]
  },
  {
    "id": "founders",
    "category": "FOUNDERS",
    "label": "Founders",
    "heading": "Founders driving innovation.",
    "depth": -16,
    "tile": {
      "width": 1600,
      "height": 1100
    },
    "radius": 0.8133333333333334,
    "photos": [
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Saurabh Pandey",
        "layout": [
          1316,
          562,
          203,
          235
        ],
        "mobileLayout": [
          1050,
          555,
          310,
          360
        ],
        "depthOffset": 0.2,
        "referenceCrop": true,
        "name": "Saurabh Pandey",
        "bio": "Founder & CEO - Eloelo Group",
        "learnMoreUrl": "https://www.linkedin.com/in/saurabh1609/"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Cevat Yerli",
        "layout": [
          628,
          156,
          207,
          239
        ],
        "mobileLayout": [
          90,
          70,
          240,
          278
        ],
        "depthOffset": 0.4,
        "referenceCrop": true,
        "name": "Cevat Yerli",
        "bio": "Founder - Crytek\nFounder, Chairman & CEO - TMRW Foundation\nCreator - Fry Cry & Crysis",
        "learnMoreUrl": "https://www.linkedin.com/in/cevatyerli/"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Alexis Bonte",
        "layout": [
          61,
          397,
          127,
          147
        ],
        "mobileLayout": [
          40,
          255,
          245,
          284
        ],
        "depthOffset": -0.4,
        "referenceCrop": true,
        "name": "Alexis Bonte",
        "bio": "Group CEO & President - Stillfront Group",
        "learnMoreUrl": "https://www.linkedin.com/in/alexisbonte/"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Ashwin Jaishanker",
        "layout": [
          1032,
          311,
          96,
          111
        ],
        "mobileLayout": [
          1120,
          205,
          190,
          220
        ],
        "depthOffset": 0.1,
        "referenceCrop": true,
        "name": "Ashwin Jaishanker",
        "bio": "CEO & Co-Founder - AutoVRse",
        "learnMoreUrl": "https://www.linkedin.com/in/ashwin-jaishanker/"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Shobu Yarlagadda",
        "layout": [
          870,
          548,
          114,
          132
        ],
        "mobileLayout": [
          1590,
          400,
          190,
          220
        ],
        "depthOffset": 0.3,
        "referenceCrop": true,
        "name": "Shobu Yarlagadda",
        "bio": "Producer - Baahubali Franchise\nCEO & Co-Founder - Arka Media Works & Mihira Visual Labs",
        "learnMoreUrl": "https://www.linkedin.com/in/shobuyarlagadda/"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Akshat Rathee",
        "layout": [
          394,
          566,
          210,
          243
        ],
        "mobileLayout": [
          85,
          660,
          200,
          232
        ],
        "depthOffset": -0.8,
        "referenceCrop": true,
        "name": "Akshat Rathee",
        "bio": "Co-Founder & MD - NODWIN Gaming",
        "learnMoreUrl": "https://www.linkedin.com/in/akshatrathee/"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Maharishi RB",
        "layout": [
          1050,
          90,
          160,
          185
        ],
        "mobileLayout": [
          -350,
          120,
          210,
          243
        ],
        "depthOffset": 0,
        "referenceCrop": true,
        "name": "Maharishi RB",
        "bio": "Co-Founder & CEO - Supernova AI",
        "learnMoreUrl": "https://linkedin.com/in/maharishirb-supernova-ai-app?originalSubdomain=in"
      }
    ]
  },
  {
    "id": "experts",
    "category": "EXPERTS",
    "label": "Experts",
    "heading": "Industry experts defining trends.",
    "depth": -32,
    "tile": {
      "width": 1600,
      "height": 1100
    },
    "radius": 0.6955555555555556,
    "photos": [
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Arnd Benninghoff",
        "layout": [
          947,
          411,
          157,
          181
        ],
        "mobileLayout": [
          1050,
          555,
          300,
          347
        ],
        "depthOffset": 0.2,
        "referenceCrop": true,
        "name": "Arnd Benninghoff",
        "bio": "EVP Gaming - Modern Times Group",
        "learnMoreUrl": "https://www.linkedin.com/in/arnd-benninghoff-9897063/"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Sean Hyunil Sohn",
        "layout": [
          56,
          141,
          234,
          270
        ],
        "mobileLayout": [
          90,
          68,
          240,
          278
        ],
        "depthOffset": 0.4,
        "referenceCrop": true,
        "name": "Sean Hyunil Sohn",
        "bio": "CEO - KRAFTON, Inc. India",
        "learnMoreUrl": "https://www.linkedin.com/in/sean-hyunil-sohn-1670216/"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Manoj Kohli",
        "layout": [
          1215,
          70,
          175,
          202
        ],
        "mobileLayout": [
          1120,
          200,
          200,
          231
        ],
        "depthOffset": -0.4,
        "referenceCrop": true,
        "name": "Manoj Kohli",
        "bio": "Ex-Country Head - SoftBank India",
        "learnMoreUrl": "https://www.linkedin.com/in/manoj-kohli-34948b108/"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Nitish Mittersain",
        "layout": [
          1146,
          601,
          137,
          158
        ],
        "mobileLayout": [
          1580,
          450,
          210,
          243
        ],
        "depthOffset": 0.1,
        "referenceCrop": true,
        "name": "Nitish Mittersain",
        "bio": "Founder & Ex-MD - Nazaara Technologies Limited",
        "learnMoreUrl": "https://www.linkedin.com/in/mittersain/"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Taewon Yun",
        "layout": [
          281,
          660,
          252,
          291
        ],
        "mobileLayout": [
          85,
          655,
          200,
          231
        ],
        "depthOffset": 0.3,
        "referenceCrop": true,
        "name": "Taewon Yun",
        "bio": "SVP, Head Of New Ventures - NCSOFT",
        "learnMoreUrl": "https://www.linkedin.com/in/taewonyun/"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Sean Lee",
        "layout": [
          530,
          392,
          33.3722,
          38.5064
        ],
        "mobileLayout": [
          -350,
          450,
          200,
          231
        ],
        "depthOffset": -0.8,
        "referenceCrop": true,
        "name": "Sean Lee",
        "bio": "Chief CDO - Wargaming Group Limited",
        "learnMoreUrl": "https://www.linkedin.com/in/97slee/"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Je Alipio",
        "layout": [
          263,
          487,
          56,
          65
        ],
        "mobileLayout": [
          36,
          255,
          245,
          284
        ],
        "depthOffset": -0.3,
        "referenceCrop": true,
        "name": "Je Alipio",
        "bio": "Director & Head of BD (Games), APAC & MENA - The Walt Disney Company",
        "learnMoreUrl": "https://www.linkedin.com/in/jealipio/"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Kartik Prabhakara",
        "layout": [
          650,
          650,
          160,
          185
        ],
        "mobileLayout": [
          -350,
          120,
          210,
          243
        ],
        "depthOffset": 0,
        "referenceCrop": true,
        "name": "Kartik Prabhakara",
        "bio": "Founding Partner - AREAM & Co.",
        "learnMoreUrl": "https://www.linkedin.com/in/kartikprabhakara/"
      }
    ]
  },
  {
    "id": "investors",
    "category": "INVESTORS",
    "label": "Investors",
    "heading": "Investors catalysing change.",
    "depth": -48,
    "tile": {
      "width": 1600,
      "height": 1100
    },
    "radius": 0.5,
    "photos": [
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Abdullah Alorainy",
        "layout": [
          1355,
          92,
          169,
          194
        ],
        "mobileLayout": [
          1120,
          200,
          200,
          231
        ],
        "depthOffset": 0.2,
        "referenceCrop": true,
        "name": "Abdullah Alorainy",
        "bio": "Investment Management, Saudi Arabia - Public Investment Fund",
        "learnMoreUrl": "https://www.linkedin.com/in/aorainy/"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Harri Manninen",
        "layout": [
          659.757,
          230,
          134.333,
          155
        ],
        "mobileLayout": [
          90,
          68,
          240,
          278
        ],
        "depthOffset": 0.4,
        "referenceCrop": true,
        "name": "Harri Manninen",
        "bio": "Founding Partner - Play Ventures",
        "learnMoreUrl": "https://www.linkedin.com/in/harrimanninen/"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Shailesh Lakhani",
        "layout": [
          142.757,
          444,
          111,
          128
        ],
        "mobileLayout": [
          36,
          255,
          245,
          284
        ],
        "depthOffset": -0.4,
        "referenceCrop": true,
        "name": "Shailesh Lakhani",
        "bio": "Ex-MD PeakXV\nCo-Founder & MD - Ambition Capital",
        "learnMoreUrl": "https://www.linkedin.com/in/shailesh-lakhani-b86409/"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Brett Karuse",
        "layout": [
          986.757,
          370,
          84,
          97
        ],
        "mobileLayout": [
          1590,
          350,
          195,
          225
        ],
        "depthOffset": 0.1,
        "referenceCrop": true,
        "name": "Brett Karuse",
        "bio": "Co-Founding General Partner - Transcend Fund",
        "learnMoreUrl": "https://www.linkedin.com/in/brett-krause/"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Evan Hoff",
        "layout": [
          845.757,
          576,
          100,
          115
        ],
        "mobileLayout": [
          1050,
          555,
          300,
          347
        ],
        "depthOffset": 0.3,
        "referenceCrop": true,
        "name": "Evan Hoff",
        "bio": "Founder & Partner - Velo Partners",
        "learnMoreUrl": "https://www.linkedin.com/in/evan-hoff-099721/"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Etsuko Horie",
        "layout": [
          432.757,
          592,
          183,
          211
        ],
        "mobileLayout": [
          85,
          655,
          200,
          231
        ],
        "depthOffset": -0.8,
        "referenceCrop": true,
        "name": "Etsuko Horie",
        "bio": "Director, Investment Strategy & Corporate Development - SEGA",
        "learnMoreUrl": "https://www.linkedin.com/in/etsuko-horie-a274636a/"
      },
      {
        "src": "/assets/insignia/people/attendee-placeholder.png",
        "alt": "Photo placeholder for Michiko Kakiya",
        "layout": [
          1140,
          650,
          160,
          185
        ],
        "mobileLayout": [
          -350,
          120,
          210,
          243
        ],
        "depthOffset": 0,
        "referenceCrop": true,
        "name": "Michiko Kakiya",
        "bio": "Founding Partner - EnFi",
        "learnMoreUrl": "https://www.linkedin.com/in/michikokakiya/"
      }
    ]
  }
];

export const mobilePlacements: readonly Placement[] = [
  [35,180,340,360], [1040,190,340,360], [570,240,155,177],
  [60,560,340,360], [1030,560,340,360], [570,670,175,200],
  [420,550,210,240], [760,510,210,240], [680,140,160,180],
];

export const originalGalleryMotionProfile: GalleryMotionProfile = {
  scrollViewports: galleryConfig.scrollViewports,
  scrub: galleryConfig.scrub,
  stops: galleryConfig.stops,
  exits: galleryConfig.exits,
  travelEase: 'power1.inOut',
};

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

// Safe default slots for newly uploaded photos; no CMS coordinates are required.
export function automaticGalleryPlacement(index: number): Placement {
  const slots: readonly Placement[] = [
    [60,100,260,210], [590,70,240,200], [1110,100,260,210],
    [30,340,240,210], [1170,340,240,210],
    [50,590,260,210], [1120,590,260,210],
    [350,680,220,190], [650,680,220,190], [910,680,220,190],
  ];
  return slots[index % slots.length];
}
