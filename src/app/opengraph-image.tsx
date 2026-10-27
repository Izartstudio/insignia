import { ImageResponse } from 'next/og';

export const alt = 'Insignia by Lumikai — Interactive Media & Gaming Summit';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#080200', color: '#fff', padding: '80px' }}>
      <div style={{ display: 'flex', color: '#fed201', fontSize: 28, letterSpacing: 8 }}>LUMIKAI PRESENTS</div>
      <div style={{ display: 'flex', fontSize: 132, fontWeight: 700, marginTop: 32 }}>INSIGNIA</div>
      <div style={{ display: 'flex', fontSize: 34, marginTop: 24 }}>Interactive Media &amp; Gaming Summit</div>
    </div>, size,
  );
}
