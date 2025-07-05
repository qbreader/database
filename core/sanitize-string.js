/**
 * Sanitizes a string by normalizing Unicode characters and replacing or removing certain special characters.
 * This function transforms fields to their sanitized counterparts (e.g. answer -> answer_sanitized).
 *
 * - Normalizes the string to NFD (Canonical Decomposition).
 * - Removes diacritical marks (accents).
 * - Replaces various dash, quote, and ellipsis Unicode characters with ASCII equivalents.
 * - Removes interpuncts and replaces the Polish "ł" with "l".
 *
 * @param {string} string - The input string to sanitize.
 * @returns {string} The sanitized string.
 */
export default function sanitizeString (string) {
  return string
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[\u2018-\u201B]/g, '\'')
    .replace(/[\u201C-\u201F]/g, '"')
    .replace(/[\u2026]/g, '...')
    .replace(/[\u2032-\u2037]/g, '\'')
    .replace(/[\u00B7\u22C5\u2027]/g, '') // interpuncts
    .replace(/\u0142/g, 'l'); // ł -> l
}
