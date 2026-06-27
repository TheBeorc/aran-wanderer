import type { IconType } from "./poi";

/**
 * Editable registry mapping every POI `icon_type` to a single cohesive cartoon SVG.
 *
 * To add or swap an icon:
 *  1. Add a new entry below returning JSX for a 32x32 viewBox SVG.
 *  2. If you add a new category, extend the IconType union in src/lib/poi.ts.
 *  3. Unknown / missing icon_type values fall back to `natural_feature`.
 */

import type { ReactElement, ReactNode } from "react";

type IconRenderer = () => ReactElement;

// Shared illustrated style: rounded strokes, warm earth + sea palette, soft fill.
const STROKE = "#3b2a1f";
const STONE = "#d9c9a8";
const STONE_DARK = "#b8a47d";
const SEA = "#5fb0c9";
const ROOF = "#8a4a3a";
const GOLD = "#e8b04a";
const GREEN = "#6ea24a";

const wrap = (children: ReactNode): ReactElement => (
  <svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true">
    {children}
  </svg>
);

const ICON_RENDERERS: Record<IconType, IconRenderer> = {
  holy_well: () =>
    wrap(
      <g stroke={STROKE} strokeWidth="1.4" strokeLinejoin="round" fill="none">
        <ellipse cx="16" cy="22" rx="9" ry="3" fill={STONE} />
        <path d="M8 22 L9 12 H23 L24 22" fill={STONE_DARK} />
        <ellipse cx="16" cy="12" rx="7" ry="2.2" fill={SEA} />
        <path d="M16 4 V10 M13 6 L16 10 L19 6" strokeLinecap="round" />
      </g>,
    ),
  church_monastic: () =>
    wrap(
      <g stroke={STROKE} strokeWidth="1.4" strokeLinejoin="round">
        <rect x="9" y="14" width="14" height="13" fill={STONE} />
        <path d="M9 14 L16 7 L23 14 Z" fill={ROOF} />
        <path d="M16 3 V8 M14 5 H18" strokeLinecap="round" fill="none" />
        <rect x="14" y="19" width="4" height="8" fill={ROOF} />
      </g>,
    ),
  fort_dun: () =>
    wrap(
      <g stroke={STROKE} strokeWidth="1.4" strokeLinejoin="round" fill={STONE}>
        <path d="M5 26 H27 V14 H24 V10 H20 V14 H17 V10 H13 V14 H10 V10 H6 V14 H5 Z" />
        <path d="M5 20 H27" fill="none" />
      </g>,
    ),
  castle_ruin: () =>
    wrap(
      <g stroke={STROKE} strokeWidth="1.4" strokeLinejoin="round" fill={STONE_DARK}>
        <path d="M6 27 H26 V12 H22 V8 H18 V12 H14 V8 H10 V12 H6 Z" />
        <path d="M14 27 V20 H18 V27" fill={STONE} />
        <path d="M22 18 L26 16" fill="none" stroke={STROKE} />
      </g>,
    ),
  beach_strand: () =>
    wrap(
      <g stroke={STROKE} strokeWidth="1.4" strokeLinecap="round" fill="none">
        <path d="M3 22 H29" stroke={GOLD} strokeWidth="3" />
        <path d="M3 26 Q8 24 13 26 T23 26 T29 26" stroke={SEA} strokeWidth="1.6" />
        <circle cx="22" cy="10" r="4" fill={GOLD} stroke={STROKE} />
        <path d="M22 4 V2 M28 10 H30 M26 6 L27 5 M26 14 L27 15" />
      </g>,
    ),
  cliff_coast: () =>
    wrap(
      <g stroke={STROKE} strokeWidth="1.4" strokeLinejoin="round">
        <path d="M3 6 H17 L19 12 L17 18 L20 24 H3 Z" fill={STONE} />
        <path d="M17 18 L20 24 H29 V26 H3 V24" fill={SEA} />
        <path d="M22 22 Q24 20 26 22 T30 22" fill="none" stroke="#fff" strokeWidth="1" />
      </g>,
    ),
  village_settlement: () =>
    wrap(
      <g stroke={STROKE} strokeWidth="1.4" strokeLinejoin="round">
        <rect x="4" y="16" width="10" height="11" fill={STONE} />
        <path d="M3 16 L9 10 L15 16 Z" fill={ROOF} />
        <rect x="16" y="13" width="12" height="14" fill={STONE_DARK} />
        <path d="M15 13 L22 7 L29 13 Z" fill={ROOF} />
        <rect x="20" y="19" width="4" height="8" fill={ROOF} />
      </g>,
    ),
  pub_amenity: () =>
    wrap(
      <g stroke={STROKE} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
        {/* frothy head */}
        <path
          d="M10 10 Q9 7 12 7 Q13 5 16 6 Q19 5 20 7 Q23 7 22 10 Z"
          fill="#fffaf0"
        />
        {/* glass body with beer */}
        <path d="M10 10 H22 L21 26 H11 Z" fill={GOLD} />
        {/* handle */}
        <path d="M22 13 Q26 14 26 18 Q26 22 22 23" fill="none" />
        {/* glass outline + bubbles */}
        <path d="M10 10 H22 L21 26 H11 Z" fill="none" />
        <circle cx="14" cy="16" r="0.9" fill="#fffaf0" stroke="none" />
        <circle cx="17" cy="20" r="0.7" fill="#fffaf0" stroke="none" />
      </g>,
    ),
  natural_feature: () =>
    wrap(
      <g stroke={STROKE} strokeWidth="1.4" strokeLinejoin="round">
        <path d="M4 24 L11 12 L16 19 L20 14 L28 24 Z" fill={GREEN} />
        <path d="M11 12 L13 14 M20 14 L22 17" stroke="#fff" />
      </g>,
    ),
  airport: () =>
    wrap(
      <g stroke={STROKE} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
        {/* plane body */}
        <path
          d="M4 18 L14 16 L20 9 Q22 7 23 9 L19 17 L26 19 L25 21 L18 20 L15 25 L13 24 L14 19 L8 20 Z"
          fill={STONE}
        />
      </g>,
    ),
};

export function renderPoiIcon(icon: IconType): ReactElement {
  const renderer = ICON_RENDERERS[icon] ?? ICON_RENDERERS.natural_feature;
  return renderer();
}

export const POI_LABELS: Record<IconType, string> = {
  holy_well: "Holy well",
  church_monastic: "Church / monastic site",
  fort_dun: "Stone fort (dún)",
  castle_ruin: "Castle / ruin",
  beach_strand: "Beach / strand",
  cliff_coast: "Cliffs / coast",
  village_settlement: "Village",
  pub_amenity: "Pub / amenity",
  natural_feature: "Natural feature",
  airport: "Airport",
};
