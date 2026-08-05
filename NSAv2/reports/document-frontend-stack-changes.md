#  Document Frontend Stack Changes

| Item               | Value                                                            |
| ------------------ | ---------------------------------------------------------------- |
| Application        | PAHO NSA public report viewer                                    |
| Environment        | Current public frontend using the DEV data structure             |
| Documentation date | 2026-08-04                                                       |
| Result             | **Preserve the existing HTML/CSS layout; implement critical data behavior in `app.js`** |

## Contents

1. [Objective](#objective)
2. [Classification](#classification)
3. [Current frontend use vs. HTML change](#current-frontend-use-vs-html-change)
4. [JavaScript refactoring map](#javascript-refactoring-map)
5. [`ui-language.js` impact](#ui-languagejs-impact)
6. [Recommended implementation sequence](#recommended-implementation-sequence)
7. [Data-refactor regression contract](#data-refactor-regression-contract)
8. [Final assessment](#final-assessment)

## Objective

Define the changes required in `app.js`, `ui-language.js`, and `index.html` to
support the DEV data model without redesigning the existing interface.

## Classification

- **Critical:** required for the frontend to use the new fields or distinguish
  the new relationships correctly.
- **Not critical:** optional cleanup or accessibility improvement that does not
  block the data refactor.
- **No change:** the existing HTML already supports the refactored behavior.

## Current frontend use vs. HTML change

| Location in `index.html` | Current frontend use | Change level | Required change | Implementation location |
| --- | --- | --- | --- | --- |
| `#typeOfSubmission-type-input` | Displays the Type of Submission filter | **Critical** | Populate its options from `NSAs.NSA_Status` | `app.js`; the existing HTML select remains |
| `#organization-type-input` | Contains hard-coded Organization Type options | **Critical** | Populate its options from `NSA Profiles.NSAOrganizationType` | `app.js`; the HTML may keep only **All** as its initial option |
| `#period-select` | Displays Collaboration Period options | **Critical** | Continue populating from `NSAs.CollaborationPeriod` | `app.js`; no HTML change |
| `#search-results` | Displays organization names returned by the search | **Critical** | Distinguish cycles using organization name, `NSA_Status`, and `CollaborationPeriod` | `app.js`; keep the existing `<ul>` |
| Type of Submission label | Uses `for="period-select"` | **Not critical** | Change to `for="typeOfSubmission-type-input"` for accessibility | `index.html` |
| Organization Type label | Uses `for="period-select"` | **Not critical** | Change to `for="organization-type-input"` for accessibility | `index.html` |
| Hard-coded Type of Submission options | Replaced by JavaScript at startup | **Not critical** | Remove unused options and keep only **All** | `index.html` |
| Profile, financial, collaboration, and workplan cards | Receive content rendered by `app.js` | No change | Preserve the existing sections and IDs | None |
| Sidebar, navigation, language controls, disclaimers, and footer | Existing page structure | No change | Preserve the existing markup | None |

## JavaScript refactoring map

Start with pure functions, then move them into ES modules after adding tests.

| Current responsibility in `app.js` | Refactoring target | How it helps implementation | Required verification |
| --- | --- | --- | --- |
| Top-level JSON loading and conversion of failures to empty arrays | A data-loading function that returns explicit loading, success, partial-failure, and failure states | Prevents a failed export from appearing to the user as an organization with no data | Simulate one failed JSON request and confirm that the failed resource produces a visible error state |
| Inline Profile/submission merge used to create `nasas` | A pure `buildPublicCycles(profiles, submissions)` function | Centralizes public eligibility and authoritative field selection instead of scattering aliases through renderers | Include `Approved` and `Pending`; take organization name/type from `NSA Profiles`, current type from `NSAs.NSA_Status`, and period from `NSAs.CollaborationPeriod` |
| Normalized `TypeOfSubmission` alias | Rename it to `currentSubmissionType` | Makes `NSAs.NSA_Status` explicit and avoids confusion with legacy `TypeOfSubmission` | Confirm filters, labels, and submission-type visibility rules use the renamed property |
| Repeated string and numeric ID conversions | A shared `normalizeId(value)` function | Keeps Profile, cycle, and child comparisons consistent | Test numeric, string, whitespace, null, and empty IDs |
| Global `currentId` plus Activity and Workplan filtering inside `render()` | A pure cycle-selection function using `NSAs.ID` and child `ParentID` | Preserves cycle-specific records and isolates invalid relationships | Return children only when `child.ParentID = selected NSAs.ID`; validate ownership with `NSAProfileID`; exclude missing-parent or mismatched records |
| Language-specific ternaries repeated across renderers | A localized-value resolver with an explicit fallback order | Prevents blank translated fields from hiding populated base fields and gives all cards the same language behavior | Test English, Spanish, blank translation, base-field fallback, and Year 3 Workplan values |
| `applyFilters()`, `handleSearchInput()`, and `showSearchResults()` | One pure filter/search function and one search-results renderer | Removes divergent limits, sorting, and filter combinations and allows all controls to use the same result set | Test search alone, every select alone, combined filters, no results, and sorting in the active language |
| Period and submission-type option builders plus hard-coded Organization Type options | One option builder based on the normalized public-cycle collection | Keeps filters aligned with export values and removes the mismatched hard-coded organization type | Confirm unique values come from `CollaborationPeriod`, `NSA_Status`, and `NSA Profiles.NSAOrganizationType` |
| Search results containing only the organization title | A cycle-label formatter | Lets a user distinguish multiple cycles belonging to the same organization | Render organization name, current type, and collaboration period while retaining `NSAs.ID` in `data-id` |
| Exported values interpolated by multiple `innerHTML` renderers | Shared safe text/line-break helpers used by every renderer | Establishes one output boundary and reduces stored-XSS risk during later changes | Test markup-like input in Profile, Activity, Workplan, yearly-result, focal-point, and website fields |
| The large `render()` function | A small coordinator calling profile, collaboration, financial, Activity, and Workplan renderers | Makes changes to one card less likely to regress other cards and clarifies which sections depend on submission type | Regression-test New Application, Renewal, and Progress Report visibility rules |
| Filter listeners and the Clear Filters listener updating state independently | Central state-update and reset functions | Keeps control values, search text, results, navigation, and selected cycle synchronized | Confirm a reset clears all visible and internal filter state and leaves a defined selected-cycle state |
| Hard-coded messages and language changes that update text only | Localized status/message lookup plus document-language update | Keeps errors, empty states, and assistive-technology language consistent with the selected UI language | Confirm messages and `<html lang>` change for English and Spanish |

## `ui-language.js` impact

Update `ui-language.js`; do not rewrite its structure. The English and Spanish
objects currently have matching keys, and all keys used by `app.js` exist.

| Change | Reason | Priority |
| --- | --- | --- |
| Add `year3` in English and Spanish | `renderYearlyResults()` must display existing Year 3 Workplan data | Critical |
| Reuse the existing `searchNoResults`, `noCollab`, and `noWorkplan` keys instead of hard-coded English messages | Equivalent translations already exist but are not used by the current renderers | Critical |
| Add localized keys for loading, load failure, partial-data failure, retry, NSA not found, no financial data, no Health Agenda, and no Strategic Plan | These messages are hard-coded, absent, or not visible in the current application | Critical for any state introduced or rendered by this refactor |
| Add a localized fallback for an untitled organization/cycle if that fallback remains visible | Search currently falls back to the English word `Untitled` | Critical |
| Rename `collabSubtitleProgresReport` to `collabSubtitleProgressReport` in both the language file and its caller | Corrects an internal typo while the language API is being touched | Maintenance |
| Set `document.documentElement.lang` to `en` or `es` when the language changes | The translated content and the document-language metadata must remain synchronized | Accessibility; no new translation key required |
| Review duplicate concepts such as `period`/`collabPeriod` and `orgType`/`orgTypeLabel` | Reduces ambiguity before removing unused keys | Maintenance |
| Correct visible Spanish wording such as `selectInput: "Selecione NSA"` and `governanza` | The current strings contain terminology/spelling issues | Content review |

Do not delete unused keys until both HTML and JavaScript consumers are checked;
some can replace current hard-coded messages. The source is valid UTF-8 and
does not require re-encoding.

## Recommended implementation sequence

1. Add focused tests around the current data normalization, cycle joins, and
   filtering before moving code.
2. Extract the pure Profile/submission normalization and cycle-selection rules.
   Keep `NSA Profiles.ID` as organization identity and `NSAs.ID` as selected UI
   identity.
3. Replace the three filtering/search paths with one pure function, then build
   all three select controls from the normalized public cycles.
4. Extend `ui-language.js`, introduce the localized-field resolver and safe
   rendering helpers, and apply them to every Profile, Activity, Workplan, and
   yearly-result output.
5. Split the large render flow by card and make `app.js` coordinate state,
   events, and those renderers.
6. Add visible loading/error states and complete reset and language behavior.
7. Run a browser smoke test for loading, selection, combined filtering,
   language switching, card navigation, and empty/error states.

## Data-refactor regression contract

The JavaScript refactor is complete only when the following rules remain true:

- `NSA Profiles.ID -> NSAs.NSAProfileID` supplies stable organization details.
- `NSAs.ID -> Activity.ParentID` and `NSAs.ID -> Workplan.ParentID` supplies the
  exact selected cycle's children.
- `NSA_Status`, not legacy `TypeOfSubmission`, supplies the current Type of
  Submission.
- `GovBodies_Status = Approved` or `Pending` determines public eligibility.
- Missing parents and mismatched children are isolated or excluded, never
  reassigned to a valid cycle.
- Multiple cycles with the same organization name remain independently
  selectable and visibly distinguishable.
- Blank localized fields fall back to available source content, including Year
  3 Workplan results.
- All plain exported text is escaped before insertion into HTML.
- Test `Pending` eligibility with a controlled fixture because the supplied
  export contains no Pending cycle.
- Re-run the validated scenarios for Profiles 43, 44, and 46. Profiles 44 and
  46 must pass; Profile 43 must remain **Pass with source-data exceptions**, with
  orphan children excluded from valid cycles.

## Final assessment

Refactor `app.js` incrementally and keep the current HTML structure. Update
`ui-language.js` for new and existing messages. Limit `index.html` changes to
dynamic-option cleanup and label corrections. No CSS change is required for the
DEV data refactor; responsive-layout remediation remains a separate task.
