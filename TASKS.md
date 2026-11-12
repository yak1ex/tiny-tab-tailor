# TASKS.md

## Project objective

TinyTabTailor is a tiny Chrome extension to avoid duplicated tabs. It provides two features: (1) close duplicated tabs on demand via a toolbar button, and (2) automatically redirect new duplicate tabs to existing ones when opened by the user. URL matching starts with simple exact match.

## Scope and constraints

- In scope: Close duplicate tabs, redirect new duplicate tabs to existing ones, toolbar button for manual deduplication
- Out of scope: Firefox support, fuzzy URL matching, tab groups, settings UI
- Deployment target: Chrome browser extension (Manifest V3)
- Important constraints: Plain JavaScript only, no build step, service worker background script

## Current status

All three planned tasks (T001–T003) are completed and verified. New work (T004) is in progress: an auto-dedup on/off checkbox in the toolbar icon's right-click (`contextMenus` "action") menu, with state in `chrome.storage.session` (re-enabled on browser restart); left-click dedup (T002) is unchanged. Implemented and static-checked; awaiting user verification in Chrome. Scenario-3 policy was set to P1 (existing-tab navigations are deduped like new tabs; recover via Ctrl+Shift+T + Ctrl+click if a duplicate close is unwanted).

## Current plan

This ordered list expresses the agreed execution order. Task IDs provide stable identity only; their numbering does not imply priority or sequence. Continue actionable active work first. Otherwise, select the first actionable item here, skipping work that is blocked or waiting on the user without silently reordering the plan.

1. `T001` — Implement core tab deduplication logic

- Selection basis: Core functionality must be implemented first
- Last reviewed: 2026-10-22

2. `T002` — Implement toolbar button for manual deduplication

- Selection basis: User-facing trigger for feature 1
- Last reviewed: 2026-11-06

3. `T003` — Implement automatic deduplication on new tab creation

- Selection basis: Feature 2, depends on core logic from T001
- Last reviewed: 2026-11-06

4. `T004` — Add auto-dedup enable/disable toggle in the action right-click menu

- Selection basis: Accepted candidate C005 (intentional-duplicate presentation workflow needs a way to pause auto-dedup)
- Last reviewed: 2026-11-11

## Active work

- Task: `T004`
- Current step: Toggle implemented (action checkbox menu + `chrome.storage.session` flag gating `onUpdated`); `node --check` and `npm test` pass. Not yet run in Chrome.
- Waiting on: `user`
- Required action: Reload the extension in Chrome and verify: (1) right-clicking the toolbar icon shows an "Automatically close duplicate tabs" checkbox; (2) unchecking it lets duplicate tabs (including native "タブを複製") survive; (3) left-click still closes duplicates while unchecked and the count badge appears; (4) rechecking restores auto-closing; (5) after a full browser restart the checkbox is checked again.

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

- Status: completed
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
  - User-verified in Chrome: with no duplicates, clicking the icon shows badge `0` as expected; after T003, with duplicates present, the badge shows the number of closed tabs, which equals (duplicated tabs − 1) per group, as expected.
- Remaining:
  - None.
- Notes:
  - Use `chrome.action.onClicked` event
  - Badge feedback uses `chrome.action.setBadgeText`/`setBadgeBackgroundColor` with a `setTimeout` clear; the timer is best-effort (service worker may be terminated after 3s idle)

### T003 — Implement automatic deduplication on new tab creation

- Status: completed
- Objective: Automatically detect and redirect new duplicate tabs to existing ones.
- Scope:
  - Listen to `chrome.tabs.onCreated` event
  - Check if new tab URL matches an existing tab
  - If duplicate, close new tab and focus existing one
- Acceptance criteria:
  - New tabs with duplicate URLs are automatically closed
  - Existing tab is focused only when the duplicate was the foreground tab; background duplicates (e.g. Ctrl+click) close silently without stealing focus (user-accepted as option A)
  - No interference with `chrome://` and `chrome-extension://` URLs
- Implemented:
  - Replaced the original `chrome.tabs.onCreated` handler (which never triggered because a freshly created tab has an empty `url` / only `pendingUrl`) with a `chrome.tabs.onUpdated` listener that acts on `changeInfo.url`.
  - On a duplicate URL, `keeperForUrl` keeps the oldest tab (lowest id); the newer tab is closed. The keeper is focused only when the closed tab was active, so background duplicates close silently without stealing focus.
  - Reuses `shouldIgnoreUrl`, so `chrome://`/`chrome-extension://`/`about:` tabs are never touched.
