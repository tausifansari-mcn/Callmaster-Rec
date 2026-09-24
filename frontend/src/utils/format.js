/** ₹1,23,456 — Indian digit grouping, no decimals (matches the original site). */
export const money = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/** 3.5 → "3.5" (drops a trailing .0) */
export const rate = (n) => String(Number(n));

/** 0.2 → "0.20" */
export const rate2 = (n) => Number(n).toFixed(2);

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
