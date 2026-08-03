# AI Project Context and Working Instructions

## Purpose

This repository contains the PAHO Non-State Actors public report viewer and the
documentation for migrating it to the new DEV data structure.

Use this file to resume work in a new session or on another computer. Always
verify the current branch and working tree before acting because documentation
changes have previously been made on different branches.

## Communication and documentation style

- Communicate with the project owner in Portuguese unless asked otherwise.
- Keep project reports in English for ITS handover.
- Prefer direct, evidence-based reports without repeated explanations.
- Do not claim SharePoint persistence, physical indexing, or query performance
  from JSON/frontend tests.
- Do not commit, switch branches, or discard local changes unless explicitly
  requested.

## Repository map

### Current public frontend

- `index.html`: existing page structure and controls.
- `assets/js/app.js`: main application controller, data loading, joins, filters,
  rendering, language behavior, and charts.
- `assets/js/ui-language.js`: English and Spanish UI labels.
- `assets/css/styles.css`: main styles and responsive rules.
- `assets/css/sidebar.css`: small sidebar override file with legacy/commented
  rules.
- `assets/database/`: the four JSON exports used by the current frontend.
- `server.js`: local static server.

### DEV reference and PoC

- `NSAv2/NSAv2_starter_web_frontier/`: application-level PoC used to validate
  the new relationships.
- `NSAv2/files/NSA.Tool.Data.Structure.for.Public.Report.pdf`: authoritative
  data-structure and report-field reference.
- `NSAv2/files/*.csv`: supplied DEV exports.

### Reports

- `NSAv2/reports/architecture.md`: historical V1 architecture. It describes the
  original three-JSON model and may not match the current `app.js`.
- `NSAv2/reports/architecture2.md`: draft/update area for the new architecture.
- `NSAv2/reports/validate-dev-database-changes.md`: validates the four-list DEV
  structure and relationships.
- `NSAv2/reports/validate-end-to-end-data-workflow.md`: validates the
  application/PoC flow and rendering.
- `NSAv2/reports/document-frontend-stack-changes.md`: documents the HTML impact
  of the data refactor. Current conclusion: preserve layout and CSS; critical
  behavior changes are implemented in `app.js` using existing controls.
- `NSAv2/reports/review-current-web-codebase-ui-ux.md`: prioritized review of
  code quality, technical debt, accessibility, responsiveness, and UX.
- `NSAv2/reports/report-missing-coluns-min.md`: minimum JSON field contract.

## Authoritative data model

```text
NSA Profiles.ID
  -> NSAs.NSAProfileID

NSAs.ID
  -> Activity.ParentID
  -> Workplan.ParentID

NSA Profiles.ID
  -> Activity.NSAProfileID
  -> Workplan.NSAProfileID
```

Interpretation:

- `NSA Profiles.ID` is the stable organization identity.
- `NSAs.ID` is a specific submission/collaboration cycle.
- Use child `ParentID` to retrieve records for the exact cycle.
- Use child `NSAProfileID` only for organization ownership validation or a
  direct organization-level join.
- Never replace `ParentID` with `NSAProfileID`; one organization may have
  multiple cycles.

## Authoritative report fields

| Report purpose | Required source |
| --- | --- |
| Organization name and stable details | `NSA Profiles` |
| Organization type | `NSA Profiles.NSAOrganizationType` |
| Current Type of Submission | `NSAs.NSA_Status` |
| Collaboration period | `NSAs.CollaborationPeriod` |
| Final Governing Bodies decision | `NSAs.GovBodies_Status` |
| Public eligibility | `GovBodies_Status = Pending` or `Approved` |
| Activity/Workplan cycle | child `ParentID = NSAs.ID` |

Important rules:

- Do not use legacy `TypeOfSubmission` as the current type. `NSA_Status` can be
  updated to Progress Report after the original application or renewal.
- Do not use workflow `Status` or `GovBodies_Outcome` for durable public
  eligibility.
- `RenewalKey` is a backend/indexing field and has no report-facing role.
- No Extension scenario or value exists in the supplied code or exports. Do not
  add it to validation coverage without new evidence.

## Validated examples and source-data exceptions

- Profiles 44 and 46 passed 100% of the application-level relationship and
  rendering checks in the PoC.
- Profile 43 passed for its valid cycle but has source-data exceptions:
  Activities 38 and 39 and Workplans 60 and 61 reference missing
  `NSAs.ID = 60`.
- `NSAs.ID = 41` and Workplan 44 form a cycle chain but have no
  `NSAProfileID`, so they cannot be assigned to an organization.
- Missing or mismatched children must be isolated or excluded, never assigned
  to another valid cycle.
- Use the standard result wording: **Pass with source-data exceptions**.

## Confirmed frontend direction

- Keep the current static HTML/CSS/JavaScript stack.
- Preserve the current visual layout and CSS during the data refactor unless
  the owner explicitly requests a redesign.
- Reuse the existing search, selects, cards, navigation, language controls, and
  chart targets.
- Populate Type of Submission from `NSA_Status`.
- Populate Organization Type from `NSA Profiles.NSAOrganizationType`.
- Populate Collaboration Period from `NSAs.CollaborationPeriod`.
- Keep the selected UI identity as `NSAs.ID` so child `ParentID` joins remain
  cycle-specific.
- Make cycles with the same organization name distinguishable by current type
  and collaboration period.

## Current code review findings

Review `NSAv2/reports/review-current-web-codebase-ui-ux.md` before adding new
features. Its primary findings are:

1. Exported values are inserted into several `innerHTML` templates without
   consistent escaping or sanitization.
2. Base Activity/Workplan fields and Year 3 values can be omitted when
   translated fields are blank.
3. The fixed `320px` sidebar/main layout does not adapt correctly to mobile
   widths or short screens.
4. Eligibility, Organization Type options, and multiple-cycle search labels
   require correction.
5. Search results and language controls are not fully keyboard-accessible.
6. JSON loading failures have no useful visible error state.
7. Filtering is duplicated across multiple functions/listeners.
8. `app.js` is monolithic and has no automated test coverage.

Do not interpret the review as a request for a rewrite. The recommended path is
incremental hardening and modularization.

## Recommended next steps

1. Review and finalize `review-current-web-codebase-ui-ux.md` with the owner.
2. Refactor `assets/js/app.js` against the authoritative data rules above.
3. Protect all exported content rendered through `innerHTML`.
4. Add localized-field fallbacks and Year 3 rendering.
5. Correct public eligibility, dynamic filter values, and cycle labels.
6. Add visible loading/error states and consolidate filtering.
7. Validate mobile and keyboard behavior.
8. Add focused unit tests plus an end-to-end browser smoke test.
9. Re-run the relationship validation for Profiles 43, 44, and 46.

The current exports contain no Pending cycle. Test Pending eligibility with a
controlled fixture or a future export containing that value.

## Working procedure for future AI sessions

1. Run `git branch --show-current` and `git status --short` first.
2. Read this file and the report relevant to the requested task.
3. Treat `architecture.md` as V1 history, not automatically as current truth.
4. Verify claims against the current source and JSON files before editing a
   report.
5. Preserve unrelated user changes and do not overwrite dirty files blindly.
6. For documentation-only requests, do not modify production frontend code.
7. For implementation requests, verify behavior in proportion to risk and
   update the relevant report only when requested.
