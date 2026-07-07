# Data Architecture and UI Integration

## Scope

This document describes the current data architecture used by the NSA viewer in the `main` branch.
The application does not query a relational database at runtime. Instead, it loads static JSON files from `assets/database/` and resolves relationships client-side through `app.js`.

## Purpose

`assets/js/app.js` is the main client-side orchestration file for the NSA viewer.
It loads the JSON datasets, keeps the current UI state, applies sidebar filters,
and renders the selected NSA profile, activities, workplans, collaboration data,
and financial chart.

## Runtime Flow

### 1. Bootstrap

At startup, `app.js` loads these files in parallel with `Promise.all(...)`:

- `./assets/database/nsa.json`
- `./assets/database/activity.json`
- `./assets/database/workplan.json`

After loading:

- only NSA records with `Status === 'Completed'` are kept
- the initial language is `en`
- the initial selected NSA is `id = 18`
- `init()` runs
- `render()` runs

This means the page assumes all three JSON files are available and parse as arrays.

### 2. Main State

The file keeps global UI state in these variables:

- `currentLang`: active language, `en` or `es`
- `currentId`: currently selected NSA record id
- `barChart`: current Chart.js instance for the financial chart
- `filters.term`: sidebar text search
- `filters.typeOfSubmission`: selected submission type filter
- `filters.organizationType`: selected organization type filter
- `filters.period`: selected collaboration period filter

## Data Model

### 1. `nsa.json`

This is the parent dataset.
Each row represents one NSA profile.

Important fields used by `app.js`:

- `id`
- `Status`
- `TitleENG`
- `TitleENGSPA`
- `NSAWebsite`
- `NSAYearOfEstablishment`
- `NSAOrganizationType`
- `CollaborationPeriod`
- `TypeOfSubmission`
- `PAHOFocalPoint`
- `NSAFocalpointRoleENG`
- `NSAFocalpointRoleSPA`
- `NSAObjetivesENG`
- `NSAObjectives`
- `NSAWorkFieldsENG`
- `NSAWorkFieldsSPA`
- `NSABoardMembersENG`
- `NSABoardMembersSPA`
- `NSAOrganizationBodiesENG`
- `NSAOrganizationBodiesSPA`
- `FinAnnualIncome`
- `FinAnnualExpenses`
- `FinAssets`
- `FinAnnualIncomeYear`
- `CollabActHealthAgenda`
- `CollabActHealthAgenda_txtENG`
- `CollabActHealthAgenda_txtSPA`
- `CollabActStrategicPlan`
- `CollabActStrategicPlan_txtENG`
- `CollabActStrategicPlan_txtSPA`
- `CollabWPActHealthAgenda`
- `CollabWPActHealthAgenda_txtENG`
- `CollabWPActHealthAgenda_txtSPA`
- `CollabWPActStrategicPlan`
- `CollabWPActStrategicPlan_txtENG`
- `CollabWPActStrategicPlan_txtSPA`

### 2. `activity.json`

This is a child dataset linked by `ParentID`.
It is used mainly for standard activity rendering.

Important fields:

- `ParentID`
- `DescriptionENG`
- `DescriptionSPA`
- `DirectResultsENG`
- `DirectResultsSPA`
- `Entity`
- `NSAFocalpoint`

### 3. `workplan.json`

This is another child dataset linked by `ParentID`.
It is used for workplans and also for progress-report activity rendering.

Important fields:

- `ParentID`
- `DescriptionENG`
- `DescriptionSPA`
- `ExpectedResultsENG`
- `ExpectedResultsSPA`
- `ResponsibleEntity`
- `HealthAgendaENG`
- `HealthAgendaSPA`
- `StrategicPlanENG`
- `StrategicPlanSPA`
- `ProgressReportENG`
- `ProgressReportSPA`
- `TypeOfSubmission`
- `Year1_Date`
- `Year1_ResultsENG`
- `Year1_ResultsSPA`
- `Year2_Date`
- `Year2_ResultsENG`
- `Year2_ResultsSPA`
- `NSAFocalpoint`

## Relationships

### 1. NSA to activities

`nsa.id -> activity.ParentID`

The UI resolves this with:

```js
activity.filter((a) => String(a.ParentID) === String(currentId))
```

### 2. NSA to workplans

`nsa.id -> workplan.ParentID`

The UI resolves this with:

