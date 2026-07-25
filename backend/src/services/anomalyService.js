/**
 * Rule-based anomaly detection over a single ticket's scan history.
 *
 * Reads AuditLog rows (already written by admissionService — see the door check-in flow)
 * and flags patterns worth an organiser's attention. Pure and dependency-free by design: no
 * training step, easy to unit test, and a first pass ahead of a learned model if the volume
 * of labelled real incidents ever justifies one.
 *
 * Three signals, each independently sufficient to flag a ticket:
 *  - repeated_rejects   — this token was rejected at the door repeatedly
 *  - multi_device       — this token was scanned from several distinct devices/IPs
 *  - rapid_sequential   — scans of this token arrived implausibly close together
 *
 * Thresholds are deliberately conservative (see eval report in
 * scripts/eval-anomaly.js) — a couple of fumbled scans from one phone is normal door
 * behaviour and must not be flagged.
 */

export const DEFAULT_THRESHOLDS = {
  repeatedRejectsCount: 3, // >=3 rejections on one ticket
  multiDeviceDistinctCount: 3, // >=3 distinct device/IP fingerprints
  multiDeviceWindowMs: 5 * 60 * 1000, // ...within a 5-minute window
  rapidSequentialMs: 2000, // two scans <2s apart
};

/**
 * @param {Array<{outcome:string, deviceId?:string, ip?:string, createdAt:string|Date}>} rows
 *   Audit rows for ONE booking, any order.
 * @param {object} [thresholds] - overrides for DEFAULT_THRESHOLDS
 * @returns {{anomalous: boolean, flags: string[]}}
 */
export const detectAnomalies = (rows, thresholds = {}) => {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds };
  const flags = [];
  if (!Array.isArray(rows) || rows.length === 0) {
    return { anomalous: false, flags };
  }

  const sorted = [...rows].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );

  // repeated_rejects
  const rejectCount = sorted.filter((r) => r.outcome === 'rejected').length;
  if (rejectCount >= t.repeatedRejectsCount) flags.push('repeated_rejects');

  // multi_device: distinct fingerprints (deviceId, falling back to ip) within the window
  const withFingerprint = sorted
    .map((r) => ({ ...r, fp: r.deviceId || r.ip }))
    .filter((r) => r.fp);
  if (withFingerprint.length > 0) {
    const windowStart =
      new Date(withFingerprint[0].createdAt).getTime();
    const inWindow = withFingerprint.filter(
      (r) => new Date(r.createdAt).getTime() - windowStart <= t.multiDeviceWindowMs,
    );
    const distinct = new Set(inWindow.map((r) => r.fp));
    if (distinct.size >= t.multiDeviceDistinctCount) flags.push('multi_device');
  }

  // rapid_sequential: any two consecutive scans closer together than the threshold
  for (let i = 1; i < sorted.length; i++) {
    const gap =
      new Date(sorted[i].createdAt) - new Date(sorted[i - 1].createdAt);
    if (gap >= 0 && gap < t.rapidSequentialMs) {
      flags.push('rapid_sequential');
      break;
    }
  }

  return { anomalous: flags.length > 0, flags };
};
