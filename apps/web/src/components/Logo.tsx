/**
 * Insta Fumigation brand marks.
 *
 * `LogoMark` — the shield + house symbol only, for tight spots (sidebar rail,
 * avatars, favicons). `Logo` — the full lockup with wordmark, for auth pages.
 *
 * Plain <img> is used rather than next/image: these are small static PNGs from
 * /public, and this keeps the components free of framework-version API surface.
 */

/* eslint-disable @next/next/no-img-element */

export const BRAND_NAME = 'Insta Fumigation';
export const BRAND_FULL_NAME = 'Insta Fumigation & Pest Control Services';
export const BRAND_TAGLINE = 'Because We Can!';

export function LogoMark({
  size = 32,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src="/logo-mark.png"
      alt=""
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function Logo({
  width = 180,
  className = '',
}: {
  width?: number;
  className?: string;
}) {
  return (
    <img
      src="/logo.png"
      alt={BRAND_FULL_NAME}
      width={width}
      height={Math.round((width * 981) / 1117)}
      className={`object-contain ${className}`}
      style={{ width, height: 'auto' }}
    />
  );
}

export default Logo;
