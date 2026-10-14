"use client";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { ClampToEdgeWrapping, LinearFilter, SRGBColorSpace, TextureLoader, VideoTexture, type Texture } from "three";
import { lcdConfig } from "./lcd-config";

export type LCDVideoResource = { video: HTMLVideoElement; texture: VideoTexture; poster: Texture };
export type VideoStatus = "loading" | "playing" | "paused" | "blocked" | "error";

export function useLCDVideo(heroRef: RefObject<HTMLElement | null>) {
  const current = useRef<LCDVideoResource | null>(null);
  const [resource, setResource] = useState<LCDVideoResource | null>(null);
  const [muted, setMuted] = useState(true);
  const [hasFrame, setHasFrame] = useState(false);
  const [status, setStatus] = useState<VideoStatus>("loading");

  useEffect(() => {
    let disposed = false;
    let heroVisible = false;
    const shouldPlay = () => heroVisible && !document.hidden;
    const video = document.createElement("video");
    video.autoplay = false;
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    const texture = new VideoTexture(video);
    const poster = new TextureLoader().load(lcdConfig.posterUrl, () => {
      if (!disposed) setResource({ ...owned });
    });
    for (const map of [texture, poster]) {
      map.colorSpace = SRGBColorSpace;
      map.minFilter = LinearFilter;
      map.magFilter = LinearFilter;
      map.wrapS = map.wrapT = ClampToEdgeWrapping;
      map.generateMipmaps = false;
    }
    const owned = { video, texture, poster };
    current.current = owned;
    setResource(owned);
    setHasFrame(false);
    setMuted(true);
    setStatus("loading");
    const ready = () => { if (!disposed) setHasFrame(true); };
    const playing = () => {
      if (disposed) return;
      if (!shouldPlay()) { video.pause(); return; }
      setHasFrame(true);
      setStatus("playing");
    };
    const failed = () => { if (!disposed) setStatus("error"); };
    const paused = () => { if (!disposed && !video.ended) setStatus(shouldPlay() ? "blocked" : "paused"); };
    const syncPlayback = () => {
      if (disposed) return;
      if (!shouldPlay()) {
        video.pause();
        setStatus("paused");
      } else if (video.paused) {
        void video.play().catch(() => {
          if (!disposed && shouldPlay()) setStatus(video.error ? "error" : "blocked");
        });
      }
    };
    const volumeChanged = () => { if (!disposed) setMuted(video.muted); };
    video.addEventListener("volumechange", volumeChanged);
    video.addEventListener("loadeddata", ready);
    video.addEventListener("playing", playing);
    video.addEventListener("error", failed);
    video.addEventListener("pause", paused);
    video.src = lcdConfig.videoUrl;
    const observer = new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting && entry.intersectionRatio > 0;
      syncPlayback();
    }, { threshold: 0 });
    if (heroRef.current) observer.observe(heroRef.current);
    document.addEventListener("visibilitychange", syncPlayback);
    return () => {
      disposed = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      video.removeEventListener("volumechange", volumeChanged);
      video.removeEventListener("loadeddata", ready);
      video.removeEventListener("playing", playing);
      video.removeEventListener("error", failed);
      video.removeEventListener("pause", paused);
      video.pause();
      video.removeAttribute("src");
      video.load();
      texture.dispose();
      poster.dispose();
      if (current.current === owned) current.current = null;
    };
  }, [heroRef]);

  const resume = useCallback(() => {
    const owned = current.current;
    if (!owned) return;
    if (owned.video.error) owned.video.load();
    void owned.video.play().catch(() => {
      if (current.current === owned) setStatus(owned.video.error ? "error" : "blocked");
    });
  }, []);

  const toggleSound = useCallback(() => {
    const owned = current.current;
    if (!owned) return;
    owned.video.muted = !owned.video.muted;
    setMuted(owned.video.muted);
    if (!owned.video.muted) {
      // Keep play() inside the user gesture so browsers can authorize audio.
      void owned.video.play().catch(() => {
        if (current.current === owned) setStatus(owned.video.error ? "error" : "blocked");
      });
    }
  }, []);

  return { resource, hasFrame, status, resume, muted, toggleSound };
}
