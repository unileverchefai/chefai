export const TREND_CODE_MAP = Object.freeze({
  T1: { class: 'borderless-cuisine', name: 'Borderless Cuisine' },
  T2: { class: 'street-food-couture', name: 'Street Food Couture' },
  T3: { class: 'diner-designed', name: 'Diner Designed' },
  T4: { class: 'culinary-roots', name: 'Culinary Roots' },
  TX: { class: 'cross-trend', name: 'Cross-Trend' },
});

const THEME_TO_TREND_CODE = Object.freeze({
  t1: 'T1',
  t2: 'T2',
  t3: 'T3',
  t4: 'T4',
});

export function normalizeTrendCode(input = '') {
  return String(input)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

export function getTrendClassFromTheme(theme = '') {
  const normalizedTheme = String(theme).trim().toLowerCase();
  const trendCode = THEME_TO_TREND_CODE[normalizedTheme];

  if (trendCode && TREND_CODE_MAP[trendCode]) {
    return TREND_CODE_MAP[trendCode].class;
  }

  const fullNameMatch = Object.values(TREND_CODE_MAP).find(
    (trend) => trend.class === normalizedTheme,
  );

  return fullNameMatch?.class || null;
}
