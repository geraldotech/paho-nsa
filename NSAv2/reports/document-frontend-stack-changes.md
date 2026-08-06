# Document Frontend Stack Changes

| Item | Value |
| --- | --- |
| Application | PAHO NSA public report viewer |
| Environment | Current public frontend using the DEV data structure |
| Documentation date | 2026-08-05 |
| Result | **Preserve the report layout, add loading and error states, and implement the DEV data behavior in `app.js`.** |

## Objective

Document the frontend changes required to support the DEV data model without
redesigning the interface.

## Current frontend use vs. HTML change

| Location in `index.html` | Current frontend use | Behavior priority | Direct `index.html` impact | Implementation location |
| --- | --- | --- | --- | --- |
| `#typeOfSubmission-type-input` | Displays the Type of Submission filter | **Critical behavior**: populate from `NSAs.NSA_Status` | **No structural change**; optionally keep only **All** in the source markup | `app.js`; preserve the existing `<select>` and ID |
| `#organization-type-input` | Contains hard-coded Organization Type options | **Critical behavior**: populate from `NSA Profiles.NSAOrganizationType` | **No structural change**; optionally keep only **All** in the source markup after the JavaScript builder is implemented | `app.js`; preserve the existing `<select>` and ID |
| `#period-select` | Displays Collaboration Period options | **Critical verification**: continue using `NSAs.CollaborationPeriod` | **No structural change** | `app.js`; preserve the existing `<select>` and ID |
| `#search-results` | Displays organization names returned by the search | **Critical behavior**: distinguish cycles using organization name, `NSA_Status`, and `CollaborationPeriod` | **No structural change** | `app.js`; preserve the existing `<ul>` and ID |
| Type of Submission label | Incorrectly uses `for="period-select"` | Accessibility correction | **Direct HTML correction**: use `for="typeOfSubmission-type-input"` | `index.html` |
| Organization Type label | Incorrectly uses `for="period-select"` | Accessibility correction | **Direct HTML correction**: use `for="organization-type-input"` | `index.html` |
| Loading status | No visible state exists while data is loaded and the initial view is rendered | UI feedback | Add a status element with `role="status"`; expose `aria-busy` on the application content | `index.html`, `assets/css/styles.css`, `app.js`, and `ui-language.js` |
| Hard-coded Type of Submission options | Replaced by JavaScript at startup | Cleanup only | **Optional HTML cleanup**: remove obsolete options and keep only **All** | `index.html` |
| Hard-coded Organization Type options | Must be replaced by the new JavaScript option builder | Cleanup only after the builder exists | **Optional HTML cleanup**: remove static values and keep only **All** | `index.html`, after the `app.js` change |
| Profile, financial, collaboration, and workplan cards | Receive content rendered by `app.js` | Preserve behavior | **No structural change**: preserve the existing sections and IDs | None |
| Sidebar, navigation, language controls, disclaimers, and footer | Existing page structure | Preserve behavior | **No structural change**: preserve the existing markup | None |

The loading state must follow application readiness, not only
`DOMContentLoaded`, because the DOM can be ready before the data and initial
render.

## JavaScript files

| File | Current role | Required impact |
| --- | --- | --- |
| `assets/js/app.js` | Loads data, builds cycles, filters records, manages selection, and renders the report | Refactor data loading, joins, filtering, localized fallbacks, safe output, loading/error states, and rendering coordination |
| `assets/js/ui-language.js` | Stores English and Spanish interface strings | Add missing states and Year 3 labels; reuse translations instead of hard-coded messages; correct identified wording and key issues |

### `app.js` refactoring map

