const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://insignia-lumikai.vercel.app';
const parsedUrl = new URL(configuredUrl);
if (!['http:', 'https:'].includes(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password) {
  throw new Error('NEXT_PUBLIC_SITE_URL must be a public HTTP(S) website URL.');
}

export const siteUrl = parsedUrl.origin;
export const siteTitle = 'Insignia — Interactive Media & Gaming Summit | Lumikai';
export const siteDescription = 'Insignia by Lumikai brings together leaders, founders, industry experts and investors for India’s signature interactive media event and annual LP summit.';
export const indexableDeployment = process.env.VERCEL_ENV !== 'preview' && process.env.VERCEL_ENV !== 'development';
