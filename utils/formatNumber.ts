/**
 * Formats numbers with thousands separators
 */
export function formatWithCommas(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return '0';

  // Simple formatting with thousands separators
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(num);
}

/**
 * Formats large numbers with compact notation (K, M, B, T)
 */
export function formatCompact(value: string | number, decimals = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return '0';

  // For very large numbers, use compact notation
  if (num >= 1e15) return `${(num / 1e15).toFixed(decimals)}Q`; // Quadrillion
  if (num >= 1e12) return `${(num / 1e12).toFixed(decimals)}T`; // Trillion
  if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`; // Billion
  if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`; // Million
  if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`; // Thousand

  // For smaller numbers, show with appropriate decimal places
  if (num >= 100) return num.toFixed(0);
  if (num >= 1) return num.toFixed(1);
  return num.toFixed(decimals);
}

/**
 * Adaptive OCTAA formatting - uses compact notation for large amounts
 */
export function formatOCTAA(
  value: string | number,
  showUnit = true,
  adaptive = true
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return showUnit ? '0 OCTAA' : '0';

  let formatted: string;

  if (adaptive && num >= 1000) {
    // Use compact notation for large numbers
    formatted = formatCompact(num);
  } else {
    // Use full formatting for smaller numbers
    formatted = formatWithCommas(num);
  }

  return showUnit ? `${formatted} OCTAA` : formatted;
}

/**
 * Smart number formatting based on context and available space
 */
export function formatSmart(value: string | number, maxLength = 10): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return '0';

  // Try different formats and pick the one that fits
  const formats = [
    formatCompact(num, 0),
    formatCompact(num, 1),
    formatCompact(num, 2),
    formatWithCommas(num),
  ];

  // Return the first format that fits within maxLength
  for (const format of formats) {
    if (format.length <= maxLength) {
      return format;
    }
  }

  // If nothing fits, use the most compact format
  return formats[0] || '0';
}
