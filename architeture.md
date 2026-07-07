# Data Architecture

## Overview

The current `main` branch uses a client-side data model loaded from three JSON datasets in [assets/js/app.js]

- `./assets/database/nsa.json`
- `./assets/database/activity.json`
- `./assets/database/workplan.json`
They are loaded in parallel with `Promise.all(...)` and then combined in memory by the UI.

## Main Tables

### 1. `nsa.json`

This is the primary master dataset. Each record represents one NSA profile and acts as the parent entity for the rest of the application.

Key characteristics:

- Primary key used by the UI: `id`
- The application filters only completed NSA status records.


#### NSA profile section:
- fields: `TitleENG`, `TitleENGSPA`, `NSAWebsite`, `NSAYearOfEstablishment`, `NSAOrganizationType`, `CollaborationPeriod`, `TypeOfSubmission`

#### Focal points:

- PAHO focal point -comes from PAHOFocalPoint `(nsa.json)`

- NSA focal point - coming from NSAFocalpoint `(activity.json)` or `(workplan.json)`

- Focal point title - coming from NSAFocalpointRoleENG `(nsa.json)`

#### Description:

- Objectives
  - coming from NSAObjetivesENG `(nsa.json)`

- Main areas of work
  - coming from NSAWorkFieldsENG `(nsa.json)`



#### Governance & formal relations

- Governing body members and affiliations
  - coming from NSABoardMembersENG `(nsa.json)`

- UN & NGOs in Formal Relations with the NSA
  - coming from NSAOrganizationBodiesENG `(nsa.json)`


#### Financial information

  - `FinAnnualIncome`  coming from FinAnnualIncome `(nsa.json)`
  - `FinAnnualExpenses`, coming from FinAnnualExpenses `(nsa.json)`
  - `FinAssets` coming from FinAssets `(nsa.json)`
  - `fiscal year`. coming from FinAnnualIncomeYear `(nsa.json)`

#### Collaboration with PAHO

- Activities carried out over the past two years

- Sustainable Health Agenda for the Americas 2018–2030

- PAHO Strategic Plan 2020 - 2025


- Collaboration summary fields: 

- `CollabActHealthAgenda`, 
- `CollabActStrategicPlan`, 
- `CollabWPActHealthAgenda`, 
- `CollabWPActStrategicPlan`





#### Sidebar:

- Search uses the NSA title fields from `nsa.json`. It lowercases the search term and matches it against `TitleENG` and `TitleENGSPA`, so users can find an NSA by either English or Spanish title text.
- type of submission select: unique `TypeOfSubmission` values such as `New Application - Nueva Aplicación`, `Progress Report - Reporte de Progreso`, and `Renewal - Renovación`
- collaboration period select: year ranges from `CollaborationPeriod`
- organization type select: `Non-governmental Organizations`, `Philanthropic Foundation` (matched against `NSAOrganizationType`)
Runtime rule:


### 2. `activity.json`

This dataset stores past activities associated with an NSA.

Key characteristics:

- Foreign key to `nsa.json`: `ParentID`
- Main content fields: `DescriptionENG`, `DescriptionSPA`, `DirectResultsENG`, `DirectResultsSPA`
- Responsible party field: `Entity`
- Shared contextual fields: `NSAFocalpoint`, `NSA_x0020_Name`

Functional role in the UI:

- Used to render the "Activities carried out" section for standard submissions.
- Also acts as one possible source for `NSAFocalpoint`.

### 3. `workplan.json`

This dataset stores planned workplan items and, in some flows, progress-report activity data.

Key characteristics:

- Foreign key to `nsa.json`: `ParentID`
- Main workplan fields: `DescriptionENG`, `DescriptionSPA`, `ExpectedResultsENG`, `ExpectedResultsSPA`, `ResponsibleEntity`
- Strategic classification fields: `HealthAgendaENG`, `HealthAgendaSPA`, `StrategicPlanENG`, `StrategicPlanSPA`
- Progress-report fields: `ProgressReport`, `TypeOfSubmission`, `Year1_*`, `Year2_*`, `Year3_*`
- Shared contextual fields: `NSAFocalpoint`, `NSA_x0020_Name`

Functional role in the UI:

- Used to render the "Workplan" section for normal flows.
- Used as the activity source for progress-report submissions.
- Used as a fallback source for Health Agenda / Strategic Plan labels and for `NSAFocalpoint`.

## Relationships

### 1. `nsa.id -> activity.ParentID`

This is a one-to-many relationship.

- One NSA can have many activity records.
- Each activity record belongs to exactly one NSA in the intended model.
- The UI resolves this with:
  - `activity.filter((a) => String(a.ParentID) === String(currentId))`

### 2. `nsa.id -> workplan.ParentID`

This is also a one-to-many relationship.

- One NSA can have many workplan records.
- Each workplan record belongs to one NSA in the intended model.
- The UI resolves this with:
  - `workplan.filter((w) => String(w.ParentID) === String(currentId))`

### 3. No direct `activity <-> workplan` foreign key

There is no direct relational join between `activity.json` and `workplan.json`.

Instead:

- both datasets are siblings under the same NSA record;
- both are linked indirectly through the same `nsa.id`;
- the UI chooses which child dataset to render depending on `nsa.TypeOfSubmission`.

## Behavioral Relationships Derived From Code

The code establishes a few non-obvious relationships beyond simple foreign keys:

### Progress report behavior

When `nsa.TypeOfSubmission` contains `Progress Report - Reporte de Progreso`:

- the financial section is hidden;
- the workplan card is hidden;
- the "activities" area is rendered from `workplan.json`, not from `activity.json`.

So, in practice, `workplan.json` plays two roles:

- future workplan items in the normal flow;
- current progress-report items in the progress-report flow.

### Fallback sourcing

Some fields are not sourced from a single table:

- `NSAFocalpoint` is searched first in `activity.json`, then in `workplan.json`
- Workplan collaboration tags can come from:
  - `nsa.json` summary fields, or
  - the first related `workplan.json` record

This means the frontend is designed to handle JSON data, arrays, and pre-assembled records.

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
   | NSAFocalpoint        |   | ProgressReport       |
   +----------------------+   | HealthAgenda*        |
                              | StrategicPlan*       |
                              | NSAFocalpoint        |
                              +----------------------+
```

## Data Quality Notes

- `activity.json` currently has no orphan `ParentID` values relative to `nsa.json`.
- `workplan.json` currently has 1 orphan record whose `ParentID` does not exist in `nsa.json`.
- Because the UI filters `nsa.json` to `Status === "Completed"`, child records linked to non-active or missing NSA records are not reachable in the normal interface.

## Summary

The current architecture is centered on `nsa.json` as the root entity:

- `nsa.json` = parent/master record
- `activity.json` = historical child records
- `workplan.json` = planning child records, plus progress-report records in specific flows

The core relationships are simple one-to-many joins through `ParentID`, but the frontend adds business rules and fallback sourcing that make `workplan.json` function as both a planning table and a reporting table depending on submission type.
