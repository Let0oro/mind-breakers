---
name: mcp-usage
description: Decision guide for when and how to use each tool in mcp-enterprise — covers all domains with practical examples and sequencing advice
---

# MCP Enterprise — Usage Guide

This skill file is the **operational playbook** for agents using this server. It answers: *which tool do I use, when, and how?*

---

## Quick Decision Tree

```
Need to read or write a file?     → read_file / write_file
Need to compile code?             → compile_code
Need system status?               → system_info
Suspect infinite loop?            → watchdog_status → supervisor_halt
Planning a multi-step task?       → planning_create
Looking for past plans?           → planning_list
About to do something destructive?→ supervisor_checkpoint (REQUIRED)
Unsure which path to take?        → supervisor_ask
Want human to review output?      → supervisor_feedback
Unsure of workflow for a task?    → workflow_consult
Finishing a session?              → docs_generate_walkthrough
Done with major refactor?         → docs_generate_project_overview
Suspect deadlock between agents?  → deadlock_analyze
Need to audit project setup?      → config_analyze / config_suggest
Coordinating multiple agents?     → workspace_read / workspace_update_file
Validating phase completion?      → judge_file
Driving an agent loop?            → orchestrator_next
About to implement user request?  → scope_guard (REQUIRED)
About to generate new code file?  → coherence_brief (REQUIRED)
Need to evaluate code coherence?  → coherence_check
```

---

## Tool-by-Tool Usage Guide

---

### `read_file`
**When:** Before editing any file. Before referencing file contents. Before checking if something exists. For large files, always use `maxLines` and `offset` constraints to avoid flooding the context view.

**Never do:** Edit a file based on what you think it contains. Always read first.

```json
// Input
{ "path": "/absolute/path/to/file.ts", "maxLines": 100, "offset": 0 }

// Output
{ "content": "...file contents...", "truncated": true, "total_lines": 550 }
```

**Tip:** Use absolute paths. Relative paths may fail depending on working directory. Try to use `file_info` beforehand to plan your offset jumps.

---

### `write_file`
**When:** Creating new files or updating existing ones after reading them first.

**Gate required if:** Overwriting a critical config, deployment file, or database migration.

```json
// Input
{ "path": "/path/to/output.md", "content": "# My Document\n..." }

// Output
{ "success": true, "path": "/path/to/output.md" }
```

---

### `compile_code`
**When:** After writing TypeScript, Rust, Go code to verify it compiles. Also useful for running build scripts.

```json
// TypeScript compilation
{ "command": "tsc", "args": ["--noEmit"], "workingDir": "/path/to/project" }

// Go build
{ "command": "go", "args": ["build", "./..."], "workingDir": "/path/to/go-project" }

// With timeout (milliseconds)
{ "command": "cargo", "args": ["build"], "workingDir": "/path", "timeout": 60000 }
```

**Output includes** stdout, stderr, and exit code. Check exit code !== 0 for failure.

---

### `system_info`
**When:** At session start to understand the environment. Before running resource-intensive operations.

```json
// Input: {}
// Output: { "os": "linux", "arch": "x64", "memory": {...}, "cpu": {...}, "uptime": 12345 }
```

---

### `watchdog_status`
**When:** You notice a tool being called more than 3 times without progress. When debugging a stuck agent.

```json
// Input: {}
// Output: { "activeTasks": [...], "hangingTasks": [...] }
```

If hanging tasks are found, call `supervisor_halt` with the taskId, then reassess.

---

### `deadlock_analyze`
**When:** Multiple agents are waiting for locks and nothing is making progress.

```json
// Input: {}
// Output: { "cycles": [], "status": "no_deadlocks" }
// or
// Output: { "cycles": [["agent-A", "lock-X", "agent-B", "lock-Y"]], "status": "deadlock_detected" }
```

If a cycle is detected, release one of the locks to break it. Then retry.

---

### `planning_create`
**When:** Before starting any task with 3+ steps or unknown scope. Always externalize your plan.

