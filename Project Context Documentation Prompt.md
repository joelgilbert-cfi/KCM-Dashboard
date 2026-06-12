# Antigravity — Project Context Documentation Prompt

You are a senior software architect. Your job is to deeply analyze this entire project — every file, folder, module, configuration, and dependency — and produce a structured documentation suite inside a folder called `Docs/`.

The goal is to create a set of concise, precise reference documents that capture the full context of this project so that any task can be completed accurately by reading only the relevant docs rather than the entire codebase.

---

## Step 1 — Full Project Scan

Recursively go through every file and folder. Understand:

- The project's purpose and domain
- The tech stack, frameworks, libraries, and tools used
- The architecture pattern (MVC, microservices, monorepo, etc.)
- All modules, their responsibilities, and how they interact
- Data flow, API contracts, and state management
- Configuration files, environment variables, and build systems
- Entry points, routing, and key execution paths
- Any existing tests, scripts, or CI/CD setup

---

## Step 2 — Create the `Docs/` Folder Structure

Generate the following inside `Docs/`:

```
Docs/
├── MASTER_INDEX.md
├── CHANGELOG.md
├── project_overview.md
├── architecture.md
├── tech_stack.md
├── modules/
│   └── [one .md file per major module or feature]
├── data_models.md
├── api_reference.md          ← (if applicable)
├── state_management.md       ← (if applicable)
├── config_and_env.md
├── dev_setup.md
├── conventions_and_patterns.md
└── gotchas_and_known_issues.md
```

Create additional files as needed based on the project's complexity. If a section is not applicable (e.g., no API, no state management), skip it.

---

## Step 3 — Write Each Document

Each document must be:

- **Dense but scannable** — use headers, bullet points, and short paragraphs
- **Precise** — include actual file paths, function names, class names, variable names where relevant
- **Self-contained** — a reader should understand the topic from the doc alone without opening source files
- **Cross-referenced** — where a doc depends on context from another, mention it explicitly (e.g., *"See `modules/auth.md` for token structure"*)

---

## Step 4 — Write `MASTER_INDEX.md`

This is the most important file. It must:

1. Give a **2–3 line summary** of the entire project
2. List **every doc** in `Docs/` with a one-line description of what it covers
3. Contain a **Task-to-Docs Routing Table** — a structured guide that maps common task types to the exact docs that must be read before doing that task:

| Task Type | Read These Docs First |
|---|---|
| Modifying the auth flow | `modules/auth.md`, `data_models.md`, `config_and_env.md` |
| Adding a new API endpoint | `api_reference.md`, `architecture.md`, `conventions_and_patterns.md` |
| Changing database schema | `data_models.md`, `modules/[relevant module].md` |
| Fixing a UI component | `modules/[relevant module].md`, `state_management.md` |
| Adding a new feature | `architecture.md`, `conventions_and_patterns.md`, `MASTER_INDEX.md` |
| Debugging an issue | `gotchas_and_known_issues.md`, `modules/[relevant module].md` |
| Setting up the project | `dev_setup.md`, `config_and_env.md` |

Add more rows based on patterns specific to this project.

4. End with a **Module Map** — a plain list of every major module/component, what it does in one line, and its primary source path.

---

## Step 5 — Create `CHANGELOG.md`

Create a `CHANGELOG.md` file that will serve as the running history of this project going forward. Populate it with the initial entry based on the current state of the project at the time of this scan:

```
# Changelog

## [Initial Scan] — [Date if known, otherwise leave blank]
### Overview
[2–3 line description of the project at its current state]

### Modules Present
- [List every major module and what it does in one line]

### Tech Stack
- [List key technologies, frameworks, and tools]

### Notes
- [Anything notable about the project's current state, known issues, or incomplete areas]
```

This file will be appended to on every future update run — never rewritten from scratch.

---

## Constraints

- Do not generate placeholder content — every line must reflect the actual project
- If something is unclear or ambiguous in the code, note it explicitly in `gotchas_and_known_issues.md`
- File paths referenced in docs must be real paths from this project
- Keep each doc focused — do not repeat information already covered in another doc, just cross-reference it
