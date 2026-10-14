"use client";
import { useId } from "react";
import { navMotion } from "@/config/navigation";
import { navArtwork } from "./navArtwork";

export function NavLabel({ index }: { index: number }) {
  const artwork = navArtwork[index];
  const clip = useId();
  return (
    <svg viewBox="0 0 129.25 56" className="nav-label" aria-hidden="true">
      <defs><clipPath id={clip}><rect x="0" y="18" width="129.25" height="22" /></clipPath></defs>
      {index === 3 && <circle cx="38.63" cy="28" r="2.5" fill="#FED201" />}
      <g clipPath={`url(#${clip})`}>
        <g transform={`translate(${-artwork.origin} 0)`} fill={artwork.fill}>
          {artwork.paths.map((path, i) => <g key={i} className="nav-glyph" style={{ transitionDelay: `${i * navMotion.hoverStagger}s` }}><path d={path} /><path d={path} transform="translate(0 22)" /></g>)}
        </g>
      </g>
    </svg>
  );
}
