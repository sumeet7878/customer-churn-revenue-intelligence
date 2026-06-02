// Base currency is INR. All API values are treated as INR.
// Rates are fixed — no API calls required.
export const CURRENCIES = {
  INR: { symbol: "₹",    rate: 1,       locale: "en-IN" },
  USD: { symbol: "$",    rate: 0.012,   locale: "en-US" },
  AED: { symbol: "د.إ ", rate: 0.044,   locale: "en-US" },
  GBP: { symbol: "£",    rate: 0.0095,  locale: "en-GB" },
  EUR: { symbol: "€",    rate: 0.011,   locale: "en-US" },
};

export const CURRENCY_KEYS = Object.keys(CURRENCIES);

/**
 * Convert an INR amount to the target currency and format it.
 * @param {number} amountINR  – raw value in INR
 * @param {string} code       – one of CURRENCY_KEYS
 * @param {number} decimals   – decimal places (default 0)
 */
export function formatMoney(amountINR, code = "INR", decimals = 0) {
  const cfg = CURRENCIES[code] ?? CURRENCIES.INR;
  const converted = Number(amountINR ?? 0) * cfg.rate;
  const num = converted.toLocaleString(cfg.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${cfg.symbol}${num}`;
}
