# 🤖 MCP Enterprise — Agent Integration Guide

> Universal guide for any AI agent connecting to this MCP server, regardless of framework (LangChain, LlamaIndex, AutoGen, CrewAI, custom agents, etc.).

---

## Overview

`mcp-enterprise` is a **Model Context Protocol server** (version 3.3.0) implementing the `2024-11-05` protocol spec. It exposes a rich set of enterprise capabilities through a unified JSON-RPC 2.0 interface over **stdio** (default) or **HTTP**.

### Architecture Summary

```
┌─────────────────────────────────────────────────┐
│                  AI Agent(s)                     │
└──────────────────────┬──────────────────────────┘
                       │  MCP / JSON-RPC 2.0
          ┌────────────▼───────────────┐
          │      SimpleMCPServer        │
          │  ┌─────────────────────┐   │
          │  │   HandlerRegistry   │   │
          │  │  18 Domain Handlers │   │
          │  └─────────────────────┘   │
          │  Monitoring · Versioning    │
          │  Observability · Tracing    │
          └────────────────────────────┘
```

---

## Protocol

**Initialization handshake** (required):

```json
// Request
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}

// Response
{
  "jsonrpc": "2.0", "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {"tools": {}},
    "serverInfo": {
      "name": "mcp-enterprise-v18-refactored",
      "version": "3.3.0"
    }
  }
}
```

**Tool discovery:**
```json
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
```

**Tool invocation:**
```json
{
  "jsonrpc": "2.0", "id": 3,
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": { ...args }
  }
}
```

---

## Available Tools

### Core Tools (tools/call)

| Tool | Required Args | Description |
|---|---|---|
| `read_file` | `path` | Read a file (supports pagination `maxLines`, `offset`) |
| `write_file` | `path`, `content` | Write content to a file |
| `file_info` | `path` | Get file size and line count |
| `compile_code` | `command` | Compile code (tsc, rustc, go build…) |
| `system_info` | — | System status and info |
| `watchdog_status` | — | Active task watchdog status |
| `deadlock_analyze` | — | Detect lock deadlocks via Wait-For Graph |
| `planning_create` | `title`, `description`, `tasks[]` | Create structured project plan |
| `planning_list` | — | List all project plans |
| `docs_generate_walkthrough` | `title`, `summary`, `tasks[]` | Generate session walkthrough |
| `docs_generate_project_overview` | — | Regenerate `docs/PROJECT.md` |
| `supervisor_checkpoint` | `operation` | Gate: pause & wait for approval |
| `supervisor_feedback` | `proposal` | Gate: present work, get feedback |
| `supervisor_ask` | `question` | Gate: ask human a question |
| `supervisor_resolve` | `gateId` | Resolve a pending gate |
| `supervisor_halt` | — | Abort task(s) |
| `supervisor_status` | — | View all gates and active tasks |
| `workflow_consult` | `intent` | Get recommended workflow plan |
| `config_analyze` | `goal` | Audit project configuration |
| `config_suggest` | `category` | Get config remediation steps |
| `workspace_read` | — | Read blackboard shared agent state |
| `workspace_update_file` | `path` | Update file phase/errors in blackboard |
| `workspace_add_feedback` | `to`, `target_file`, `reason` | Assign rework for another agent |
| `judge_file` | `path`, `phase` | Stateless evaluation of pipeline phase |
| `orchestrator_next` | — | Decide next pipeline action |
| `orchestrator_status` | — | Get general pipeline execution status |
| `coherence_brief` | `target_path` | Get project coherence rules before generating code |
| `coherence_check` | `path` | Evaluate file coherence after generation |
| `coherence_scan` | — | Force a full project coherence scan |
| `scope_guard` | `intent` | Evaluate feature request for scope creep/risks |
| `scope_guard_plan` | `intent`, `deferred_reason` | Create plan for deferred work |
| `expandSchema` | `name` | Expand details of a truncated tool schema for token optimization |
| `agent_sprint_planning` | `task` | Run a Self-MoA sprint planning session with multiple simulated agents |
| `agent_retrospective` | — | Analyze recent execution failures and circuit breaker triggers from DLQ |
| `agent_decide_strategy` | `task_description` | Recommend multi-agent execution strategy (direct, voting, debate) |

### Direct RPC Methods (method calls, not tools/call)

**System:**
`system/health` · `system/metrics`

