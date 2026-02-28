---
name: memory-systems
description: How AI agents store, retrieve, and manage memory beyond the context window — RAG, vector DBs, temporal memory, and practical patterns with mcp-enterprise
---

# Memory Systems for AI Agents

## The Memory Problem

AI agents have a fundamental constraint: **the context window is finite**. Without external memory, every session starts from zero. The agent "forgets" everything it did before.

This document describes the memory systems agents can use — and how the primitives in `mcp-enterprise` provide a practical memory layer.

---

## Types of Memory

### 1. In-Context Memory (Ephemeral)
**What:** Information held in the active token window.
**Duration:** Current session only.
**Capacity:** ~128K–2M tokens depending on model.
**Risk:** Oldest content is truncated when window fills.

**Use for:** Active reasoning, current file contents, ongoing plan steps.

### 2. External File Memory (Persistent)
**What:** Information written to disk files.
**Duration:** Indefinite (survives across sessions).
**Capacity:** Unlimited.
**Risk:** Requires explicit read to reload into context.

**Use with mcp-enterprise:**
```
write_file(path, content)  → store memory
read_file(path)            → recall memory
```

**Best for:** Plans, notes, intermediate outputs, session summaries.

### 3. Structured Memory (Database)
**What:** Information stored in a structured data store (SQL, NoSQL, key-value).
**Duration:** Indefinite.
**Capacity:** Unlimited.
**Risk:** Requires query interface; not natively supported by this server.

**Note:** mcp-enterprise provides `monitoring:record_metric` as a lightweight time-series memory store for numeric values. For full document or vector storage, you need an external database.

### 4. Episodic Memory (Walkthroughs)
**What:** Narrative logs of what happened in previous sessions.
**Duration:** Indefinite.
**Capacity:** Unlimited (stored as markdown files).

**Use with mcp-enterprise:**
```
docs_generate_walkthrough(title, summary, tasks[])
```
At the end of every session, generate a walkthrough. At the start of the next session, read the latest walkthrough to resume context.

### 5. Semantic Memory (RAG)
**What:** Information retrieved by semantic similarity to a query.
**Duration:** Indefinite (stored in vector store).
**Capacity:** Millions of documents.
**Risk:** Requires embedding model + vector DB infrastructure.

**Not built into this server**, but can be added as an external tool.

---

## Memory Architecture with mcp-enterprise

Here's the full external memory stack available through this server:

```
┌────────────────────────────────────────────────┐
│              Agent Context Window               │
│         (current session, ephemeral)            │
└──────────────────┬─────────────────────────────┘
                   │ read/write
    ┌──────────────▼──────────────────────────────┐
    │             File System Memory               │
    │  plans/        → planning_create output      │
    │  goals/        → roadmap and goals           │
    │  docs/         → walkthrough history         │
    │  data/         → agent-generated data files  │
    └──────────────┬──────────────────────────────┘
                   │ record/query
    ┌──────────────▼──────────────────────────────┐
    │            Metrics Memory                    │
    │  monitoring:record_metric                    │
    │  monitoring:query_analytics                  │
    │  (numeric time-series values)                │
    └─────────────────────────────────────────────┘
```

---

## Practical Memory Patterns

### Pattern 1: Plan-as-Memory

Instead of keeping a complex task breakdown in context, externalize it:

```
// Session start
planning_create({
  title: "Refactor Auth Module",
  description: "...",
  tasks: [...]
})
// → Plan written to plans/ directory

// Later session (new context window)
planning_list()
// → Re-read the plan, resume where you left off
```

**Benefit:** The agent can resume a multi-session task without needing the original conversation history.

### Pattern 2: Walkthrough Chain

Each session ends with a walkthrough. Each session starts by reading the last one:

```
// End of session N
docs_generate_walkthrough({
  title: "Auth Refactor - Session 2",
  summary: "Completed JWT validation module. Remaining: refresh token flow.",
  tasks: [...],
  nextSteps: ["Implement refresh token rotation", "Add integration tests"]
})

// Start of session N+1
read_file("docs/walkthrough-auth-refactor-session-2.md")
// → Agent now knows exactly where it left off
```

### Pattern 3: Metric as State

Use `monitoring:record_metric` to store numeric state that persists across sessions:

```json
// Record a metric
{
  "method": "monitoring:record_metric",
  "params": {
    "name": "tests.coverage.percent",
    "value": 78.5,
    "tags": {"module": "auth"}
  }
}

// Query it later
{
  "method": "monitoring:query_analytics",
  "params": {
    "metric": "tests.coverage.percent",
    "from": "2024-01-01T00:00:00Z",
    "to": "2024-12-31T23:59:59Z"
  }
}
```

### Pattern 4: Shared Agent Memory

For multi-agent systems where agents need shared state:

```
// Each agent writes its output with a lock
lock/acquire("resource:shared-state.json")
write_file("data/shared-state.json", updatedContent)
lock/release("resource:shared-state.json")

// Other agents read it
lock/acquire("resource:shared-state.json") // even reads should be locked for consistency
read_file("data/shared-state.json")
lock/release("resource:shared-state.json")
```

---

## Memory Hygiene Rules

### Do
- ✅ Write progress to disk **before** the context window fills
- ✅ Read files **fresh** before editing (never trust recalled content)
- ✅ Use `planning_create` for any task with > 3 subtasks
- ✅ Summarize tool outputs before storing in context (compress verbosity)
- ✅ End every session with `docs_generate_walkthrough`

### Don't
- ❌ Rely on conversation history as the only record of decisions
- ❌ Assume previous session tools are still "remembered"
- ❌ Edit files based on recalled content without re-reading first
- ❌ Store large files entirely in context — read only the lines you need
- ❌ Keep plans only in your head — always write them to disk

---

## Temporal Memory: The Role of Goals & Roadmaps

The `goals/` and `docs/` directories in this project serve as **temporal memory** — a chronological record of what was planned, what was done, and what comes next.

When `planning_create` is called with `appendToRoadmap: true`, the plan is automatically appended to the roadmap file. When `docs_generate_walkthrough` is called with `appendToRoadmap: true`, the walkthrough summary is appended to the roadmap.

This creates a **continuity thread** that any agent (or human) can follow across sessions:

```
goals/roadmap.md
├── 2024-01-10: Auth Module — planned
├── 2024-01-12: Auth Module — JWT complete
├── 2024-01-15: Auth Module — refresh tokens complete
└── 2024-01-18: Rate Limiting — planned
```

Always pass `appendToRoadmap: true` for long-running projects.
