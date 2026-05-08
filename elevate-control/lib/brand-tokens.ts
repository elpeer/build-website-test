export interface BrandTokens {
  fonts: { headings: string; body: string };
  colors: { primary: string; secondary: string; accent: string; neutral: string };
}

export const DEFAULT_BRAND_TOKENS: BrandTokens = {
  fonts:  { headings: '', body: '' },
  colors: { primary: '#1f2937', secondary: '#64748b', accent: '#f59e0b', neutral: '#f1f5f9' },
};
