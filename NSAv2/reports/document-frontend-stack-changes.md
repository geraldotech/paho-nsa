# Document Frontend Stack Changes

| Item | Value |
| --- | --- |
| Application | PAHO NSA public report viewer |
| Environment | Current public frontend using the DEV data structure |
| Documentation date | 2026-08-07 |
| Result | **Preserve the report layout, add loading and error states, and implement the confirmed data behavior in `assets/js/app.js`.** |

## Objective

Document the frontend changes required to support the DEV data structure
without redesigning the interface.

## Current frontend use vs. HTML change

| Location in `index.html` | Current frontend use | Required behavior | Direct `index.html` impact | Implementation location |
| --- | --- | --- | --- | --- |
| `#typeOfSubmission-type-input` | Displays the Type of Submission filter | Populate from `NSAs.NSA_Status` | Preserve the existing `<select>` and ID; optionally keep only **All** in the source markup | `assets/js/app.js` |
| `#organization-type-input` | Contains hard-coded Organization Type options | Populate from `NSA Profiles.NSAOrganizationType` | Preserve the existing `<select>` and ID; optionally keep only **All** after dynamic population is implemented | `assets/js/app.js` |
| `#period-select` | Displays Collaboration Period options | Continue populating from `NSAs.CollaborationPeriod` | Preserve the existing `<select>` and ID | `assets/js/app.js` |
| `#search-results` | Displays organization names returned by search | Distinguish `NSAs` records by `NSA Profiles.Title`, `NSAs.NSA_Status`, and `NSAs.CollaborationPeriod`; retain `NSAs.ID` for selection | Preserve the existing `<ul>` and ID | `assets/js/app.js` |
| Type of Submission label | Incorrectly uses `for="period-select"` | Associate the label with its select | Change to `for="typeOfSubmission-type-input"` | `index.html` |
| Organization Type label | Incorrectly uses `for="period-select"` | Associate the label with its select | Change to `for="organization-type-input"` | `index.html` |
| Loading status | No visible state exists while the JSON files and initial report view load | Show localized loading and error feedback | Add a status target with `role="status"`; expose `aria-busy` on the application content | `index.html`, `assets/css/styles.css`, `assets/js/app.js`, and `assets/js/ui-language.js` |
| Profile, financial, collaboration, Activity, and Workplan cards | Receive content from `assets/js/app.js` | Preserve the existing rendering targets | No structural change | None |
| Sidebar, navigation, language controls, disclaimers, and footer | Existing page structure | Preserve existing behavior | No structural change | None |

Loading must remain visible until JSON loading, relationship checks, filter
option creation, and the first render finish. `DOMContentLoaded` alone does not
represent application readiness.

## JavaScript files

| File | Current role | Required impact |
| --- | --- | --- |
| `assets/js/app.js` | Loads `NSA Profiles`, `NSAs`, `Activity`, and `Workplan`; joins records; filters results; manages selection; and renders the report | Correct the confirmed data rules, consolidate repeated logic, protect rendered output, and add loading/error behavior |
| `assets/js/ui-language.js` | Stores English and Spanish interface strings | Add missing messages and labels and replace hard-coded English output |
| `assets/js/vendors/chart.js` | Provides Chart.js for the financial chart | No change required |

### `assets/js/app.js` changes

| Current implementation evidence | Proposed change | Required verification |
| --- | --- | --- |
| `fetchJson()` returns `null` on failure, and startup converts non-arrays to empty arrays | Distinguish loading, successful loading, partial resource failure, request failure, and valid empty results | Show loading on initial paint, remove it after the first complete render, and display an error when a required resource fails |
| The `nasas` mapping joins `NSA Profiles` and `NSAs` inline | Centralize the join and eligibility logic within `assets/js/app.js` | Use `NSA Profiles` for stable organization details, `NSAs.NSA_Status` for current Type of Submission, `NSAs.CollaborationPeriod` for period, and `NSAs.GovBodies_Status = Approved` or `Pending` for public eligibility |
| ID comparisons repeatedly convert values to strings | Centralize ID comparison without renaming source keys | Select with `NSAs.ID`; retrieve records through `Activity.ParentID = NSAs.ID` and `Workplan.ParentID = NSAs.ID`; validate ownership through `Activity.NSAProfileID` and `Workplan.NSAProfileID` |
| Localized fallbacks differ across rendering functions | Apply one consistent fallback order while preserving source field names | Test English, Spanish, blank translations, base-field fallback, and Workplan Year 3 values |
| `applyFilters()`, `handleSearchInput()`, and `showSearchResults()` apply overlapping logic | Consolidate filtering, sorting, option generation, and result rendering | Test every filter, combined filters, search, sorting, no results, and multiple `NSAs` records linked to the same `NSA Profiles.ID` |
| Exported values enter multiple `innerHTML` templates | Apply shared safe-text, line-break, URL, and number handling | Test markup-like values from `NSA Profiles`, `NSAs`, `Activity`, and `Workplan` |
| `render()` and control listeners update state independently | Centralize selection, reset, navigation, and rendering coordination | Verify Type of Submission visibility rules, selection by `NSAs.ID`, reset, navigation, and loading/error transitions |
| Messages and document language are inconsistent | Use localized messages and update `<html lang>` | Verify all visible states in English and Spanish |

