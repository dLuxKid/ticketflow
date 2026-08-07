/**
 * Held-out question → expected-intent pairs for evaluating nlQuery/intentParser.js.
 *
 * "Held-out" here means: written to cover paraphrases an organiser might actually type,
 * independent of the exact wording used while designing the regexes - the standard way to
 * check a rule-based (or LLM) parser generalises beyond its literal training/design
 * examples, not just repeats them back. `expected: null` cases assert the parser correctly
 * declines to answer rather than guessing.
 */
export const NL_QUERY_EVAL_SET = [
  // list, not admitted
  {
    q: "who hasn't arrived",
    expected: { action: 'list', status: 'not_admitted', vipOnly: false },
  },
  {
    q: "Which guests haven't checked in?",
    expected: { action: 'list', status: 'not_admitted', vipOnly: false },
  },
  {
    q: 'who has not arrived from the VIP list',
    expected: { action: 'list', status: 'not_admitted', vipOnly: true },
  },
  {
    q: 'list guests who have not arrived',
    expected: { action: 'list', status: 'not_admitted', vipOnly: false },
  },

  // list, admitted
  {
    q: 'who has arrived',
    expected: { action: 'list', status: 'admitted', vipOnly: false },
  },
  {
    q: 'who checked in',
    expected: { action: 'list', status: 'admitted', vipOnly: false },
  },
  {
    q: 'show me who is admitted so far',
    expected: { action: 'list', status: 'admitted', vipOnly: false },
  },
  {
    q: 'list VIPs who have arrived',
    expected: { action: 'list', status: 'admitted', vipOnly: true },
  },

  // list, any
  {
    q: 'list all guests',
    expected: { action: 'list', status: 'any', vipOnly: false },
  },
  {
    q: 'show the guest list',
    expected: { action: 'list', status: 'any', vipOnly: false },
  },
  {
    q: 'who are the VIPs',
    expected: { action: 'list', status: 'any', vipOnly: true },
  },
  {
    q: 'list vip guests',
    expected: { action: 'list', status: 'any', vipOnly: true },
  },

  // count, admitted
  {
    q: 'how many guests have arrived',
    expected: { action: 'count', status: 'admitted', vipOnly: false },
  },
  {
    q: 'how many people checked in',
    expected: { action: 'count', status: 'admitted', vipOnly: false },
  },
  {
    q: 'how many VIPs have arrived',
    expected: { action: 'count', status: 'admitted', vipOnly: true },
  },
  {
    q: 'count how many are admitted',
    expected: { action: 'count', status: 'admitted', vipOnly: false },
  },

  // count, not admitted
  {
    q: "how many haven't arrived",
    expected: { action: 'count', status: 'not_admitted', vipOnly: false },
  },
  {
    q: 'how many guests have not checked in yet',
    expected: { action: 'count', status: 'not_admitted', vipOnly: false },
  },
  {
    q: "how many VIPs haven't arrived",
    expected: { action: 'count', status: 'not_admitted', vipOnly: true },
  },

  // count, any
  {
    q: 'how many guests are there',
    expected: { action: 'count', status: 'any', vipOnly: false },
  },
  {
    q: 'how many people are on the list',
    expected: { action: 'count', status: 'any', vipOnly: false },
  },
  {
    q: 'how many VIPs are there',
    expected: { action: 'count', status: 'any', vipOnly: true },
  },

  // unrecognised - must decline, not guess
  { q: 'what is the weather like tonight', expected: null },
  { q: 'delete this event', expected: null },
  { q: '', expected: null },
  { q: '   ', expected: null },
  { q: 'refund the last purchase', expected: null },
];
