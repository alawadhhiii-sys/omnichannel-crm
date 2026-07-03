import { OPT_OUT_KEYWORDS } from './constants.js';

export function isOptOutMessage(text) {
  if (!text || typeof text !== 'string') return false;

  const normalized = text.trim().toLowerCase();

  return OPT_OUT_KEYWORDS.some((keyword) => {
    return normalized === keyword.toLowerCase();
  });
}
