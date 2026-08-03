# Review Current Web Codebase & UI/UX

| Item | Value |
| --- | --- |
| Application | PAHO NSA public report viewer |
| Review date | 2026-08-02 |
| Review type | Static code, HTML, CSS, data, accessibility, and UX review |
| Result | **Remediation recommended before further feature development** |

## Objective

Review the existing frontend codebase and UI/UX implementation, assess code
quality, identify technical debt, and document improvements required before
further development.

## Executive assessment

The current static HTML, CSS, and JavaScript stack is sufficient and does not
need to be replaced. The application already has a clear visual structure,
centralized translation labels, responsive content grids, and working
cycle-level Activity and Workplan joins.

Further feature development should follow remediation of the high-priority
findings below. The main risks are unsafe rendering of exported content, valid
data not reaching the interface, limited mobile behavior, filter correctness,
and keyboard/accessibility gaps. These issues can be corrected incrementally;
a frontend rewrite is not required.

## Scope reviewed

- [`assets/js/app.js`](../../assets/js/app.js): data loading, state, filtering,
  relationships, rendering, language behavior, and error handling;
- [`index.html`](../../index.html): structure, controls, semantics, and DOM
  dependencies;
- [`assets/css/styles.css`](../../assets/css/styles.css) and
  [`assets/css/sidebar.css`](../../assets/css/sidebar.css): layout,
  responsiveness, focus behavior, and maintainability;
- [`assets/js/ui-language.js`](../../assets/js/ui-language.js): English and
  Spanish UI coverage;
- the four current JSON exports, only where needed to verify frontend behavior.

## Positive findings

- The application remains deployable as a simple static site.
- Four JSON files are loaded in parallel.
- `NSA Profiles` data is joined to cycles by `NSAProfileID`.
- Activities and Workplans are retrieved by the exact cycle `ParentID`.
- Translation labels are centralized in `ui-language.js`.
- CSS variables provide a consistent base palette.
- Profile and metric grids have responsive column breakpoints.
- External website links use `noopener noreferrer`.
- Chart instances are destroyed before replacement, avoiding duplicate chart
  instances.
- An `escapeHtml()` helper already exists and can be reused more consistently.

## High-priority findings

### H1. Exported content is inserted into `innerHTML` without consistent escaping

Several renderers interpolate JSON values directly into HTML, including
Activity descriptions/results, Workplan expected results, yearly results,
responsible entities, Profile fields, and the website `href`. Only some output
paths call `escapeHtml()`.

**Impact:** malformed or hostile content in a SharePoint export can alter the
page or execute as stored cross-site scripting in the public site.

**Required improvement:** escape all plain-text fields before interpolation.
For fields that intentionally contain approved rich text, use an explicit HTML
sanitizer and an allowlist instead of rendering the raw value.

### H2. Valid Activity, Workplan, and Year 3 data can be omitted

The renderers prefer only translated fields such as `DescriptionENG`,
`DescriptionSPA`, and `Year1_ResultsENG`. In the current exports, many of these
translated fields are blank while the base fields (`Description`,
`DirectResults`, `ExpectedResults`, and `Year*_Results`) contain data.

`renderYearlyResults()` handles Year 1 and Year 2 only. The current Workplan
export contains eight records with Year 3 data, including records 71 and 72 for
approved cycle 94.

**Impact:** the interface can display `-` or omit report content that is present
in the source data.

**Required improvement:** define a consistent localized-field fallback and add
Year 3 rendering, labels, and tests. The fallback order should be documented so
that missing translations do not silently remove the base value.

### H3. The main layout is not responsive at mobile widths

The sidebar is fixed at `320px`, uses `height: 100vh` and `overflow: hidden`,
while the main area always keeps a `320px` left margin. Existing media queries
adjust grids and charts but do not change the sidebar/main layout.

**Impact:** narrow screens can show very little main content, and sidebar
controls can become unreachable on short screens.

**Required improvement:** add a mobile breakpoint that converts the sidebar to
a normal, collapsible, or off-canvas region; remove the fixed main margin at
that breakpoint; and allow the sidebar controls to scroll vertically.

### H4. Search and filters do not fully represent the current data model

- only `GovBodies_Status = Approved` enters the public collection, although the
  reference rule accepts Pending or Approved;
- Organization Type options are hard-coded and the NGO option does not match
  the singular value in the export;
- multiple cycles for one organization appear with the same title in search
  results, so the user cannot identify which cycle will be selected.

**Impact:** valid records can be excluded, a filter can return no expected
results, and users can select the wrong cycle.

**Required improvement:** apply the validated eligibility rule, generate filter
values from authoritative data, and label search results with organization
name, `NSA_Status`, and `CollaborationPeriod`.

### H5. Core interactions are not keyboard-accessible

The search results are clickable `<li>` elements without listbox/option
semantics or keyboard handling. Language controls are `<a>` elements without an
`href`. Search, Type of Submission, and Organization Type labels point to the
wrong control. CSS removes the default input outline and supplies only a subtle
border change.