```json
{
  "title": "Implement Rate Limiting",
  "description": "Add token-bucket rate limiting to all API endpoints",
  "model": "gemini-2-5-pro",
  "appendToRoadmap": true,
  "tasks": [
    {
      "title": "Design middleware interface",
      "description": "Define TypeScript interface for rate limit middleware",
      "priority": "high",
      "estimatedHours": 2
    },
    {
      "title": "Implement token bucket",
      "description": "Core algorithm for token bucket rate limiting",
      "priority": "critical",
      "estimatedHours": 4,
      "dependencies": ["Design middleware interface"]
    }
  ]
}
```

**Output:** `{ "planId": "plan-abc", "path": "plans/rate-limiting.md" }`

Set `appendToRoadmap: true` for any plan that's part of a long-running project.

---

### `planning_list`
**When:** Starting a new session and wanting to see what plans exist. Before creating a new plan (to avoid duplicates).

```json
// Input: {}
// Output: { "plans": [{ "id": "plan-abc", "title": "...", "createdAt": "..." }] }
```

---

### `docs_generate_walkthrough`
**When:** At the **end of every session**. After completing a meaningful milestone.

```json
{
  "title": "Rate Limiting — Session 1",
  "summary": "Designed and implemented the token bucket algorithm. Middleware interface is complete.",
  "tasks": [
    {
      "title": "Design middleware interface",
      "description": "Defined TypeScript interface with rate() and consume() methods",
      "filesChanged": ["src/middleware/rate-limit.ts"],
      "outcome": "success"
    },
    {
      "title": "Implement token bucket",
      "description": "Core algorithm with TTL-based refill",
      "filesChanged": ["src/core/rate-limit/token-bucket.ts"],
      "outcome": "partial",
      "notes": "Redis integration pending for distributed mode"
    }
  ],
  "nextSteps": ["Connect Redis backend", "Write integration tests"],
  "appendToRoadmap": true
}
```

---

### `docs_generate_project_overview`
**When:** After major structural changes (new module, refactored architecture). After onboarding new agents to the project.

```json
{
  "includeArchitecture": true,
  "includeToolsCatalogue": true,
  "includeSecurityModel": true,
  "includeApiReference": true,
  "includeChangelog": true
}
```

This regenerates `docs/PROJECT.md` — the canonical reference for the project.

---

### Supervisor Gates

#### `supervisor_checkpoint`
**When:** Irreversible action is about to happen.

```json
{
  "operation": "Delete all records from users table older than 2020",
  "details": { "sql": "DELETE FROM users WHERE created_at < '2020-01-01'" },
  "severity": "critical",
  "ttlMs": 600000
}
// → { "gateId": "gate-123", "status": "pending" }
```

**After opening:** Wait. Do not proceed until `supervisor_status` shows the gate is resolved.

#### `supervisor_feedback`
**When:** You've produced a plan or code diff and want human review before applying it.

```json
{
  "proposal": "Refactored the auth module to use JWT RS256 instead of HS256",
  "diff": "```diff\n-import { sign } from 'jsonwebtoken';\n+import { sign } from 'jsonwebtoken';\n...",
  "aspects": ["security implications", "backward compatibility", "performance impact"]
}
// → { "gateId": "gate-456", "status": "pending" }
```

#### `supervisor_ask`
**When:** Two equally valid approaches exist and you need context to decide.

```json
{
  "question": "Should I use Redis or in-memory storage for session management? Redis adds infrastructure but supports multi-instance deployments.",
  "suggestions": ["Use Redis (distributed)", "Use in-memory (simple, single-instance)"]
}
// → { "gateId": "gate-789", "status": "pending" }
```

#### `supervisor_resolve`
**When:** The human answers (or you need to programmatically resolve a gate in tests).

```json
// Resolve a checkpoint
{ "gateId": "gate-123", "approved": true, "reason": "Verified the SQL is correct" }

// Resolve an ask
{ "gateId": "gate-789", "answer": "Use Redis" }

// Resolve feedback
{ "gateId": "gate-456", "feedback": "Looks good, but add a migration for existing sessions", "aspects": { "backward compatibility": "add migration" } }
```

#### `supervisor_status`
**When:** Checking if any gates are pending. After a long operation, to see if the human has responded.

```json
// Input: {}
// Output: { "pendingGates": [...], "activeTasks": [...], "resolvedGates": [...] }
```

#### `supervisor_halt`
**When:** Emergency stop. A task is looping, misbehaving, or needs to be aborted immediately.

```json
// Halt a specific task
{ "taskId": "task-abc", "reason": "Task exceeded 30 minutes without progress" }

