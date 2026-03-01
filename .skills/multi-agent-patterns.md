---
name: multi-agent-patterns
description: Patterns for orchestrating multiple AI agents using this MCP server — orchestrator, swarm, hierarchical, and specialist models
---

# Multi-Agent Patterns

This MCP server is built to support **concurrent, coordinated multi-agent systems**. This document describes the patterns and which server primitives to use for each.

---

## Why Multi-Agent?

Single agents are bottlenecked by:
- **Context window limits** — can't hold all information at once
- **Sequential execution** — long tasks take a long time
- **Specialization** — a generalist agent is mediocre at everything

Multi-agent systems solve these by:
- **Parallelism** — multiple agents work simultaneously
- **Separation of concerns** — each agent focuses on what it does best
- **Context isolation** — each agent has its own clean context window

---

## Pattern 1: Orchestrator + Workers

```
┌─────────────────────────┐
│     OrchestratorAgent    │
│  planning_create()       │
│  workflow_consult()      │
└──┬──────────┬───────────┘
   │          │
   ▼          ▼
WorkerA    WorkerB
(read+     (compile
 write)     + test)
```

**When to use:** Large tasks that can be decomposed into independent subtasks.

**Pattern rules:**
1. Orchestrator calls `planning_create` to build the task list
2. Orchestrator dispatches subtasks to workers (via shared files or message queues)
3. Workers acquire locks before touching shared resources (`lock/acquire`)
4. Workers write results to a shared output file
5. Orchestrator polls for completion and aggregates results
6. Orchestrator calls `docs_generate_walkthrough` when all tasks finish

**Server primitives used:**
- `planning_create` / `planning_list` → task distribution
- `lock/acquire` / `lock/release` → mutual exclusion
- `write_file` / `read_file` → shared state
- `transaction/begin` / `transaction/commit` → atomic multi-file updates

---

## Pattern 2: Specialist Swarm

```
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Architect │  │  Coder   │  │  Tester  │
  │  Agent   │  │  Agent   │  │  Agent   │
  └──────────┘  └──────────┘  └──────────┘
       │              │              │
       └──────────────┴──────────────┘
              Shared File System
```

**When to use:** Tasks with clear specialist separation (design → implementation → testing).

**Execution flow:**
1. Architect reads codebase with `read_file`, analyzes with `architect/analyze`, writes design doc
2. Coder reads design doc, implements with `write_file`, compiles with `compile_code`
3. Tester reads implementation, runs tests (via `compile_code` with test commands)
4. Each specialist calls `supervisor_checkpoint` before overwriting another's output

**Coordination protocol:**
- Each specialist operates on files it **owns** — avoid cross-specialist writes
- Use a `status.json` file (via `write_file` + `lock/acquire`) to communicate phase transitions
- If a specialist finds an error in upstream work, it calls `supervisor_ask` to escalate

---

## Pattern 3: Hierarchical Agents

```
           ┌───────────────┐
           │  Director     │
           │  (strategy)   │
           └──────┬────────┘
                  │
     ┌────────────┼────────────┐
     ▼            ▼            ▼
  Manager A    Manager B    Manager C
  (planning)   (impl)       (testing)
     │
  ┌──┴──┐
Worker Worker
```

**When to use:** Very large projects where even orchestration itself needs to be distributed.

**Key rule:** Each level only communicates **one level up or down**. Workers never talk directly to the Director. This keeps context clean and responsibility clear.

**Primitives:**
- `observability/start-trace` at Director level → span IDs passed to Managers → Workers add sub-spans
- `monitoring:record_metric` at Worker level → Managers aggregate → Director reads analytics
- `supervisor_halt` at Director level → cascades to all children

---

## Pattern 4: Pipeline Agents

```
Input → Agent A → Agent B → Agent C → Output
         (read)   (transform)  (write)
```

**When to use:** Linear data processing (ETL, code transformation, document generation).

**Pattern rules:**
1. Each agent reads the output of the previous step from disk
2. Each agent writes its output to a named intermediate file
3. Use `transaction/begin` if multiple files must be written atomically
4. The last agent in the pipeline calls `docs_generate_walkthrough`

## Pattern 5: Stateful Pipeline with Guards (Orchestrator + Blackboard + Judge)

