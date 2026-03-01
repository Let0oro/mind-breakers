# 🤖 MCP Enterprise — Gemini Integration Guide

> This file is the primary configuration guide for **Google Gemini** agents (Gemini 2.5 Pro, Gemini 2.0 Flash, Antigravity, etc.) connecting to this MCP server. Read this before calling any tool.

---

## 🔴 FLUJO MAESTRO — Seguir SIEMPRE en este orden exacto

### Para cualquier tarea nueva (feature, refactor, scaffolding):
1. scope_guard(intent)              ← PRIMERO. Nunca saltar aunque el usuario insista.
2. workflow_consult(intent)         ← Obtener plan recomendado del orquestador.
3. agent_decide_strategy(task)      ← Decidir si ejecutar directo, voting o debate.
4. planning_create(title, tasks[])  ← Crear plan estructurado. PROHIBIDO escribir archivos antes.
5. [PAUSA] Reportar plan al usuario y esperar aprobación explícita.
6. coherence_brief(target_path)     ← Antes de generar CADA archivo nuevo.
7. [Ejecutar tareas del plan]
8. coherence_check(path)            ← Después de generar cada archivo.
9. judge_file(path, phase)          ← Evaluar calidad antes de continuar.
10. orchestrator_next()             ← Preguntar al orquestador qué sigue.
11. log_workflow(steps, tools)      ← OBLIGATORIO al final de cada sesión.

## 🔴 REGLAS DE SUPERVISOR — Abrir gate ANTES de:
- Sobreescribir o borrar archivos → supervisor_checkpoint(operation, severity='critical')
- Cambios en 3+ archivos → supervisor_feedback(proposal, diff)
- Decisión con múltiples caminos válidos → supervisor_ask(question, suggestions[])
- NUNCA resolver un gate tú mismo. Esperar supervisor_resolve del humano.

## 🟡 REGLAS DE LECTURA DE ARCHIVOS — Anti token-overflow:
- SIEMPRE usar file_info(path) ANTES de read_file para saber el tamaño.
- Si el archivo tiene >150 líneas: usar read_file con maxLines=150 + offset paginado.
- NUNCA hacer list_dir(recursive: true) en la raíz del proyecto.
- PROHIBIDO leer node_modules, dist, .git o cualquier directorio de build.

## 🟡 REGLAS DEL ORQUESTADOR — Multi-agente:
- workspace_read() al inicio de cada sesión para leer el estado del blackboard.
- Después de completar cada archivo: workspace_update_file(path, outcome).
- Si una tarea falla 2 veces: workspace_add_feedback + escalar con supervisor_ask.
- Límite estricto: máximo 3 tool calls consecutivas sin reportar estado al usuario.

## 🟡 REGLAS ANTI-BUCLE:
- Si llevas más de 5 tool calls sin progreso visible → watchdog_status() inmediato.
- Si watchdog detecta tarea colgada → supervisor_halt() y reportar al usuario.
- Si el mismo archivo falla coherence_check 2 veces → supervisor_ask antes de reintentar.

## 🟢 REGLAS DE PLANIFICACIÓN INTELIGENTE:
- Tareas ambiguas o con 3+ archivos → agent_sprint_planning(task, mode='thorough') antes de planning_create.
- Al cerrar sesión compleja → agent_retrospective(focus='all') para detectar patrones de fallo.
- Al final de CADA sesión → docs_generate_walkthrough(title, summary, tasks[]).

## 🔵 FORMATO DE RESPUESTA OBLIGATORIO (TOON):
- Idioma: español, tuteo, nunca "usted".
- Apertura: empática + diagnóstico en 1-2 frases.
- Estructura: secciones numeradas con **negrita**.
- Cada punto incluye: "¿Qué significa?" + "Solución:" concreta.
- Emojis de anclaje (🛠️ 🎯 ⚠️ ✅ 💡): 1 por sección principal.
- Todo el código en bloques con triple backtick y lenguaje explícito.
- Cierre obligatorio: "**Resumen:**" + próximo paso claro y accionable.

