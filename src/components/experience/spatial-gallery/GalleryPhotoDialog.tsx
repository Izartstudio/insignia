"use client";

import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GalleryState } from '@/content/spatial-gallery';
import type { GalleryCopy } from '@/sanity/galleryContent';

export type GallerySelection = { worldId: string; photoIndex: number };
export function GalleryPhotoDialog({ selection, onClose, onCloseStart, states, copy }: { selection: GallerySelection; onClose: () => void; onCloseStart: () => void; states: GalleryState[]; copy: GalleryCopy }) {
  const entries = states.flatMap(world => world.photos.map((photo, photoIndex) => ({ world, photo, photoIndex })));
  const [index, setIndex] = useState(() => Math.max(0, entries.findIndex(entry => entry.world.id === selection.worldId && entry.photoIndex === selection.photoIndex)));
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  const openingAnimation = useRef<Animation | null>(null);
  const closing = useRef(false);
  const request = useRef(0);
  const targetIndex = useRef(index);
  const outsidePress = useRef(false);
  const { world, photo } = entries[index];
  const duration = (ms: number) => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms;
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    request.current++;
    animation.current?.cancel();
    const opacity = getComputedStyle(dialog.current!).opacity;
    openingAnimation.current?.cancel();
    dialog.current!.dataset.closing = 'true';
    document.body.classList.add('gallery-photo-closing');
    onCloseStart();
    animation.current = dialog.current!.animate([{ opacity }, { opacity: 0 }], { duration: duration(420), easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'forwards' });
    animation.current.onfinish = () => {
      // Persist the faded state before React cleanup cancels the animation.
      // Otherwise removing its fill can expose the full-opacity dialog for a frame.
      const node = dialog.current;
      if (node) {
        node.style.opacity = '0';
        node.close();
      }
      onClose();
    };
  };
  const step = async (direction: number) => {
    if (closing.current) return;
    const token = ++request.current;
    const next = (targetIndex.current + direction + entries.length) % entries.length;
    targetIndex.current = next;
    // Decode before replacing the current photo, preventing blank frames on mobile.
    const image = new Image();
    image.src = entries[next].photo.src;
    try { await image.decode(); } catch { return; }
    if (token !== request.current || closing.current) return;
    animation.current?.cancel();
    const fade = content.current!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: duration(140), easing: 'ease-out', fill: 'forwards' });
    animation.current = fade;
    fade.onfinish = () => {
      if (token !== request.current || closing.current) return;
      setIndex(next);
    };
  };

  useLayoutEffect(() => {
    animation.current?.cancel();
    animation.current = content.current!.animate([{ opacity: 0 }, { opacity: 1 }], { duration: duration(260), easing: 'ease-out' });
  }, [index]);

  useLayoutEffect(() => {
    const node = dialog.current!;
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('gallery-photo-open');
    node.style.opacity = '';
    node.showModal();
    // Focus the dialog initially; Tab reveals the close button's keyboard focus ring.
    node.focus({ preventScroll: true });
    const opening = node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: duration(280), easing: 'ease-out' });
    openingAnimation.current = opening;
    return () => {
      request.current++;
      // Remove the top layer before releasing animation styles or page locks.
      node.style.opacity = '0';
      node.close();
      animation.current?.cancel();
      opening.cancel();
      document.body.classList.remove('gallery-photo-open', 'gallery-photo-closing');
      document.body.style.overflow = overflow;
      document.documentElement.style.overflow = rootOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(<dialog ref={dialog} className="gallery-photo-dialog" tabIndex={-1} data-lenis-prevent aria-labelledby="gallery-dialog-title" aria-describedby="gallery-dialog-description"
    onPointerDown={event => { outsidePress.current = event.target === event.currentTarget; }}
    onClick={event => { if (outsidePress.current && event.target === event.currentTarget) close(); outsidePress.current = false; }}
    onCancel={event => { event.preventDefault(); close(); }}
    onKeyDown={event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); step(event.key === 'ArrowLeft' ? -1 : 1);
      }
    }}>
    <button type="button" className="gallery-dialog-close" aria-label="Close photo details" onClick={close}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
    <h2 id="gallery-dialog-title">{copy.dialogTitle}</h2>
    <div ref={content} className="gallery-dialog-content">
      <p className="gallery-dialog-category">{world.category}</p>
      <h3 className="gallery-dialog-name">{photo.name || 'Lorem Ipsum'}</h3>
      <img className="gallery-dialog-image" src={photo.src} alt={photo.alt} />
      <div className="gallery-dialog-bio">
        <p id="gallery-dialog-description">{photo.bio || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}</p>
        <a className="gallery-dialog-link" href={photo.learnMoreUrl || 'https://example.com'} target="_blank" rel="noopener noreferrer">{copy.learnMoreLabel} <span aria-hidden="true">＋</span></a>
      </div>
    <button type="button" className="gallery-dialog-arrow is-previous" aria-label="Previous photo" onClick={() => step(-1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg></button>
    <button type="button" className="gallery-dialog-arrow is-next" aria-label="Next photo" onClick={() => step(1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg></button>
    </div>
    <span className="sr-only" aria-live="polite">{world.label}, photo {index + 1} of {entries.length}: {photo.alt}</span>
  </dialog>, document.body);
}
