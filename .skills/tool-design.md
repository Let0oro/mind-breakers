---
name: tool-design
description: Principles and patterns for designing effective MCP tools — when to add a tool, how to structure inputs/outputs, and how this server's tools were designed
---

# Tool Design for AI Agents

## What Makes a Good MCP Tool?

An MCP tool is a **typed, named, callable function** that an AI agent can invoke to interact with the world outside its context window. Good tools balance expressiveness with clarity and are designed to be used correctly by an LLM.

---

## Core Principles

### 1. One Tool, One Responsibility
Each tool should do **exactly one thing** and do it well. Avoid tools that take a `mode` or `action` parameter that fundamentally changes what they do — those are actually multiple tools in disguise.

**Bad:**
```json
{
  "name": "file_operation",
  "params": { "action": "read|write|delete", "path": "..." }
}
```

**Good:**
```json
{ "name": "read_file",  "params": { "path": "..." } }
{ "name": "write_file", "params": { "path": "...", "content": "..." } }
```

Why: The LLM reads the tool name as a description of intent. `write_file` is harder to accidentally misuse than `file_operation` with `action: "delete"`.

### 2. Make the Happy Path Obvious
Required parameters should represent the **minimum viable invocation**. Optional parameters add power without adding complexity.

This server's tools follow this pattern:
- `supervisor_checkpoint(operation)` — one required field, everything else optional
- `planning_create(title, description, tasks[])` — exactly three things needed to plan
- `compile_code(command)` — compile anything with just the command name

### 3. Fail Loudly and Clearly
Tools should return structured errors with helpful messages. Never return success with an embedded error string in the content.

**Good error format:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Missing required argument: 'operation'"
  }
}
```

The LLM will read the error message and correct its call. Vague errors lead to hallucinated corrections.

### 4. Idempotency Where Possible
Tools that can be safely called multiple times with the same input should be. This enables the agent to retry without fear of side effects.

- `read_file` → perfectly idempotent
- `write_file` → idempotent (overwriting same content is fine)
- `lock/acquire` → **not** idempotent — guard with status checks

### 5. Document Intent, Not Implementation
The `description` field in tool schemas is read by the LLM as the first source of truth about when to use the tool. Write it as a **decision guide**, not a technical spec.

**Bad description:**
> "Calls supervisorGate.openCheckpoint() and returns a gateId object."

**Good description:**
> "Open a checkpoint gate — AI pauses before a destructive operation and waits for human approval. Returns a gateId; use supervisor/resolve to approve or reject."

---

## Input Schema Design

### Use Enums for Constrained Choices
When a field has a fixed set of valid values, define them as an enum. This prevents the LLM from hallucinating invalid values.

```json
"severity": {
  "type": "string",
  "enum": ["info", "warning", "critical"],
  "default": "warning"
}
```

### Use Objects for Grouped Context
When multiple related fields go together, group them into an object parameter.

```json
"details": {
  "type": "object",
  "description": "Structured context: file paths, SQL, env vars, etc."
}
```

This gives the agent flexibility while keeping the top-level schema clean.

### Use Arrays for Repeating Items
Tasks, files, aspects — anything that can appear multiple times — should be arrays with a well-defined item schema.

```json
"tasks": {
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "title": { "type": "string" },
      "description": { "type": "string" },
      "priority": { "type": "string", "enum": ["critical", "high", "medium", "low"] },
      "estimatedHours": { "type": "number" }
    },
    "required": ["title", "description"]
  }
}
```

---

## Output Design

### Always Return Structured Results
Even for void operations, return a confirmation object. The agent needs to know the operation succeeded.

```json
{ "status": "acquired", "lockId": "abc123", "resource": "file:config.json" }
```

### Include Actionable IDs
When an operation creates an entity (gate, lock, plan, trace), return an ID the agent can use in a follow-up tool call.

```json
{ "gateId": "gate-789", "status": "pending", "message": "Checkpoint created. Waiting for approval." }
```

The `gateId` maps directly to `supervisor_resolve(gateId)` — the agent knows what to do next.

### Avoid Overly Verbose Outputs
Return only what the agent needs for its next decision. Verbose outputs consume context tokens unnecessarily.

---

## Categories of Tools (by Effect)

| Category | Examples | Safety Level |
|---|---|---|
| **Read-only** | `read_file`, `system_info`, `planning_list` | Safe to retry |
| **Write (reversible)** | `write_file` (with backup), `monitoring:record_metric` | Low risk |
| **Write (irreversible)** | Deleting files, running migrations | **Require checkpoint gate** |
| **Control flow** | `supervisor_checkpoint`, `supervisor_halt` | Must not be retried blindly |
| **External side-effects** | `auth/login`, `gateway/process-request` | Use with caution |

### The Checkpoint Pattern
Before any **irreversible write**, the agent MUST call `supervisor_checkpoint` and wait for approval. This is not just a rule — it's the design intent of the Supervisor system:

```
Agent calls compile_code(command: "rm -rf dist && ...") ← should trigger checkpoint first
→ supervisor_checkpoint({ operation: "Delete dist/ and rebuild", severity: "warning" })
→ waits for human resolve({ approved: true })
→ then calls compile_code(...)
```

---

## Extending This Server with New Tools

If you need to add a new tool to this server, follow this checklist:

1. **Define the schema** in `src/mcp/tools/index.ts` — include `name`, `description`, `inputSchema`
2. **Create a handler** in `src/mcp/handlers/<domain>.ts` — one class, one method per tool
3. **Register the handler** in `src/mcp/handlers/index.ts` `HandlerRegistry`
4. **Add the route** in `handleToolCall()` switch statement
5. **Test the schema** — call `tools/list` and verify the tool appears
6. **Update documentation** — add to `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` tool tables
7. **Write a test** in `__tests__/`

### Naming Conventions

| Pattern | Example | When to use |
|---|---|---|
| `noun_verb` | `read_file`, `write_file` | Simple filesystem/CRUD operations |
| `domain_action` | `planning_create`, `docs_generate_walkthrough` | Domain-specific operations |
| `supervisor_action` | `supervisor_checkpoint`, `supervisor_halt` | Lifecycle/control flow |
| `domain/action` (RPC) | `auth/login`, `lock/acquire` | Direct RPC methods (not tools/call) |
