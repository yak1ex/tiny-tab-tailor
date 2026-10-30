# TASKS.md

## Project objective

TinyTabTailor is a tiny Chrome extension to avoid duplicated tabs. It provides two features: (1) close duplicated tabs on demand via a toolbar button, and (2) automatically redirect new duplicate tabs to existing ones when opened by the user. URL matching starts with simple exact match.

## Scope and constraints

- In scope: Close duplicate tabs, redirect new duplicate tabs to existing ones, toolbar button for manual deduplication
- Out of scope: Firefox support, fuzzy URL matching, tab groups, settings UI
- Deployment target: Chrome browser extension (Manifest V3)
- Important constraints: Plain JavaScript only, no build step, service worker background script

## Current status

Core dedup logic (T001) is implemented as a testable ES module (`src/dedup.js`) and verified with `npm test` (8/8 unit tests pass). Manual toolbar dedup (T002) and automatic dedup (T003) are wired into the service worker; the original `chrome.tabs.onCreated` race in T003 (tab `url` is empty at creation) was fixed by switching to `chrome.tabs.onUpdated`. The extension loads in Chrome and its icon renders (user-confirmed). T002 and T003 runtime behavior awaits user verification in Chrome.

## Current plan

This ordered list expresses the agreed execution order. Task IDs provide stable identity only; their numbering does not imply priority or sequence. Continue actionable active work first. Otherwise, select the first actionable item here, skipping work that is blocked or waiting on the user without silently reordering the plan.

1. `T001` — Implement core tab deduplication logic

- Selection basis: Core functionality must be implemented first
- Last reviewed: 2026-10-22

2. `T002` — Implement toolbar button for manual deduplication

- Selection basis: User-facing trigger for feature 1
- Last reviewed: 2026-10-22

3. `T003` — Implement automatic deduplication on new tab creation

- Selection basis: Feature 2, depends on core logic from T001
- Last reviewed: 2026-10-22

## Active work

- Task: `none`
- Current step: T001 verified via unit tests. T002 and T003 are implemented in code and now waiting on user verification in Chrome, so no task is agent-actionable this cycle.
- Waiting on: `user`
- Required action: User reloads the extension in Chrome and verifies (T002) that clicking the toolbar button closes duplicates and shows a badge count, and (T003) that opening a duplicate tab redirects to the existing one without affecting `chrome://` tabs.

## Tasks

Use stable IDs. Append newly accepted work using the next unused ID. Never reuse an ID or renumber existing tasks without explicit user approval.

### T001 — Implement core tab deduplication logic

- Status: completed
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
  - `src/dedup.js` (ES module, no Chrome dependency): `shouldIgnoreUrl`, `groupTabsByUrl`, `findDuplicates`, `collectRemovals`, `keeperForUrl`. Duplicate groups keep the lowest tab id (oldest) and the input array is not mutated.
  - `src/background.js` imports these helpers; no dedup logic remains inline.
- Verification:
  - `npm test` (`node --test`, auto-discovers `tests/`): 8 unit tests pass covering URL filtering (http/https kept; missing/invalid/privileged ignored), grouping, keep-oldest duplicate selection, input non-mutation, removal id collection, and keeper lookup.
  - `node --check` passes for `src/dedup.js` and `src/background.js`.
- Remaining:
  - None.
- Notes:
  - URL matching is exact string comparison on `tab.url`
  - Ignore `chrome://` and `chrome-extension://` URLs to avoid closing system tabs (also `about:` and `edge:`)
  - Core logic lives in a module so it is unit-testable in Node; the service worker imports it via ES modules (see D005)

### T002 — Implement toolbar button for manual deduplication

- Status: in progress
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
  - `manifest.json` declares `action` with default title and icons at 16/32/48/128; icon renders in Chrome (user-confirmed via screenshot).
  - `chrome.action.onClicked` triggers `closeDuplicateTabs()`, which closes all non-oldest duplicates across all windows.
  - A badge flashes the closed-tab count for ~3s as feedback.
- Verification:
  - Not run in Chrome (UI/behavioral). Only `node --check` static parsing was done on `src/background.js`.
- Remaining:
  - Awaiting user verification in Chrome: confirm the button closes duplicates and the badge shows the count.
- Notes:
  - Use `chrome.action.onClicked` event
  - Badge feedback uses `chrome.action.setBadgeText`/`setBadgeBackgroundColor` with a `setTimeout` clear; the timer is best-effort (service worker may be terminated after 3s idle)

### T003 — Implement automatic deduplication on new tab creation

- Status: in progress
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
  - Replaced the original `chrome.tabs.onCreated` handler (which never triggered because a freshly created tab has an empty `url` / only `pendingUrl`) with a `chrome.tabs.onUpdated` listener that acts on `changeInfo.url`.
  - On a duplicate URL, `keeperForUrl` keeps the oldest tab (lowest id); the newer tab is closed. The keeper is focused only when the closed tab was active, so background duplicates close silently without stealing focus.
  - Reuses `shouldIgnoreUrl`, so `chrome://`/`chrome-extension://`/`about:` tabs are never touched.
- Verification:
  - Core grouping/keep-oldest logic is covered by T001 unit tests. The event wiring itself was not run (requires Chrome); only `node --check` static parsing was done.
- Remaining:
  - Awaiting user verification in Chrome: confirm duplicate opens via Ctrl+click / new tab are redirected to the existing tab, that privileged tabs are unaffected, and the expected brief new-tab flash.
- Notes:
  - `chrome.tabs.onCreated` cannot be used for URL matching (URL not yet set); see D004
  - There is still a brief visual "flash" of the new tab before it closes
  - Cannot reliably distinguish user-initiated from JS-initiated tab opens (see C003)

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

### D004 — Detect duplicates via onUpdated, not onCreated

- Date: 2026-10-22
- Status: accepted
- Decision: Automatic dedup listens to `chrome.tabs.onUpdated` (`changeInfo.url`) instead of `chrome.tabs.onCreated`.
- Rationale: `onCreated` fires before the new tab's final URL is populated (empty `url` / `pendingUrl`), so URL-based dedup cannot work there; `onUpdated` provides the resolved URL.
- Consequences:
  - Auto-dedup triggers whenever any tab navigates to a URL another tab already holds
  - Oldest tab (lowest id) is kept; background duplicates close without focus stealing
- Related tasks: `T003`

### D005 — Ship the service worker as an ES module

- Date: 2026-10-22
- Status: accepted
- Decision: `manifest.json` background uses `"type": "module"` and shared logic lives in `src/dedup.js` via `import`/`export`.
- Rationale: Separates pure logic from Chrome-dependent listeners so the logic is unit-testable in Node (T001 "testable/reusable" criterion).
- Consequences:
  - `package.json` sets `"type": "module"` so Node treats `.js` as ESM; test runner is `node --test`
  - No bundler; Chrome loads the module graph directly (still complies with D002's "no build step")
- Related tasks: `T001`, `T002`, `T003`

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
