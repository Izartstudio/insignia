const radians = (degrees: number) => degrees * Math.PI / 180;

export const sceneConfig = {
  modelUrl: "/models/camcorder-realism-v2.glb",
  dpr: [1, 2] as [number, number],
  model: {
    normalizedRadius: 1,
    orientation: [0, radians(200), 0] as [number, number, number],
  },
  hero: {
    rotation: { initialY: radians(10), finalY: 0 },
    scroll: { start: "top top", distanceInViewports: 1.8, scrub: 0.65, anticipatePin: 1 },
    timeline: {
      rotationEnd: 0.2,
      zoomStart: 0.24,
      fullscreenStart: 0.85,
      fullscreenThreshold: 0.985,
      indicatorFadeStart: 0.88,
    },
  },
  camera: {
    fov: 28,
    viewDirection: [0, 0, 1] as [number, number, number],
    target: [0, 0.08, 0] as [number, number, number],
    up: [0, 1, 0] as [number, number, number],
    framingPadding: 1.08,
    distanceInRadii: 3.6,
    nearRadiusRatio: 0.01,
    farRadiusPadding: 4,
    fullscreenCoverage: 1.01,
    approachDistanceScale: 1.8,
    debug: {
      enabled: false,
      pathColor: "#00ffff",
      targetColor: "#fed201",
      endColor: "#ff00ff",
    },
  },
  heading: {
    revealThreshold: 0.985,
    hideThreshold: 0.95,
    offsetY: 35,
    revealDuration: 1.2,
    hideDuration: 0.35,
    revealEase: "power3.out",
    hideEase: "power2.out",
  },
  lighting: {
    hemisphere: { sky: "#ffffff", ground: "#8d8b85", intensity: 2 },
    key: { position: [8, 12, 8] as [number, number, number], intensity: 3 },
    fill: { position: [-8, 4, -6] as [number, number, number], intensity: 1.5 },
  },
} as const;
