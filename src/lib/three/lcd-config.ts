export const lcdConfig = {
  videoUrl: "/videos/insignia-film.mp4",
  posterUrl: "/videos/insignia-poster.jpg",
  videoAspect: 1920 / 1080,
  // Imported scene coordinates, before the existing centering/normalization wrappers.
  position: [4366.015793876227, 39.94788650070651, 163.30531570081564] as [number, number, number],
  rotation: [-3.0560346726736958, 0.42082953334677725, 3.1284911275409004] as [number, number, number],
  width: 362.2674116025298,
  height: 270.5377278367416,
  normalOffset: 0.75,
  debug: { enabled: false, wireframe: true, outline: true, axes: true, normal: true, uvPattern: true },
} as const;
