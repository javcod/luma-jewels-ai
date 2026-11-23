"""Groq implementation of LLMProvider, using Groq's OpenAI-compatible chat API."""

import json
import logging
import time
import uuid
from typing import Any, Optional

import httpx

from app.llm.base import ChatMessage, LLMProvider, LLMResponse, ToolCall, ToolDefinition

logger = logging.getLogger("lumajewel.llm.groq")

API_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "openai/gpt-oss-20b"

_TIMEOUT_SECONDS = 20.0
_MAX_ATTEMPTS = 2
_RETRY_BACKOFF_SECONDS = 1.0


class GroqProviderError(Exception):
    """Raised for any Groq configuration or API failure."""


class GroqProvider(LLMProvider):
    """`client` can be passed in to use a mock transport in tests."""

    def __init__(self, api_key: Optional[str], model: str = "", client: Optional[httpx.Client] = None):
        if not api_key:
            raise GroqProviderError("GROQ_API_KEY is not configured.")
        self._api_key = api_key
        self._model = model or DEFAULT_MODEL
        self._client = client or httpx.Client(timeout=_TIMEOUT_SECONDS)

    def generate(self, messages: list[ChatMessage], tools: list[ToolDefinition]) -> LLMResponse:
        payload: dict[str, Any] = {"model": self._model, "messages": _to_openai_messages(messages)}
        if tools:
            payload["tools"] = [_to_openai_tool(tool) for tool in tools]
            payload["tool_choice"] = "auto"

        headers = {"Authorization": f"Bearer {self._api_key}"}

        for attempt in range(1, _MAX_ATTEMPTS + 1):
            try:
                response = self._client.post(API_URL, json=payload, headers=headers)
            except httpx.HTTPError as exc:
                raise GroqProviderError(f"Could not reach Groq: {exc}") from exc

            if response.status_code >= 500 and attempt < _MAX_ATTEMPTS:
                logger.warning("Groq returned %d, retrying", response.status_code)
                time.sleep(_RETRY_BACKOFF_SECONDS)
                continue

            if response.status_code != 200:
                # 429 means the free-tier quota is used up; the fallback chain moves on
                raise GroqProviderError(f"Groq API error {response.status_code}: {response.text[:200]}")

            return _from_openai_response(response.json())

        raise GroqProviderError("Groq request failed after retries")


def _to_openai_messages(messages: list[ChatMessage]) -> list[dict[str, str]]:
    converted = []
    for message in messages:
        if message.role == "tool":
            # The orchestrator does not keep the assistant's tool-call turn, so
            # tool results are passed back as a user message.
            converted.append(
                {"role": "user", "content": f"Result of tool `{message.name}`:\n{message.content}"}
            )
        else:
            converted.append({"role": message.role, "content": message.content})
    return converted


def _to_openai_tool(tool: ToolDefinition) -> dict[str, Any]:
    return {
        "type": "function",
        "function": {"name": tool.name, "description": tool.description, "parameters": tool.parameters},
    }


def _from_openai_response(data: dict[str, Any]) -> LLMResponse:
    try:
        message = data["choices"][0]["message"]
    except (KeyError, IndexError, TypeError) as exc:
        raise GroqProviderError("Groq returned an unexpected response shape") from exc

    raw_calls = message.get("tool_calls") or []
    if raw_calls:
        tool_calls = []
        for call in raw_calls:
            function = call.get("function") or {}
            name = function.get("name")
            if not name:
                raise GroqProviderError("Groq returned a tool call with no function name")
            try:
                arguments = json.loads(function.get("arguments") or "{}")
            except ValueError as exc:
                raise GroqProviderError(f"Invalid tool arguments from Groq for {name}") from exc
            tool_calls.append(
                ToolCall(
                    id=call.get("id") or f"call_{uuid.uuid4().hex[:8]}",
                    name=name,
                    arguments=arguments if isinstance(arguments, dict) else {},
                )
            )
        return LLMResponse(tool_calls=tool_calls)

    return LLMResponse(message=message.get("content") or "")
