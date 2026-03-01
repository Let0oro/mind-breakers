---
name: context-fundamentals
description: What context is, why it matters for AI agents, and how to manage it effectively within this MCP server
---

# Context Fundamentals for AI Agents

## What Is Context?

In the world of AI agents, **context** is the sum of all information available to an agent at any given moment to make decisions and produce outputs. It is the agent's working memory — finite, perishable, and critically important.

Context includes:
- **Conversation history** — the dialogue turns so far
- **Tool results** — outputs of prior tool calls
- **Files and code** — loaded source content
- **System state** — environment variables, server health
- **Instructions** — system prompts, skill files, user rules
- **Goals** — the current task and its subgoals

---

## Why Context Gets Corrupted

### 1. Context Window Overflow
Every LLM has a finite token budget. When that budget is exhausted:
- Old turns get truncated (usually from the beginning)
- Tool results may be dropped silently
- The agent loses awareness of decisions already made

**Mitigation:** Summarize frequently. Use `docs_generate_walkthrough` at session checkpoints to persist what was done before context fills up.

### 2. Hallucination from Context Gaps
When the agent references something that was dropped from context, it may **hallucinate** plausible-sounding but wrong details (file paths, function names, API contracts).

**Mitigation:** Always re-read files before editing them. Never trust recalled content without verification via `read_file`.

### 3. Stale Context
The agent may operate on outdated information if the file system or database changed since it last read it.

**Mitigation:** Re-read shared resources before acting on them, especially in multi-agent scenarios.

---

## Context Layers in mcp-enterprise

This server provides several mechanisms that extend the agent's effective context beyond the token window:

| Layer | Mechanism | How to use |
|---|---|---|
| **Persistent state** | `read_file` / `write_file` | Externalize memory to disk files |
| **Plans** | `planning_create` / `planning_list` | Store task structure outside context |
| **Walkthroughs** | `docs_generate_walkthrough` | Persist session history to markdown |
| **Tracing** | `observability/start-trace` / `get-trace` | Correlate multi-step operations |
| **Metrics** | `monitoring:record_metric` | Track numeric state over time |

### The Planning File as Extended Context
When you call `planning_create`, the plan is saved to disk and can be retrieved later with `planning_list`. This means you can **offload your task structure** to the file system and reload it at the start of each sub-session. Never keep a complex plan only in context — write it with `planning_create`.

---

## Context Injection Hierarchy

When this MCP server is connected, AI clients typically inject context in this order (highest to lowest priority):

1. **User message** — the immediate request
2. **CLAUDE.md / GEMINI.md** — agent-specific behavioural rules (this project)
3. **AGENTS.md** — universal agent contract
4. **Skill files** (`.skills/`) — domain knowledge loaded on demand
5. **Tool results** — live data from tool calls
6. **Conversation history** — prior turns (subject to truncation)

### Key Insight
Rules defined in `CLAUDE.md` or `GEMINI.md` take precedence over general behaviour. When in conflict with user instructions, the rules in these files should be followed unless the human explicitly overrides them within the conversation.

---

## Context Budget Management

### Token Budget by Activity

| Activity | Approximate tokens consumed |
|---|---|
| Reading a small file (< 100 lines) | ~500 |
| Reading a large file (500+ lines) | 5,000–15,000 |
| Single tool call + result | 200–1,000 |
| A full planning_create result | 1,000–3,000 |
| A conversation turn | 200–2,000 |

### Strategies for Staying Within Budget

1. **Read only what you need** — use line ranges when reading large files
2. **Summarize after obtaining data** — compress tool outputs before storing in memory
3. **Write progress to disk early** — call `docs_generate_walkthrough` before the window fills
4. **Split long sessions** — complete one major task, flush context, then start the next
5. **Use `planning_create` as your anchor** — it externalizes your todo list so you can always reload it

---

## Context and Multi-Agent Systems

In multi-agent setups, each agent has **its own context window** and no inherent awareness of what other agents have done. Coordination requires explicit mechanisms:

- **Shared files** → agents write intermediate outputs to disk, others read them
- **Distributed locks** → prevent two agents from modifying the same resource simultaneously
- **Tracing** → link operations across agents with a shared `traceId`
- **Supervisor gates** → human mediates when agents reach decision forks

See `.skills/multi-agent-patterns.md` for detailed coordination strategies.

---

## Practical Rules

1. **Before editing a file → `read_file` it first.** Never edit from memory.
2. **Before a long task → `planning_create`.** Never plan in context alone.
3. **After a session → `docs_generate_walkthrough`.** Never assume context survives.
4. **When uncertain → `supervisor_ask`.** Never hallucinate an answer to an ambiguous question.
5. **When stuck in a loop → `watchdog_status`.** Never retry the same tool > 3 times.
