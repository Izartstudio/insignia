export const lcdConfig = {
  videoUrl: "/videos/insignia-film.mp4?v=1fdca2753274",
  posterUrl: "/videos/insignia-poster.jpg?v=699488cfb1e7",
  videoAspect: 854 / 480,
  // Imported scene coordinates, before the existing centering/normalization wrappers.
  position: [0.2738608717918396,0.12349204160273075,0.10969862155616283] as [number, number, number],
  rotation: [-2.6969277822065227,-0.000083191368544377,-3.1324718938370437] as [number, number, number],
  width: 0.23677430997435417,
  height: 0.1625031047830497,
  normalOffset: 0.0003,
  debug: { enabled: false, wireframe: true, outline: true, axes: true, normal: true, uvPattern: true },
} as const;