Keep these changes in the existing JavaScript files. `assets/js/app.js` is
already loaded with `type="module"` and imports `assets/js/ui-language.js`; no
additional internal JavaScript files are required.

### `assets/js/ui-language.js` changes

| Change | Priority |
| --- | --- |
| Add `year3` in English and Spanish | Critical |
| Reuse `searchNoResults`, `noCollab`, and `noWorkplan` instead of hard-coded English | Critical |
| Add loading, load failure, partial failure, retry, not-found, missing financial data, Health Agenda, and Strategic Plan messages | Critical when the corresponding state is displayed |
| Add a localized fallback when `NSA Profiles.Title` is unavailable and that fallback remains visible | Critical |
| Rename `collabSubtitleProgresReport` to `collabSubtitleProgressReport` in the language file and caller | Maintenance |
| Correct visible Spanish wording, including `Selecione NSA` and `governanza` | Content review |
| Review duplicate concepts such as `period`/`collabPeriod` and `orgType`/`orgTypeLabel` before removing unused keys | Maintenance |

Do not delete language keys until their HTML and JavaScript consumers have been
checked. The file is valid UTF-8 and does not require re-encoding.

## Recommended implementation sequence

1. Add focused tests for the confirmed relationships, eligibility, localized
   fallbacks, and filters.
2. Centralize ID comparison, `NSA Profiles`/`NSAs` joining, eligibility, and
   `Activity`/`Workplan` relationship checks.
3. Consolidate filtering, search, option generation, sorting, and result labels.
4. Add localized fallbacks, Workplan Year 3 output, safe rendering, and messages.
5. Split rendering into focused functions within `assets/js/app.js` and
   centralize UI state updates.
6. Add loading and error presentation, then run a browser smoke test covering
   selection, combined filtering, language switching, navigation, and empty or
   failed data.

## Regression contract

The refactor is complete only when:

- `NSA Profiles.ID -> NSAs.NSAProfileID` supplies stable organization details.
- `NSAs.ID -> Activity.ParentID` retrieves `Activity` records for the selected
  `NSAs.ID`.
- `NSAs.ID -> Workplan.ParentID` retrieves `Workplan` records for the selected
  `NSAs.ID`.
- `NSA Profiles.ID -> Activity.NSAProfileID` and
  `NSA Profiles.ID -> Workplan.NSAProfileID` validate organization ownership.
- `NSAs.NSA_Status`, not legacy `NSAs.TypeOfSubmission`, supplies the current
  Type of Submission.
- `NSAs.GovBodies_Status = Approved` or `Pending` determines public eligibility.
- Missing or mismatched `Activity` and `Workplan` records are excluded, never
  reassigned to another `NSAs.ID`.
- `NSAs` records linked to the same `NSA Profiles.ID` remain independently
  selectable and visibly distinguishable.
- Blank localized fields fall back to available source content, including
  Workplan Year 3 results.
- Exported text is escaped before insertion into HTML.
- Loading remains active until the first complete render and changes to an
  actionable error state on failure; `aria-busy` matches the visible state.
- `NSAs.GovBodies_Status = Pending` is tested with a controlled fixture because
  the supplied export contains no matching `NSAs` record.
- `NSA Profiles.ID = 44` and `NSA Profiles.ID = 46` pass validation.
- `NSA Profiles.ID = 43` remains **Pass with source-data exceptions**, with
  `Activity.ID = 38`, `Activity.ID = 39`, `Workplan.ID = 60`, and
  `Workplan.ID = 61` excluded because they reference missing `NSAs.ID = 60`.

Only loading-state styles are required for this data refactor. Responsive-layout
work remains a separate task.
