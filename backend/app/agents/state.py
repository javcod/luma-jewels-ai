"""State for a single Luma Concierge request. Nothing is persisted between requests."""

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
    """A short, user-facing step such as "Searching the catalog"."""

    type: str = "activity"
    label: str
    tool: Optional[str] = None


class ConciergeState(BaseModel):
    user_message: str

    # Conversation sent to the provider, including tool results
    messages: list[ChatMessage] = Field(default_factory=list)

    tool_calls: list[ToolCall] = Field(default_factory=list)
    tool_results: list[ToolResult] = Field(default_factory=list)

    # Filters from the latest search, returned to the client
    applied_filters: Optional[dict[str, Any]] = None

    # Filled only from tool output
    recommended_products: list[Product] = Field(default_factory=list)

    final_response: Optional[str] = None
    iterations: int = 0

    trace: list[TraceEvent] = Field(default_factory=list)