**Monitoring:**
`monitoring:record_metric` · `monitoring:get_metric` · `monitoring:list_metrics` · `monitoring:query_analytics` · `monitoring:create_alert` · `monitoring:update_alert` · `monitoring:delete_alert` · `monitoring:list_alerts` · `monitoring:get_alert_events` · `monitoring:health_status`

**Versioning:**
`versioning:get_versions` · `versioning:register_version` · `versioning:deprecate_endpoint` · `versioning:get_deprecation_timeline` · `versioning:get_migration_guide` · `versioning:translate_request`

**Auth:**
`auth/login` · `auth/logout` · `auth/refresh` · `auth/verify` · `auth/user-create`

**Rate Limiting:**
`ratelimit/throttle-user` · `ratelimit/throttle-endpoint` · `ratelimit/throttle-ip` · `ratelimit/token-bucket` · `ratelimit/stats`

**Quota:**
`quota/assign-plan` · `quota/usage` · `quota/consumption`

**Gateway / Load Balancer:**
`gateway/register-backend` · `gateway/register-route` · `gateway/process-request` · `gateway/backends` · `gateway/metrics` · `lb/add-server` · `lb/select-server` · `lb/set-strategy` · `lb/server-metrics` · `lb/stats`

**Locking:**
`lock/acquire` · `lock/release` · `lock/status`

**Transactions:**
`transaction/begin` · `transaction/commit` · `transaction/rollback` · `transaction/status` · `transaction/stats`

**Observability:**
`observability/start-trace` · `observability/end-trace` · `observability/get-trace` · `observability/health`

---

## Agent Behavioral Contract

The server enforces a **human-in-the-loop (HITL)** model via Supervisor Gates. Agents must respect the following contract:

### Gate Types

| Gate | Trigger | Resolution |
|---|---|---|
| `checkpoint` | Destructive action about to happen | Human approves or rejects |
| `feedback` | Agent has produced output and needs review | Human provides structured feedback |
| `ask` | Agent is at a decision fork | Human answers the question |

Gates are **fire-and-wait**: the agent opens a gate, receives a `gateId`, and must wait for it to be resolved before proceeding. Gates expire after `ttlMs` (default: 10 minutes).

### Mandatory Gate Situations

Any agent MUST open a gate before:
1. Deleting or overwriting files
2. Running migrations or destructive database operations
3. Deploying to any environment
4. Making external API calls with side-effects
5. Proceeding when 2+ equally valid approaches exist

In addition to gates, agents MUST:
- Call `scope_guard` BEFORE implementing any new feature or answering complex requests, to check for architectural drift or scope creep.
- Call `coherence_brief` BEFORE generating any new file to ensure it aligns with existing naming and layers.

---

## Multi-Agent Patterns

This server is designed to support **multiple concurrent agents**. Key primitives for coordination:

| Primitive | Tool/Method | Purpose |
|---|---|---|
| Distributed Lock | `lock/acquire`, `lock/release` | Prevent two agents from modifying the same resource |
| Transaction | `transaction/begin`, `transaction/commit` | ACID operations across agents |
| Deadlock Detection | `deadlock_analyze` | Detect lock cycles automatically |
| Watchdog | `watchdog_status`, `supervisor_halt` | Kill stuck or looping agents |
| Tracing | `observability/start-trace`, `observability/end-trace` | Correlate spans across agents |

For deep guidance on multi-agent coordination, read `.skills/multi-agent-patterns.md`.

---

## Connection Examples

### LangChain / Python

```python
from langchain_mcp import MCPClient

client = MCPClient(
    command=["npm", "run", "start:local"],
    cwd="/path/to/mcp-enterprise",
    env={"NODE_ENV": "production"}
)
```

### AutoGen

```python
mcp_config = {
    "mcp_servers": [{
        "name": "mcp-enterprise",
        "command": "npm",
        "args": ["run", "start:local"]
    }]
}
```

### HTTP (Any Framework)

```bash
TRANSPORT=http PORT=3000 npm start
# Streamable HTTP Endpoint: http://localhost:3000/mcp
```

---

## Skills Reference

Read these before working in their respective domains:

| Skill | File |
|---|---|
| Context & memory fundamentals | `.skills/context-fundamentals.md` |
| Multi-agent coordination patterns | `.skills/multi-agent-patterns.md` |
| Memory systems (RAG, vector DB) | `.skills/memory-systems.md` |
| Designing tools for agents | `.skills/tool-design.md` |
| How to use this MCP effectively | `.skills/mcp-usage.md` |
