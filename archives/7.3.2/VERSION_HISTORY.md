# Version History

## 7.3.2 - 2026-05-26
- PATCH: Fixed archived `3.0.0` build loading issue by restoring compatible app bundle files (`index.html`, `styles.css`, `app.js`, `lib/*`, `topics/*`).
- PATCH: Ensured `archives/3.0.0` includes required module files imported by `app.js`.
- Archived full release into `archives/7.3.2`.

## 7.3.1 - 2026-05-26
- PATCH: Fully fixed archive-to-archive version switching by routing through `archivePath` from central metadata.
- PATCH: Propagated cleaned switcher logic and central version/history files across archive builds to prevent nested archive URLs.
- Archived full release into `archives/7.3.1`.

## 7.3.0 - 2026-05-26
- MINOR: Completed version history list and improved anchor tips + footer safe-area styling.

## 7.2.0 - 2026-05-25
- MINOR: Fixed nested archive-path switching bug and improved history modal rendering.

## 7.1.0 - 2026-05-25
- MINOR: Expanded square-root anchor square list explicitly in tips.

## 7.0.0 - 2026-05-24
- MAJOR: Restored full stats rendering and modularized stats/tips helpers.

## 6.0.0 - 2026-05-24
- MAJOR: Added SR algorithm selector (SM-2 Strict / SuperMemo Heuristic) and modular topics structure.

## 5.0.0 - 2026-05-24
- MAJOR: Added percentage topic and centralized version loading.

## 4.0.0 - 2026-05-24
- MAJOR: Added mobile tabs, modal history, grouped attempts, and activity calendar.

## 3.0.0 - 2026-05-24
- MAJOR: Reintroduced version switcher, charts, and stronger spaced repetition flow.

## 2.0.0 - 2026-05-24
- MAJOR: Added hamburger navigation, stats dashboard, Firebase auth, and colorful tips page.

## 1.0.0 - 2026-05-24
- MAJOR: Initial runnable QuickMath square-root web app.

## 0.1.0 - 2026-05-24
- Initial repository scaffold.
