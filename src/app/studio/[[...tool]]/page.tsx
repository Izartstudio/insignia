import { NextStudio } from 'next-sanity/studio';
import config from '../../../../sanity.config';

export const dynamic = 'force-static';
export { metadata, viewport } from 'next-sanity/studio';

export default function StudioPage() {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    return <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <p>Set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET to connect the gallery Studio.</p>
    </main>;
  }
  return <div data-sanity-studio><NextStudio config={config} /></div>;
}
