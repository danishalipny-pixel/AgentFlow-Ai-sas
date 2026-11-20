import asyncio
import pytest
from app.agents.state import AgentState
from app.agents.graph import MultiAgentOrchestrator
from app.tools.registry import ToolRegistry

def test_standard_task_completes():
    state = AgentState(
        task_id="t-1",
        task_title="Analyze quarterly revenue trends",
        task_description="Calculate revenue growth and summarize key metrics",
        organization_id="org-1",
    )
    final_state = asyncio.run(MultiAgentOrchestrator.run_workflow(state))
    assert final_state.status == "completed"
    assert len(final_state.steps) >= 3
    assert final_state.final_output is not None

def test_sensitive_action_triggers_approval_gate():
    state = AgentState(
        task_id="t-2",
        task_title="Send email to churn risk accounts",
        task_description="Draft message and send email to 50 churn accounts",
        organization_id="org-1",
    )
    final_state = asyncio.run(MultiAgentOrchestrator.run_workflow(state, require_approval=True))
    assert final_state.status == "waiting_approval"
    assert final_state.approval_checkpoint is not None
    assert final_state.approval_checkpoint.action_type == "send_email"

def test_safe_calculator():
    res = ToolRegistry.calculate("(120 * 5) - 40")
    assert res["value"] == 560.0

def test_calculator_blocks_injections():
    with pytest.raises(ValueError):
        ToolRegistry.calculate("__import__('os').system('dir')")