// Halt all tasks
{ "reason": "Emergency: user requested full stop" }
```

---

### `workflow_consult`
**When:** You know *what* needs to be done but not the *sequence* of steps.

```json
{ "intent": "Refactor the authentication module to support OAuth2 and PKCE" }
// → Detailed step-by-step workflow recommendation from the WorkflowAgent
```

Always call this **before** `planning_create` if you're uncertain about the approach.

---

### Orchestration & Workspace (Agent Framework Tools)

#### `workspace_read` & `workspace_update_file`
**When:** You're operating in an Orchestrated loop and need to pull phase context, or report errors on a file.

#### `judge_file`
**When:** Immediately after making structural code changes, to statically verify complexity, test coverage, and typescript correctness before moving the phase. Returns `approve`, `retry`, or `escalate`.

#### `orchestrator_next`
**When:** In the main agent event loop. Directs the workflow from Scaffold → Config → Types → Validations. Returns early if blocked on feedback.

#### `config_analyze`
**When:** Bootstrapping a new CI/CD pipeline, formatting setup, or security constraints. Use `config_suggest` to retrieve the step-by-step commands on how to fix whatever this tool flagged.

---

### Multi-Agent Meta-Cognition (Swarm Orchestration)

#### `agent_decide_strategy`
**When:** You have a new problem and need to decide if you should execute it immediately, vote among multiple options, or debate.
```json
{ "task_description": "Migrate database to Prisma", "is_reversible": false, "latency_budget_ms": 15000 }
// → { "strategy": "debate", "reason": "Irreversible or ambiguous...", "estimated_tokens": ... }
```

#### `agent_sprint_planning`
**When:** You are beginning an execution phase that is architecturally ambiguous and need diverse perspectives before deciding on the steps.
```json
{ "task": "Design the authentication flow", "mode": "thorough" }
```

#### `agent_retrospective`
**When:** A deployment fails, tests repeatedly fail, or `AgentCircuitBreaker` states tools are closed/tripped.
```json
// Input: {"lookback_minutes": 60, "focus": "all"}
// Output: { "metrics": {...}, "toolHealth": [...], "quarantined": [...], "affectiveStateUpdate": "..." }
```
Use this report to adjust your plan or quarantine tools from the workflow.

---

### Coherence & Scope Guard

#### `scope_guard`
**When:** BEFORE implementing any new feature, workflow, or user request.
```json
{ "intent": "Rewrite the database access layer to use Prisma instead of Postgres SDK" }
// → { "risk_level": "critical", "recommendation": "defer", "concerns": [...] }
```
**Never bypass this evaluation.** If it recommends `defer`, use `scope_guard_plan` to properly log it and ask the user to proceed with the deferred plan instead.

#### `coherence_brief` & `coherence_check`
**When:** Call `coherence_brief` BEFORE generating a new file to get the shared vocabulary and layer constraints. Call `coherence_check` AFTER writing the file to ensure it passed.
```json
// Input
{ "target_path": "src/services/billing.ts" }
// Output
{ "brief": "...use 'invoice' instead of 'bill', services cannot import from agents..." }
```

---

## Common Sequences

### Starting a new project module
```
1. workflow_consult({ intent: "..." })
2. planning_create({ title, description, tasks[] })
3. read_file() × N (understand existing code)
4. write_file() × N (implement changes)
5. compile_code() (verify)
6. docs_generate_walkthrough()
```

### Reviewing before destructions
```
1. supervisor_checkpoint({ operation, details, severity: "critical" })
2. supervisor_status() → check if resolved
3. (if approved) proceed with destructive operation
4. docs_generate_walkthrough() → note what was deleted and why
```

### Debugging a multi-agent deadlock
```
1. deadlock_analyze()
2. (if cycle found) release one lock in the cycle
3. watchdog_status() → identify hanging tasks
4. supervisor_halt(taskId) → kill stuck agents
5. Investigate root cause via read_file(relevant log file)
6. Fix coordination logic
7. Restart affected agents
```

### End of session / context near limit
```
1. docs_generate_walkthrough({ ..., appendToRoadmap: true })
2. (optional) docs_generate_project_overview()
3. supervisor_ask if there are pending decisions for next session
```
