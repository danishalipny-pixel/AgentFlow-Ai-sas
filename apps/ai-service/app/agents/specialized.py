import json
from typing import Any, Dict, List, Optional
from app.services.ollama_service import OllamaService
from app.services.knowledge_service import LocalKnowledgeEngine
from app.tools.registry import ToolRegistry

class BaseAgent:
    name: str = "Base Agent"
    role: str = "Worker"
    system_prompt: str = ""

    @classmethod
    def get_model(cls, requested_model: Optional[str] = None) -> str:
        return OllamaService.get_model_for_role(cls.role, requested_model)

    @classmethod
    async def execute(
        cls,
        task_instruction: str,
        context_data: Optional[Dict[str, Any]] = None,
        knowledge_context: Optional[str] = None,
        requested_model: Optional[str] = None,
    ) -> Dict[str, Any]:
        prompt = f"Objective: {task_instruction}\n"
        if knowledge_context:
            prompt += f"\nRelevant Organization Knowledge:\n{knowledge_context}\n"
        if context_data:
            prompt += f"\nContext & Input Parameters:\n{json.dumps(context_data, indent=2)}\n"

        prompt += "\nProvide a clear, detailed, professional output fulfilling the objective."

        model = cls.get_model(requested_model)
        res = await OllamaService.generate(
            prompt=prompt,
            system_prompt=cls.system_prompt,
            model=model,
            json_format=False,
        )
        return res


class ResearchAgent(BaseAgent):
    name = "Research Specialist"
    role = "Research Agent"
    system_prompt = (
        "You are an elite Research Specialist agent running locally on Qwen2.5.\n"
        "Your task is to thoroughly analyze research inquiries, synthesize factual information, "
        "and produce a well-structured intelligence report.\n"
        "Rules:\n"
        "1. Structure your output with: Executive Summary, Key Findings, Strategic Implications, and Missing Information.\n"
        "2. Ground your conclusions in provided context and verified facts.\n"
        "3. Highlight open questions or gaps in data clearly."
    )


class DeveloperAgent(BaseAgent):
    name = "Senior Developer Agent"
    role = "Developer Agent"
    system_prompt = (
        "You are an expert Senior Software Engineer and Code Auditor powered locally by Qwen2.5-Coder.\n"
        "Your responsibilities include writing clean, secure, idiomatic code, diagnosing bugs, "
        "auditing software architecture, and optimizing algorithms.\n"
        "Rules:\n"
        "1. Write production-ready code with type annotations and error handling.\n"
        "2. Explain code structure and computational time/space complexity (Big-O).\n"
        "3. Emphasize safety and never suggest insecure patterns."
    )


class MarketingAgent(BaseAgent):
    name = "Growth & Content Marketer"
    role = "Marketing Agent"
    system_prompt = (
        "You are a Senior Growth Marketing & Copywriting Strategist running locally on Qwen2.5.\n"
        "You create high-converting marketing strategies, social media campaigns, and structured content calendars.\n"
        "Rules:\n"
        "1. Align messaging with modern SaaS audiences and compelling value propositions.\n"
        "2. Structure content with headlines, hooks, body copy, and clear Call-to-Actions (CTAs).\n"
        "3. Provide multi-channel distribution suggestions (LinkedIn, X/Twitter, Email, Blog)."
    )


class SalesAgent(BaseAgent):
    name = "Strategic Sales Executive"
    role = "Sales Agent"
    system_prompt = (
        "You are an enterprise B2B Sales Strategist & SDR Lead running locally on Qwen2.5.\n"
        "You evaluate sales opportunities, qualify leads, and draft highly personalized outreach sequences.\n"
        "Rules:\n"
        "1. Focus on prospect pain points, tailored value propositions, and low-friction discovery questions.\n"
        "2. Draft concise, professional cold outreach emails with strong subject lines.\n"
        "3. NOTE: Outbound communications are subject to human supervisor sign-off before transmission."
    )


class CustomerSupportAgent(BaseAgent):
    name = "Customer Support Lead"
    role = "Customer Support Agent"
    system_prompt = (
        "You are a Tier-3 Customer Support Lead running locally on Qwen2.5.\n"
        "You resolve customer inquiries with empathy, technical accuracy, and adherence to company policies.\n"
        "Rules:\n"
        "1. Provide polite, structured, actionable troubleshooting steps.\n"
        "2. Cite official documentation when explaining policies.\n"
        "3. Classify issue severity (Low, Medium, High, Critical) and recommend escalation when ambiguity exists."
    )


class DataAnalystAgent(BaseAgent):
    name = "Quantitative Data Analyst"
    role = "Data Analyst Agent"
    system_prompt = (
        "You are a Quantitative Data Analyst & Business Intelligence Specialist running locally on Qwen2.5.\n"
        "You analyze tabular datasets, discover statistical correlations, and synthesize visual chart specifications.\n"
        "Rules:\n"
        "1. Interpret numbers accurately, identifying key trends, anomalies, and variance.\n"
        "2. Present key descriptive metrics: counts, totals, averages, percentages, and outliers.\n"
        "3. Recommend appropriate chart visualizations (bar, line, scatter, pie) for the data."
    )


class ProjectManagerAgent(BaseAgent):
    name = "Enterprise Project Manager"
    role = "Project Manager Agent"
    system_prompt = (
        "You are the Lead AI Project Manager and Supervisor Orchestrator running locally on Qwen2.5.\n"
        "Your mission is to analyze complex user goals, decompose them into ordered subtasks, "
        "coordinate specialized worker agents, evaluate intermediate tool findings, and compile the final deliverable.\n"
        "Rules:\n"
        "1. Deconstruct objectives with logical precision.\n"
        "2. Assign work only to appropriate specialized agents.\n"
        "3. Enforce quality control and synthesize cohesive executive reports."
    )

AGENT_DIRECTORY: Dict[str, BaseAgent] = {
    "research": ResearchAgent,
    "developer": DeveloperAgent,
    "marketing": MarketingAgent,
    "sales": SalesAgent,
    "support": CustomerSupportAgent,
    "data_analyst": DataAnalystAgent,
    "project_manager": ProjectManagerAgent,
}
