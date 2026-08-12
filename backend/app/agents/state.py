"""Explicit state for one Luma Concierge agent run.

Deliberately minimal: this represents a single request/response cycle, not
persistent multi-turn memory (no database, no session store — that's a
future phase, if ever needed). Everything here lives in memory for the
lifetime of one `run_concierge()` call.
"""

from typing import Any, Optional

from pydantic import BaseModel, Field

from app.llm.base import ChatMessage, ToolCall
from app.schemas.product import Product


class ToolResult(BaseModel):
    """The recorded outcome of one tool execution."""

    tool_call_id: str
    tool_name: str
    output: dict[str, Any]


class TraceEvent(BaseModel):
    """One user-safe activity event for the execution trace.

    Deliberately high-level ("Searching the catalog") — never the model's
    reasoning text, a prompt, or raw provider internals. Safe to render
    directly in a future frontend.
    """

    type: str = "activity"
    label: str
    tool: Optional[str] = None


class ConciergeState(BaseModel):
    user_message: str

    # Full conversation sent to/received from the LLM provider, including
    # tool-result turns — this is what makes the loop in orchestrator.py
    # stateful across reasoning steps.
    messages: list[ChatMessage] = Field(default_factory=list)

    # Every tool call the agent made this run, and what each one returned.
    tool_calls: list[ToolCall] = Field(default_factory=list)
    tool_results: list[ToolResult] = Field(default_factory=list)

    # The filters actually used for the most recent search_products call,
    # if any — echoed back in the API response as transparent, non-fabricated
    # grounding for why these products were recommended.
    applied_filters: Optional[dict[str, Any]] = None

    # Real, validated Product records returned by a tool this run. Never
    # populated from anything the LLM said directly — only from tool output.
    recommended_products: list[Product] = Field(default_factory=list)

    final_response: Optional[str] = None
    iterations: int = 0

    # High-level, user-safe activity trace — see TraceEvent. Never contains
    # prompts, raw model output, or provider internals.
    trace: list[TraceEvent] = Field(default_factory=list)
