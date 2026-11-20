import time
from typing import Dict, Any
from app.agents.state import AgentState
from app.schemas.orchestration import StepRecord, ApprovalCheckpoint
from app.tools.registry import ToolRegistry

class MultiAgentOrchestrator:
    @classmethod
    async def run_workflow(cls, initial_state: AgentState, require_approval: bool = True) -> AgentState:
        state = initial_state
        start_time = time.time()

        # Node 1: Supervisor Analysis & Plan
        state.steps.append(
            StepRecord(
                step_number=state.step_number,
                agent_name="Supervisor",
                step_type="thought",
                title=f"Decomposing objective: {state.task_title}",
                payload={"objective": state.task_title, "assigned_worker": "Specialist"},
                duration_ms=280,
                tokens_used=320,
            )
        )
        state.step_number += 1
        state.total_tokens += 320

        # Check for sensitive action requiring human approval
        desc_lower = (state.task_description + " " + state.task_title).lower()
        is_sensitive_email = any(k in desc_lower for k in ["send email", "email lead", "dispatch message"])
        is_sensitive_deletion = any(k in desc_lower for k in ["delete", "purge", "drop"])

        # Node 2: Worker Execution & Tool Invocation
        tool_result = None
        tool_name = None

        if "calculate" in desc_lower or "math" in desc_lower or "sum" in desc_lower:
            tool_name = "calculator"
            try:
                tool_result = ToolRegistry.calculate("1500 * 1.25 + 300")
            except Exception as e:
                tool_result = {"error": str(e)}
        elif "summarize" in desc_lower or "research" in desc_lower:
            tool_name = "text_summarizer"
            tool_result = ToolRegistry.summarize_text(state.task_description)
        else:
            tool_name = "datetime_tool"
            tool_result = ToolRegistry.datetime_utility()

        if tool_name:
            state.steps.append(
                StepRecord(
                    step_number=state.step_number,
                    agent_name="Worker Specialist",
                    step_type="tool_call",
                    title=f"Executing tool: [{tool_name}]",
                    payload={"tool": tool_name},
                    duration_ms=190,
                    tokens_used=180,
                )
            )
            state.step_number += 1
            state.total_tokens += 180

            state.steps.append(
                StepRecord(
                    step_number=state.step_number,
                    agent_name="Worker Specialist",
                    step_type="tool_result",
                    title=f"Tool [{tool_name}] returned output",
                    payload={"result": tool_result},
                    duration_ms=120,
                    tokens_used=210,
                )
            )
            state.step_number += 1
            state.total_tokens += 210

        # Node 3: Approval Checkpoint Gate
        if require_approval and (is_sensitive_email or is_sensitive_deletion):
            action_type = "send_email" if is_sensitive_email else "data_deletion"
            action_title = "Dispatch Outbound Email" if is_sensitive_email else "Purge Stale Records"

            state.approval_checkpoint = ApprovalCheckpoint(
                required=True,
                action_type=action_type,
                action_title=action_title,
                action_payload={"target": "lead@target.com", "body": "Draft outreach message"},
                reason="Policy requires human supervisor authorization before dispatching external communications.",
            )

            state.steps.append(
                StepRecord(
                    step_number=state.step_number,
                    agent_name="Supervisor",
                    step_type="approval_request",
                    title=f"Halted at Human Approval Gate: {action_title}",
                    payload={"action_type": action_type, "action_title": action_title},
                    duration_ms=80,
                    tokens_used=90,
                )
            )
            state.step_number += 1
            state.status = "waiting_approval"
            state.total_duration_ms = int((time.time() - start_time) * 1000)
            return state

        # Node 4: Final Output Synthesis
        final_deliverables = {
            "title": state.task_title,
            "status": "Completed",
            "findings": "All authorized multi-agent steps concluded cleanly.",
            "tool_data": tool_result,
        }

        state.steps.append(
            StepRecord(
                step_number=state.step_number,
                agent_name="Supervisor",
                step_type="final_output",
                title="Synthesizing final executive briefing",
                payload=final_deliverables,
                duration_ms=310,
                tokens_used=450,
            )
        )
        state.final_output = final_deliverables
        state.status = "completed"
        state.total_tokens += 450
        state.total_duration_ms = int((time.time() - start_time) * 1000)

        return state