```js
workplan.filter((w) => String(w.ParentID) === String(currentId))
```

### 3. No direct activity to workplan join

`activity.json` and `workplan.json` are sibling datasets.
The page switches between them depending on the current NSA submission type.

## Relationship Diagram

```text
                 +----------------------+
                 |      nsa.json        |
                 |   PK: id             |
                 |   Status             |
                 |   TypeOfSubmission   |
                 |   Collaboration...   |
                 +----------+-----------+
                            |
              +-------------+-------------+
              |                           |
              | 1:N                       | 1:N
              |                           |
   +----------v-----------+   +-----------v----------+
   |    activity.json     |   |    workplan.json     |
   | FK: ParentID         |   | FK: ParentID         |
   | Description*         |   | Description*         |
   | DirectResults*       |   | ExpectedResults*     |
   | Entity               |   | ResponsibleEntity    |
   | NSAFocalpoint        |   | ProgressReport*      |
   +----------------------+   | HealthAgenda*        |
                              | StrategicPlan*       |
                              | NSAFocalpoint        |
                              +----------------------+
```

Important runtime note:

- only `nsa.json` records with `Status === 'Completed'` enter the UI state
- `workplan.json` is used both for normal workplans and for progress-report activities

## Behavioral Relationships Derived From Code

The raw relationships are simple, but `app.js` adds business rules on top of them.

### 1. Progress report behavior

When `TypeOfSubmission` contains `Progress Report - Reporte de Progreso`:

- the financial section is hidden
- the financial navigation item is hidden
- the workplan card is hidden
- the collaboration subtitle switches to the progress-report text
- the activities area is rendered from `workplan.json`, not `activity.json`

This makes `workplan.json` serve two roles:

- future workplan items in the normal flow
- current activity/progress content in the progress-report flow

### 2. Fallback sourcing behavior

Some UI sections are assembled from more than one dataset.

- `NSAFocalpoint` is searched first in related `activity.json` rows, then in related `workplan.json` rows
- collaboration tags can come from `nsa.json` summary fields or, if those are missing, from the first related `workplan.json` record

This is the practical reason the frontend has to handle plain strings, arrays, and normalized tag-like objects during rendering.

## Sidebar Behavior

### Search

Search is title-based.
The typed term is lowercased and matched against:

- `TitleENG`
- `TitleENGSPA`

The search does not look in descriptions, focal points, website, or ids.

Matching logic:

```js
const titleEng = String(n.TitleENG || '').toLowerCase()
const titleEngSpa = String(n.TitleENGSPA || '').toLowerCase()
return titleEng.includes(term) || titleEngSpa.includes(term)
```

Other search behavior:

- minimum search length is `1`
- results are sorted by `TitleENG`
- `applyFilters()` limits visible matches to `30`
- clicking a result sets `currentId` and re-renders the page

### Other filters

The sidebar also filters by:

- `TypeOfSubmission`
- `NSAOrganizationType`
- `CollaborationPeriod`

Combined behavior:

- all filters are applied together
- search results are recalculated on each change
- the clear button resets all filter state and select elements

## Rendering Rules

### 1. Profile section

`renderNSAProfile(...)` fills the main NSA identity and descriptive content.

Main mappings:

- title: `TitleENG` or `TitleENGSPA`
- subtitle: `TypeOfSubmission`
- website: `NSAWebsite`
- foundation year: `NSAYearOfEstablishment`
- organization type: `NSAOrganizationType`
- period: `CollaborationPeriod`
- PAHO focal point: `PAHOFocalPoint`
- NSA focal point: resolved from child datasets
- focal point role: `NSAFocalpointRoleENG` or `NSAFocalpointRoleSPA`
- objectives: `NSAObjetivesENG` or `NSAObjectives`
- work fields: `NSAWorkFieldsENG` or `NSAWorkFieldsSPA`
- board members: `NSABoardMembersENG` or `NSABoardMembersSPA`
- formal relations bodies: `NSAOrganizationBodiesENG` or `NSAOrganizationBodiesSPA`

### 2. Focal point fallback

`NSAFocalpoint` does not come directly from `nsa.json`.
The code resolves it in this order:

1. first related `activity.json` row with `NSAFocalpoint`
2. first related `workplan.json` row with `NSAFocalpoint`
3. `null`

### 3. Submission-type branching

The current `TypeOfSubmission` changes page behavior.

