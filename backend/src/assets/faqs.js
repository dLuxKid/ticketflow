/**
 * Backend copy of the site FAQ shown in frontend/src/assets/data/faqs.ts.
 *
 * Duplicated, not imported: frontend/ and backend/ are two separate npm projects with no
 * shared workspace, so importing the frontend's TS asset into this backend ESM module isn't
 * a one-line fix. Five entries, low churn - duplicating a list this small is the honest
 * tradeoff, not a DRY violation worth cross-package tooling for. Keep in sync manually if
 * either copy changes.
 */
export const faqs = [
  {
    question: 'How do I pay for my tickets?',
    answer:
      'We make use of the paystack system of payment so you can pay with your bank card or bank transfer.',
  },
  {
    question: 'I have not received my ticket',
    answer:
      "After payment confirmation, wait for another 10 minutes and check your spam/promotions mail. If you still haven't received your ticket contact us at adetunjiboyz@gmail.com.",
  },
  {
    question: 'Can I request a refund?',
    answer:
      'Event tickets are non-refundable however, you may be refunded where event organisers state otherwise or where an event has been canceled by the organisers.',
  },
  {
    question: 'How do I create events with TicketFlow?',
    answer:
      'After signing up, click on Create Events and answer all the questions provided.',
  },
  {
    question: 'What do I do when I use the wrong email address?',
    answer:
      'Immediately you notice such mistake, contact our customer support at adetunjiboyz@gmail.com. You may be required to provide your account details and the intended email address.',
  },
];
