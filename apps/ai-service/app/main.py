from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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
from app.services.ollama_service import OllamaService
from app.services.knowledge_service import LocalKnowledgeEngine

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AgentFlow AI - Autonomous Multi-Agent Local Orchestration Engine",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SwitchModelRequest(BaseModel):
    model: str

class IndexDocumentRequest(BaseModel):
    organization_id: str
    document_id: str
    title: str
    content: str

class SearchKnowledgeRequest(BaseModel):
    organization_id: str
    query: str
    top_k: int = 3

@app.get("/health")
async def health_check():
    ollama_status = await OllamaService.check_connection()
    return {
        "status": "healthy",
        "service": "agentflow-ai-service",
        "version": settings.VERSION,
        "ollama": ollama_status,
    }

@app.get("/api/v1/models/status")
async def get_models_status():
    """Returns local Ollama runtime connectivity and installed model catalogue."""
    return await OllamaService.check_connection()

@app.post("/api/v1/models/switch")
def switch_active_model(req: SwitchModelRequest):
    """Switches default active model for CPU local inference."""
    settings.DEFAULT_MODEL = req.model
    return {
        "success": True,
        "active_model": settings.DEFAULT_MODEL,
        "coder_model": settings.CODER_MODEL,
        "message": f"Active model set to '{req.model}'",
    }

@app.post("/api/v1/knowledge/index")
def index_document(req: IndexDocumentRequest):
    """Indexes document chunks locally without external embedding APIs."""
    chunk_count = LocalKnowledgeEngine.index_document(
        organization_id=req.organization_id,
        doc_id=req.document_id,
        title=req.title,
        text=req.content,
    )
    return {
        "success": True,
        "document_id": req.document_id,
        "chunks_indexed": chunk_count,
    }

@app.post("/api/v1/knowledge/search")
def search_knowledge(req: SearchKnowledgeRequest):
    """Searches local document chunks using TF-IDF relevance scoring."""
    results = LocalKnowledgeEngine.search(
        organization_id=req.organization_id,
        query=req.query,
        top_k=req.top_k,
    )
    return {
        "success": True,
        "query": req.query,
        "results": results,
    }

@app.post("/api/v1/orchestrate", response_model=OrchestrationResponse)
async def orchestrate_task(req: OrchestrationRequest):
    """Main Multi-Agent Supervisor Orchestrator endpoint powered by local LLM."""
    try:
        initial_state = AgentState(
            task_id=req.task_id,
            task_title=req.task_title,
            task_description=req.task_description,
            organization_id=req.organization_id,
            tools_allowed=req.tools_allowed,
            context_data=req.input_parameters,
        )

        final_state = await MultiAgentOrchestrator.run_workflow(
            initial_state,
            require_approval=req.require_human_approval,
            requested_model=req.model,
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
        elif req.tool_name == "safe_fetch":
            res = await ToolRegistry.safe_fetch(req.parameters.get("url", ""))
            return ToolCallResult(tool_name=req.tool_name, success=True, result=res)
        else:
            return ToolCallResult(tool_name=req.tool_name, success=False, error=f"Unknown tool: {req.tool_name}")
    except Exception as e:
        return ToolCallResult(tool_name=req.tool_name, success=False, error=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
