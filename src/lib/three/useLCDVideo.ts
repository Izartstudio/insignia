"use client";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { ClampToEdgeWrapping, LinearFilter, SRGBColorSpace, TextureLoader, VideoTexture, type Texture } from "three";
import { lcdConfig } from "./lcd-config";
import { trackEvent } from '@/lib/analytics';

export type LCDVideoResource = { video: HTMLVideoElement; texture: VideoTexture; poster: Texture };
export type VideoStatus = "loading" | "playing" | "paused" | "blocked" | "error";

export function useLCDVideo(heroRef: RefObject<HTMLElement | null>) {
  const current = useRef<LCDVideoResource | null>(null);
  const [resource, setResource] = useState<LCDVideoResource | null>(null);
  const [hasFrame, setHasFrame] = useState(false);
  const [status, setStatus] = useState<VideoStatus>("loading");

  useEffect(() => {
    let disposed = false;
    let heroVisible = false;
    let reportedStart = false;
    const reportedProgress = new Set<number>();
    const reportProgress = () => {
      if (!shouldPlay() || !Number.isFinite(video.duration) || video.duration <= 0) return;
      const percent = video.currentTime / video.duration * 100;
      [10, 25, 50, 75, 90].forEach(milestone => {
        if (percent >= milestone && !reportedProgress.has(milestone)) {
          reportedProgress.add(milestone);
          trackEvent('video_progress', { video_title: 'Insignia Showreel', video_percent: milestone, video_duration: Math.round(video.duration), video_provider: 'self_hosted' });
        }
      });
    };
    const shouldPlay = () => heroVisible && !document.hidden;
    const video = document.createElement("video");
    video.autoplay = true;
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("muted", "");
    video.setAttribute("autoplay", "");
    // Keep the media element attached for WebKit's inline playback lifecycle.
    video.style.cssText = "position:fixed;bottom:0;left:0;width:1px;height:1px;opacity:0.001;pointer-events:none";
    video.setAttribute("aria-hidden", "true");
    video.tabIndex = -1;
    document.body.appendChild(video);
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    const texture = new VideoTexture(video);
    const poster = new TextureLoader().load(lcdConfig.posterUrl, () => {
      if (!disposed) owned.poster.needsUpdate = true;
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
    setStatus("loading");
    const ready = () => { if (!disposed) setHasFrame(true); };
    const playing = () => {
      if (disposed) return;
      if (!shouldPlay()) { video.pause(); return; }
      if (!reportedStart) {
        reportedStart = true;
        trackEvent('video_start', { video_title: 'Insignia Showreel', video_provider: 'self_hosted' });
      }
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
    video.addEventListener("loadeddata", ready);
    video.addEventListener('timeupdate', reportProgress);
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
    // Retry inside the user's gesture when browser policy blocks initial autoplay.
    document.addEventListener("pointerdown", syncPlayback, { passive: true });
    document.addEventListener("touchend", syncPlayback, { passive: true });
    document.addEventListener("keydown", syncPlayback);
    video.addEventListener("canplay", syncPlayback);
    return () => {
      disposed = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      document.removeEventListener("pointerdown", syncPlayback);
      document.removeEventListener("touchend", syncPlayback);
      document.removeEventListener("keydown", syncPlayback);
      video.removeEventListener("canplay", syncPlayback);
      video.removeEventListener("loadeddata", ready);
      video.removeEventListener('timeupdate', reportProgress);
      video.removeEventListener("playing", playing);
      video.removeEventListener("error", failed);
      video.removeEventListener("pause", paused);
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.remove();
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

  return { resource, hasFrame, status, resume };
}
