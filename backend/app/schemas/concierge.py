"""Request and response models for POST /concierge/chat.

recommended_products always come from tool results, and trace contains only
short user-facing steps.
"""

from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator

from app.agents.state import TraceEvent
from app.schemas.product import Product


class ConciergeChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)

    @field_validator("message")
    @classmethod
    def message_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("message must not be blank")
        return value


class ConciergeChatResponse(BaseModel):
    message: str = Field(..., description="The Concierge's natural-language reply.")
    recommended_products: list[Product] = Field(
        default_factory=list, description="Real catalog products returned by a tool this turn, if any."
    )
    tools_used: list[str] = Field(
        default_factory=list, description="Names of tools invoked this turn, for debugging/evaluation."
    )
    applied_filters: Optional[dict[str, Any]] = Field(
        None, description="The exact filters used for a search this turn, if a search was performed."
    )
    iterations: int = Field(0, description="Number of tool-calling rounds this turn took.")
    trace: list[TraceEvent] = Field(
        default_factory=list,
        description="High-level, user-safe activity events (e.g. 'Searching the catalog'). Never internal reasoning or prompts.",
    )
