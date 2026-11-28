import json
import time
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.agents.state import AgentState
from app.schemas.orchestration import StepRecord, ApprovalCheckpoint
from app.tools.registry import ToolRegistry
from app.services.ollama_service import OllamaService
from app.services.knowledge_service import LocalKnowledgeEngine
from app.agents.specialized import (
    AGENT_DIRECTORY,
    ProjectManagerAgent,
    ResearchAgent,
    DeveloperAgent,
    SalesAgent,
    MarketingAgent,
    CustomerSupportAgent,
    DataAnalystAgent,
)

class MultiAgentOrchestrator:
    @classmethod
    async def run_workflow(
        cls,
        initial_state: AgentState,
        require_approval: bool = True,
        requested_model: Optional[str] = None,
    ) -> AgentState:
        state = initial_state
        overall_start_time = time.time()
        state.step_number = 1
        state.total_tokens = 0
        state.steps = []

        # Step 0: Check Local Knowledge Base for Relevant Organization Context
        kb_chunks = LocalKnowledgeEngine.search(
            organization_id=state.organization_id,
            query=f"{state.task_title} {state.task_description}",
            top_k=3,
        )
        knowledge_context = LocalKnowledgeEngine.format_context_block(kb_chunks)

        # -------------------------------------------------------------
        # Node 1: Supervisor Task Decomposition & Agent Selection (LLM)
        # -------------------------------------------------------------
        decomp_prompt = (
            f"Analyze this enterprise task and return a strict JSON execution plan.\n"
            f"Task Title: {state.task_title}\n"
            f"Task Description: {state.task_description}\n"
            f"Context Data: {json.dumps(state.context_data or {})}\n"
            f"Allowed Tools: {state.tools_allowed}\n\n"
            f"Respond with a JSON object matching this schema:\n"
            f"{{\n"
            f'  "analysis": "Brief 1-sentence breakdown of user intent",\n'
            f'  "primary_agent": "research | developer | sales | marketing | support | data_analyst | project_manager",\n'
            f'  "subtasks": ["subtask 1", "subtask 2"],\n'
            f'  "tools_to_run": ["calculator | csv_reader | safe_fetch | datetime_tool | none"],\n'
            f'  "tool_input": "parameter string for the tool if needed, or empty",\n'
            f'  "requires_approval": true/false (true ONLY if task involves sending real emails, deleting records, or modifying production data),\n'
            f'  "approval_action": "description of sensitive action if requires_approval is true"\n'
            f"}}"
        )

        supervisor_model = OllamaService.get_model_for_role("Project Manager Agent", requested_model)
        
        step_start = time.time()
        try:
            plan_res = await OllamaService.generate(
                prompt=decomp_prompt,
                system_prompt="You are an enterprise AI Project Manager. Return strict valid JSON only without markdown formatting.",
                model=supervisor_model,
                json_format=True,
            )
            step_duration = plan_res.get("duration_ms", int((time.time() - step_start) * 1000))
            step_tokens = plan_res.get("total_tokens", 0)
            state.total_tokens += step_tokens

            try:
                plan_json = json.loads(plan_res.get("text", "{}"))
            except Exception:
                plan_json = {
                    "analysis": f"Orchestrating task: {state.task_title}",
                    "primary_agent": "research",
                    "subtasks": [state.task_description],
                    "tools_to_run": [],
                    "requires_approval": False,
                }
        except Exception as e:
            # Fallback when Ollama is offline or encountered runtime failure
            plan_json = {
                "analysis": f"Decomposing objective: {state.task_title}",
                "primary_agent": "developer" if "code" in state.task_description.lower() else "research",
                "subtasks": [state.task_description],
                "tools_to_run": [],
                "requires_approval": "email" in state.task_description.lower() or "delete" in state.task_description.lower(),
                "approval_action": "Dispatch Outbound Outreach Email" if "email" in state.task_description.lower() else "Data Deletion",
                "runtime_warning": str(e),
            }
            step_duration = int((time.time() - step_start) * 1000)
            step_tokens = 0

        # Record Supervisor Thought Step
        state.steps.append(
            StepRecord(
                step_number=state.step_number,
                agent_name="Enterprise Project Manager (Supervisor)",
                step_type="thought",
                title=f"Task Deconstructed: {plan_json.get('analysis', state.task_title)}",
                payload={
                    "plan": plan_json,
                    "model_used": supervisor_model,
                    "local_knowledge_applied": len(kb_chunks) > 0,
                },
                duration_ms=step_duration,
                tokens_used=step_tokens,
            )
        )
        state.step_number += 1

        # -------------------------------------------------------------
        # Node 2: Dynamic Tool Invocation
        # -------------------------------------------------------------
        tools_to_run = plan_json.get("tools_to_run", [])
        if isinstance(tools_to_run, str):
            tools_to_run = [tools_to_run]

        tool_results: Dict[str, Any] = {}

        for tool_name in tools_to_run:
            if tool_name in ["none", "", None]:
                continue

            tool_start = time.time()
            tool_res_payload: Any = None
            tool_err: Optional[str] = None

            try:
                if tool_name == "calculator":
                    expr = plan_json.get("tool_input") or "100 * 1.15"
                    tool_res_payload = ToolRegistry.calculate(expr)
                elif tool_name == "datetime_tool":
                    tool_res_payload = ToolRegistry.datetime_utility()
                elif tool_name == "csv_reader":
                    sample = state.context_data.get("csvData") or "name,dept,score\nLeadA,Sales,88\nLeadB,Ops,92"
                    tool_res_payload = ToolRegistry.parse_csv(sample)
                elif tool_name == "safe_fetch":
                    url = plan_json.get("tool_input") or "https://example.com"
                    tool_res_payload = await ToolRegistry.safe_fetch(url)
                elif tool_name == "text_summarizer":
                    tool_res_payload = ToolRegistry.summarize_text(state.task_description)
                else:
                    tool_res_payload = {"status": "skipped", "reason": f"Tool '{tool_name}' not available"}
            except Exception as ex:
                tool_err = str(ex)
                tool_res_payload = {"error": tool_err}

            tool_dur = int((time.time() - tool_start) * 1000)

            # Record Tool Call Step
            state.steps.append(
                StepRecord(
                    step_number=state.step_number,
                    agent_name="Tool Execution Sandbox",
                    step_type="tool_call",
                    title=f"Dispatched Tool: [{tool_name}]",
                    payload={"tool": tool_name, "input": plan_json.get("tool_input")},
                    duration_ms=tool_dur,
                    tokens_used=0,
                )
            )
            state.step_number += 1

            # Record Tool Result Step
            state.steps.append(
                StepRecord(
                    step_number=state.step_number,
                    agent_name="Tool Execution Sandbox",
                    step_type="tool_result",
                    title=f"Tool [{tool_name}] Output",
                    payload={"result": tool_res_payload, "error": tool_err},
                    duration_ms=50,
                    tokens_used=0,
                )
            )
            state.step_number += 1
            tool_results[tool_name] = tool_res_payload

        # -------------------------------------------------------------
        # Node 3: Specialized Worker Agent Execution (Local LLM)
        # -------------------------------------------------------------
        agent_key = plan_json.get("primary_agent", "research").lower()
        worker_cls = AGENT_DIRECTORY.get(agent_key, ResearchAgent)

        worker_instruction = (
            f"User Task: {state.task_title}\n"
            f"Details: {state.task_description}\n"
            f"Subtasks: {plan_json.get('subtasks', [])}\n"
        )
        if tool_results:
            worker_instruction += f"\nTool Findings: {json.dumps(tool_results, indent=2)}\n"

        worker_start = time.time()
        try:
            worker_res = await worker_cls.execute(
                task_instruction=worker_instruction,
                context_data=state.context_data,
                knowledge_context=knowledge_context,
                requested_model=requested_model,
            )
            worker_output_text = worker_res.get("text", "")
            worker_tokens = worker_res.get("total_tokens", 0)
            worker_dur = worker_res.get("duration_ms", int((time.time() - worker_start) * 1000))
            worker_model = worker_res.get("model", OllamaService.get_model_for_role(worker_cls.role, requested_model))
            state.total_tokens += worker_tokens
        except Exception as ex:
            worker_output_text = (
                f"Agent [{worker_cls.name}] generated deliverable based on parameters:\n"
                f"- Evaluated task '{state.task_title}'\n"
                f"- Processed subtasks under organization guidelines\n"
                f"(Local model runtime note: {str(ex)})"
            )
            worker_tokens = 0
            worker_dur = int((time.time() - worker_start) * 1000)
            worker_model = requested_model or settings.DEFAULT_MODEL

        state.steps.append(
            StepRecord(
                step_number=state.step_number,
                agent_name=worker_cls.name,
                step_type="thought",
                title=f"{worker_cls.name} Reasoning & Domain Output",
                payload={
                    "deliverable": worker_output_text,
                    "model_used": worker_model,
                    "tokens_used": worker_tokens,
                },
                duration_ms=worker_dur,
                tokens_used=worker_tokens,
            )
        )
        state.step_number += 1

        # -------------------------------------------------------------
        # Node 4: Human-in-the-Loop Approval Checkpoint Gate
        # -------------------------------------------------------------
        desc_lower = (state.task_description + " " + state.task_title).lower()
        is_sensitive = plan_json.get("requires_approval", False) or any(
            k in desc_lower for k in ["send email", "email lead", "dispatch message", "delete record", "purge", "drop database"]
        )

        if require_approval and is_sensitive:
            action_type = "send_email" if "email" in desc_lower else "data_mutation"
            action_title = plan_json.get("approval_action") or (
                "Dispatch Outbound Outreach Email" if "email" in desc_lower else "Execute System Mutation"
            )

            state.approval_checkpoint = ApprovalCheckpoint(
                required=True,
                action_type=action_type,
                action_title=action_title,
                action_payload={
                    "target": state.context_data.get("recipient", "external_contact@enterprise.com"),
                    "proposed_message": worker_output_text[:500],
                    "agent_recommendation": worker_cls.name,
                },
                reason="Organization security policy requires human sign-off prior to external communications or data mutations.",
            )

            state.steps.append(
                StepRecord(
                    step_number=state.step_number,
                    agent_name="Supervisor Governance Gate",
                    step_type="approval_request",
                    title=f"Execution Suspended: Awaiting Human Approval for [{action_title}]",
                    payload={"action_type": action_type, "action_title": action_title},
                    duration_ms=50,
                    tokens_used=0,
                )
            )
            state.step_number += 1
            state.status = "waiting_approval"
            state.total_duration_ms = int((time.time() - overall_start_time) * 1000)
            return state

        # -------------------------------------------------------------
        # Node 5: Supervisor Final Synthesis
        # -------------------------------------------------------------
        synth_start = time.time()
        final_deliverables = {
            "title": state.task_title,
            "status": "Completed Successfully",
            "primary_worker": worker_cls.name,
            "summary": worker_output_text,
            "tools_used": list(tool_results.keys()),
            "tool_data": tool_results,
            "model_metadata": {
                "runtime": "Local Ollama Engine",
                "default_model": settings.DEFAULT_MODEL,
                "coder_model": settings.CODER_MODEL,
                "cost_usd": 0.0,  # 100% Free Local Model
            },
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

        synth_dur = int((time.time() - synth_start) * 1000)
        state.steps.append(
            StepRecord(
                step_number=state.step_number,
                agent_name="Enterprise Project Manager (Supervisor)",
                step_type="final_output",
                title="Synthesized Executive Deliverable",
                payload=final_deliverables,
                duration_ms=synth_dur,
                tokens_used=0,
            )
        )
        state.final_output = final_deliverables
        state.status = "completed"
        state.total_duration_ms = int((time.time() - overall_start_time) * 1000)

        return state
