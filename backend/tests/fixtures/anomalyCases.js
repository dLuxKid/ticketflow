/**
 * Deterministic, labelled synthetic scan sequences for evaluating anomalyService.
 *
 * Ground truth is assigned by domain judgment (what a human reviewing door logs would
 * call suspicious), NOT by re-running the detector - otherwise "evaluating" the detector
 * against its own rule would trivially score 100% and prove nothing. A few templates are
 * deliberately chosen to sit outside what the current thresholds catch, so the eval report
 * shows real, non-trivial precision/recall (see scripts/eval-anomaly.js's printed
 * limitations section).
 *
 * Timestamps are jittered with a seeded PRNG (mulberry32) so the set is reproducible
 * without hand-authoring 100+ rows.
 */

// Small deterministic PRNG so the fixture is identical on every run (no crypto randomness).
function mulberry32(seed) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260725);
const jitter = (baseMs, spreadMs) => baseMs + Math.floor(rand() * spreadMs);

const row = (outcome, atMs, fp) => ({
  outcome,
  deviceId: fp,
  createdAt: new Date(atMs).toISOString(),
});

const T0 = Date.UTC(2026, 6, 25, 20, 0, 0); // an arbitrary door-open timestamp

/** One template = a function producing {rows, label, name} for a given case index. */
const TEMPLATES = [
  {
    name: 'clean_admit',
    label: false,
    count: 30,
    build: (i) => [row('admitted', T0 + jitter(i * 1000, 500), 'dev-A')],
  },
  {
    name: 'minor_fumble_then_admit',
    label: false,
    count: 25,
    build: (i) => {
      const base = T0 + i * 10000;
      return [
        row('rejected', base, 'dev-A'),
        row('rejected', base + jitter(5000, 20000), 'dev-A'),
        row('admitted', base + jitter(15000, 20000), 'dev-A'),
      ];
    },
  },
  {
    name: 'late_staff_recheck',
    label: false,
    count: 15,
    build: (i) => {
      const base = T0 + i * 10000;
      return [
        row('admitted', base, 'dev-A'),
        row('rejected', base + jitter(180000, 60000), 'dev-B'), // a second usher re-scans minutes later
      ];
    },
  },
  {
    name: 'borderline_two_device_benign',
    label: false,
    count: 15,
    build: (i) => {
      const base = T0 + i * 10000;
      return [
        row('rejected', base, 'dev-A'), // tries own phone
        row('admitted', base + jitter(30000, 15000), 'dev-B'), // friend's phone works
      ];
    },
  },
  {
    name: 'rapid_replay_attack',
    label: true,
    count: 20,
    build: (i) => {
      const base = T0 + i * 10000;
      return [
        row('rejected', base, 'dev-A'),
        row('rejected', base + jitter(200, 800), 'dev-A'), // <1s apart - implausible for a human
      ];
    },
  },
  {
    name: 'ticket_sharing_multidevice',
    label: true,
    count: 20,
    build: (i) => {
      const base = T0 + i * 10000;
      return [
        row('admitted', base, 'dev-A'),
        row('rejected', base + jitter(20000, 30000), 'dev-B'),
        row('rejected', base + jitter(60000, 30000), 'dev-C'),
        row('rejected', base + jitter(90000, 30000), 'dev-D'),
      ];
    },
  },
  {
    name: 'persistent_reject_attempt',
    label: true,
    count: 15,
    build: (i) => {
      const base = T0 + i * 10000;
      return [
        row('rejected', base, 'dev-A'),
        row('rejected', base + jitter(20000, 20000), 'dev-A'),
        row('rejected', base + jitter(50000, 20000), 'dev-A'),
        row('rejected', base + jitter(80000, 20000), 'dev-A'),
      ];
    },
  },
  {
    // Intentionally NOT caught by either signal: only 2 rejects (below the
    // repeated_rejects threshold of 3) and the 3rd device falls outside the 5-minute
    // multi-device window anchored to the first scan. Ground truth still calls this
    // suspicious (a ticket forwarded to 3 people over ~9 minutes) - a documented known
    // limitation, not a bug to silently "fix" by widening the window (which would raise
    // false positives on legitimate late staff re-checks, see late_staff_recheck above).
    name: 'slow_drip_sharing_known_limitation',
    label: true,
    count: 12,
    build: (i) => {
      const base = T0 + i * 10000;
      return [
        row('admitted', base, 'dev-A'),
        row('rejected', base + 4 * 60000, 'dev-B'),
        row('rejected', base + 9 * 60000, 'dev-C'),
      ];
    },
  },
];

export const buildAnomalyEvalSet = () => {
  const cases = [];
  for (const tpl of TEMPLATES) {
    for (let i = 0; i < tpl.count; i++) {
      cases.push({
        name: `${tpl.name}#${i}`,
        label: tpl.label,
        rows: tpl.build(i),
      });
    }
  }
  return cases; // 152 cases across 8 templates
};
