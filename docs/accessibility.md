# Accessibility (WCAG 2.2 AA) - scope and status

## Honest scope statement

A full WCAG 2.2 AA audit of the entire pre-existing TicketFlow frontend (checkout, event
creation wizard, my-profile, explore-events, etc.) was not performed as part of this merge
- that codebase predates this work and auditing it thoroughly is a separate, sizeable
effort. What follows is what was actually done, so it can be represented accurately in the
group report rather than overstated.

**In scope and fixed:** the components built or substantially modified during this merge -
`guest-manager.tsx` (guest-list import + NL query + GDPR erasure UI) and
`live-dashboard.tsx` (the live arrivals dashboard). These were audited and fixed against
concrete WCAG 2.2 AA success criteria, listed below with what was found and changed.

**Out of scope, recommended as follow-up:** the pre-existing checkout flow, event-creation
wizard, and public event pages. A pass over those is a good next task for whoever owns
frontend polish before the demo.

## Findings and fixes (this merge's components)

| Issue | Success criterion | Where | Fix |
|---|---|---|---|
| CSV textarea and NL-question input had no `<label>`, only placeholder text - placeholder text disappears once typing starts and isn't reliably read by all screen readers/AT | 1.3.1 Info and Relationships, 3.3.2 Labels or Instructions, 4.1.2 Name, Role, Value | `guest-manager.tsx` | Added `<label htmlFor>` (visible for the CSV field, `sr-only` for the question field alongside its own visible hint text), plus `aria-describedby` linking each field to its hint paragraph |
| Import result, query answer, and erasure outcome appeared with no announcement to screen-reader users (visual-only update) | 4.1.3 Status Messages | `guest-manager.tsx` | Wrapped each dynamic result region in `<div aria-live="polite" role="status">`; error messages additionally use `role="alert"` |
| `text-gray-500` / `text-gray-400` used for body text and timestamps sits at or below the 4.5:1 AA contrast threshold for normal text (gray-400 ≈ 2.8:1 on white - fails; gray-500 ≈ 4.6:1 - passes but with negligible margin) | 1.4.3 Contrast (Minimum) | Both components, multiple instances | Bumped informational text to `gray-600` (≈7:1 on white) and status-feed timestamps from `gray-400` to `gray-600` |
| Progress bar (arrivals vs. capacity) was a purely visual `<div>` - no accessible value exposed | 1.3.1, 4.1.2 | `live-dashboard.tsx` | Added `role="progressbar"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax` and `aria-labelledby` pointing at the visible "Arrivals" label |
| Connection status ("Live" / "Reconnecting…") changes with no announcement | 4.1.3 Status Messages | `live-dashboard.tsx` | Added `role="status"` + `aria-live="polite"` to the badge; the colored dot is marked `aria-hidden="true"` since the adjacent text already conveys the same state |
| Recent-scans feed updates in place with no announcement as new scans arrive | 4.1.3 Status Messages | `live-dashboard.tsx` | Added `aria-live="polite"` to the feed `<ul>` |
| Table headers had no `scope` attribute | 1.3.1 | `guest-manager.tsx` guest table | Added `scope="col"` to every `<th>`; the new Actions column header is visually hidden (`sr-only`) but present for AT |
| Interactive elements relied on the browser's default focus ring, which some resets/utility CSS can suppress | 2.4.7 Focus Visible | Buttons, textarea, input in `guest-manager.tsx` | Added explicit `focus:outline-none focus:ring-2` (with `focus:ring-offset-2` on solid buttons) so focus is visible regardless of any global reset |
| Destructive action (erase a guest's PII) had no confirmation step | 3.3.4 Error Prevention (context: irreversible action) - good practice regardless of exact SC | `guest-manager.tsx` erase button | Added a `window.confirm` guard describing exactly what is and isn't removed before calling the erase endpoint |

## Not addressed (documented, not silently skipped)

- **Colour is not the sole signal** anywhere in these two components (admitted/rejected,
  connected/disconnected, and result categories all differ in text content, not just
  colour) - verified, no change needed.
- **Keyboard operability**: all interactive elements in these two components are native
  `<button>`/`<input>`/`<textarea>` elements, so keyboard access and default ARIA roles
  come for free; spot-checked with Tab/Enter, no custom widgets that would need
  `role`/`tabindex` management.
- **Screen-reader testing**: the above was fixed against the WCAG success criteria text and
  common automated-checker rules (axe-core's rule set), not verified with an actual screen
  reader (VoiceOver/NVDA) session - recommended before the demo video if time allows.
- **Full-site automated scan** (e.g. axe DevTools or Lighthouse accessibility audit) across
  every route was not run in this environment. Recommended as a fast next step - it would
  likely surface issues in the pre-existing pages noted as out of scope above.
