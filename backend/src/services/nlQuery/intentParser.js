/**
 * Natural-language → structured query, for questions about a guest list.
 *
 * No hosted LLM is wired in: this environment has no LLM API key configured (see
 * IMPLEMENTATION_PROMPT.md Phase 5), and a pattern-based parser over a small, well-defined
 * question space is both fully offline-testable and - for the handful of questions an
 * organiser actually asks on the night ("who hasn't arrived", "how many VIPs checked in") -
 * just as reliable as an LLM call, without the latency, cost, or a third-party dependency.
 *
 * This is intentionally the swappable half of the feature: `parseQuestion` returns the same
 * {action, status, vipOnly} shape a hosted-LLM parser would be asked to produce (e.g. via a
 * structured-output/function-calling prompt). Swapping providers means adding a second
 * implementation of this one function and selecting it in nlGuestQueryService - the executor
 * and API never change.
 *
 * @typedef {{action: 'list'|'count', status: 'admitted'|'not_admitted'|'any', vipOnly: boolean}} Intent
 */

const VIP_RE = /\bvips?\b/i;
// Negation may attach to either verb an organiser uses for "showed up": "haven't arrived"
// or "haven't checked in" - both must be recognised, not just the first one written.
const NOT_ARRIVED_RE =
  /\b(hasn'?t|has not|haven'?t|have not)\s+(arriv\w*|check(ed)?[\s-]?in)/i;
const ARRIVED_RE = /\barriv(ed|ing)?\b|\bcheck(ed)?[\s-]?in\b|\badmitted\b/i;
const HOW_MANY_RE = /\bhow many\b|\bcount\b/i;
const WHO_RE = /\bwho\b|\bwhich\b|\blist\b|\bshow\b/i;

/**
 * @param {string} question - a plain-English question about the guest list
 * @returns {Intent|null} the structured intent, or null if the question isn't recognised
 */
export const parseQuestion = (question) => {
  if (typeof question !== 'string' || question.trim() === '') return null;
  const q = question.trim();

  const vipOnly = VIP_RE.test(q);
  const isCount = HOW_MANY_RE.test(q);
  const isList = !isCount && WHO_RE.test(q);

  if (!isCount && !isList) return null;

  let status = 'any';
  if (NOT_ARRIVED_RE.test(q)) status = 'not_admitted';
  else if (ARRIVED_RE.test(q)) status = 'admitted';

  return { action: isCount ? 'count' : 'list', status, vipOnly };
};
