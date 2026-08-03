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

## High priority

These findings should be resolved before further feature development.

| ID | Area | Finding and evidence | Impact | Required improvement |
| --- | --- | --- | --- | --- |
| H1 | Security | Several renderers interpolate exported Activity, Workplan, yearly-result, responsible-entity, Profile, and website values directly into `innerHTML`. Only some output paths use `escapeHtml()`. | Malformed or hostile exported content can alter the page or execute as stored cross-site scripting. | Escape every plain-text value before interpolation. Sanitize intentionally supported rich text with an explicit allowlist. |
| H2 | Data completeness | Renderers prefer translated fields even when they are blank and the base fields contain data. `renderYearlyResults()` handles only Years 1 and 2, although eight current Workplan records contain Year 3 data, including records 71 and 72 for approved cycle 94. | The interface can display `-` or omit report content present in the source data. | Define and document a consistent localized-field fallback; add Year 3 rendering, labels, and tests. |
| H3 | Responsive layout | The sidebar is fixed at `320px` with `height: 100vh` and `overflow: hidden`; the main area always retains a `320px` left margin. Existing media queries do not alter this layout. | Narrow screens show little main content, and controls can become unreachable on short screens. | Add a mobile breakpoint with a normal, collapsible, or off-canvas sidebar; remove the fixed main margin and allow vertical scrolling. |
| H4 | Data correctness and UX | Public data includes only `GovBodies_Status = Approved`, although Pending is also eligible. Organization Type options are hard-coded and include a mismatched NGO value. Search results do not distinguish multiple cycles for the same organization. | Valid records can be excluded, filters can return incorrect results, and users can select the wrong cycle. | Apply the validated eligibility rule, generate filter values from authoritative data, and label results with organization name, `NSA_Status`, and `CollaborationPeriod`. |
| H5 | Accessibility | Search results are clickable `<li>` elements without keyboard behavior or listbox semantics. Language controls are anchors without `href`. Several labels target the wrong controls, and focus indication is insufficient. | Keyboard and assistive-technology users cannot reliably operate controls or identify focus. | Implement an accessible combobox/listbox or native controls; correct control semantics and labels; add visible `:focus-visible` styling and Escape, Arrow, and Enter behavior. |

## Medium priority

These findings should be included in the same remediation cycle when they
overlap with high-priority work.

| ID | Area | Finding and evidence | Impact | Required improvement |
| --- | --- | --- | --- | --- |
| M1 | Reliability | `fetchJson()` logs an error and returns `null`; startup converts the failed dataset to an empty array. | Users see only `NSA not found` or empty sections and cannot distinguish a loading failure from missing data. | Add loading, empty, partial-data, and error states with retry or a clear support message. Identify the failed resource without exposing sensitive internals. |
| M2 | Maintainability | Filtering is implemented separately in `applyFilters()`, `handleSearchInput()`, and `showSearchResults()`. The search input has two `input` listeners, and the paths apply different limits and filters. | Behavior can diverge and regress as filtering changes. | Create one pure filtering function and one render path; use one listener per event and consistent ordering, limits, and language rules. |
| M3 | UX | Clear Filters resets filter state and select indexes but leaves the search input and results list populated and renders the previously selected cycle. | The visible interface does not match its reset state. | Reset the input, results list, select values, navigation visibility, and selected-cycle behavior together. |
| M4 | Semantics | Generated Profile sections place some `<dt>` elements inside `<p>` elements, although definition terms are valid only inside `<dl>`. | The generated DOM is invalid and less reliable for assistive technology. | Use consistent `<dl><dt><dd>` markup or ordinary headings and paragraphs; validate the generated DOM. |
| M5 | Localization | Language changes do not update `<html lang>`. Several empty/error messages remain hard-coded in English, and search results are always sorted by the English title. | Document language, messages, and result order can conflict with the selected language. | Update `document.documentElement.lang`, move user-facing messages to `ui-language.js`, and sort using the active-language label. |
| M6 | Maintainability and testing | `app.js` exceeds 1,000 lines and combines data access, normalization, state, filtering, rendering, localization, charts, and DOM events. No frontend test, lint, or formatting configuration is present. | Changes carry a high regression risk and are difficult to isolate. | Extract pure modules for normalization, joins, filtering, localized-field resolution, and formatting; add unit tests and a browser smoke test. |

## Low-priority technical debt

| Finding | Improvement |
| --- | --- |
| `DEBUG` is enabled and logs records to the browser console | Disable debug output in production or gate it by environment |
| CSS selectors for metrics, charts, and field values are duplicated | Consolidate each selector into one authoritative rule |
| `sidebar.css` contains mostly commented or overlapping rules | Remove dead CSS or merge the remaining rules into the main stylesheet |
| DOM references and translation targets exist for elements that are absent or unused | Remove dead references or restore the intended elements |
| User messages use inconsistent wording such as `nas`, `NSA`, and `organization` | Standardize terminology in both languages |
| Internal names such as `isProcessReportType` contain inconsistent terminology | Rename for clarity when the JavaScript is modularized |

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
