"""Provider-agnostic LLM interface.

Nothing in `app.agents` or `app.tools` should ever import a specific
vendor SDK. Everything the agent needs from "an LLM" is expressed through
the types and abstract class in this module. A real provider (Gemini,
OpenAI, Anthropic, ...) plugs in later by implementing `LLMProvider` — the
agent orchestration code does not change.

Only one concrete implementation exists as of Phase 3: `FakeLLMProvider`
(see `app.llm.fake_provider`), a deterministic rule-based stand-in used for
local development and the entire automated test suite. No real provider is
integrated yet — see backend/README.md for why.
"""

from abc import ABC, abstractmethod
from typing import Any, Literal, Optional

from pydantic import BaseModel


class ToolDefinition(BaseModel):
    """Describes one callable tool to the LLM, in a vendor-neutral shape
    (a JSON-schema-like `parameters` dict, which is what every major
    tool-calling API — OpenAI, Anthropic, Gemini — expects in some form)."""

    name: str
    description: str
    parameters: dict[str, Any]


class ChatMessage(BaseModel):
    """One turn in the conversation sent to the provider.

    `role` follows the common tool-calling convention: "system" (agent
    instructions), "user", "assistant" (the agent's own prior replies), and
    "tool" (a tool's result being fed back in). `name`/`tool_call_id` are
    only meaningful for `role == "tool"`.
    """

    role: Literal["system", "user", "assistant", "tool"]
    content: str
    name: Optional[str] = None
    tool_call_id: Optional[str] = None


class ToolCall(BaseModel):
    """A request from the LLM to execute a specific tool with specific
    arguments. `id` correlates this call to its eventual tool result."""

    id: str
    name: str
    arguments: dict[str, Any]


class LLMResponse(BaseModel):
    """What a provider returns for one reasoning step.

    Either `message` is set (a final answer, no further tool calls needed)
    or `tool_calls` is non-empty (the agent should execute them and call
    the provider again with the results). A provider should not normally
    set both.
    """

    message: Optional[str] = None
    tool_calls: list[ToolCall] = []


class LLMProvider(ABC):
    """Minimum capability contract the Concierge agent depends on."""

    @abstractmethod
    def generate(self, messages: list[ChatMessage], tools: list[ToolDefinition]) -> LLMResponse:
        """Given the conversation so far and the available tools, return
        either a final message or the next tool call(s) to make.

        Implementations may raise on failure (e.g. a network/API error for
        a real provider) — callers are responsible for handling that
        gracefully (see `app.agents.orchestrator`)."""
        raise NotImplementedError