- Verification:
  - Core grouping/keep-oldest logic is covered by T001 unit tests; event wiring passes `node --check`.
  - User-verified in Chrome:
    - "Clone tab" (native tab context menu) on an existing tab: the duplicate closes immediately and focus returns to the original tab — working as designed (this motivated candidate C004 for intentional duplicates).
    - Ctrl+click a link whose URL is already open: the new background tab closes immediately; focus stays on the page the link was clicked from (accepted behavior; matches D006).
    - Typing an already-open URL in a new (foreground) tab: the new tab closes and Chrome switches to the existing tab.
    - `chrome://about/` and `chrome://extensions` can still be opened in multiple tabs — privileged URLs unaffected.
    - The expected brief open→close "flash" was observed and confirmed acceptable (artifact of the onUpdated approach, D004).
- Remaining:
  - None.
- Notes:
  - `chrome.tabs.onCreated` cannot be used for URL matching (URL not yet set); see D004
  - Background duplicates closing silently was accepted over focus-stealing redirect; see D006
  - Cannot reliably distinguish user-initiated from JS-initiated tab opens (see C003)

### T004 — Add auto-dedup enable/disable toggle in the action right-click menu

- Status: in progress
- Objective: Let the user pause automatic dedup (e.g., to clone tabs intentionally for a presentation) without a keyboard shortcut or popup, while keeping the left-click close behavior unchanged.
- Scope:
  - Checkbox menu item ("Automatically close duplicate tabs") in the toolbar icon's right-click menu (`contextMenus` context `action`)
  - Toggle state in `chrome.storage.session`, auto-enabled by default; browser restart re-enables
  - `onUpdated` auto-dedup handler checks the state before closing duplicates
  - Left-click `action.onClicked` close-all behavior unchanged (also closes while paused)
- Acceptance criteria:
  - Right-clicking the toolbar icon shows the checkbox item
  - Unchecking lets newly opened duplicate tabs (including native "タブを複製") survive
  - Left-click still closes all duplicates and flashes the count badge, regardless of the toggle
  - Rechecking restores automatic closing
  - After a full browser restart, the toggle is enabled again
- Implemented:
  - `manifest.json` permissions now `tabs`, `storage`, `contextMenus`.
  - `src/background.js`: `createMenu()` registers the checkbox via `chrome.contextMenus.create({ contexts: ["action"], type: "checkbox" })` on `runtime.onInstalled` (after `removeAll`); `runtime.onStartup` resets the session flag to enabled and updates the item; `contextMenus.onClicked` mirrors the checkbox state into `chrome.storage.session` (`autoDedup`); `tabs.onUpdated` returns early when `isAutoDedupEnabled()` is false.
- Verification:
  - `npm test`: 8/8 unit tests pass (T001 logic unchanged).
  - `node --check` passes on `src/background.js`. `npm run lint` is a no-op placeholder.
  - Not yet run in Chrome.
- Remaining:
  - Awaiting user verification in Chrome per the listed acceptance criteria (first live confirmation that the `action`-context menu appears on right-click of the toolbar icon).
- Notes:
  - Intentional-duplicate flow enabled by this task: uncheck → clone tabs (native "タブを複製") → collect for presentation → left-click closes duplicates → recheck (or leave unchecked)
  - The `contextMenus` "action" context is documented by Chrome but its live behavior in the current Chrome version is unverified by this project
  - No persistent visual signal while paused (state only visible in the right-click menu); could be revisited if the forgotten-pause risk proves annoying

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

### D006 — Background duplicates close silently; no focus stealing

- Date: 2026-11-06
- Status: accepted
- Decision: Automatic dedup activates the keeper tab only when the closed duplicate was the foreground tab. Background duplicates (e.g. Ctrl+click opens) are simply removed and focus stays where the user was.
- Rationale: User-accepted during T003 verification (option A): Ctrl+click is itself a background open, so switching to the existing tab would steal focus from the page the user clicked from, which is worse than closing silently.
- Consequences:
  - T003 acceptance criterion reworded from "existing tab is focused when duplicate is detected" to focus-on-foreground-only.
- Related tasks: `T003`

### D007 — Existing-tab navigations are deduped like new tabs (policy P1)

