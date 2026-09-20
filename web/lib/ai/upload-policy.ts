// Shared display policy; enforcement happens on the server before any AI allowance is reserved.
export const uploadPolicy = {
  maxPdfPages: 5,
  maxImageSide: 8192,
  maxImagePixels: 20_000_000,
  inspectionTimeoutMs: 3000,
} as const;

export const uploadLimitHint = 'PDF: up to 5 pages. Images: up to 20 megapixels and 8,192 pixels per side.';
