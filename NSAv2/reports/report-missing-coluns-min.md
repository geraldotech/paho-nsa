# Minimum Columns for FTP JSON

## `nsa-profiles.json`

```text
ID
Title
NSAObjectives
NSAWorkFields
NSABoardMembers
NSAOrganizationBodies
NSAOrganizationType
NSAWebsite
NSAYearOfEstablishment
PAHO_Focal_Point
```

## `nsa.json`

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

## `activity.json`

```text
ID
ActivityID
ParentID
NSAProfileID
DescriptionENG
DescriptionSPA
DirectResultsENG
DirectResultsSPA
Entity
NSAFocalpoint
```

## `workplan.json`

```text
ID
Reference
ParentID
NSAProfileID
DescriptionENG
DescriptionSPA
ExpectedResultsENG
ExpectedResultsSPA
ResponsibleEntity
HealthAgendaENG
HealthAgendaSPA
StrategicPlanENG
StrategicPlanSPA
ProgressReportENG
ProgressReportSPA
Year1_Date
Year1_ResultsENG
Year1_ResultsSPA
Year2_Date
Year2_ResultsENG
Year2_ResultsSPA
NSAFocalpoint
```

## Required relationships

```text
nsa-profiles.ID = nsa.NSAProfileID
nsa.ID = activity.ParentID
nsa.ID = workplan.ParentID
```

## Rules

- Publish only records where `GovBodies_Status = "Approved"`.
- Use `NSA_Status` as the current submission type.
- Do not replace `ParentID` with `NSAProfileID`.
- Keep property names exactly as listed.
