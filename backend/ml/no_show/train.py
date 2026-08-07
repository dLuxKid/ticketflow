"""
No-show prediction - training script (Phase 5, feature 3/3).

No real historical attendance data exists yet (this is a pre-launch merge), so this trains
on a SYNTHETIC dataset generated from an explicit, documented generative process below. This
is a deliberate, stated limitation, not a hidden one: the model's job here is to prove the
pipeline (feature engineering -> scikit-learn training -> held-out evaluation -> exported
portable weights -> lightweight runtime scorer) end-to-end, ready to retrain on real
post-launch data without changing any other code.

Features (all derived from fields that already exist on Booking/Guest by Phase 4):
  rsvp_lead_days  - days between booking creation and event start
  is_purchase     - 1 if source == 'purchase' (paid), 0 if 'invite' (free)
  is_vip          - 1 if the guest is VIP
  plus_ones       - number of plus-ones on the booking

Assumed relationships in the synthetic generator (documented, not claimed to be real-world
fact - replace with data-driven coefficients once real attendance history exists):
  + longer RSVP lead time  -> slightly HIGHER no-show risk (early enthusiasm fades)
  + paid (purchase)        -> LOWER no-show risk (financial commitment)
  + VIP                    -> LOWER no-show risk (higher personal investment)
  + more plus-ones         -> slightly HIGHER no-show risk (coordination overhead)

Run: python3 ml/no_show/train.py
Writes: ml/no_show/model.json (portable weights for the Node.js runtime scorer)
        ml/no_show/eval_report.txt (metrics, committed as measurable evidence)
"""
import json
import os
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
)

SEED = 20260725
N_SAMPLES = 3000
FEATURE_ORDER = ["rsvp_lead_days", "is_purchase", "is_vip", "plus_ones"]


def generate_synthetic_data(n, seed):
    rng = np.random.default_rng(seed)

    rsvp_lead_days = np.clip(rng.exponential(scale=7.0, size=n), 0, 45)
    is_purchase = rng.integers(0, 2, size=n).astype(float)
    is_vip = (rng.random(n) < 0.15).astype(float)  # ~15% of guests are VIP
    plus_ones = rng.integers(0, 4, size=n).astype(float)

    logit = (
        -0.9
        + 0.035 * rsvp_lead_days
        - 1.4 * is_purchase
        - 0.8 * is_vip
        + 0.22 * plus_ones
        + rng.normal(0, 0.5, size=n)  # unexplained variance
    )
    prob_no_show = 1.0 / (1.0 + np.exp(-logit))
    label_no_show = (rng.random(n) < prob_no_show).astype(int)

    X = np.column_stack([rsvp_lead_days, is_purchase, is_vip, plus_ones])
    return X, label_no_show


def main():
    X, y = generate_synthetic_data(N_SAMPLES, SEED)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=SEED, stratify=y
    )

    mean = X_train.mean(axis=0)
    std = X_train.std(axis=0)
    std[std == 0] = 1.0  # guard against a degenerate constant feature

    X_train_std = (X_train - mean) / std
    X_test_std = (X_test - mean) / std

    model = LogisticRegression(random_state=SEED)
    model.fit(X_train_std, y_train)

    y_pred = model.predict(X_test_std)
    y_proba = model.predict_proba(X_test_std)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    cm = confusion_matrix(y_test, y_pred)

    report_lines = [
        "No-show prediction - evaluation report",
        "=======================================",
        f"Train/test split: {len(X_train)}/{len(X_test)} (synthetic, seed={SEED})",
        "",
        "LIMITATION: trained on a synthetic, documented generative process (see module",
        "docstring in train.py) - no real attendance history exists pre-launch. Retrain on",
        "real post-launch data by replacing generate_synthetic_data() with a query over",
        "actual Booking/AuditLog history once enough events have run.",
        "",
        f"Accuracy:  {accuracy:.3f}",
        f"Precision: {precision:.3f}",
        f"Recall:    {recall:.3f}",
        f"F1:        {f1:.3f}",
        f"ROC-AUC:   {auc:.3f}",
        "",
        "Confusion matrix (rows=actual, cols=predicted; order=[showed, no_show]):",
        f"  {cm.tolist()}",
        "",
        f"Feature order: {FEATURE_ORDER}",
        f"Coefficients:  {model.coef_[0].round(4).tolist()}",
        f"Intercept:     {round(float(model.intercept_[0]), 4)}",
    ]
    report = "\n".join(report_lines)
    print(report)

    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, "eval_report.txt"), "w", encoding="utf-8") as f:
        f.write(report + "\n")

    model_json = {
        "feature_order": FEATURE_ORDER,
        "mean": mean.tolist(),
        "std": std.tolist(),
        "coef": model.coef_[0].tolist(),
        "intercept": float(model.intercept_[0]),
        "metrics": {
            "accuracy": accuracy,
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "roc_auc": auc,
        },
    }
    with open(os.path.join(here, "model.json"), "w") as f:
        json.dump(model_json, f, indent=2)


if __name__ == "__main__":
    main()