**Impact:** keyboard and assistive-technology users cannot reliably operate the
search and language controls or identify focus.

**Required improvement:** implement an accessible combobox/listbox interaction
or use native controls, make language controls buttons or valid links, correct
label associations, add visible `:focus-visible` styles, and support Escape,
Arrow, and Enter behavior.

## Medium-priority findings

### M1. Data-loading failures have no user-facing state

`fetchJson()` logs an error and returns `null`. Startup then converts the failed
dataset to an empty array, and the page shows only `NSA not found` or empty
sections.

**Improvement:** add loading, empty, partial-data, and error states with a retry
or clear support message. Identify which resource failed without exposing
sensitive internals.

### M2. Search and filter logic is duplicated

Filtering is separately implemented in `applyFilters()`, `handleSearchInput()`,
and `showSearchResults()`. The search input receives two `input` listeners, and
the different paths do not apply identical limits and filters.

**Improvement:** create one pure filtering function and one render path. Attach
one listener per event and reuse the same result ordering, limit, and language
rules.

### M3. Clear Filters does not reset the complete visible state

The clear handler resets the filter object and select indexes but does not
clear the search input or results list. It also renders the previously selected
cycle rather than explicitly defining the intended reset selection.

**Improvement:** reset the input, list, select values, navigation visibility,
and selected-cycle behavior together.

### M4. Generated profile markup contains invalid semantics

Some generated Profile sections place `<dt>` elements inside `<p>` elements.
Definition terms are valid only inside `<dl>` structures.

**Improvement:** use consistent `<dl><dt><dd>` markup or ordinary headings and
paragraphs. Validate the generated DOM, not only the static HTML file.

### M5. Language support is incomplete

Changing language updates many labels but does not update the document
`<html lang>` value. Several empty/error messages remain hard-coded in English,
and search results are always sorted by the English title.

**Improvement:** update `document.documentElement.lang`, move all user-facing
messages to `ui-language.js`, and sort by the active-language label.

### M6. `app.js` is a monolithic controller without automated coverage

The file contains more than 1,000 lines and combines data access, normalization,
state, filtering, rendering, localization, Chart.js, and DOM events. No test,
lint, or formatting configuration is present in the reviewed frontend.

**Improvement:** extract pure modules for data normalization/joins, filtering,
localized field resolution, and formatting before adding more features. Add
unit tests for those modules and a small end-to-end smoke test for the rendered
workflow.

## Low-priority technical debt

| Finding | Improvement |
| --- | --- |
| `DEBUG` is enabled and logs records to the browser console | Disable debug output in production or gate it by environment |
| CSS selectors for metrics, charts, and field values are duplicated | Consolidate each selector into one authoritative rule |
| `sidebar.css` contains mostly commented or overlapping rules | Remove dead CSS or merge the remaining rules into the main stylesheet |
| DOM references and translation targets exist for elements that are absent or unused | Remove dead references or restore the intended elements |
| User messages use inconsistent wording such as `nas`, `NSA`, and `organization` | Standardize terminology in both languages |
| Internal names such as `isProcessReportType` contain inconsistent terminology | Rename for clarity when the JavaScript is modularized |

## Recommended remediation order

### Phase 1: protect data and restore complete output

1. Escape or sanitize every exported value rendered as HTML.
2. Add localized-field fallbacks and Year 3 rendering.
3. Correct eligibility, filter sources, and cycle identification.
4. Add explicit loading and failure states.

### Phase 2: make the interface usable across devices and input methods

1. Implement the mobile sidebar/main layout.
2. Make search and language controls keyboard-accessible.
3. Correct labels, focus states, semantic markup, and language state.
4. Make Clear Filters reset all visible state.

### Phase 3: reduce regression risk before new features

1. Consolidate search/filter logic.
2. Extract data, filter, render, and formatting modules from `app.js`.
3. Add unit tests, a browser smoke test, linting, and formatting.
4. Consolidate CSS and remove dead rules and debug code.

## Ready-for-development criteria

The frontend is ready for further feature development when:

- exported plain text cannot inject markup or script;
- Year 1, Year 2, and Year 3 source data reaches the interface with documented
  language fallbacks;
- public eligibility and all filters use the validated fields;
- multiple cycles are distinguishable;
- JSON failures produce a visible and actionable state;
- the page is usable at mobile and desktop widths;
- search, filters, language switching, and navigation work by keyboard;
- duplicated filtering logic is covered by automated tests;
- no high-priority finding remains open.

## Review limitations

This was a static review of the committed code and supplied data. It did not
include real-browser device testing, screen-reader testing, automated
accessibility scanning, production performance measurement, or penetration
testing. Those checks should be performed after the high-priority changes are
implemented.

## Conclusion

The current frontend is a workable foundation, but additional features should
not be layered onto the existing monolithic rendering flow before the
high-priority correctness, security, responsive-layout, and accessibility
issues are addressed. The recommended work is an incremental hardening and
modularization effort, not a rewrite.
