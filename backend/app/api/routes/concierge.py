"""Luma Concierge chat endpoint.

Thin HTTP layer only: validates the request, runs the agent orchestrator,
and shapes the response. All reasoning/tool-selection lives in
`app.agents`; all catalog access lives in `app.services` (via `app.tools`).

The LLM provider is a FastAPI dependency (rather than constructed inline)
specifically so tests can override it — see `tests/test_concierge_api.py`
for the provider-failure test this enables.
"""

from fastapi import APIRouter, Depends

from app.agents.orchestrator import run_concierge
from app.llm.base import LLMProvider
from app.llm.factory import get_llm_provider
from app.schemas.concierge import ConciergeChatRequest, ConciergeChatResponse

router = APIRouter(prefix="/concierge", tags=["concierge"])


@router.post("/chat", response_model=ConciergeChatResponse)
def concierge_chat(
    request: ConciergeChatRequest,
    provider: LLMProvider = Depends(get_llm_provider),
) -> ConciergeChatResponse:
    state = run_concierge(request.message, provider)

    return ConciergeChatResponse(
        message=state.final_response or "",
        recommended_products=state.recommended_products,
        tools_used=[tool_call.name for tool_call in state.tool_calls],
        applied_filters=state.applied_filters,
        iterations=state.iterations,
        trace=state.trace,
    )
