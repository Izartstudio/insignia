const rays = [
  { angle: -90, stage: 1 },
  { angle: -60, stage: 1 },
  { angle: -30, stage: 1 },
  { angle: 0, stage: 1 },
  { angle: 30, stage: 1 },
  { angle: 60, stage: 2 },
  { angle: 90, stage: 2 },
  { angle: 120, stage: 2 },
  { angle: 150, stage: 3 },
  { angle: 180, stage: 3 },
  { angle: 210, stage: 3 },
  { angle: 240, stage: 3 },
] as const;

export function SunGraphic() {
  return (
    <div className="introduction-sun" aria-hidden="true">
      <div className="sun-core" />
      <div className="sun-rays">
        {rays.map(({ angle, stage }) => (
          <span
            className="sun-ray"
            data-ray-stage={stage}
            key={angle}
            style={{ "--ray-angle": `${angle}deg` } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
