# AGENTFLOW AI — Visual Workflow Builder & Execution Engine

AGENTFLOW AI includes a visual Directed Acyclic Graph (DAG) workflow builder powered by **React Flow** on the frontend and an asynchronous execution engine on the backend.

---

## 1. Visual Builder Overview

The Workflow Studio allows users to design multi-agent automation pipelines through an intuitive drag-and-drop canvas:
- **Pan, Zoom & Mini-map**: Smooth canvas navigation with background grid.
- **Node Sidebar**: Drag-and-drop node palette.
- **Node Configuration Drawer**: Inspect and tune parameters for any selected node.
- **Validation Engine**: Real-time graph integrity checks prior to persistence.
- **Execution Controls**: One-click pipeline run with live node status badges.

---

## 2. Supported Node Types

| Node Type | Icon / Visual | Input Connections | Output Connections | Description |
|:---|:---|:---:|:---:|:---|
| `TRIGGER` | Lightning Bolt (Gold) | 0 | 1+ | Entry point for execution. Supported modes: Manual, Webhook, or Scheduled Cron. |
| `AGENT` | Bot (Blue) | 1+ | 1+ | Delegates task execution to a configured AI Agent with access to its specific tools. |
| `CONDITION` | Split Branch (Violet) | 1 | 2 (True/False) | Evaluates JSON path or regex condition on upstream data to route execution path. |
| `APPROVAL` | Shield / Check (Amber) | 1 | 1 | Pauses pipeline until a human reviewer approves or rejects the action payload. |
| `TOOL` | Wrench (Emerald) | 1+ | 1+ | Directly executes a sandboxed tool (e.g., CSV reader, math parser, web fetch). |
| `OUTPUT` | Flag / CheckCircle (Teal) | 1+ | 0 | Compiles final pipeline payload, persists deliverable, or dispatches webhook. |

---

## 3. DAG Validation Rules

Before a workflow can be saved or triggered, it passes through backend validation (`apps/api/src/services/workflow.service.ts`):

1. **Cycle Detection (DFS Algorithm)**:
   - Evaluates the graph to ensure no cyclical dependencies exist. Cycles return `400 Bad Request: Workflow contains cyclical loops and is not a valid DAG`.
2. **Single Entry Point**:
   - The workflow must contain at least one valid `TRIGGER` node.
3. **Connectivity Check**:
   - Disconnected orphan nodes are flagged with warnings or errors.
4. **Terminal Reachability**:
   - At least one active path must connect a `TRIGGER` to a terminal `OUTPUT` or terminating node.

---

## 4. Execution Runtime & State Transfer

When a workflow is executed:
1. The execution engine computes a **topological sort** of the graph.
2. The initial trigger payload is seeded into the workflow run context.
3. As each node completes:
   - Output artifacts, generated text, and parsed metrics are stored in the execution state dictionary under `nodeOutputs[nodeId]`.
   - Downstream nodes interpolate variables using `{{nodeId.output}}` template expressions.
4. If an `APPROVAL` node is reached:
   - Pipeline state is saved with status `WAITING_APPROVAL`.
   - Once approved via `/api/v1/approvals/:id/approve`, execution automatically resumes from that node.
5. All execution steps and per-node logs are streamed to the UI trace inspector.