| Current issue | Refactoring target | Required verification |
| --- | --- | --- |
| Failed JSON requests become empty arrays | A loader with loading, success, partial-failure, and failure states | Loading appears on initial paint, clears after the first complete render, and becomes an error state when required data fails |
| Profile/submission merging and public eligibility are handled inline | `buildPublicCycles(profiles, submissions)` | Use Profile fields for organization details, `NSA_Status` for current submission type, `CollaborationPeriod` for period, and `GovBodies_Status = Approved` or `Pending` for eligibility |
| IDs are compared with repeated string and numeric conversions | `normalizeId(value)` and a cycle-selection function | Select with `NSAs.ID`; include children only when `ParentID` matches that cycle and `NSAProfileID` confirms ownership |
| Language fallbacks vary across renderers | One localized-value resolver | Test English, Spanish, blank translations, base-field fallback, and Year 3 Workplan values |
| Search and filtering are duplicated | One filter/search function, one option builder, and one cycle-label formatter | Test each filter, combined filters, search, sorting, no results, dynamic options, and multiple cycles for one organization |
| Exported values are inserted through multiple `innerHTML` templates | Shared safe text and line-break helpers | Test markup-like values in Profile, Activity, Workplan, yearly results, focal points, and website fields |
| `render()` and control listeners coordinate state independently | Card renderers plus centralized selection, reset, and UI state updates | Verify submission-type visibility, selection, reset, navigation, and loading/error transitions |
| Messages and document language are inconsistent | Localized status lookup and document-language update | Verify visible messages and `<html lang>` in English and Spanish |

Keep the extracted functions in the existing `app.js` during this refactor. An
ES-module conversion is optional and would require a separate change to how
`index.html` loads the application script.

### `ui-language.js` impact

| Change | Priority |
| --- | --- |
| Add `year3` in English and Spanish | Critical |
| Reuse `searchNoResults`, `noCollab`, and `noWorkplan` instead of hard-coded English | Critical |
| Add loading, load failure, partial failure, retry, not-found, missing financial data, Health Agenda, and Strategic Plan messages | Critical when the corresponding state is displayed |
| Add a localized untitled-cycle fallback if it remains visible | Critical |
| Rename `collabSubtitleProgresReport` to `collabSubtitleProgressReport` in the language file and caller | Maintenance |
| Correct visible Spanish wording, including `Selecione NSA` and `governanza` | Content review |
| Review duplicate concepts such as `period`/`collabPeriod` and `orgType`/`orgTypeLabel` before removing unused keys | Maintenance |

Do not delete language keys until their HTML and JavaScript consumers have been
checked. The file is valid UTF-8 and does not require re-encoding.

## Recommended implementation sequence

1. Add focused tests for normalization, joins, eligibility, and filtering.
2. Extract public-cycle normalization, ID handling, and cycle selection.
3. Consolidate filtering, search, option building, and cycle labels.
4. Add localized fallbacks, Year 3 output, safe rendering, and messages.
5. Split rendering by card and centralize UI state.
6. Add loading and error presentation, then run a browser smoke test covering
   selection, combined filtering, language switching, navigation, and empty or
   failed data.

## Regression contract

The refactor is complete only when:

- `NSA Profiles.ID -> NSAs.NSAProfileID` supplies stable organization details.
- `NSAs.ID -> Activity.ParentID` and `NSAs.ID -> Workplan.ParentID` supplies the
  selected cycle's children.
- `NSA_Status`, not legacy `TypeOfSubmission`, supplies the current Type of
  Submission.
- `GovBodies_Status = Approved` or `Pending` determines public eligibility.
- Missing parents and mismatched children are excluded, never reassigned.
- Multiple cycles for one organization remain independently selectable and
  visibly distinguishable.
- Blank localized fields fall back to available source content, including Year
  3 Workplan results.
- Exported text is escaped before insertion into HTML.
- Loading remains active until the first complete render and changes to an
  actionable error state on failure; `aria-busy` matches the visible state.
- `Pending` eligibility is tested with a controlled fixture because the supplied
  export contains no Pending cycle.
- Profiles 44 and 46 pass validation. Profile 43 remains **Pass with source-data
  exceptions**, with orphan children excluded from valid cycles.

Only loading-state styles are required for this data refactor. Responsive-layout
work and ES-module conversion remain separate tasks.
