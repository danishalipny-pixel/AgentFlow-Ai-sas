from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.orchestration import StepRecord, ApprovalCheckpoint

class AgentState(BaseModel):
    task_id: str
    task_title: str
    task_description: str
    organization_id: str
    current_agent: str = "Supervisor"
    step_number: int = 1
    steps: List[StepRecord] = Field(default_factory=list)
    context_data: Dict[str, Any] = Field(default_factory=dict)
    tools_allowed: List[str] = Field(default_factory=list)
    status: str = "running"
    approval_checkpoint: Optional[ApprovalCheckpoint] = None
    final_output: Optional[Dict[str, Any]] = None
    total_tokens: int = 0
    total_duration_ms: int = 0
    error: Optional[str] = None