- Date: 2026-11-11
- Status: accepted
- Decision: Keep current behavior (no scope split): any tab navigating to a URL an older tab already holds closes and switches to the keeper, including address-bar typing and same-tab link clicks. Blocking same-tab navigation is infeasible in MV3, and per-transition-type handling (webNavigation) was rejected for simplicity.
- Rationale: User chose "try from simple behavior". Unwanted closes are recoverable via Ctrl+Shift+T (restore the closed tab) and Ctrl+click (background-open the link without foreground dedup).
- Consequences:
  - Same-tab link clicks that land on an already-open URL close the reading tab; accepted trade-off.
  - A later switch to per-transition policies remains possible via C006.
- Related tasks: `T003`

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

### C004a — Keyboard-toggle auto-dedup off/on for intentional duplicates

- Origin: User presentation use case (2026-11-06): clone tabs intentionally, collect them in one window, close them later; the extension currently blocks the native "タブを複製" clone.
- Question: Accept a global pause for automatic dedup via `chrome.commands` keyboard shortcut, with the flag in `chrome.storage.session`/`storage.local` and an icon/badge indication when paused?
- Possible relationship: `T003`; minimal slice of `C002`
- Disposition: not accepted (2026-11-11) — superseded by C005, which was accepted as `T004`; the right-click checkbox needs no keybinding management
- Notes:
  - User flow: shortcut to disable → clone tabs → shortcut to enable → toolbar click closes the duplicates (works with existing T002)
  - No browser/extension reload involved; toggle is instant
  - Cost: user must remember to flip the toggle back on
  - Manifest change: `commands` entry; no new permission beyond existing ones

### C004b — Popup with toggle + "Deduplicate now" button

- Origin: Agent proposal during C004 discussion (2026-11-06)
- Question: Should dedup control move into an action popup?
- Possible relationship: `T002`, `C002`
- Disposition: not accepted — user stated no interest; adding a popup would also break `chrome.action.onClicked` one-click dedup (T002 UX)
- Notes:
  - Rejected 2026-11-06; reopen only if popup/feature growth is later accepted via C002

### C004c — Tab context-menu "clone & bypass" item instead of a mode switch

- Origin: User presentation use case (2026-11-06), agent proposal
- Question: Accept a `chrome.contextMenus` item at the tab context that calls `chrome.tabs.duplicate()` and adds the new tab id to a one-time ignore set, so auto-dedup skips exactly those clones while the toolbar button still closes all duplicates later?
- Possible relationship: `T003`; alternative to `C004a`
- Disposition: not accepted (2026-11-11) — superseded by C005 (`T004`); the global pause covers the presentation flow without a per-clone exemption
- Notes:
  - Does not replace Chrome's native "タブを複製" menu item (built-in items cannot be modified by extensions); it adds a separate extension item beside it
  - No on/off mode state for the user to track; per-clone exemption
  - Manifest change: add `contextMenus` permission (currently only `tabs`)
  - Bypassed clones remain eligible for manual dedup via the toolbar button

### C005 — Left-click closes; right-click action-menu checkbox toggles auto-dedup

- Origin: Action-slot discussion (2026-11-11), after discovering Chrome `contextMenus` supports the `action` context (toolbar icon right-click, up to 6 top-level items)
- Question: Assign left click to close-duplicates (unchanged T002) and a checkbox menu item on the icon's right-click to enable/disable automatic dedup, state in `chrome.storage.session`?
- Possible relationship: `T002`, `T003`; minimal slice of `C002`
- Disposition: accepted (2026-11-11) as `T004`
- Notes:
  - Chosen over the alternating-click state machine (mode-dependent click needs a stronger paused-state signal) and over C004a/C004c
  - Auto re-enabled on browser startup by design (safe default)

### C006 — Scope auto-dedup by navigation origin (new tab vs same-tab typed vs same-tab link)

- Origin: Scenario matrix discussion (2026-11-11)
- Question: Should existing-tab navigations to duplicate URLs behave differently from new-tab opens (P2: dedup only new tabs; P3: distinguish typed vs link via `webNavigation.transitionType`)?
- Possible relationship: `T003`, `C003`
- Disposition: not accepted (2026-11-11) — user chose P1 (status quo) for simplicity; recovery procedure is Ctrl+Shift+T then Ctrl+click; recorded as D007
- Notes:
  - P3 would add the `webNavigation` permission; "block navigation in place" is not feasible in MV3
  - Revisit if unexpected same-tab closes prove annoying in practice
