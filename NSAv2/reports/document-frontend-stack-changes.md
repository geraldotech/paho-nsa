#  Document Frontend Stack Changes

## Objective

all planned changes to the frontend stack, including JavaScript, CSS, and HTML modifications, with enough detail to support implementation and future maintenance.

## Classification

- **Critical:** required for the frontend to use the new fields or distinguish
  the new relationships correctly.
- **Not critical:** optional cleanup or accessibility improvement that does not
  block the data refactor.
- **No change:** the existing HTML already supports the refactored behavior.

## Current frontend use vs. HTML change

| Location in `index.html` | Current frontend use | Change level | Required change | Implemented in |
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

## Final assessment

The critical changes concern the data placed into existing HTML controls; they
are implemented in `app.js`. The HTML structure itself remains compatible with
the DEV refactor. Changes made directly in `index.html` are limited to optional
cleanup and accessibility corrections. No CSS or layout change is required.
