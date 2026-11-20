# AGENTFLOW AI — Agent Studio & Multi-Agent Orchestration

AGENTFLOW AI provides a multi-agent orchestration architecture powered by LangGraph, FastAPI, and structured LLM tool execution. This guide explains how agents are defined, managed, and orchestrated.

---

## 1. Built-in Agent Templates

The platform includes 7 pre-engineered agent templates designed for production enterprise workflows. Each comes with hardened prompt guidelines, recommended toolsets, and safety constraints.

```
       ┌────────────────────────────────────────────────────────┐
       │                Project Manager Agent                   │
       │       (Decomposes objectives, coordinates teams)       │
       └──────────────────────────┬─────────────────────────────┘
                                  │
    ┌──────────────┬──────────────┼──────────────┬──────────────┐
    ▼              ▼              ▼              ▼              ▼
┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
│Research│    │ Sales  │    │Support │    │Developer    │ Analyst│
│ Agent  │    │ Agent  │    │ Agent  │    │ Agent  │    │ Agent  │
└────────┘    └────────┘    └────────┘    └────────┘    └────────┘
```

### 1. Research Agent
- **Purpose**: Gathers verified factual information, reads web content, explores uploaded tenant knowledge documents, and generates structured executive summaries.
- **Allowed Tools**: `web_fetch`, `knowledge_search`, `text_summarizer`, `structured_parser`.
- **Safety Rule**: Mandates source citations. Blocks internal network lookups via SSRF guard.

### 2. Sales Agent
- **Purpose**: Analyzes qualified inbound leads, personalizes sales messaging, drafts follow-up cadences, and scores pipeline opportunities.
- **Allowed Tools**: `calculator`, `text_summarizer`, `structured_parser`.
- **Safety Rule**: Prohibited from dispatching outbound communications without an explicit human approval checkpoint.

### 3. Customer Support Agent
- **Purpose**: Resolves user queries, explains policies, diagnoses common errors, and drafts polite, accurate customer replies using the verified tenant knowledge base.
- **Allowed Tools**: `knowledge_search`, `datetime`.
- **Safety Rule**: When uncertainty exceeds threshold or policy is ambiguous, escalates directly to human supervisor.

### 4. Developer Agent
- **Purpose**: Reviews code diffs, explains algorithmic complexity, detects syntax and security vulnerabilities, and generates clean code implementations.
- **Allowed Tools**: `structured_parser`, `knowledge_search`.
- **Safety Rule**: Strict zero-host execution. Does not evaluate or execute untrusted code on the host operating system.

### 5. Marketing Agent
- **Purpose**: Synthesizes market trends, drafts high-converting marketing copy, generates multi-channel content strategies, and formulates social campaigns.
- **Allowed Tools**: `text_summarizer`, `knowledge_search`, `web_fetch`.
- **Safety Rule**: Adheres to strict brand voice guidelines and checks compliance against banned marketing claims.

### 6. Data Analyst Agent
- **Purpose**: Parses tabular CSV data, performs statistical computations, calculates financial ratios, and structures telemetry data for visual charts.
- **Allowed Tools**: `calculator`, `csv_reader`, `structured_parser`.
- **Safety Rule**: Validates dataset row bounds and memory limits to prevent buffer overflow attacks.

### 7. Project Manager Agent (Supervisor)
- **Purpose**: Analyzes high-level user directives, decomposes them into ordered subtasks, assigns work to specialized worker agents, tracks dependencies, and compiles the final deliverable.
- **Allowed Tools**: `datetime`, `structured_parser`.
- **Safety Rule**: Enforces iteration caps and human approvals before critical branch points.

---

## 2. Agent Hyperparameters & Governance

When configuring agents in the **Agent Studio**, organizations can tune execution limits:

| Parameter | Type | Default | Permitted Range | Purpose |
|:---|:---|:---|:---|:---|
| `temperature` | `float` | `0.3` | `0.0` – `1.0` | Controls output randomness; lower values ensure determinism for analysis. |
| `maxTokens` | `integer` | `4096` | `256` – `16384` | Maximum token length for model completion. |
| `maxSteps` | `integer` | `10` | `1` – `30` | Guard against infinite reasoning loops in autonomous chains. |
| `timeoutSeconds` | `integer` | `120` | `10` – `600` | Hard cutoff for agent execution runs. |
| `tokenBudget` | `integer` | `50000` | `1000` – `500000` | Cost ceiling per execution to avoid runaway LLM spend. |

---

## 3. LangGraph Multi-Agent Orchestration

The Python AI service utilizes **LangGraph** to construct a deterministic, stateful workflow graph:

### Orchestration Flow
1. **Supervisor Node**: Analyzes incoming task payload and current task state. Determines next appropriate agent or concludes task.
2. **Worker Nodes (Research, Sales, Analyst, etc.)**: Receives filtered context, reasons about objective, and either emits a tool call or an intermediate finding.
3. **Tool Execution Node**: Executes approved tools inside a restricted sandbox environment. Returns sanitized outputs back to the graph state.
4. **Approval Checkpoint Node**: If a sensitive action (e.g. `SEND_EMAIL`, `DATABASE_MUTATE`) is required, execution halts and sets status to `WAITING_APPROVAL`.
5. **Synthesis Node**: When all subtasks are satisfied, supervisor compiles final structured output.

### Real-Time Telemetry & Step Trace
Every execution records an immutable chronological sequence of steps:
- `THOUGHT`: Inner reasoning and planning step.
- `TOOL_CALL`: Parameterized tool invocation with inputs.
- `TOOL_RESULT`: Sanitized data returned by tool.
- `APPROVAL_REQUEST`: Human-in-the-loop checkpoint pause.
- `FINAL_OUTPUT`: Verified task resolution and deliverable.
