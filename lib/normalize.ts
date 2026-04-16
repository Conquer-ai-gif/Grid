/**
 * Shared normalization utilities used across the app.
 * Always normalize department and university names before saving or querying.
 */

/**
 * Converts any string to Title Case.
 * "computer science" → "Computer Science"
 * "MEDICINE"         → "Medicine"
 * "  law  "          → "Law"
 */
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Strips common degree and faculty prefixes before normalizing.
 * Examples:
 *   "B.Sc in Computer Science"  → "Computer Science"
 *   "BSc Computer Science"      → "Computer Science"
 *   "Department of Medicine"    → "Medicine"
 *   "Faculty of Law"            → "Law"
 *   "School of Engineering"     → "Engineering"
 *   "M.Sc. in Statistics"       → "Statistics"
 */
const DEGREE_PREFIXES: RegExp[] = [
  /^b\.?\s*sc\.?\s*(in\s+|of\s+)?/i,
  /^b\.?\s*eng\.?\s*(in\s+|of\s+)?/i,
  /^b\.?\s*a\.?\s*(in\s+|of\s+)?/i,
  /^b\.?\s*ed\.?\s*(in\s+|of\s+)?/i,
  /^b\.?\s*tech\.?\s*(in\s+|of\s+)?/i,
  /^m\.?\s*sc\.?\s*(in\s+|of\s+)?/i,
  /^m\.?\s*eng\.?\s*(in\s+|of\s+)?/i,
  /^m\.?\s*a\.?\s*(in\s+|of\s+)?/i,
  /^m\.?\s*b\.?\s*a\.?\s*(in\s+|of\s+)?/i,
  /^ph\.?\s*d\.?\s*(in\s+|of\s+)?/i,
  /^bachelor\s+of\s+(science\s+in\s+|arts\s+in\s+|engineering\s+in\s+)?/i,
  /^master\s+of\s+(science\s+in\s+|arts\s+in\s+|engineering\s+in\s+)?/i,
  /^doctor\s+of\s+(philosophy\s+in\s+)?/i,
  /^department\s+of\s+/i,
  /^dept\.?\s+of\s+/i,
  /^faculty\s+of\s+/i,
  /^school\s+of\s+/i,
  /^college\s+of\s+/i,
  /^institute\s+of\s+/i,
  /^division\s+of\s+/i,
];

export function stripDegreePrefix(raw: string): string {
  let cleaned = raw.trim();
  // Try each prefix pattern — apply the first match and stop
  for (const pattern of DEGREE_PREFIXES) {
    const result = cleaned.replace(pattern, '');
    if (result !== cleaned) {
      cleaned = result.trim();
      break;
    }
  }
  return cleaned.trim();
}

/**
 * Normalizes a department name for safe storage and comparison.
 * Strips degree prefixes, then converts to Title Case.
 * Returns null if the input is blank (meaning "All Departments").
 */
export function normalizeDepartment(raw: string | null | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  return toTitleCase(stripDegreePrefix(raw));
}

/**
 * Normalizes a university name.
 */
export function normalizeUniversity(raw: string): string {
  return toTitleCase(raw);
}
