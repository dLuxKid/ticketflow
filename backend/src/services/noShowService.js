import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

/**
 * No-show probability scoring - the runtime half of the Phase 5 feature.
 *
 * Training happens offline in Python (ml/no_show/train.py, scikit-learn LogisticRegression
 * on a documented synthetic dataset - see that file's docstring for the labelled
 * limitation and the features used). This module loads the exported portable weights
 * (mean/std/coef/intercept) and reimplements just the standardize-then-sigmoid inference
 * step in pure JS, so the running app never needs a Python runtime or scikit-learn
 * installed. tests/unit/noShow.test.js is a parity test proving this reimplementation
 * matches scikit-learn's own predict_proba on the same inputs.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODEL_PATH = path.join(__dirname, '../../ml/no_show/model.json');

let cachedModel = null;

/** Loads and caches the trained model. Exported for tests to inject a fixture model. */
export const loadModel = () => {
  if (!cachedModel) {
    cachedModel = JSON.parse(readFileSync(MODEL_PATH, 'utf8'));
  }
  return cachedModel;
};

const sigmoid = (z) => 1 / (1 + Math.exp(-z));

/**
 * Scores one booking's no-show probability.
 *
 * @param {{rsvpLeadDays:number, isPurchase:boolean, isVip:boolean, plusOnes:number}} features
 * @param {object} [model] - defaults to the loaded trained model; override in tests
 * @returns {number} probability in [0, 1] that this guest does not show up
 */
export const predictNoShowProbability = (features, model = loadModel()) => {
  const raw = [
    features.rsvpLeadDays,
    features.isPurchase ? 1 : 0,
    features.isVip ? 1 : 0,
    features.plusOnes,
  ];

  const standardized = raw.map(
    (value, i) => (value - model.mean[i]) / model.std[i],
  );
  const logit =
    standardized.reduce((sum, x, i) => sum + x * model.coef[i], 0) +
    model.intercept;

  return sigmoid(logit);
};

/** Derives the model's input features from a booking + its event. */
export const featuresFromBooking = (booking, event) => {
  const createdAt = new Date(booking.createdAt);
  const eventStart = new Date(event.startDate);
  const rsvpLeadDays = Math.max(
    0,
    (eventStart - createdAt) / (1000 * 60 * 60 * 24),
  );

  return {
    rsvpLeadDays,
    isPurchase: booking.source === 'purchase',
    isVip: Boolean(booking.vip), // Guest.vip, joined in by the caller
    plusOnes: booking.plusOnes ?? 0,
  };
};
