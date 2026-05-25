# Version History

## 7.2.0 - 2026-05-25
- MINOR: Fixed version switching to always resolve from repository root, preventing nested archive paths.
- MINOR: Prettified version history modal and now render entries for all versions from central `version.json`.
- MINOR: Prettified anchor-square tip into grouped memory blocks (1–25).
- Archived full release into `archives/7.2.0`.

## 7.1.0 - 2026-05-25
- MINOR: Expanded square-roots tips to explicitly list anchor squares (1² through 25²) in-app.
- Archived full release into `archives/7.1.0`.

## 7.0.0 - 2026-05-24
- MAJOR: Fixed stats regression by restoring full stats rendering (calendar + grouped attempts + metrics) via dedicated `lib/stats.js`.
- Added fallback loading strategy for central `version.json` and `VERSION_HISTORY.md` from main branch first, then local archive copy.
- Split tips rendering into `lib/tips.js` and stats rendering into `lib/stats.js` for cleaner architecture.
- Removed Settings from footer tabs (kept in menu only).
- Back-propagated central `version.json` and `VERSION_HISTORY.md` into archive folders for consistency.
- Archived full release into `archives/7.0.0`.
