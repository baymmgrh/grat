/**
 * Currency formatting utilities for Indonesian Rupiah (IDR)
 */

/**
 * Format number as Indonesian Rupiah currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export const formatRupiah = (
  amount: number | null | undefined,
  options: {
    showSymbol?: boolean;
    showDecimals?: boolean;
    compact?: boolean;
  } = {}
): string => {
  const {
    showSymbol = true,
    showDecimals = false,
    compact = false
  } = options;

  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? 'Rp 0' : '0';
  }

  // For compact format (e.g., 1.2M, 500K)
  if (compact && Math.abs(amount) >= 1000) {
    if (Math.abs(amount) >= 1000000000) {
      const formatted = (amount / 1000000000).toFixed(1);
      return showSymbol ? `Rp ${formatted}M` : `${formatted}M`;
    } else if (Math.abs(amount) >= 1000000) {
      const formatted = (amount / 1000000).toFixed(1);
      return showSymbol ? `Rp ${formatted}Jt` : `${formatted}Jt`;
    } else if (Math.abs(amount) >= 1000) {
      const formatted = (amount / 1000).toFixed(1);
      return showSymbol ? `Rp ${formatted}K` : `${formatted}K`;
    }
  }

  // Standard formatting
  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });

  let formatted = formatter.format(amount);

  // Remove currency symbol if not wanted
  if (!showSymbol) {
    formatted = formatted.replace(/Rp\s?/, '').trim();
  }

  return formatted;
};

/**
 * Format number as Rupiah with thousands separator only (no currency symbol)
 * @param amount - The amount to format
 * @returns Formatted number string
 */
export const formatNumber = (amount: number | null | undefined): string => {
  return formatRupiah(amount, { showSymbol: false, showDecimals: false });
};

/**
 * Format number as compact Rupiah (e.g., 1.2Jt, 500K)
 * @param amount - The amount to format
 * @returns Formatted compact currency string
 */
export const formatRupiahCompact = (amount: number | null | undefined): string => {
  return formatRupiah(amount, { showSymbol: true, compact: true });
};

/**
 * Parse Rupiah string back to number
 * @param rupiahString - Rupiah formatted string
 * @returns Parsed number or null if invalid
 */
export const parseRupiah = (rupiahString: string): number | null => {
  if (!rupiahString || typeof rupiahString !== 'string') {
    return null;
  }

  // Remove currency symbols and spaces
  const cleanString = rupiahString
    .replace(/Rp\s?/g, '')
    .replace(/\./g, '') // Remove thousands separators
    .replace(/,/g, '.') // Convert decimal comma to dot
    .trim();

  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? null : parsed;
};

/**
 * Convert IDR amount to IDR (approximate conversion)
 * @param usdAmount - Amount in IDR
 * @param exchangeRate - IDR to IDR exchange rate (default: 15000)
 * @returns Amount in IDR
 */
export const convertIDRToIDR = (
  usdAmount: number,
  exchangeRate: number = 15000
): number => {
  return usdAmount * exchangeRate;
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use formatRupiah instead
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  return formatRupiah(amount);
};

// Export default as formatRupiah for convenience
export default formatRupiah;
