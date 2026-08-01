# End-to-End Data Workflow Validation Report

| Item | Value |
|---|---|
| Application | NSA relationship viewer |
| Environment | Local DEV build using DEV JSON exports |
| Validation date | 2026-08-01 |
| Application entry point | `NSAv2_starter_web_frontier/index.html` |
| JavaScript under test | `NSAv2_starter_web_frontier/src/index.js` |
| Result | **Pass with source-data exceptions** |
| Handover | **Ready for ITS review** |

## Executive summary

This report validates the complete path followed by the data in the application,
from the four JSON files to the rendered interface. The PDF is used only to
define the expected relationships and field roles; the evidence below comes
from executing the current JavaScript with the current JSON files.

The end-to-end application flow passed for Profiles 43, 44, and 46:

- All four JSON files were served successfully over HTTP and parsed.
- `index.js` loaded the files into application state.
- NSAs were related to the selected organization by `NSAProfileID`.
- Activities and Workplans were related to the exact NSA cycle by `ParentID`.
- The current implementation kept children from different cycles separate.
- The expected cycles and children reached the interface.
- No duplicate IDs, duplicate references, or cross-organization mismatches were
  found.

The application also handled incomplete source data without mixing it into a
valid cycle. Four Profile 43 children whose parent cycle 60 is missing were
shown separately as orphans. One additional NSA/Workplan chain cannot be shown
under an organization because both records lack `NSAProfileID`.

## Files validated

- [index.html](../NSAv2_starter_web_frontier/index.html)
- [index.js](../NSAv2_starter_web_frontier/src/index.js)
- [nsa-profiles.json](../NSAv2_starter_web_frontier/src/database/nsa-profiles.json)
- [nsa.json](../NSAv2_starter_web_frontier/src/database/nsa.json)
- [activity.json](../NSAv2_starter_web_frontier/src/database/activity.json)
- [workplan.json](../NSAv2_starter_web_frontier/src/database/workplan.json)
- [Data Structure Reference PDF](../files/NSA.Tool.Data.Structure.for.Public.Report.pdf)

## Validated application flow

```mermaid
flowchart LR
    J["4 JSON files"] --> L["loadData / Promise.all"]
    L --> S["Application state"]
    S --> P["Select NSA Profile"]
    P --> N["Find cycles by NSAProfileID"]
    N --> C["Index cycle IDs"]
    C --> R["Find children by ParentID"]
    R --> V["Validate child NSAProfileID"]
    V --> U["Render cycles and children"]
    R --> O["Render missing-parent children separately"]
```

### Expected relationships

The PDF defines the expected joins. The application implements them as follows:

| Expected relationship | JavaScript behavior | Result |
|---|---|---|
| `NSA Profiles.ID = NSAs.NSAProfileID` | Filters NSAs by the selected Profile ID | Pass |
| `NSAs.ID = Activity.ParentID` | Builds the selected cycle-ID set and filters Activities by `ParentID` | Pass with 2 source-data orphans |
| `NSAs.ID = Workplan.ParentID` | Builds the selected cycle-ID set and filters Workplans by `ParentID` | Pass with 2 source-data orphans |
| `NSA Profiles.ID = child.NSAProfileID` | Checks that each rendered child belongs to the selected organization | Pass for all verifiable records |

The implementation correctly uses `NSAProfileID` for organization-level
selection and `ParentID` for cycle-level selection. It does not substitute one
relationship for the other.

## Test execution

The validation executed the actual `index.js` with a controlled DOM and the
four current JSON files. A local HTTP server was also used to verify that every
application resource is accessible through the same path used by the browser.

### Loading results

| Resource | HTTP result | Parsed records |
|---|---:|---:|
| `nsa-profiles.json` | 200 | 46 |
| `nsa.json` | 200 | 22 |
| `activity.json` | 200 | 14 |
| `workplan.json` | 200 | 34 |

The test confirmed that the four JSON paths were requested once, all responses
were parsed, `loadData()` completed, and the interface reported successful data
loading.

### Profile-to-interface results

| Profile | Cycles rendered | Activities rendered with a parent | Workplans rendered with a parent | Orphans shown separately | Result |
|---:|---:|---:|---:|---:|---|
| 43 | 2 | 2 | 2 | 4 | Partial pass due to source data |
| 44 | 2 | 2 | 2 | 0 | Pass |
| 46 | 4 | 2 | 6 | 0 | Pass |

