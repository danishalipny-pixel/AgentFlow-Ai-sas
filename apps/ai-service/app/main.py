from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.schemas.orchestration import (
    OrchestrationRequest,
    OrchestrationResponse,
    ToolCallRequest,
    ToolCallResult,
)
from app.agents.state import AgentState
from app.agents.graph import MultiAgentOrchestrator
from app.tools.registry import ToolRegistry

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AgentFlow AI - Autonomous Multi-Agent Orchestration Engine",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "agentflow-ai-service",
        "version": settings.VERSION,
    }

@app.post("/api/v1/orchestrate", response_model=OrchestrationResponse)
async def orchestrate_task(req: OrchestrationRequest):
    try:
        initial_state = AgentState(
            task_id=req.task_id,
            task_title=req.task_title,
            task_description=req.task_description,
            organization_id=req.organization_id,
            tools_allowed=req.tools_allowed,
        )

        final_state = await MultiAgentOrchestrator.run_workflow(
            initial_state,
            require_approval=req.require_human_approval,
        )

        return OrchestrationResponse(
            task_id=final_state.task_id,
            status=final_state.status,
            final_output=final_state.final_output,
            steps=final_state.steps,
            approval_checkpoint=final_state.approval_checkpoint,
            total_tokens=final_state.total_tokens,
            total_duration_ms=final_state.total_duration_ms,
            error=final_state.error,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/tools/execute", response_model=ToolCallResult)
async def execute_tool(req: ToolCallRequest):
    try:
        if req.tool_name == "calculator":
            res = ToolRegistry.calculate(req.parameters.get("expression", ""))
            return ToolCallResult(tool_name=req.tool_name, success=True, result=res)
        elif req.tool_name == "datetime_tool":
            res = ToolRegistry.datetime_utility(req.parameters.get("action", "current_time"))
            return ToolCallResult(tool_name=req.tool_name, success=True, result=res)
        elif req.tool_name == "text_summarizer":
            res = ToolRegistry.summarize_text(req.parameters.get("text", ""))
            return ToolCallResult(tool_name=req.tool_name, success=True, result=res)
        elif req.tool_name == "csv_reader":
            res = ToolRegistry.parse_csv(req.parameters.get("csv_text", ""))
            return ToolCallResult(tool_name=req.tool_name, success=True, result=res)
        else:
            return ToolCallResult(tool_name=req.tool_name, success=False, error=f"Unknown tool: {req.tool_name}")
    except Exception as e:
        return ToolCallResult(tool_name=req.tool_name, success=False, error=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
