---
agent: agent
description: Audit and restructure the AI agent infrastructure for this project. Re-run whenever tooling or best practices evolve.
---

# Task: Maintain AI Infrastructure

You are auditing and improving the files that AI coding agents read to understand
this project's rules, conventions, and recurring tasks.

Goal: create a durable, low-friction AI infrastructure where a new agent session can
become productive quickly, follow the right constraints, and execute recurring tasks
without guesswork.

---

## Step 1 — Discover all agent-facing files

Read every file an agent is likely to consume. Include common variants so this prompt
works across different tooling stacks:

- `.github/copilot-instructions.md` (or equivalent system prompt / instructions file)
- `AGENTS.md` (or `CLAUDE.md`, `CURSOR.md`, or any root-level agent instruction file)
- All files under `.github/prompts/`
- ADR / architecture docs (`plan/`, `docs/adr/`, `architecture/`, etc.)
- Feature history / implementation docs (`feature/`, `docs/features/`, etc.)
- `README.md`, `CONTRIBUTING.md`, and developer runbooks (`docs/dev/`, `playbooks/`)
- Any rule-enforcing config that materially affects agent output (`eslint`, formatters,
  test/build scripts in `package.json`, CI workflows)

For each file, note:

- Purpose
- Intended audience (human devs, Copilot, all agents)
- Unique content (what should remain here vs be moved elsewhere)
- Trust level (authoritative / reference-only / legacy)

---

## Step 2 — Assess against these principles

Score each principle from 0–2 (`0 = poor`, `1 = partial`, `2 = strong`) and provide
one short evidence line per score.

### P1 — Single source of truth

Every rule, constraint, and convention lives in **one** file. Other files may point to
it but must not repeat it. Duplication is a maintenance hazard: the copies drift.

### P2 — Clear authority hierarchy

There must be one authoritative rules file. Every other file either defers to it or
contains genuinely unique content.

### P3 — Task-specific prompt files for recurring work

Any task that agents are asked to perform repeatedly (add a new module, wire a shared
feature, scaffold a component, migrate APIs, release prep) should have a dedicated
prompt file. Preferred location: `.github/prompts/`. These prompts must be:

- Self-contained (an agent can follow them without reading other files)
- Actionable (ordered steps + concrete code patterns, not vague descriptions)
- Verifiable (end with a build/test/lint/check command)

### P4 — Thin quick-start for non-Copilot agents

`AGENTS.md` (or equivalent) should contain only: repo layout, dev commands, and
pointers to authoritative files. It must not duplicate rules or git conventions.

### P5 — Reference docs are focused

Architecture and feature-history docs should contain only durable reference content
(decisions, rationale, history, diagrams), not operational runbooks.

### P6 — No stale content

File trees, component lists, and feature inventories must reflect the actual repo.
Outdated examples mislead agents into making wrong assumptions.

---

## Step 3 — Identify gaps and redundancies

Produce a concise list of findings, categorized and prioritized:

**Duplication** — the same content appears in more than one file.  
**Staleness** — content describes a state of the repo that no longer exists.  
**Missing prompts** — a recurring task exists but has no prompt file.  
**Unclear authority** — it is ambiguous which file an agent should trust for a rule.  
**Bloated reference docs** — operational steps buried inside plan/architecture files.

For each finding include:

- Severity: `high` / `medium` / `low`
- Evidence: file paths + one-sentence description
- Impact: what errors or inefficiency this causes in agent sessions

---

## Step 4 — Plan the changes

For each finding, propose the change:

- Which file to edit (or create/delete)
- What content moves, is removed, or is replaced with a pointer
- Why this improves reliability or speed for future agent sessions

Present the plan to the user for confirmation before implementing if the scope is large,
or proceed directly if the changes are clearly mechanical (de-duplication, stale text).

---

## Step 5 — Implement

Apply all changes. Guidelines:

- **Authoritative rules file** — keep rules + conventions only. Replace step-by-step
  operational content with pointers to dedicated prompt files.
- **Agent quick-start file** — keep concise: repo map, run commands, and pointers to
  authoritative files. Remove duplicated rules.
- **New prompt files** — use front matter supported by the local environment. In this
  workspace, prompt files currently use:
  ```yaml
  ---
  agent: agent
  description: One-sentence description of what the prompt does.
  ---
  ```
  Prefer this structure: context/variables → ordered steps → concrete patterns →
  checklist → verification.
- **Architecture/reference docs** — keep rationale and durable context; remove transient
  procedural checklists.
- **Feature index/history** — ensure it matches what is implemented in the repo.

Implementation hygiene:

- Prefer minimal diffs and preserve existing style.
- Do not introduce new documentation files unless required by the scope.
- Do not alter unrelated code or project behavior.

---

## Step 6 — Verify

After implementing, run a final check:

- [ ] Every rule appears in exactly one place.
- [ ] The authoritative rules file contains no step-by-step operational guides.
- [ ] Agent quick-start file(s) match the actual directory tree and run commands.
- [ ] Every recurring agent task has a dedicated prompt file.
- [ ] Each prompt file ends with a build/test verification step.
- [ ] Feature index/history is up to date.
- [ ] No file references a path or component that no longer exists.
- [ ] Prompt front matter passes editor diagnostics.

---

## Notes for re-runs

When re-running this prompt as tools evolve:

- Check whether prompt front matter attributes have changed. As of 2026-03-04 the
  current front matter in this workspace is:
  ```yaml
  ---
  agent: agent
  description: Single-line string description.
  ---
  ```
  Validate this with diagnostics before mass updates; schema support can change.
- Check whether the IDE or agent runtime now supports additional prompt features
  (e.g., `tools:`, `context:`, variable interpolation syntax) and adopt them if useful.
- Review whether any new recurring tasks have emerged that deserve their own prompt file.
- Check whether the authority hierarchy still makes sense — some tools give primacy to
  `AGENTS.md`, others to `copilot-instructions.md`; align to what the agent stack reads.

Recommended cadence:

- Run this prompt after major tooling upgrades, framework migrations, or after adding
  2+ new recurring agent workflows.