#### Profile 43

- Cycles 96 and 97 reached the cycle table.
- Activities 42 and 43 and Workplans 73 and 74 reached cycle 96.
- Activities 38 and 39 and Workplans 60 and 61 did not enter cycle 96 because
  their `ParentID` is 60.
- The four records were preserved and displayed in the missing-parent section.

#### Profile 44

- The application selected Profile 44 by default.
- Cycles 100 and 101 reached the cycle table.
- Activities 45 and 46 and Workplans 79 and 80 reached cycle 100.
- No orphan section was displayed.

#### Profile 46

- Cycles 94, 95, 98, and 99 reached the cycle table.
- Activities 41 and 44 reached their respective cycles.
- Workplans 71, 72, 75, 76, 77, and 78 reached their respective cycles.
- No orphan section was displayed.

## NSA indexing/association regression

The correction is present in the current JavaScript:

1. It first finds every NSA cycle whose `NSAProfileID` matches the selected
   organization.
2. It creates a set containing the matching `NSAs.ID` values.
3. It retrieves Activities and Workplans only when their `ParentID` exists in
   that cycle-ID set.
4. It validates the child's `NSAProfileID` against the selected organization.
5. Children that match the organization but reference an absent cycle are
   isolated as orphans instead of being assigned to another cycle.

This prevents the previous association/indexing symptom in which an
organization ID could be confused with a cycle ID or children from different
cycles could be mixed. The regression passed for Profiles 43, 44, and 46.

This is an application-level regression result. The static frontend does not
query SharePoint, and it does not use `RenewalKey`; therefore this test does not
certify the physical SharePoint index configuration or SharePoint query
performance.

## Field behavior reaching the interface

The JavaScript follows the PDF guidance for the report-facing fields:

- The cycle table displays the current type from `NSA_Status`.
- `TypeOfSubmission` is not used as the current type filter.
- Eligibility is calculated only from `GovBodies_Status`, accepting Pending or
  Approved.
- `Status` is displayed as workflow progress and is not used for eligibility.
- `RenewalKey` is not exposed in the interface.

Profile 11 confirms the importance of this distinction: its relationships are
complete, but every cycle has `GovBodies_Status = null`. Even though cycles 91
and 92 have `GovBodies_Outcome = Approved`, the interface correctly cannot use
that working field as durable approval evidence.

## Integrity controls

| Control | Result | Evidence |
|---|---|---|
| Duplicate Profile IDs | Pass | 0 duplicates |
| Duplicate NSA cycle IDs | Pass | 0 duplicates |
| Duplicate Activity IDs or references | Pass | 0 duplicates |
| Duplicate Workplan IDs or references | Pass | 0 duplicates |
| Parent/child organization mismatch | Pass | 0 mismatches where the parent and organization IDs are available |
| Valid selected records lost before rendering | Pass | Expected records for Profiles 43, 44, and 46 reached the interface |
| Children assigned to the wrong cycle | Pass | Cycle lookup uses `ParentID`; missing parents are isolated |

## Source-data exceptions

1. `NSAs.ID = 60` is absent from `nsa.json`. Consequently, these Profile 43
   records have no cycle parent:
   - Activities 38 and 39
   - Workplans 60 and 61
2. `NSAs.ID = 41` has a blank `NSAProfileID`.
3. Workplan 44 uses `ParentID = 41` but also has a blank `NSAProfileID`.

The NSA 41/Workplan 44 pair has a cycle relationship, but it cannot be attached
to any organization or reached through the profile selector. This is a source
data limitation, not a loss introduced by the JavaScript.

## Acceptance and handover

| Requirement | Result |
|---|---|
| Four JSON files are loaded | Pass |
| JavaScript reads and relates the data | Pass |
| Tables and relationships operate correctly | Pass with documented source-data exceptions |
| NSA association/indexing correction is applied | Pass at application level |
| Resulting information reaches the interface | Pass for all valid records tested |
| No application-introduced loss, duplication, or incorrect association | Pass |

**Conclusion:** The current application correctly carries valid data from the
four JSON files through relationship processing to the rendered interface. It
does not mix cycles, duplicate records, or silently discard the four detected
orphans. The remaining failures originate in the exported data and are listed
above for correction or clarification.

**Handover:** Ready for ITS review with the test results and source-data
exceptions documented in this report.