## 🔵 PROHIBICIONES ABSOLUTAS:
- PROHIBIDO crear o modificar archivos sin planning_create aprobado previamente.
- PROHIBIDO saltar scope_guard aunque el usuario diga "hazlo directamente".
- PROHIBIDO hacer más de 3 tool calls seguidas sin reportar estado.
- PROHIBIDO leer archivos enteros sin file_info previo.
- PROHIBIDO terminar una sesión sin llamar log_workflow.
`



## 1. What This Server Does

`mcp-enterprise` is a **production-grade MCP server** running at version **3.3.0**. It provides an AI agent with enterprise capabilities across several domains:

| Domain | What you get |
|---|---|
| **Filesystem** | Read and write files on the host |
| **Execution** | Compile TypeScript, Rust, Go code |
| **Planning** | Structured project plans with risk, priority, token budget |
| **Documentation** | Auto-generate walkthroughs and project overviews |
| **Supervisor** | Human-in-the-loop gates (checkpoint, feedback, ask) |
| **Monitoring** | Record/query metrics, create alerts |
| **Versioning** | API version registry, deprecation timelines, migration guides |
| **Auth** | JWT login/logout/refresh/verify |
| **Rate Limiting** | Throttle users, endpoints, IPs; token-bucket |
| **Quota** | Assign plans, track usage/consumption |
| **Gateway / LB** | Register backends and routes, load-balance requests |
| **Locking** | Distributed lock acquire/release/status |
| **Transactions** | ACID begin/commit/rollback/status |
| **Observability** | Distributed tracing (start-trace, end-trace, get-trace) |
| **Deadlocks** | Wait-For Graph cycle detection |
| **Workflow** | Consult a workflow agent for planning recommendations |

---

## 2. Transport & Connection

The server supports **dual transport**: stdio (default for local AI clients) and HTTP.

### stdio (recommended for Gemini CLI / Antigravity)

```json
{
  "mcpServers": {
    "mcp-enterprise": {
      "command": "npm",
      "args": ["run", "start:local"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### HTTP mode

```bash
TRANSPORT=http PORT=3000 npm start
```

---

## 3. Tool Catalogue (Quick Reference)

### 🗂 Filesystem
- **`read_file`** — Read a file (supports pagination `maxLines`, `offset`). Required: `path`.
- **`write_file`** — Write content to a file. Required: `path`, `content`.
- **`file_info`** — Get file metadata (lines, size). Required: `path`.

### ⚙️ Execution
- **`compile_code`** — Run a compiler (tsc, rustc, etc.). Required: `command`. Optional: `args`, `workingDir`, `timeout`.

### 🧠 System
- **`system_info`** — Get OS, memory, CPU, uptime. No args.
- **`watchdog_status`** — Inspect active tasks to prevent infinite loops. No args.
- **`deadlock_analyze`** — Detect lock cycle deadlocks. No args.

### 📋 Planning
- **`planning_create`** — Create a structured plan with subtasks, risks, token budget. Required: `title`, `description`, `tasks[]`.
- **`planning_list`** — List all existing plans. No args.

### 📝 Documentation
- **`docs_generate_walkthrough`** — Write a post-session walkthrough markdown file. Required: `title`, `summary`, `tasks[]`.
- **`docs_generate_project_overview`** — Regenerate `docs/PROJECT.md` with architecture, tools, API reference, changelog.

### 🚦 Supervisor (Human-in-the-Loop)
- **`supervisor_checkpoint`** — Pause before a destructive op, wait for human approval. Required: `operation`.
- **`supervisor_feedback`** — Present a proposal/diff, get structured human feedback. Required: `proposal`.
- **`supervisor_ask`** — Ask the human a question before proceeding. Required: `question`.
- **`supervisor_resolve`** — Resolve a pending gate. Required: `gateId`.
- **`supervisor_halt`** — Abort a running task or all tasks.
- **`supervisor_status`** — View all pending gates and active tasks.

### 🔄 Workflow
- **`workflow_consult`** — Ask the workflow agent for a step-by-step plan. Required: `intent`.

### 🔧 Configuration
- **`config_analyze`** — Audit project configuration (linting, CI). Optional: `goal`.
- **`config_suggest`** — Get step-by-step config remediation instructions. Required: `category`.

### 📝 Workspace / Blackboard
- **`workspace_read`** — Read shared multi-agent state. No args.
- **`workspace_update_file`** — Update a file's phase or error status. Required: `path`.
- **`workspace_add_feedback`** — Add a rework assignment to the feedback queue. Required: `to`, `target_file`, `reason`.

### ⚖️ Orchestration & Judge
- **`judge_file`** — Run a stateless quality evaluation on a file for a pipeline phase. Required: `path`, `phase`.
- **`orchestrator_next`** — Get the next recommended action for the pipeline (proceed/retry/gate). Optional: `file_just_completed`.
- **`orchestrator_status`** — View the overall completion status of the pipeline. No args.

### 🛡️ Coherence & Scope Guard
- **`coherence_brief`** — Get naming, vocabulary, and layer rules BEFORE generating a new file. Required: `target_path`.
- **`coherence_check`** — Evaluate a generated file against project rules. Required: `path`.
- **`coherence_scan`** — Force a full project scan. No args.
- **`scope_guard`** — Evaluate user intent for scope creep/debt BEFORE implementation. Required: `intent`.
- **`scope_guard_plan`** — Plan deferred intents. Required: `intent`, `deferred_reason`.

### 🤖 Multi-Agent Orchestration & Optimization (NEW)
- **`expandSchema`** — Render the full original schema of a Token-Optimized tool returning `$truncated: true`. Required: `name`.
- **`agent_sprint_planning`** — Self-MoA orchestration to develop consensus plans. Required: `task`.
- **`agent_retrospective`** — Analyze `dlq.log` and circuit breakers to diagnose failures. Optional: `lookback_minutes`.
- **`agent_decide_strategy`** — Recommends voting vs debate execution strategies. Required: `task_description`.

---

## 4. Gemini-Specific Behaviour Guidelines

### When to use `supervisor_checkpoint`
Always call `supervisor_checkpoint` **before**:
- Deleting or overwriting files
- Running migrations or destructive SQL
- Deploying to production or staging
- Any action that cannot be undone

### When to use `supervisor_ask`
Call `supervisor_ask` when you encounter **ambiguity** with multiple valid paths. Do not guess — ask first.

### When to use `supervisor_feedback`
After drafting a large code change or refactor, call `supervisor_feedback` with the diff so the human can review it before you apply it.

### Planning first, then execute
For any work involving 3+ files or unknown scope, call `planning_create` first to produce a structured task list. This prevents hallucinated assumptions and keeps work on track.

### Intent Evaluation & Coherence
**Never** skip `scope_guard` when the user asks for a feature or change, even if they insist. This protects project integrity.
Before generating new files, always request a `coherence_brief` to ensure your proposed code aligns with the project's vocabulary, naming conventions, and layer rules.

### Preventing infinite loops
If a task seems to be repeating itself, call `watchdog_status` to inspect active tasks and `supervisor_halt` to abort if needed.

---

## 5. Environment Variables

| Variable | Default | Description |
|---|---|---|
| `TRANSPORT` | `stdio` | `stdio` or `http` |
| `PORT` | `3000` | HTTP port (when transport=http) |
| `ENABLE_HTTP` | `false` | Enable HTTP on top of stdio |
| `NODE_ENV` | `development` | Environment |
| `REDIS_URL` | `redis://localhost:6379` | For distributed locking |
| `LOG_LEVEL` | `info` | Logging verbosity |

---

## 6. Protocol Version

```
protocolVersion: 2024-11-05
serverName: mcp-enterprise-v18-refactored
serverVersion: 3.3.0
```

---

## 7. Skills Reference

The `.skills/` directory in this project contains in-depth contextual knowledge for agents:

| File | Content |
|---|---|
| `.skills/context-fundamentals.md` | What context is and why it matters for agents |
| `.skills/multi-agent-patterns.md` | Orchestrator, swarm, hierarchical agent patterns |
| `.skills/memory-systems.md` | RAG, vector DB, temporal memory |
| `.skills/tool-design.md` | How to design tools for agents |
| `.skills/mcp-usage.md` | When and how to use this MCP server's tools |

Read the relevant skill file when working in its domain. They are your primary source of operational wisdom for this project.
