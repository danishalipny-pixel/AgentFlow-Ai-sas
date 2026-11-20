from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class ToolCallRequest(BaseModel):
    tool_name: str
    parameters: Dict[str, Any] = Field(default_factory=dict)

class ToolCallResult(BaseModel):
    tool_name: str
    success: bool
    result: Optional[Any] = None
    error: Optional[str] = None

class StepRecord(BaseModel):
    step_number: int
    agent_name: str
    step_type: str  # thought, tool_call, tool_result, approval_request, final_output, error
    title: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    duration_ms: int = 0
    tokens_used: int = 0

class ApprovalCheckpoint(BaseModel):
    required: bool
    action_type: str
    action_title: str
    action_payload: Dict[str, Any] = Field(default_factory=dict)
    reason: str

class OrchestrationRequest(BaseModel):
    task_id: str
    task_title: str
    task_description: str
    organization_id: str
    model: str = "gpt-4o-mini"
    temperature: float = 0.2
    max_steps: int = 15
    timeout_seconds: int = 120
    tools_allowed: List[str] = Field(default_factory=list)
    system_prompt: Optional[str] = None
    input_parameters: Dict[str, Any] = Field(default_factory=dict)
    require_human_approval: bool = True

class OrchestrationResponse(BaseModel):
    task_id: str
    status: str  # completed, waiting_approval, failed
    final_output: Optional[Dict[str, Any]] = None
    steps: List[StepRecord] = Field(default_factory=list)
    approval_checkpoint: Optional[ApprovalCheckpoint] = None
    total_tokens: int = 0
    total_duration_ms: int = 0
    error: Optional[str] = None
