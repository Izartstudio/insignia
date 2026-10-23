import { galleryConfig, type GalleryPhoto, type Placement } from '@/content/spatial-gallery';

type Slot = readonly [name: string, rect: Placement];
// Supplied 1440 × 900 desktop compositions, in CMS photo order.
const compositions: Record<string, readonly Slot[]> = {
  leaders: [
    ['ssrajamouli', [119,245,228,225]], ['rajakoduri', [1185,461,170,170]],
    ['rajeevchandrasekhar', [487,85,195,193]], ['amarjitsinghbatra', [971,158,208,205]],
    ['gauravgandhi', [179,558,225,224]], ['kiranmani', [912,653,202,201]],
  ],
  experts: [
    ['arndbenninghoff', [152,193,193,190]], ['seanhyunilsohn', [77,475,147,146]],
    ['manojkohli', [496,100,190,188]], ['nitishmittersain', [1103,228,196,193]],
    ['taewonyun', [876,121,148,145]], ['seanlee', [324,629,190,189]],
    ['jealipio', [1177,633,147,145]], ['kartikprabhakara', [875,601,180,179]],
  ],
  investors: [
    ['abdullahalorainy', [112,480,206,202]], ['harrimanninen', [223,153,190,189]],
    ['shaileshlakhani', [1078,405,203,200]], ['brettkaruse', [916,678,171,170]],
    ['evanhoff', [520,589,180,178]], ['etsukohorie', [577,84,195,193]],
    ['michikokakiya', [932,136,195,191]],
  ],
};

export function hasDesktopComposition(id: string, count: number) {
  return !!compositions[id] && count <= compositions[id].length;
}

export function mapDesktopReferencePhoto(id: string, photo: GalleryPhoto, index: number, count: number, width: number, height: number, imageAspect: number) {
  if (!hasDesktopComposition(id, count)) return null;
  const slots = compositions[id];
  const name = (photo.name ?? '').toLowerCase().replace(/[^a-z]/g, '');
  const [x,y,w,h] = (slots.find(([key]) => name.includes(key)) ?? slots[index])[1];
  // Uniformly contain the composition: resizing never stretches or shuffles slots.
  const fit = Math.min(width / 1440, height / 900);
  const units = 2 * galleryConfig.distance * Math.tan(galleryConfig.fov * Math.PI / 360) / height;
  const aspect = w / h;
  return {
    position: [(x + w / 2 - 720) * fit * units, (450 - y - h / 2) * fit * units, 0] as [number,number,number],
    scale: [w * fit * units, h * fit * units, 1] as [number,number,number],
    repeat: [Math.min(1, aspect / imageAspect), Math.min(1, imageAspect / aspect)] as const,
  };
}