If it contains `Progress Report - Reporte de Progreso`:

- the financial card is hidden
- the financial navigation item is hidden
- the workplan card is hidden
- the collaboration subtitle changes
- the top disclaimer changes
- activities are rendered from `workplan.json`

If it contains `New Application - Nueva Aplicacion`:

- the collaboration subtitle uses a different label

Otherwise:

- the normal collaboration subtitle is used
- activities are rendered from `activity.json`
- workplans stay visible
- financials stay visible

## Collaboration Data Resolution

The collaboration cards do not always come from one field.
`app.js` resolves them by precedence and then normalizes the chosen value for rendering.

### Progress report flow

For Health Agenda:

1. `nsa.CollabWPActHealthAgenda`
2. localized `nsa.CollabWPActHealthAgenda_txtENG` or `_txtSPA`
3. first related workplan `HealthAgendaENG` or `HealthAgendaSPA`

For Strategic Plan:

1. `nsa.CollabWPActStrategicPlan`
2. localized `nsa.CollabWPActStrategicPlan_txtENG` or `_txtSPA`
3. first related workplan `StrategicPlanENG` or `StrategicPlanSPA`

### Normal flow

For Health Agenda:

1. `nsa.CollabActHealthAgenda`
2. localized `nsa.CollabActHealthAgenda_txtENG` or `_txtSPA`
3. `nsa.CollabWPActHealthAgenda`
4. first related workplan `HealthAgendaENG` or `HealthAgendaSPA`

For Strategic Plan:

1. `nsa.CollabActStrategicPlan`
2. localized `nsa.CollabActStrategicPlan_txtENG` or `_txtSPA`
3. `nsa.CollabWPActStrategicPlan`
4. first related workplan `StrategicPlanENG` or `StrategicPlanSPA`

After a source is chosen, `normalizeObjects(...)` converts it into a list of
`{ Label }` objects so the UI can render tags consistently.

## Activities and Workplans

### Standard activities

`renderActivities(...)` uses `activity.json` and shows:

- description
- direct results
- responsible entity

### Progress report activities

`renderActivitiesFromWorkplan(...)` uses `workplan.json` and shows:

- description
- extracted progress-report text
- responsible entity
- year 1 and year 2 result blocks when present

`getTextAfterLastBold(...)` strips HTML tags after the last `</b>` marker in the
progress-report text before rendering it.

### Workplans

`renderWorkplans(...)` uses `workplan.json` and shows:

- description
- expected results
- responsible entity

## Financial Chart

`renderFinancialCharts(...)` builds a Chart.js bar chart from:

- `FinAnnualIncome`
- `FinAnnualExpenses`
- `FinAssets`

Behavior:

- values are normalized to numbers with `toNumber(...)`
- labels are formatted with `formatNumber(...)`
- the fiscal year block uses `FinAnnualIncomeYear`
- if all raw financial fields are empty, the chart is destroyed and a
  "No financial data reported." message is shown instead

## Language Behavior

`currentLang` affects:

- titles and text labels from `ui-language.js`
- which dataset field is preferred for English vs Spanish content
- the sidebar placeholder and button labels
- the brand logo image

Language is changed by clicking elements with the `.lang-toggle` class.
Every change triggers `render()` and `applyLanguage()`.

## DOM Dependencies

`app.js` is tightly coupled to the page HTML.
It expects many specific ids to exist, including:

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

If the HTML structure changes, this file may stop rendering parts of the page.

## External Dependencies

`app.js` depends on:

- `ui-language.js` for translations
- `chart.js` being globally available for the financial chart
- three static JSON datasets in `assets/database/`: one master NSA dataset and two child datasets, activities and workplans

## Maintenance Notes

These points are useful when changing `app.js`:

- search and filter logic is duplicated between `applyFilters()` and `showSearchResults()`
- the file uses global mutable state rather than isolated components
- `fetchJson(...)` returns `null` on failure, so startup assumes successful JSON loading
- some rendered fields are escaped, but not every output path follows the same pattern
- if you document orphan `ParentID` counts, re-check them against the current JSON files because those counts can drift

## Short Summary

`app.js` is not only a data reader.
It is the runtime controller for:

- loading data
- keeping current state
- switching language
- applying sidebar filters
- selecting one NSA
- choosing activity/workplan behavior by submission type
- resolving fallback fields
- rendering charts and profile content
