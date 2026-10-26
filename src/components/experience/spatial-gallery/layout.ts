import { galleryConfig, mobilePlacements, type GalleryPhoto } from '@/content/spatial-gallery';

/** Map the reference rectangle at its own depth, preserving the source aspect ratio. */
export function mapPhoto(photo: GalleryPhoto, index: number, width: number, height: number, imageAspect: number, mobile = width <= 1024) {
  const [x, y, w, h] = mobile ? (photo.mobileLayout ?? mobilePlacements[index % mobilePlacements.length]) : photo.layout;
  const distance = galleryConfig.distance - photo.depthOffset;
  const visibleHeight = 2 * distance * Math.tan(galleryConfig.fov * Math.PI / 360);
  const visibleWidth = visibleHeight * width / height;
  const planeWidth = w / 1440 * visibleWidth;
  // A portrait viewport needs larger photos; use width, never anisotropic stretching.
  const planeHeight = photo.referenceCrop && !mobile ? h / 900 * visibleHeight : planeWidth / imageAspect;
  const planeAspect = planeWidth / planeHeight;
  const repeatX = Math.min(1, planeAspect / imageAspect);
  const repeatY = Math.min(1, imageAspect / planeAspect);
  return {
    repeat: [repeatX, repeatY] as const,
    position: [(x + w / 2) / 1440 * visibleWidth - visibleWidth / 2,
      (.5 - y / 900) * visibleHeight - planeHeight / 2, photo.depthOffset] as [number, number, number],
    scale: [planeWidth, planeHeight, 1] as [number, number, number],
  };
}

/** Resolve original-photo collisions before fitting the composition to the viewport.
 * Flatten per-photo depth so panning cannot reintroduce overlap through parallax.
 */
export function fitPhotoLayouts(layouts: ReturnType<typeof mapPhoto>[], width: number, height: number) {
  if (!layouts.length) return;
  if (width <= 1024) { fitMobilePhotoLayouts(layouts, width, height); return; }
  const visibleHeight = 2 * galleryConfig.distance * Math.tan(galleryConfig.fov * Math.PI / 360);
  const visibleWidth = visibleHeight * width / height;
  const gap = Math.max(8, Math.min(20, width * .012));
  const boxes = layouts.map(layout => {
    const factor = galleryConfig.distance / (galleryConfig.distance - layout.position[2]);
    return { x: layout.position[0] * factor / visibleWidth, y: layout.position[1] * factor / visibleHeight,
      w: layout.scale[0] * factor / visibleWidth, h: layout.scale[1] * factor / visibleHeight };
  });
  let unresolved = false;
  for (let pass = 0; pass < 160; pass++) {
    unresolved = false;
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const dx = (a.w + b.w) / 2 + gap / width - Math.abs(a.x - b.x);
      const dy = (a.h + b.h) / 2 + gap / height - Math.abs(a.y - b.y);
      if (dx <= 1e-7 || dy <= 1e-7) continue;
      unresolved = true;
      if (dx * width < dy * height) {
        const shift = (dx / 2 + 1e-6) * (a.x < b.x ? -1 : 1);
        a.x += shift; b.x -= shift;
      } else {
        const shift = (dy / 2 + 1e-6) * (a.y < b.y ? -1 : 1);
        a.y += shift; b.y -= shift;
      }
    }
    if (!unresolved) break;
  }
  // Pathological CMS placements (including identical coordinates) still get safe slots.
  if (unresolved) {
    const columns = Math.ceil(Math.sqrt(boxes.length * width / height));
    const cellW = Math.max(...boxes.map(b => b.w)) + gap / width;
    const cellH = Math.max(...boxes.map(b => b.h)) + gap / height;
    boxes.forEach((b, i) => { b.x = (i % columns) * cellW; b.y = -Math.floor(i / columns) * cellH; });
  }
  const left = Math.min(...boxes.map(b => b.x - b.w / 2));
  const right = Math.max(...boxes.map(b => b.x + b.w / 2));
  const bottom = Math.min(...boxes.map(b => b.y - b.h / 2));
  const top = Math.max(...boxes.map(b => b.y + b.h / 2));
  const mobile = width <= 1024;
  const topInset = mobile ? Math.max(.10, 64 / height) : .08;
  const bottomInset = mobile ? Math.max(.18, 104 / height) : .08;
  const availableHeight = Math.max(.2, 1 - topInset - bottomInset);
  const centerY = (bottomInset - topInset) / 2;
  const scale = Math.min(mobile ? 1.35 : 1, (mobile ? .94 : .90) / (right - left), availableHeight / (top - bottom));
  boxes.forEach((b, i) => {
    const layout = layouts[i];
    layout.position = [(b.x - (left + right) / 2) * scale * visibleWidth,
      ((b.y - (bottom + top) / 2) * scale + centerY) * visibleHeight, 0];
    layout.scale = [b.w * scale * visibleWidth, b.h * scale * visibleHeight, 1];
  });
}

