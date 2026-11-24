/**
 * Single source of truth for Krudex Global brand assets.
 *
 * Every logo on the site (navbar, footer, hero fallback, social card,
 * structured data) must come from this module or from <BrandLogo/>.
 * `npm run check:brand` fails the build if a logo file is referenced anywhere
 * else, so a rebrand only ever touches this folder.
 *
 * Source artwork: design/brand-archive/krudex-bg-gold.png (gold KK logo),
 * recolored to royal blue #2C65DD; cream parts made pure white.
 */
export const BRAND = {
  name: 'Krudex Global',
  /** Krudex wordmark with signature blue X, trimmed to its edges. */
  logoSrc: '/brand/krudex-global-logo-royal.png',
  logoWidth: 493,
  logoHeight: 140,
  /** Krudex mark, 512×512 transparent, for structured data. */
  markSmallSrc: '/brand/krudex-global-mark-royal-512.png',
  logoAlt: 'Krudex Global',
} as const;
