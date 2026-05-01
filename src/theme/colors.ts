/**
 * Rural Connect — Colour Palette
 * Source: Minimal Colors by Dumma Branding
 *
 *  #A0D2EB  Sky blue      — light backgrounds, accents
 *  #E5EAF5  Lavender white — card surfaces, inputs
 *  #D0BDF4  Soft purple   — secondary highlights
 *  #8458B3  Deep purple   — primary (headers, buttons, active states)
 *  #494D5F  Dark slate    — text, dark backgrounds
 */

export const C = {
  // ── Core palette ──────────────────────────────────────────────────────────
  primary:    '#8458B3',   // deep purple  — buttons, headers, active tab
  secondary:  '#D0BDF4',   // soft purple  — accents, borders, highlights
  accent:     '#A0D2EB',   // sky blue     — info, user-location dot
  surface:    '#E5EAF5',   // lavender white — card bg, input bg
  dark:       '#494D5F',   // dark slate   — text, dark headers

  // ── Derived / utility ─────────────────────────────────────────────────────
  bg:         '#F0EEF8',   // very light purple-tinted page background
  cardBg:     '#FFFFFF',   // pure white cards
  border:     '#D0BDF4',   // soft purple borders
  textPrimary:'#494D5F',   // dark slate for headings
  textSecond: '#7B7F96',   // muted slate for subtitles
  textMuted:  '#A9ADBE',   // light slate for hints/timestamps
  white:      '#FFFFFF',

  // ── Status colours (kept distinct for accessibility) ──────────────────────
  success:    '#4CAF50',   // completed  — green
  warning:    '#FFC107',   // in progress — amber
  danger:     '#E05C7A',   // not visited / error — rose-red (fits palette)
  info:       '#A0D2EB',   // sky blue

  // ── Role colours ──────────────────────────────────────────────────────────
  volunteer:  '#8458B3',   // deep purple (same as primary)
  userRole:   '#A0D2EB',   // sky blue

  // ── Transparent tints ─────────────────────────────────────────────────────
  primaryLight:   '#8458B322',
  secondaryLight: '#D0BDF433',
  accentLight:    '#A0D2EB33',
  successLight:   '#4CAF5022',
  warningLight:   '#FFC10722',
  dangerLight:    '#E05C7A22',
};