/** Larger touch photos occupy clear bands above/below the glass heading. */
function fitMobilePhotoLayouts(layouts: ReturnType<typeof mapPhoto>[], width: number, height: number) {
  const units = 2 * galleryConfig.distance * Math.tan(galleryConfig.fov * Math.PI / 360) / height;
  const gap = width < 400 ? 10 : 14;
  const margin = width < 400 ? 12 : 16;
  const compact = height < 500;
  const top = compact ? 48 : 68;
  const bottom = height - (compact ? 88 : 144);
  const halfClear = compact ? 40 : Math.max(60, Math.min(100, height * .10));
  const upperEnd = height / 2 - halfClear - 12;
  const lowerStart = height / 2 + halfClear + 12;
  const sorted = layouts.slice().sort((a, b) => b.position[1] - a.position[1]);
  let topCount = Math.ceil(layouts.length * .65);
  if (bottom - lowerStart < 48) topCount = layouts.length;
  if (upperEnd - top < 48 && bottom - lowerStart >= 48) topCount = 0;
  const place = (photos: typeof layouts, start: number, end: number) => {
    if (!photos.length) return;
    const areaWidth = width - margin * 2;
    const areaHeight = Math.max(8, end - start);
    const maxSide = width <= 600 ? 160 : 240;
    let bestColumns = 1, bestScore = -1;
    const measure = (columns: number) => {
      const rows = Math.ceil(photos.length / columns);
      const cellWidth = (areaWidth - gap * (columns - 1)) / columns;
      const cellHeight = (areaHeight - gap * (rows - 1)) / rows;
      const sizes = photos.map(photo => {
        const aspect = photo.scale[0] / photo.scale[1];
        const h = Math.max(1, Math.min(cellHeight, cellWidth / aspect, maxSide, maxSide / aspect));
        return { w: h * aspect, h };
      });
      return { rows, cellWidth, cellHeight, sizes };
    };
    for (let columns = 1; columns <= Math.min(5, photos.length); columns++) {
      const candidate = measure(columns);
      const score = candidate.sizes.reduce((sum, size) => sum + size.w * size.h, 0);
      if (candidate.cellHeight > 0 && score > bestScore) { bestScore = score; bestColumns = columns; }
    }
    // Retain each band's left-to-right order while opening space around the heading.
    photos.sort((a, b) => a.position[0] - b.position[0]);
    const { cellWidth, cellHeight, sizes } = measure(bestColumns);
    photos.forEach((photo, index) => {
      const row = Math.floor(index / bestColumns), col = index % bestColumns;
      const rowCount = Math.min(bestColumns, photos.length - row * bestColumns);
      const rowWidth = rowCount * cellWidth + (rowCount - 1) * gap;
      const x = margin + (areaWidth - rowWidth) / 2 + col * (cellWidth + gap) + cellWidth / 2;
      const y = start + row * (cellHeight + gap) + cellHeight / 2;
      photo.position = [(x - width / 2) * units, (height / 2 - y) * units, 0];
      photo.scale = [sizes[index].w * units, sizes[index].h * units, 1];
    });
  };
  place(sorted.slice(0, topCount), top, upperEnd);
  place(sorted.slice(topCount), lowerStart, bottom);
}
