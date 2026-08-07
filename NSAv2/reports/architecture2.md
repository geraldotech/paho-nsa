# Data Architecture and UI Integration - DEV Data Refactor

## Table of Contents

- [Status and evidence](#status-and-evidence)
- [Architecture overview](#architecture-overview)
- [Scope](#scope)
- [Runtime flow](#runtime-flow)
- [Data structure](#data-structure)
- [Relationships](#relationships)
- [Confirmed data behavior](#confirmed-data-behavior)
- [Sidebar behavior](#sidebar-behavior)
- [Rendering behavior](#rendering-behavior)
- [Collaboration data resolution](#collaboration-data-resolution)
- [Activity and Workplan rendering](#activity-and-workplan-rendering)
- [Financial chart](#financial-chart)
- [Language behavior](#language-behavior)
- [DOM dependencies](#dom-dependencies)
- [Implementation and regression coverage](#implementation-and-regression-coverage)
- [Evidence limits](#evidence-limits)
- [Summary](#summary)

## Status and evidence

| Item | Value |
| --- | --- |
| Branch reviewed | `main` |
| Architecture status | Planned behavior for the incremental refactor |
| Current controller | `assets/js/app.js` |
| Data sources | Four static JSON exports |
| Runtime database | None |
| Document date | 2026-08-07 |
| Layout decision | Preserve the current HTML/CSS layout |

This report uses the following evidence:

- `NSAv2/files/NSA.Tool.Data.Structure.for.Public.Report.pdf` for authoritative
  object names, fields, keys, and relationships;
- `NSAv2/files/*.csv` and `assets/database/*.json` for supplied export evidence;
- `assets/js/app.js`, `assets/js/ui-language.js`, and `index.html` for current
  implementation evidence.

Planned changes are identified as such. They are not evidence that the behavior
or tests already exist.

## Architecture overview

The viewer remains a static client-side application. It loads `NSA Profiles`,
`NSAs`, `Activity`, and `Workplan` JSON exports, applies the confirmed
relationships, filters eligible `NSAs` records, selects by `NSAs.ID`, and
renders the existing report cards.

The refactor remains inside the current frontend stack. Focused functions in
`assets/js/app.js` will separate relationship checks, filtering, localized
fallbacks, safe formatting, and rendering coordination. No additional internal
JavaScript files, framework, build system, backend service, or runtime database
is required.

## Scope

Included:

- loading the four JSON exports and reporting failures;
- the five authoritative relationships;
- public eligibility and report field sources;
- filtering and selection by `NSAs.ID`;
- rendering, localization, safe output, and loading/error feedback;
- focused tests and browser regression coverage.

Excluded:

- framework or backend migration;
- SharePoint persistence or internal write behavior;
- physical indexing or query-performance claims;
- visual redesign and broader responsive-layout work.

## Runtime flow

### 1. Loading

`assets/js/app.js` requests these resources in parallel:

- `assets/database/nsa-profiles.json`
- `assets/database/nsa.json`
- `assets/database/activity.json`
- `assets/database/workplan.json`

Current implementation evidence: `fetchJson()` returns `null` after a failed
request, and startup converts a non-array response into an empty array. The
planned behavior must instead distinguish loading, resource failure, and valid
empty data in the visible interface.

### 2. Relationship preparation

After loading:

1. Compare source IDs consistently without renaming their keys.
2. Match `NSA Profiles.ID -> NSAs.NSAProfileID`.
3. Include only `NSAs` records where `NSAs.GovBodies_Status` is `Approved` or
   `Pending`.
4. Build filter values from `NSAs.NSA_Status`,
   `NSA Profiles.NSAOrganizationType`, and `NSAs.CollaborationPeriod`.

### 3. Selection and rendering

1. Store the selected `NSAs.ID`.
2. Retrieve `Activity` through `NSAs.ID -> Activity.ParentID`.
3. Retrieve `Workplan` through `NSAs.ID -> Workplan.ParentID`.
4. Validate ownership through `Activity.NSAProfileID` and
   `Workplan.NSAProfileID` against `NSA Profiles.ID`.
5. Resolve localized values and fallbacks before rendering.
6. Update the existing DOM targets and Chart.js canvas.

Search, select filters, reset, language changes, and record selection should use
one coordinated update path.

### 4. Current JavaScript files

| Existing file | Responsibility after refactoring |
| --- | --- |
| `assets/js/app.js` | Load the four resources, apply relationships and eligibility, manage filters and `NSAs.ID` selection, resolve fallbacks, protect output, handle events, and coordinate rendering |
| `assets/js/ui-language.js` | Store English and Spanish labels and messages |
| `assets/js/vendors/chart.js` | Provide the existing financial chart dependency; no refactor required |

`assets/js/app.js` is already loaded with `type="module"` and imports
`assets/js/ui-language.js`.

## Data structure

### 1. `NSA Profiles`

Each `NSA Profiles` record represents one organization.

<details>
<summary>Required fields used by the public report</summary>

```text
ID
Title
NSAOrganizationType
NSAObjectives
NSAWorkFields
NSABoardMembers
NSAOrganizationBodies
NSAWebsite
NSAYearOfEstablishment
PAHO_Focal_Point
```

</details>

### 2. `NSAs`

Each `NSAs` record is identified by `NSAs.ID` and links to `NSA Profiles`
through `NSAs.NSAProfileID`.

<details>
<summary>Required fields used by the public report</summary>

```text
ID
NSAProfileID
NSA_Status
GovBodies_Status
CollaborationPeriod
NSAFocalpointRole
FinAnnualIncome
FinAnnualExpenses
FinAssets
FinAnnualIncomeYear
CollabActHealthAgenda
CollabActHealthAgenda_txtENG
CollabActHealthAgenda_txtSPA
CollabActStrategicPlan
CollabActStrategicPlan_txtENG
CollabActStrategicPlan_txtSPA
CollabWPActHealthAgenda
CollabWPActHealthAgenda_txtENG
CollabWPActHealthAgenda_txtSPA
CollabWPActStrategicPlan
CollabWPActStrategicPlan_txtENG
CollabWPActStrategicPlan_txtSPA
```

</details>

`NSAs.NSA_Status` supplies the current Type of Submission.
`NSAs.GovBodies_Status` supplies public eligibility. Legacy
`NSAs.TypeOfSubmission`, workflow `NSAs.Status`, and
`NSAs.GovBodies_Outcome` do not replace these authoritative fields.

Current export evidence: `assets/database/nsa.json` does not contain the
financial and collaboration fields listed above. Those report sections cannot
be validated end to end until the export supplies the required fields.

### 3. `Activity`

<details>
<summary>Required fields used by the public report</summary>

```text
ID
ActivityID
ParentID
NSAProfileID
Description
DescriptionENG
DescriptionSPA
DirectResults
DirectResultsENG
DirectResultsSPA
Entity
NSAFocalpoint
```

</details>

`Activity.ParentID` identifies the related `NSAs.ID`.
`Activity.NSAProfileID` validates ownership against `NSA Profiles.ID`. Base
`Activity.Description` and `Activity.DirectResults` provide fallbacks when the
requested localized values are blank.

### 4. `Workplan`

<details>
<summary>Required fields used by the public report</summary>

```text
ID
Reference
ParentID
NSAProfileID
Description
DescriptionENG
DescriptionSPA
ExpectedResults
ExpectedResultsENG
ExpectedResultsSPA
ResponsibleEntity
HealthAgenda
HealthAgendaENG
HealthAgendaSPA
StrategicPlan
StrategicPlanENG
StrategicPlanSPA
ProgressReport
ProgressReportENG
ProgressReportSPA
Year1_Date
Year1_Results
Year1_ResultsENG
Year1_ResultsSPA
Year2_Date
Year2_Results
Year2_ResultsENG
Year2_ResultsSPA
Year3_Date
Year3_Results
Year3_ResultsENG
Year3_ResultsSPA
NSAFocalpoint
```

</details>

`Workplan.ParentID` identifies the related `NSAs.ID`.
`Workplan.NSAProfileID` validates ownership against `NSA Profiles.ID`. Base
text and result fields provide fallbacks when localized values are blank.

## Relationships

Use these relationships exactly:

```text
NSA Profiles.ID -> NSAs.NSAProfileID
NSAs.ID -> Activity.ParentID
NSAs.ID -> Workplan.ParentID
NSA Profiles.ID -> Activity.NSAProfileID
NSA Profiles.ID -> Workplan.NSAProfileID
```

Interpretation:

- `NSA Profiles.ID` identifies the organization.
- `NSAs.ID` identifies the selected `NSAs` record.
- `Activity.ParentID` and `Workplan.ParentID` retrieve records for that exact
  `NSAs.ID`.
- `Activity.NSAProfileID` and `Workplan.NSAProfileID` validate organization
  ownership; they never replace `Activity.ParentID` or `Workplan.ParentID`.
- More than one `NSAs` record may reference the same `NSA Profiles.ID`.

### Relationship diagram

```text
NSA Profiles
  NSA Profiles.ID
      |
      | NSA Profiles.ID -> NSAs.NSAProfileID
      v
NSAs
  NSAs.ID
      |
      +---- NSAs.ID -> Activity.ParentID ----> Activity
      |
      +---- NSAs.ID -> Workplan.ParentID ----> Workplan

NSA Profiles.ID -> Activity.NSAProfileID
NSA Profiles.ID -> Workplan.NSAProfileID
```

## Confirmed data behavior

### Public eligibility

Include an `NSAs` record only when:

```text
NSAs.GovBodies_Status = Approved
NSAs.GovBodies_Status = Pending
```

Current implementation difference: `assets/js/app.js` currently includes only
`NSAs.GovBodies_Status = Approved`. The supplied export contains no `NSAs`
record with `NSAs.GovBodies_Status = Pending`, so Pending requires a controlled
fixture or a future export.

### Required `NSA Profiles` match

An eligible `NSAs` record must match `NSA Profiles.ID` through
`NSAs.NSAProfileID`. An `NSAs` record without that match remains unassigned and
is excluded from the public result set.

### Activity and Workplan integrity

Render an `Activity` record only when:

- `Activity.ParentID = NSAs.ID` for the selected `NSAs` record; and
- `Activity.NSAProfileID = NSA Profiles.ID` for the matched organization.

Render a `Workplan` record only when:

- `Workplan.ParentID = NSAs.ID` for the selected `NSAs` record; and
- `Workplan.NSAProfileID = NSA Profiles.ID` for the matched organization.

Missing or mismatched `Activity` and `Workplan` records are excluded. They are
never reassigned to another `NSAs.ID`.

### Multiple `NSAs` records

`NSAs` records linked to the same `NSA Profiles.ID` remain separate. Search
labels must distinguish them with `NSA Profiles.Title`, `NSAs.NSA_Status`, and
`NSAs.CollaborationPeriod`. Selection and relationship checks continue to use
`NSAs.ID`.

## Sidebar behavior

### Search and filters

Consolidate the current overlapping search and filter paths so they use the same
result set and ordering.

- Search and sorting use `NSA Profiles.Title`.
- Each result shows `NSA Profiles.Title`, `NSAs.NSA_Status`, and
  `NSAs.CollaborationPeriod`.
- Each result retains `NSAs.ID` for selection.
- Type of Submission options come from `NSAs.NSA_Status`.
- Organization Type options come from
  `NSA Profiles.NSAOrganizationType`.
- Collaboration Period options come from `NSAs.CollaborationPeriod`.

### Clear Filters

Reset must clear search text and results, all select values, navigation state,
and the selected `NSAs.ID` according to one defined rule.

## Rendering behavior

### Source ownership

- Stable organization details come from `NSA Profiles`.
- Current Type of Submission comes from `NSAs.NSA_Status`.
- Collaboration Period comes from `NSAs.CollaborationPeriod`.
- Financial and collaboration values come from the selected `NSAs` record.
- Activity content comes from validated `Activity` records.
- Workplan and progress content comes from validated `Workplan` records.

### Safe output

- Escape exported plain text before inserting it into HTML.
- Convert line breaks only after escaping.
- Use `textContent` where markup is unnecessary.
- Allow only supported website protocols such as HTTP and HTTPS.
- Do not insert exported rich text without an explicit sanitization rule.

### Visible application states

| Condition | Required behavior |
| --- | --- |
| Initial load | Disable dependent controls and show a localized loading message |
| All required resources loaded | Enable controls and render the selected `NSAs.ID` |
| One resource unavailable | Identify the unavailable content and show a localized partial-data message |
| Required loading failed | Show a localized error and retry action |
| Valid query with no records | Show the corresponding localized empty message |

Loading failures must not appear as valid empty data. The loading state remains
active until relationship checks, filter option creation, and the first render
finish.

## Collaboration data resolution

The following precedence reflects the current `assets/js/app.js`
implementation and must retain the exact source fields.

### `NSAs.NSA_Status = Progress Report`

Health Agenda:

1. `NSAs.CollabWPActHealthAgenda`
2. `NSAs.CollabWPActHealthAgenda_txtENG` or
   `NSAs.CollabWPActHealthAgenda_txtSPA`
3. `Workplan.HealthAgendaENG` or `Workplan.HealthAgendaSPA` where
   `Workplan.ParentID = NSAs.ID`

Strategic Plan:

1. `NSAs.CollabWPActStrategicPlan`
2. `NSAs.CollabWPActStrategicPlan_txtENG` or
   `NSAs.CollabWPActStrategicPlan_txtSPA`
3. `Workplan.StrategicPlanENG` or `Workplan.StrategicPlanSPA` where
   `Workplan.ParentID = NSAs.ID`

### `NSAs.NSA_Status = New Application` or `Renewal`

Health Agenda:

1. `NSAs.CollabActHealthAgenda`
2. `NSAs.CollabActHealthAgenda_txtENG` or
   `NSAs.CollabActHealthAgenda_txtSPA`
3. `NSAs.CollabWPActHealthAgenda`
4. `Workplan.HealthAgendaENG` or `Workplan.HealthAgendaSPA` where
   `Workplan.ParentID = NSAs.ID`

Strategic Plan:

1. `NSAs.CollabActStrategicPlan`
2. `NSAs.CollabActStrategicPlan_txtENG` or
   `NSAs.CollabActStrategicPlan_txtSPA`
3. `NSAs.CollabWPActStrategicPlan`
4. `Workplan.StrategicPlanENG` or `Workplan.StrategicPlanSPA` where
   `Workplan.ParentID = NSAs.ID`

Current implementation evidence: `normalizeObjects()` converts the selected
value into the list shape expected by the existing render functions.

## Activity and Workplan rendering

### `NSAs.NSA_Status = New Application` or `Renewal`

The Activity card uses validated `Activity` records:

- `Activity.DescriptionENG` or `Activity.DescriptionSPA`, with
  `Activity.Description` as fallback;
- `Activity.DirectResultsENG` or `Activity.DirectResultsSPA`, with
  `Activity.DirectResults` as fallback;
- `Activity.Entity`.

The Workplan card uses validated `Workplan` records:

- `Workplan.DescriptionENG` or `Workplan.DescriptionSPA`, with
  `Workplan.Description` as fallback;
- `Workplan.ExpectedResultsENG` or `Workplan.ExpectedResultsSPA`, with
  `Workplan.ExpectedResults` as fallback;
- `Workplan.ResponsibleEntity`.

### `NSAs.NSA_Status = Progress Report`

The Activity display uses validated `Workplan` records:

- `Workplan.DescriptionENG` or `Workplan.DescriptionSPA`, with
  `Workplan.Description` as fallback;
- `Workplan.ProgressReportENG` or `Workplan.ProgressReportSPA`, with
  `Workplan.ProgressReport` as fallback;
- `Workplan.ResponsibleEntity`;
- available Year 1, Year 2, and Year 3 dates and results.

The prospective Workplan card is hidden. No Extension behavior is added without
new source evidence.

## Financial chart

The financial renderer uses these fields from the selected `NSAs` record:

- `NSAs.FinAnnualIncome`
- `NSAs.FinAnnualExpenses`
- `NSAs.FinAssets`
- `NSAs.FinAnnualIncomeYear`

Required behavior:

- format numeric values consistently;
- destroy the previous Chart.js instance before creating a replacement;
- show a localized empty message when all financial values are absent;
- hide the financial card and navigation when
  `NSAs.NSA_Status = Progress Report`.

## Language behavior

`assets/js/ui-language.js` remains the source for English and Spanish interface
text.

- Keep matching keys in both language objects.
- Translate loading, error, empty, no-result, and fallback messages.
- Add `year3` in both languages.
- Set `document.documentElement.lang` to the selected language.
- Apply the same localized-field fallback order across render functions.
- Re-render labels, values, sorting, results, messages, and the brand logo after
  a language change.

Remove a translation key only after checking its HTML and JavaScript consumers.

## DOM dependencies

Preserve the existing `index.html` report structure and IDs, including:

- `searchInput`
- `search-results`
- `period-select`
- `typeOfSubmission-type-input`
- `organization-type-input`
- `clear-filters`
- `nsa-title`
- `nsa-subtitle`
- `nsa-info`
- `nsa-activities`
- `workplans`
- `workplans-card`
- `financial_card`
- `financialBarChart`
- `FinAnnualIncomeYear`
- `collabWPActHealthAgendaObj`
- `strategicPlan`
- `card03`
- `card04`

Direct HTML changes are limited to:

- correcting the two filter label `for` attributes;
- optionally retaining only **All** where JavaScript generates select options;
- adding the loading/error status target requested for the interface.

Only loading-state styles are part of this data refactor. Broader responsive
layout work remains separate.

## Implementation and regression coverage

1. Add tests for the five relationships, eligibility, localized fallbacks, and
   filters.
2. Centralize ID comparison and relationship checks within
   `assets/js/app.js`.
3. Consolidate search, filters, sorting, option generation, and reset behavior.
4. Add safe output, base-field fallbacks, Workplan Year 3 output, and localized
   messages.
5. Split rendering into focused functions within `assets/js/app.js`.
6. Add loading, partial failure, error, retry, and valid empty states.
7. Run a browser smoke test for selection by `NSAs.ID`, filters, language,
   navigation, chart replacement, loading failure, and empty results.

Required regression evidence:

- Test `NSAs.GovBodies_Status = Pending` with a controlled fixture.
- `NSA Profiles.ID = 44` and `NSA Profiles.ID = 46` must pass.
- `NSA Profiles.ID = 43` must remain **Pass with source-data exceptions**.
- Exclude `Activity.ID = 38`, `Activity.ID = 39`, `Workplan.ID = 60`, and
  `Workplan.ID = 61` because they reference missing `NSAs.ID = 60`.
- Keep `NSAs.ID = 41` and `Workplan.ID = 44` unassigned because
  `NSAs.NSAProfileID` is missing.

## Evidence limits

- Keep the static deployment model.
- Do not claim SharePoint persistence, physical indexing, internal write
  behavior, or query performance from JSON/frontend tests.
- Report differences between the PDF, supplied exports, and implementation
  instead of silently resolving them.

## Summary

The refactor preserves the current page, JavaScript files, and deployment model.
`NSA Profiles.ID` identifies the organization, `NSAs.ID` identifies the selected
`NSAs` record, `Activity.ParentID` and `Workplan.ParentID` retrieve related
records, and `Activity.NSAProfileID` and `Workplan.NSAProfileID` validate
ownership. Public eligibility uses `NSAs.GovBodies_Status`, and current Type of
Submission uses `NSAs.NSA_Status`.
