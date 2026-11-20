"""Vendor-neutral types and the LLMProvider interface used by the agent.

Implementations: FakeLLMProvider (tests and local development) and
GeminiProvider (production).
"""

from abc import ABC, abstractmethod
from typing import Any, Literal, Optional

from pydantic import BaseModel


class ToolDefinition(BaseModel):
    """A tool exposed to the model; `parameters` is a JSON schema."""

    name: str
    description: str
    parameters: dict[str, Any]


class ChatMessage(BaseModel):
    """One conversation turn. `name` and `tool_call_id` are used only for tool results."""

    role: Literal["system", "user", "assistant", "tool"]
    content: str
    name: Optional[str] = None
    tool_call_id: Optional[str] = None


class ToolCall(BaseModel):
    """A tool call requested by the model."""

    id: str
    name: str
    arguments: dict[str, Any]


class LLMResponse(BaseModel):
    """Either a final `message` or a list of `tool_calls` to execute."""

    message: Optional[str] = None
    tool_calls: list[ToolCall] = []


class LLMProvider(ABC):
    """Interface every LLM provider implements."""

    @abstractmethod
    def generate(self, messages: list[ChatMessage], tools: list[ToolDefinition]) -> LLMResponse:
        """Return the next step for the conversation. May raise on API errors."""
        raise NotImplementedError
