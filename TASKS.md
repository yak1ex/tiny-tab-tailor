# TASKS.md

## Project objective

TinyTabTailor is a tiny Chrome extension to avoid duplicated tabs. It provides two features: (1) close duplicated tabs on demand via a toolbar button, and (2) automatically redirect new duplicate tabs to existing ones when opened by the user. URL matching starts with simple exact match.

## Scope and constraints

- In scope: Close duplicate tabs, redirect new duplicate tabs to existing ones, toolbar button for manual deduplication
- Out of scope: Firefox support, fuzzy URL matching, tab groups, settings UI
- Deployment target: Chrome browser extension (Manifest V3)
- Important constraints: Plain JavaScript only, no build step, service worker background script

## Current status

Project scaffold created. Initial implementation pending.

## Current plan

This ordered list expresses the agreed execution order. Task IDs provide stable identity only; their numbering does not imply priority or sequence. Continue actionable active work first. Otherwise, select the first actionable item here, skipping work that is blocked or waiting on the user without silently reordering the plan.

1. `T001` — Implement core tab deduplication logic

- Selection basis: Core functionality must be implemented first
- Last reviewed: 2026-10-01

2. `T002` — Implement toolbar button for manual deduplication

- Selection basis: User-facing trigger for feature 1
- Last reviewed: 2026-10-01

3. `T003` — Implement automatic deduplication on new tab creation

- Selection basis: Feature 2, depends on core logic from T001
- Last reviewed: 2026-10-01

## Active work

- Task: `none`
- Current step: None
- Waiting on: `none`
- Required action: None.

## Tasks

Use stable IDs. Append newly accepted work using the next unused ID. Never reuse an ID or renumber existing tasks without explicit user approval.

### T001 — Implement core tab deduplication logic

- Status: pending
- Objective: Create utility functions to identify and manage duplicate tabs based on exact URL matching.
- Scope:
  - Function to query all tabs and group by URL
  - Function to identify duplicates (tabs with same URL)
  - Function to close duplicate tabs, keeping the first/oldest one
- Acceptance criteria:
  - Can identify tabs with identical URLs
  - Can close duplicates while preserving one instance
  - Logic is testable and reusable
- Implemented:
  - None.
- Verification:
  - Not run.
- Remaining:
  - Implement `src/dedup.js` with core logic
  - Add unit tests or manual test procedure
- Notes:
  - URL matching is exact string comparison on `tab.url`
  - Ignore `chrome://` and `chrome-extension://` URLs to avoid closing system tabs

### T002 — Implement toolbar button for manual deduplication

- Status: pending
- Objective: Add a toolbar button that triggers manual deduplication when clicked.
- Scope:
  - Add action button to manifest
  - Create icon for the button
  - Wire click event to deduplication logic
- Acceptance criteria:
  - Toolbar button appears in Chrome
  - Clicking the button closes duplicate tabs
  - User receives feedback (e.g., badge count or notification)
- Implemented:
  - None.
- Verification:
  - Not run.
- Remaining:
  - Add action to `manifest.json`
  - Create icon files (16x16, 32x32, 48x48, 128x128)
  - Implement click handler in `src/background.js`
  - Test manually in Chrome
- Notes:
  - Use `chrome.action.onClicked` event
  - Consider showing count of closed tabs in badge

### T003 — Implement automatic deduplication on new tab creation

- Status: pending
- Objective: Automatically detect and redirect new duplicate tabs to existing ones.
- Scope:
  - Listen to `chrome.tabs.onCreated` event
  - Check if new tab URL matches an existing tab
  - If duplicate, close new tab and focus existing one
- Acceptance criteria:
  - New tabs with duplicate URLs are automatically closed
  - Existing tab is focused when duplicate is detected
  - No interference with `chrome://` and `chrome-extension://` URLs
- Implemented:
  - None.
- Verification:
  - Not run.
- Remaining:
  - Implement `onCreated` listener in `src/background.js`
  - Handle race conditions (tab may not have URL yet)
  - Test with various tab opening methods (Ctrl+Click, middle-click, new tab)
- Notes:
  - `chrome.tabs.onCreated` fires for all new tabs; cannot reliably distinguish user-initiated from JS-initiated
  - There will be a brief visual "flash" of the new tab before it closes
  - Consider adding a small delay to ensure tab URL is populated

## Decisions

Record short project decisions that affect future implementation. Use a separate design document when analysis, alternatives, diagrams, or specifications become substantial.

### D001 — Target Chrome only

- Date: 2026-10-01
- Status: accepted
- Decision: Target Chrome browser only using Manifest V3
- Rationale: Simplifies implementation; Firefox support can be added later if needed
- Consequences:
  - No cross-browser compatibility concerns
  - Firefox users cannot use the extension
- Related tasks: `T001`, `T002`, `T003`

### D002 — Plain JavaScript without build step

- Date: 2026-10-01
- Status: accepted
- Decision: Use plain JavaScript without TypeScript or bundler
- Rationale: Extension is small; build step adds complexity without significant benefit
- Consequences:
  - No type checking or advanced tooling
  - Simpler development and debugging
  - Files loaded directly by Chrome
- Related tasks: `T001`, `T002`, `T003`

### D003 — Exact URL matching

- Date: 2026-10-01
- Status: accepted
- Decision: Start with exact string matching for URLs
- Rationale: Simplest correct implementation; can be enhanced later
- Consequences:
  - Same page with different fragments or query parameters treated as different
  - May miss some duplicates that differ only in tracking parameters
- Related tasks: `T001`, `T003`

## Blocked items

Keep the primary task entry authoritative. This section is a compact index for visibility.

- None.

## Cancelled items

Keep the original task and ID with `Status: cancelled`; record the reason and replacement task where applicable.

- None.

## Candidate items

Items awaiting acceptance, prioritization, or feasibility analysis. They are not implementation tasks and must not be started merely because they appear here. Use stable `C###` IDs so discussion can continue across work cycles. When a candidate is accepted, create a new `T###` task and retain the candidate as a short record of its disposition.

### C001 — Fuzzy URL matching

- Origin: Initial project discussion
- Question: Should URL matching ignore query parameters, fragments, or tracking parameters?
- Possible relationship: `T001`, `T003`
- Disposition: awaiting triage
- Notes:
  - Could match `example.com/page` with `example.com/page?utm_source=twitter`
  - Could ignore fragments (`#section`)
  - Adds complexity; may have false positives

### C002 — Settings UI

- Origin: Initial project discussion
- Question: Should users be able to configure deduplication behavior?
- Possible relationship: Separate work
- Disposition: awaiting triage
- Notes:
  - Could allow whitelisting/blacklisting URLs
  - Could toggle automatic vs manual mode
  - Adds significant scope

### C003 — Distinguish user-initiated from JS-initiated tabs

- Origin: User requirement clarification
- Question: Is it possible to reliably filter for user-initiated tab opens only?
- Possible relationship: `T003`
- Disposition: awaiting triage
- Notes:
  - `chrome.tabs.onCreated` fires for all new tabs
  - `tab.openerTabId` is set for both Ctrl+Click and `window.open()`
  - May require content scripts and heuristics; reliability uncertain
