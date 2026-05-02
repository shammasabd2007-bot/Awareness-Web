/**
 * Rural Connect — Colour System
 *
 * Light palette: Minimal Colors by Dumma Branding
 * Dark palette:  Derived from the same hues, darkened
 *
 * Usage:
 *   import { C } from '../theme/colors';          // static light (backward compat)
 *   import { useTheme } from '../theme/colors';   // reactive hook
 *   const T = useTheme();                          // T.bg, T.primary, etc.
 */

import { useThemeStore } from '../store/themeStore';

// ─── Light palette ────────────────────────────────────────────────────────────
const LIGHT = {
  primary:      '#8458B3',
  secondary:    '#D0BDF4',
  accent:       '#A0D2EB',
  surface:      '#E5EAF5',
  dark:         '#494D5F',
  bg:           '#F0EEF8',
  cardBg:       '#FFFFFF',
  border:       '#D0BDF4',
  textPrimary:  '#494D5F',
  textSecond:   '#7B7F96',
  textMuted:    '#A9ADBE',
  white:        '#FFFFFF',
  success:      '#4CAF50',
  warning:      '#FFC107',
  danger:       '#E05C7A',
  info:         '#A0D2EB',
  volunteer:    '#8458B3',
  userRole:     '#A0D2EB',
  primaryLight: '#8458B322',
  secondaryLight:'#D0BDF433',
  accentLight:  '#A0D2EB33',
  successLight: '#4CAF5022',
  warningLight: '#FFC10722',
  dangerLight:  '#E05C7A22',
  // ── Header-specific ──
  headerBg:     '#8458B3',
  headerText:   '#FFFFFF',
  headerSub:    '#D0BDF4',
  // ── Tab bar ──
  tabBg:        '#E5EAF5',
  tabBorder:    '#D0BDF4',
  tabActive:    '#8458B3',
  tabInactive:  '#A9ADBE',
  // ── Navigation header ──
  navHeaderBg:  '#8458B3',
  navHeaderText:'#FFFFFF',
};

// ─── Dark palette ─────────────────────────────────────────────────────────────
const DARK: typeof LIGHT = {
  primary:      '#B48AE0',
  secondary:    '#7E5FB8',
  accent:       '#6BB8D9',
  surface:      '#2A2D3A',
  dark:         '#1A1C26',
  bg:           '#1E2030',
  cardBg:       '#262838',
  border:       '#3D3F52',
  textPrimary:  '#E5E7F0',
  textSecond:   '#A0A3B8',
  textMuted:    '#6B6F85',
  white:        '#FFFFFF',
  success:      '#66BB6A',
  warning:      '#FFD54F',
  danger:       '#EF7B97',
  info:         '#6BB8D9',
  volunteer:    '#B48AE0',
  userRole:     '#6BB8D9',
  primaryLight: '#B48AE033',
  secondaryLight:'#7E5FB833',
  accentLight:  '#6BB8D933',
  successLight: '#66BB6A22',
  warningLight: '#FFD54F22',
  dangerLight:  '#EF7B9722',
  headerBg:     '#262838',
  headerText:   '#E5E7F0',
  headerSub:    '#A0A3B8',
  tabBg:        '#1E2030',
  tabBorder:    '#3D3F52',
  tabActive:    '#B48AE0',
  tabInactive:  '#6B6F85',
  navHeaderBg:  '#262838',
  navHeaderText:'#E5E7F0',
};

// ─── Static export (backward compat — always light) ───────────────────────────
export const C = LIGHT;

// ─── Reactive hook ────────────────────────────────────────────────────────────
export const useTheme = (): typeof LIGHT => {
  const isDark = useThemeStore((s) => s.isDark);
  return isDark ? DARK : LIGHT;
};
