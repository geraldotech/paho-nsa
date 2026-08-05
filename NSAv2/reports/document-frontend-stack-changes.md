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
4. [How this document supports the JavaScript refactor](#how-this-document-supports-the-javascript-refactor)
5. [PoC `index.js` compared with the current `app.js`](#poc-indexjs-compared-with-the-current-appjs)
6. [JavaScript refactoring map](#javascript-refactoring-map)
7. [`ui-language.js` impact](#ui-languagejs-impact)
8. [Recommended implementation sequence](#recommended-implementation-sequence)
9. [Data-refactor regression contract](#data-refactor-regression-contract)
10. [Final assessment](#final-assessment)

## Objective

Document the frontend changes required by the DEV data model and translate them
into an implementation guide for refactoring `app.js`. The guide identifies
which responsibilities must change, which behavior must be preserved, and how
each change can be verified without redesigning the existing interface.

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

## How this document supports the JavaScript refactor

The refactor is not only a file-organization exercise. It must protect the
validated data relationships while correcting behavior that is currently
duplicated or incomplete in `app.js`. This document provides the implementation
contract: developers can extract responsibilities in small steps and compare
the result against the same field, relationship, filtering, and rendering
rules.

The main benefit is a separation between data rules and DOM rendering. At
present, `app.js` loads the exports, creates joined records, manages state,
filters results, resolves language-specific values, renders HTML, creates
charts, and registers events. Because these responsibilities share global
state, a change to a filter or field fallback can affect several UI paths. The
target structure makes those rules explicit and independently testable while
keeping `app.js` as the application coordinator.

## PoC `index.js` compared with the current `app.js`

The four JSON files under
`NSAv2/NSAv2_starter_web_frontier/src/database/` are byte-for-byte identical to
the four files under `assets/database/`. The PoC therefore provides valid
behavioral evidence for the same supplied dataset. It is not, however, a
replacement implementation for the public frontend: its purpose is to expose
and validate relationships, while `app.js` must continue to support the public
layout, filters, languages, cards, navigation, and charts.

| Concern | PoC `src/index.js` | Current `assets/js/app.js` | Refactoring decision |
| --- | --- | --- | --- |
| Public eligibility | `isEligible()` correctly recognizes `Pending` and `Approved`, but the PoC displays eligible and non-eligible cycles for diagnostic purposes | The initial collection filters only `Approved` | Reuse the eligibility rule, but apply it as a public-data filter; do not copy the PoC behavior of displaying non-eligible cycles |
| Organization-to-cycle join | `getJoinedData()` finds all cycles with `NSAs.NSAProfileID = NSA Profiles.ID` | The initial mapping merges the matching Profile into each eligible submission | Extract the current merge into a pure normalizer, require a valid Profile match, and retain one normalized item per eligible cycle |
| Cycle-to-child join | Children are selected with `ParentID = NSAs.ID` | `render()` filters Activities and Workplans with `ParentID = currentId` | Preserve this rule and extract it from DOM rendering so it can be unit-tested |
| Ownership validation | The PoC compares child `NSAProfileID` with the cycle's organization and identifies missing-parent records separately | The current public renderer relies on `ParentID` and does not explicitly validate child ownership | Add an integrity check; exclude or isolate invalid/orphan records rather than showing them under another cycle |
| Identifier normalization | The PoC consistently normalizes IDs with `String(value ?? '').trim()` | The current code repeats `String(...)` and sometimes converts the selected ID to `Number` | Reuse a single string ID normalizer to avoid inconsistent comparisons and unnecessary numeric coercion |
| Loading behavior | `loadData()` disables the control and shows visible loading or failure status | `fetchJson()` returns `null`, after which startup silently substitutes an empty array | Adapt the visible-state concept to the existing page and localize it; do not copy the PoC's Portuguese messages or diagnostic DOM |
| Output safety | The PoC escapes every value inserted into its diagnostic HTML | The current renderers escape only some exported values | Reuse the safe-output principle across every public renderer, with a separate explicit policy if supported rich text must remain |
| Orphan presentation | Missing-parent children are deliberately displayed for data diagnosis | The public report has no diagnostic section | Do not expose the PoC orphan table in the public UI; isolate the records and surface an appropriate operational error or diagnostic log |
| Rendering and events | The PoC renders relationship tables for one Profile selector | The current frontend renders production cards, search, filters, language switching, navigation, and charts | Keep the current frontend renderers and DOM contract; none of the PoC table-rendering or event code should be ported |

One additional naming correction is recommended during extraction. The current
normalized object stores `NSA_Status` in a property named `TypeOfSubmission`.
Although the displayed value is usually correct, that alias can be confused
with the legacy source field of the same name. A name such as
`currentSubmissionType` makes the authoritative source explicit and prevents a
future renderer from reverting to legacy `TypeOfSubmission`.

## JavaScript refactoring map

The names below describe responsibilities; they do not require a framework or a
specific folder structure. They can first be introduced as pure functions and
then moved into ES modules when covered by tests.

| Current responsibility in `app.js` | Refactoring target | How it helps implementation | Required verification |
| --- | --- | --- | --- |
| Top-level JSON loading and conversion of failures to empty arrays | A data-loading function that returns explicit loading, success, partial-failure, and failure states | Prevents a failed export from appearing to the user as an organization with no data | Simulate one failed JSON request and confirm that the failed resource produces a visible error state |
| Inline Profile/submission merge used to create `nasas` | A pure `buildPublicCycles(profiles, submissions)` function | Centralizes public eligibility and authoritative field selection instead of scattering aliases through renderers | Include `Approved` and `Pending`; take organization name/type from `NSA Profiles`, current type from `NSAs.NSA_Status`, and period from `NSAs.CollaborationPeriod` |
| Global `currentId` plus Activity and Workplan filtering inside `render()` | A pure cycle-selection function using `NSAs.ID` and child `ParentID` | Preserves cycle-specific records when one organization has multiple submissions | Confirm that children are returned only when `child.ParentID = selected NSAs.ID`; never substitute `NSAProfileID` for this join |
| Language-specific ternaries repeated across renderers | A localized-value resolver with an explicit fallback order | Prevents blank translated fields from hiding populated base fields and gives all cards the same language behavior | Test English, Spanish, blank translation, base-field fallback, and Year 3 Workplan values |
| `applyFilters()`, `handleSearchInput()`, and `showSearchResults()` | One pure filter/search function and one search-results renderer | Removes divergent limits, sorting, and filter combinations and allows all controls to use the same result set | Test search alone, every select alone, combined filters, no results, and sorting in the active language |
| Period and submission-type option builders plus hard-coded Organization Type options | One option builder based on the normalized public-cycle collection | Keeps filters aligned with export values and removes the mismatched hard-coded organization type | Confirm unique values come from `CollaborationPeriod`, `NSA_Status`, and `NSA Profiles.NSAOrganizationType` |
| Search results containing only the organization title | A cycle-label formatter | Lets a user distinguish multiple cycles belonging to the same organization | Render organization name, current type, and collaboration period while retaining `NSAs.ID` in `data-id` |
| Exported values interpolated by multiple `innerHTML` renderers | Shared safe text/line-break helpers used by every renderer | Establishes one output boundary and reduces stored-XSS risk during later changes | Test markup-like input in Profile, Activity, Workplan, yearly-result, focal-point, and website fields |
| The large `render()` function | A small coordinator calling profile, collaboration, financial, Activity, and Workplan renderers | Makes changes to one card less likely to regress other cards and clarifies which sections depend on submission type | Regression-test New Application, Renewal, and Progress Report visibility rules |
| Filter listeners and the Clear Filters listener updating state independently | Central state-update and reset functions | Keeps control values, search text, results, navigation, and selected cycle synchronized | Confirm a reset clears all visible and internal filter state and leaves a defined selected-cycle state |
| Hard-coded messages and language changes that update text only | Localized status/message lookup plus document-language update | Keeps errors, empty states, and assistive-technology language consistent with the selected UI language | Confirm messages and `<html lang>` change for English and Spanish |

## `ui-language.js` impact

`ui-language.js` must change as part of the JavaScript refactor, but it does not
need a structural rewrite. Both language objects currently contain the same set
of keys, and every translation key referenced by `app.js` exists. The required
work is to route remaining user-visible strings through that file and add the
new states introduced by the refactor.

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

The scan found no missing key currently referenced by `app.js` and no key-set
difference between English and Spanish. It did find several defined but unused
keys. They should not be deleted automatically: some represent intended UI
copy and can replace current hard-coded messages. Remove a key only after its
HTML and JavaScript consumers have both been checked.

The source file is valid UTF-8. Any mojibake displayed by a shell that reads it
with a legacy default encoding is a tooling/display issue and is not evidence
that the translations should be re-encoded.

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

This order allows each extraction to be behavior-preserving before correctness
changes are added. It also creates testable seams without requiring a rewrite
or a change to the static deployment model.

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

Profiles 44 and 46 should continue to pass the application-level relationship
and rendering checks. Profile 43 should retain the result **Pass with
source-data exceptions** because its orphan child records cannot be assigned to
a missing cycle. A controlled fixture is required to test `Pending` eligibility
because the supplied export contains no Pending cycle.

## Final assessment

The critical changes concern the data placed into existing HTML controls; they
are implemented in `app.js`. The HTML structure itself remains compatible with
the DEV refactor. Changes made directly in `index.html` are limited to optional
cleanup and accessibility corrections. No CSS or layout change is required for
the DEV data refactor itself; the separate responsive-layout remediation remains
recommended by the UI/UX review.

The document helps the JavaScript refactor by defining the target
responsibilities, implementation order, and regression contract. This allows
the monolithic file to be reduced incrementally while preserving the existing
page and validating each data rule independently.
