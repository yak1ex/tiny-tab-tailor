# AGENTS.md

Operating instructions for coding agents working in `TinyTabTailor`. Read this file and `TASKS.md` before changing the repository.

## 1. Non-negotiable rules

1. Do not fabricate repository facts, file paths, APIs, commands, test results, or completion claims. Inspect or run them.
2. Make the smallest change that satisfies the requested outcome. Do not perform unrelated cleanup, refactoring, reformatting, or feature work.
3. Match existing repository structure, conventions, and patterns unless the task explicitly changes them.
4. Do not add, remove, replace, or upgrade dependencies without prior user approval.
5. Do not create commits, rewrite history, push, or publish unless repository-specific instructions explicitly authorize it.
6. Keep `TASKS.md` synchronized with meaningful implementation progress in the same work cycle.
7. Do not expose, copy, log, or commit credentials, secrets, private keys, tokens, or personal data.

## 2. Project context

- Project: `TinyTabTailor`
- Objective: `A tiny Chrome extension to avoid duplicated tabs by closing duplicates and redirecting new duplicate tabs to existing ones`
- Primary language(s): `JavaScript`
- Framework(s): `Chrome Extension Manifest V3`
- Runtime and deployment target: `Chrome browser extension`
- Supported host platforms: `Windows, macOS, Linux (any platform running Chrome)`
- External runtime requirements: `Google Chrome or Chromium-based browser`

## 3. Repository orientation

Before editing:

1. Read `TASKS.md`; identify the active work, current plan, and relevant mainline task.
2. Inspect the files to be changed and their callers, tests, configuration, and adjacent conventions.
3. Inspect manifests and lockfiles before choosing tool commands or proposing dependencies.
4. Check the working tree and preserve unrelated user changes.
5. State a brief plan and verifiable success criteria for non-trivial work.
6. Resolve ambiguity from repository evidence when possible. Ask only when materially different interpretations remain.

Repository layout:

- Source: `src/`
- Tests: `tests/` (not yet created)
- Configuration: `manifest.json`, `package.json`
- Generated or vendored paths not to edit manually: `node_modules/`, `dist/`

## 4. Implementation policy

- Implement only requested behavior and work required to make it correct.
- Prefer direct, readable code over speculative abstraction or configurability.
- Reuse existing utilities and patterns before introducing new ones.
- Handle realistic failure modes at system boundaries; do not hide errors or suppress diagnostics without justification.
- Remove imports, variables, functions, files, and configuration made obsolete by the current change, but do not delete unrelated pre-existing code.
- Preserve public APIs, stored data formats, command-line behavior, and compatibility unless the task explicitly changes them.
- Update documentation and examples when the change makes them inaccurate.

## 5. Dependency policy

Prefer the standard library and existing dependencies. A new dependency is acceptable only when it materially simplifies the implementation or avoids unreliable custom code.

Prior user approval is required before:

- adding a dependency;
- removing or replacing a dependency;
- upgrading or downgrading a dependency;
- changing a package source, feature set, or resolution policy in a materially significant way.

Before requesting approval, explain:

1. the need;
2. alternatives considered, including existing or standard-library options;
3. expected maintenance, security, binary-size, or runtime impact where relevant;
4. manifests and lockfiles that would change.

Installing or synchronizing dependencies already declared by the repository is allowed. After an approved dependency change, update both the manifest and lockfile and run relevant checks.

## 6. Verification policy

Define success as observable behavior and verification, not a plausible diff.

- Run every relevant check already configured by the repository.
- During iteration, prefer focused tests or checks; run the broader relevant suite before finalizing.
- For a bug fix, add or identify a reproducer where practical and verify it fails before or is demonstrably addressed by the fix.
- For a refactor, verify behavior before and after and avoid unintended public API changes.
- For performance work, establish a baseline and compare with the same method.
- Read command output and report failures accurately. Do not claim a check passed if it was not run or completed.
- Do not introduce a full quality-tool stack merely to satisfy this template.
- For a new non-trivial project, establish a minimal testing and static-check baseline appropriate to its language and risk.

Completion authority:

- Objective, non-UI work may be marked `completed` after relevant automated or executable checks pass.
- Documentation-only work may be marked `completed` after a consistency review.
- UI appearance, usability, hardware behavior, platform integration, and subjective output remain `in progress` with `Awaiting user verification` when adequate verification is unavailable.
- A task may be marked `completed` after explicit user confirmation of the remaining manual checks.

## 7. Task management

`TASKS.md` is the authoritative record of project objective, current state, mainline implementation work, verification evidence, and short decisions.

Before implementing newly requested or discovered work, classify it as exactly one of:

- part of the current task because it is required by or naturally within its accepted outcome;
- part of another existing task;
- a new accepted task with the next unused `T###` ID;
- a candidate item needing acceptance, prioritization, or feasibility analysis, with the next unused `C###` ID;
- no action because it is duplicate, rejected, already satisfied, or out of scope.

Do not implement a candidate merely because it was mentioned during review or user verification. Record its origin and possible relationship to existing work. When a candidate is accepted, create a new task ID and update the candidate's disposition; do not convert or rename its `C###` ID.