```
┌───────────────────────────────────────────────┐
│              Blackboard (State)               │
│  Tracks phases, file errors, feedback queues  │
└───────▲───────────────────────▲───────────────┘
        │                       │
┌───────▼───────┐       ┌───────▼───────┐
│ Orchestrator  │ ◄───► │  JudgeAgent   │
│   (Router)    │       │ (Evaluator)   │
└───────┬───────┘       └───────▲───────┘
        │                       │
        │                       │ (Coherence Validation)
┌───────▼───────┐       ┌───────┴───────┐
│  ScopeGuard   │─────► │ [Specialists] │
│ (Gatekeeper)  │       │ (Coders, etc) │
└───────────────┘       └───────────────┘
```

**When to use:** Complex, multi-step code generation tasks requiring strict quality control, scope management, and human-in-the-loop escalation.

**Pattern rules:**
1. **ScopeGuard:** Evaluates intent *before* anything starts. If risk is too high (scope creep, arch violation), it defers the intent.
2. **Sprint Planning:** Use `agent_sprint_planning` to evaluate strategies before creating formal code, and `agent_decide_strategy` to route execution.
3. **Blackboard:** Instead of raw files, agents use `workspace_read` and `workspace_update_file` to understand phase contexts. Agents inherit `agentAffectiveState` hints based on system success/failure rates.
4. **Coherence & Execution:** Specialists request `coherence_brief` before starting, update code, then run `coherence_check`.
5. **Orchestrator:** Calls `orchestrator_next` to figure out routing (proceed, retry, gate).
6. **Judge:** Emits stateless, unbiased verdicts via `judge_file` for specific files.
7. **Escalation & Retrospective:** If Judge detects repeated failures, Orchestrator catches the `escalate` signal, halts via `supervisorGate`, and runs `agent_retrospective` on the `dlq.log` to recover.

---

## Coordination Primitives Reference

### Mutual Exclusion (Distributed Locking)

```json
// Acquire lock before touching shared resource
{"method": "lock/acquire", "params": {"resource": "file:config.json", "ttl": 30000}}
// → {"lockId": "abc123", "acquired": true}

// Release when done
{"method": "lock/release", "params": {"resource": "file:config.json", "lockId": "abc123"}}
```

Lock automatically expires after `ttl` ms if not released — prevents deadlocks from crashed agents.

### Atomic Transactions

```json
{"method": "transaction/begin", "params": {}}
// → {"transactionId": "tx-456"}

// ... perform reads/writes ...

{"method": "transaction/commit", "params": {"transactionId": "tx-456"}}
// or
{"method": "transaction/rollback", "params": {"transactionId": "tx-456"}}
```

### Deadlock Detection

If you suspect a lock cycle (agents waiting on each other):
```json
{"method": "tools/call", "params": {"name": "deadlock_analyze", "arguments": {}}}
// → {"cycles": [], "status": "no_deadlocks"}
```

Run this proactively when you notice agents stalling.

### Distributed Tracing

```json
// Agent A starts a trace
{"method": "observability/start-trace", "params": {"operation": "build-pipeline", "context": {}}}
// → {"traceId": "trace-789"}

// Agent B adds a span using the same traceId
{"method": "observability/start-trace", "params": {"operation": "compile-step", "context": {"parentTraceId": "trace-789"}}}

// Retrieve the full trace
{"method": "observability/get-trace", "params": {"traceId": "trace-789"}}
```

---

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Fix |
|---|---|---|
| Two agents writing the same file without locking | Race condition, data corruption | Use `lock/acquire` before write |
| Agent polls a resource in a tight loop | Starves other agents, wastes tokens | Use exponential backoff; check `watchdog_status` |
| Orchestrator holds all state in context | Context overflow when delegating | Write plan to disk via `planning_create` |
| Agents communicate through conversation history | History gets truncated | Use shared files as the communication channel |
| No tracing across agents | Impossible to debug failures | Always propagate `traceId` |

---

## Recommended Startup Sequence (Multi-Agent)

```
1. Director calls planning_create()           → externalizes task list
2. Director calls workflow_consult()           → gets recommended sequence
3. Director acquires top-level lock if needed
4. Workers initialized, each with own context
5. Workers call observability/start-trace()   → with shared parent traceId
6. Workers execute, using lock/acquire for each shared resource
7. Workers write outputs to known file paths
8. Director reads outputs, aggregates
9. Director calls docs_generate_walkthrough() → persists session
10. Director calls observability/end-trace()   → closes root trace
```
