# Complete NSA Workflow Validation - Scope and Comparison

## Objective

Validate that the complete NSA workflow captures, processes, and stores data
correctly across all supported scenarios, including:

- New application
- Renewal
- Extension
- Any other supported submission or lifecycle scenario

The validation must also confirm that the previous indexing issue remains
resolved during real workflow execution and that each stage of the NSA cycle is
stored correctly in the related tables.

This activity can begin only after approximately **20 July**, when the required
environment and test data are available.

## Difference from the previous validation

| Previous task: DEV database structure | New task: complete NSA workflow |
|---|---|
| Focused on the technical database structure | Focuses on the functional, end-to-end process |
| Validated the additional `NSA Profiles` ("abuela") table | Validates all supported NSA lifecycle scenarios |
| Reviewed table relationships and reference integrity | Verifies data creation and updates throughout the workflow |
| Assessed the proposed indexing strategy | Regression-tests the indexing fix under actual workflow use |
| Considered structural and performance expectations | Confirms functional behavior, persistence, and expected performance |
| Produced a database-structure assessment | Requires documented results and formal handover to ITS |

In summary, the previous task asked whether the database foundation was
structured correctly. The new task asks whether the complete application
workflow uses that foundation correctly in every supported scenario.

## Required validation

For each supported scenario, validate that:

1. The NSA Profile identifies the organization correctly.
2. A new NSA submission or cycle is created with the correct submission type.
3. The submission is linked to the correct NSA Profile.
4. Activity and Workplan records are linked to the correct submission/cycle.
5. Status changes and lifecycle transitions are saved correctly.
6. Renewal and extension processes preserve the organization identity while
   creating or updating the appropriate cycle records.
7. No data is lost, duplicated, assigned to another organization, or linked to
   the wrong submission.
8. The previous indexing issue cannot be reproduced.
9. Indexed queries and operations return the correct records with acceptable
   performance.

## NSA cycle relationship checks

The expected relationship model is:

```text
NSA Profiles.ID
  -> NSAs.NSAProfileID

NSAs.ID
  -> Collaboration Activity.ParentID
  -> Collaboration Workplan.ParentID

NSA Profiles.ID
  -> Collaboration Activity.NSAProfileID
  -> Collaboration Workplan.NSAProfileID
```

The validation must distinguish between:

- **Organization identity:** `NSA Profiles.ID` / `NSAProfileID`
- **Submission or cycle identity:** `NSAs.ID` / `ParentID`

An organization may have multiple NSA submissions or cycles. Therefore,
`NSAProfileID` must remain stable for the organization, while `ParentID` must
identify the correct new application, renewal, extension, or other cycle.

## Indexing regression checks

The workflow validation should confirm that:

- Records are retrieved using the intended indexed fields.
- Filtering and relationship lookups return the correct submission and profile.
- Larger data volumes do not reintroduce list-threshold or timeout failures.
- Renewal and extension operations do not overwrite or retrieve the wrong NSA
  cycle.
- Query execution remains within the agreed performance expectations.

Database exports alone are not sufficient evidence for these checks. The
physical index configuration, executed queries, test results, and observed
response times should be recorded.

## Evidence and handover to ITS

The final validation report should include:

- Environment and build/version tested
- Validation date and tester
- Test data used
- Scenarios and steps executed
- Expected and actual results
- Record identifiers created or updated in each table
- Evidence of correct relationships and lifecycle persistence
- Index configuration and indexing regression results
- Performance observations or measurements
- Defects, limitations, and unresolved risks
- Overall pass/fail result for each scenario
- Final conclusion and handover status to ITS

## Expected outcome

The task is complete when every supported workflow scenario has been exercised,
the complete NSA cycle has been verified in the related tables, the indexing
fix has passed regression and performance checks, and the documented results
have been handed over to ITS.
