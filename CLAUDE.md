# 🤖 MCP Enterprise — Claude Integration Guide

> This file is automatically loaded by Claude (claude.ai, Claude Desktop, Claude Code, Cursor with Claude, etc.) when connecting to this MCP server. Read it in its entirety before calling any tool.

---

## Server Identity

```
name:     mcp-enterprise-v18-refactored
version:  3.3.0
protocol: 2024-11-05
```

This is a **production-grade enterprise MCP server** providing file operations, code execution, planning, documentation generation, human-in-the-loop supervision, monitoring, versioning, auth, rate limiting, distributed locking, transactions, observability, and more.

---

## Tool Groups & When To Use Them

### 🗂 Filesystem
```
read_file(path, maxLines?, offset?, searchPattern?)
write_file(path, content)
file_info(path)
```
Use for reading source code, config files, logs. Use `write_file` for creating or updating files — always prefer doing it through this tool so operations are traced.

### ⚙️ Code Execution
```
compile_code(command, args?, workingDir?, timeout?)
```
Run any compiler: `tsc`, `rustc`, `go build`, `cargo build`, etc. Capture stdout/stderr to check for errors.

### 🧠 System & Health
```
system_info()
watchdog_status()
deadlock_analyze()
```
- `system_info` → check host state before heavy operations
- `watchdog_status` → always check when you suspect an infinite loop
- `deadlock_analyze` → run when lock contention is observed

### 📋 Planning
```
planning_create(title, description, tasks[], model?, appendToRoadmap?)
planning_list()
```
**Always call `planning_create` before starting work on tasks with 3+ files or unknown scope.** Include risk ratings, priority levels, and estimated hours to prevent scope creep and hallucinations.

### 📝 Documentation
```
docs_generate_walkthrough(title, summary, tasks[], nextSteps?, appendToRoadmap?)
docs_generate_project_overview(includeArchitecture?, includeToolsCatalogue?, ...)
```
Call `docs_generate_walkthrough` at the **end of every work session** to persist what was done. Call `docs_generate_project_overview` after major structural changes.

### 🚦 Supervisor Gates (Human-in-the-Loop)

> **CRITICAL**: Claude must use supervisor gates for all risky or ambiguous situations. Never proceed destructively without a gate.

```
supervisor_checkpoint(operation, details?, severity?, ttlMs?)  → gateId
supervisor_feedback(proposal, diff?, aspects?, ttlMs?)         → gateId
supervisor_ask(question, suggestions?, ttlMs?)                 → gateId
supervisor_resolve(gateId, approved?, answer?, feedback?)
supervisor_halt(taskId?, reason?)
supervisor_status()
```

**When to use each gate:**

| Gate | Use when |
|---|---|
| `supervisor_checkpoint` | About to delete, overwrite, deploy, migrate data |
| `supervisor_feedback` | You've written code/a plan and want human review before applying |
| `supervisor_ask` | There are 2+ valid approaches and context is needed to decide |
| `supervisor_halt` | A task is hung, looping, or needs emergency stop |

Gates return a `gateId`. The human resolves it via `supervisor_resolve`. Poll `supervisor_status` if needed.

### 🔄 Workflow
```
workflow_consult(intent)
```
Ask the WorkflowAgent for a recommended step-by-step plan. Use **before** starting any multi-step task where you're unsure of the sequence.

### 🔧 Configuration
```
config_analyze(goal?)
config_suggest(category)
```
Audit project configuration (linting, CI, husky) and get remediation instructions.

### 📝 Workspace / Blackboard
```
workspace_read()
workspace_update_file(path, errors?, phase_completed?)
workspace_add_feedback(to, target_file, reason)
```
Interact with the shared state manager during multi-agent workflows.

### ⚖️ Orchestration & Judge
```
judge_file(path, phase)
orchestrator_next(file_just_completed?)
orchestrator_status()
```
Run the stateless Judge evaluation on an artifact, and consult the Orchestrator for the next pipeline action.

### 🤖 Multi-Agent Orchestration & Optimization (NEW)
```
expandSchema(name)
agent_sprint_planning(task, context?, mode?)
agent_retrospective(lookback_minutes?, focus?)
agent_decide_strategy(task_description, is_reversible?, has_verifiable_answer?, latency_budget_ms?)
```
Use `expandSchema` to see the full JSON schema of a tool if its output size was truncated to save token budgets.
When executing complex swarms, define your strategy with `agent_decide_strategy` and plan complex moves using `agent_sprint_planning` (Self-MoA consensus). Use `agent_retrospective` to diagnose repeating Circuit Breaker failures or DLQ logs.

---

## Monitoring RPC Methods (Direct RPC, not tools/call)

These are available as direct JSON-RPC method calls:

```
monitoring:record_metric     monitoring:get_metric
monitoring:list_metrics      monitoring:query_analytics
monitoring:create_alert      monitoring:update_alert
monitoring:delete_alert      monitoring:list_alerts
monitoring:get_alert_events  monitoring:health_status
```

Use these when instrumenting agents or tracking performance trends.

---

## Critical Rules for Claude

### 1. Evaluate Intent Before Acting
**Never** skip `scope_guard` when the user asks for a feature or change, even if they insist. This protects project integrity from scope creep or debt.

### 2. Plan before code
For any task touching > 2 files, call `planning_create` first. Do not start writing code without a plan.

### 3. Check Coherence before generation
Call `coherence_brief` onto the target path before generating any new files to ensure you follow naming, vocabulary, and layer conventions.

### 4. Gate before destruction
**Never** delete files, run migrations, or overwrite important config without calling `supervisor_checkpoint` first.

### 5. Document after work
Close every session with `docs_generate_walkthrough`. This is not optional.

### 6. No infinite loops
If you've executed the same tool > 3 times without progress, call `watchdog_status` and assess. Call `supervisor_ask` if stuck.

### 7. Read skills first
Before working in an unfamiliar domain, read the relevant file from `.skills/`:
- New to multi-agent coordination? Read `.skills/multi-agent-patterns.md`
- Working with memory/RAG? Read `.skills/memory-systems.md`
- Designing new tools? Read `.skills/tool-design.md`
- Using this MCP? Read `.skills/mcp-usage.md`

---

## Transport Configuration

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "mcp-enterprise": {
      "command": "npm",
      "args": ["run", "start:local"],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "warn"
      }
    }
  }
}
```

### Cursor (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "mcp-enterprise": {
      "command": "npm",
      "args": ["run", "start:local"],
      "env": { "ENABLE_HTTP": "true" }
    }
  }
}
```

---

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `TRANSPORT` | `stdio` | `stdio` or `http` |
| `PORT` | `3000` | HTTP server port |
| `ENABLE_HTTP` | `false` | Run HTTP alongside stdio |
| `REDIS_URL` | `redis://localhost:6379` | Distributed locking backend |
| `LOG_LEVEL` | `info` | `debug` / `info` / `warn` / `error` |
| `NODE_ENV` | `development` | Environment flag |