Task IDs provide stable identity only. Their numbering and document order do not imply priority or execution sequence. `Current plan` is the authoritative ordering of accepted work. Continue the active task while it is actionable; otherwise choose the first actionable task in `Current plan`, skipping blocked or user-waiting entries without silently reordering them. If no agreed ordering identifies the next task, request a decision rather than choosing by task number.

`Active work` is an execution pointer, not a second task record. The referenced task entry remains authoritative for status, scope, evidence, and remaining work. Multiple tasks may be `in progress`, but only one task can be active.

Maintain these invariants whenever `TASKS.md` changes:

- the active task ID exists, or the value is `none`;
- work changes from `pending` to `in progress` when implementation or verification starts;
- a `completed` or `cancelled` task is never active;
- a `blocked` task remains active only while resolving its blocker is the current action;
- `Waiting on: user` or `Waiting on: external` has a concrete required action;
- `Waiting on: none` uses `Required action: None.`;
- status, plan, and active-work fields are updated together when one affects the others.

For each meaningful implementation step:

1. Identify the affected stable task ID.
2. Update only the affected task entries in the same work cycle.
3. Record factual implementation, verification, remaining work, blockers, or user-verification needs.
4. Triage newly discovered work before adding or changing a task or candidate item.
5. Preserve existing IDs and do not reuse deleted or cancelled IDs.
6. Do not renumber or substantially reorganize tasks without explicit user approval.
7. Perform a final consistency review of task status, current plan, and active work before responding.

Allowed statuses are exactly:

- `pending`: not started;
- `in progress`: implementation or verification has started but is incomplete;
- `blocked`: cannot proceed because of a specific dependency, decision, environment, or external condition;
- `completed`: implemented and adequately verified under the completion policy;
- `cancelled`: intentionally abandoned or superseded, with the reason recorded.

When changing a status, include enough evidence to explain why. Do not equate code written with task completed.

`.agentic-template.yml` is the authoritative template provenance record. Do not duplicate its release and revision fields in `TASKS.md`. When reviewing an upstream template update, compare from `last_reviewed_revision`, merge applicable changes without overwriting repository-specific instructions, and advance that field only after the review is complete.

## 8. Git and workspace safety

- Inspect the working tree before and after work.
- Do not discard, overwrite, stage, or modify unrelated user changes.
- Avoid destructive Git commands unless explicitly requested and the consequences are clear.
- Do not commit by default.
- When commits are authorized, include only task-related changes and follow conventional commits format.
- Do not add AI attribution unless the repository explicitly requires it.

## 9. Commands

- Install or synchronize: `npm install`
- Run locally: Load unpacked extension in Chrome via `chrome://extensions`
- Build: `npm run build`
- Test all: `npm test`
- Test focused: N/A
- Lint: `npm run lint`
- Format check: N/A
- Type or static check: N/A
- Package or release check: N/A

## 10. Repository-specific constraints

- Chrome extensions must use Manifest V3 format.
- Background scripts must be service workers, not persistent background pages.
- All extension files must be declared in `manifest.json`.
- No remote code execution; all code must be bundled with the extension.

## 11. Stack-specific instructions

### Chrome Extension (Manifest V3)

- Use Manifest V3 format with service worker for background logic.
- Declare all permissions explicitly in `manifest.json`.
- Use `chrome.tabs` API for tab management.
- Use `chrome.action` for toolbar button (not `chrome.browserAction`).
- Service workers are terminated when idle; design for event-driven execution.
- Test by loading as unpacked extension in `chrome://extensions`.
- Use `chrome.runtime.reload()` during development to reload the extension.

### JavaScript (Plain)

- Use modern JavaScript (ES2020+) features supported by Chrome.
- No build step required; files are loaded directly by the browser.
- Use `const` and `let` instead of `var`.
- Prefer async/await over callbacks for asynchronous operations.
- Use strict mode (`"use strict"`).

## 12. Project learnings

- Chrome extension service workers are terminated when idle; state must be persisted to `chrome.storage` if needed across restarts.
- `chrome.tabs.onCreated` fires for all new tabs; distinguishing user-initiated from JS-initiated tabs is not reliably possible with the extension API.

## 13. User handoff and action requests

Make the required next action explicit whenever work is not fully complete.

Use exactly one of these outcomes:

- `No user action required`: the work is complete, or the agent can continue autonomously.
- `Permission required`: state the exact action requiring approval and why.
- `Decision required`: ask a specific question, provide the relevant options and trade-offs, and identify the recommended option when appropriate.
- `User verification required`: provide concrete verification steps and describe what result to report.
- `Blocked`: state the blocking condition and what would unblock the work.

Do not present an explanation, possible future step, or rhetorical question in a way that could be mistaken for a request. When requesting user action, end the response with a clearly labelled `User action required` section. Distinguish the agent's next action from the user's next action.

## 14. Final response checklist

Before the final response:

- review the changed-file list;
- run and report relevant verification;
- confirm `TASKS.md` matches the implementation state;
- distinguish verified behavior from unverified claims;
- mention blockers, risks, manual verification, and approved-but-unfinished follow-up explicitly.
- state whether user action is required;
- if user action is required, give one concrete request and enough information to answer it;
- distinguish the agent's next action from the user's next action.
