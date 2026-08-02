# HTML Impact of the DEV Data Refactor

## Objective

Validate whether `index.html` must change when `app.js` is refactored for the
new DEV data structure.

## Validation result

**No mandatory HTML change is required.**

The current page already contains the search, filters, cards, navigation,
language controls, disclaimers, and chart targets needed by the refactored
JavaScript. The new `NSA Profiles` dataset and relationship logic affect data
loading and processing in `app.js`, not the page structure.

`app.js` can continue using the existing selects and replace their options at
startup:

- populate Type of Submission from `NSAs.NSA_Status`;
- populate Organization Type from `NSA Profiles.NSAOrganizationType`;
- populate Collaboration Period from `NSAs.CollaborationPeriod`.

No new input, select, card, section, or navigation item is needed.

## Optional HTML cleanup

These corrections are useful but are not required by the DEV data migration:

- remove the hard-coded options from the Type of Submission and Organization
  Type selects, leaving only **All** as the initial option;
- change the Type of Submission label to
  `for="typeOfSubmission-type-input"`;
- change the Organization Type label to
  `for="organization-type-input"`.

## Conclusion

Preserve the existing HTML and CSS. The required refactoring belongs in
`assets/js/app.js`; `index.html` needs no functional or structural change.
