"""Gemini implementation of LLMProvider.

All `google.genai` SDK usage is isolated to this file — nothing outside
`app/llm/` imports it, and nothing outside this file constructs or reads a
`google.genai.types.*` object. Everything is converted to/from our
provider-agnostic `ChatMessage` / `ToolDefinition` / `ToolCall` /
`LLMResponse` types (see `app.llm.base`) at the boundary, so
`app.agents.orchestrator` never knows Gemini exists.

The exact SDK shapes used here (`Tool.functionDeclarations`,
`FunctionDeclaration.parametersJsonSchema`, `GenerateContentConfig`,
`Part.from_function_response`, `response.function_calls`/`.text`, and the
`errors.APIError` hierarchy) were confirmed against the installed
`google-genai` package via introspection rather than assumed from memory.
"""

import json
import logging
import time
import uuid
from typing import Optional

from google import genai
from google.genai import errors, types

from app.llm.base import ChatMessage, LLMProvider, LLMResponse, ToolCall, ToolDefinition

logger = logging.getLogger("lumajewel.llm.gemini")

DEFAULT_MODEL = "gemini-2.5-flash"

# `errors.ServerError` (5xx, e.g. the transient "model is currently
# experiencing high demand" 503) is retried a couple of times with a short
# backoff before giving up — confirmed via direct reproduction that the
# exact same request/conversation succeeds on a later attempt, so this is
# upstream capacity flakiness, not a malformed request. `errors.ClientError`
# (4xx, e.g. bad API key, invalid request) is never retried — retrying an
# invalid request just wastes time before returning the same error.
_MAX_ATTEMPTS = 3
_RETRY_BACKOFF_SECONDS = 1.5


class GeminiProviderError(Exception):
    """Raised for any Gemini configuration or call failure (missing key,
    timeout, API error, malformed response). Caught by
    `app.agents.orchestrator`, which turns it into a graceful user-facing
    message — a raw SDK exception/stack trace never reaches the API layer."""


class GeminiProvider(LLMProvider):
    """See module docstring. Accepts an optional pre-built `client` purely
    for testability (unit tests inject a mock instead of hitting the real
    network) — production code always lets it construct a real
    `genai.Client` from `api_key`."""

    def __init__(self, api_key: Optional[str], model: str, client: Optional[genai.Client] = None):
        if client is not None:
            self._client = client
        else:
            if not api_key:
                raise GeminiProviderError(
                    "LLM_PROVIDER is 'gemini' but LLM_API_KEY is not configured. "
                    "Set LLM_API_KEY in backend/.env (see .env.example)."
                )
            self._client = genai.Client(api_key=api_key)

        self._model = model or DEFAULT_MODEL

    def generate(self, messages: list[ChatMessage], tools: list[ToolDefinition]) -> LLMResponse:
        system_instruction, contents = _to_gemini_contents(messages)
        config = types.GenerateContentConfig(
            systemInstruction=system_instruction,
            tools=[_to_gemini_tool(tools)] if tools else None,
        )

        for attempt in range(1, _MAX_ATTEMPTS + 1):
            try:
                response = self._client.models.generate_content(
                    model=self._model,
                    contents=contents,
                    config=config,
                )
            except errors.ServerError as exc:
                # Transient upstream failure (e.g. 503 "high demand") — the
                # request itself is fine, so a short retry is safe and
                # usually succeeds (this is a read-only generation call, not
                # a mutation, so re-sending it has no side effects).
                if attempt < _MAX_ATTEMPTS:
                    logger.warning(
                        "Gemini ServerError on attempt %d/%d, retrying in %.1fs: %s",
                        attempt,
                        _MAX_ATTEMPTS,
                        _RETRY_BACKOFF_SECONDS,
                        exc,
                    )
                    time.sleep(_RETRY_BACKOFF_SECONDS)
                    continue
                logger.exception("Gemini API error (exhausted retries)")
                raise GeminiProviderError(f"Gemini API error: {exc}") from exc
            except errors.APIError as exc:
                # ClientError (e.g. invalid/missing API key, bad request) and
                # any other non-retryable APIError — retrying would just
                # return the same error, so fail immediately.
                logger.exception("Gemini API error")
                raise GeminiProviderError(f"Gemini API error: {exc}") from exc
            except Exception as exc:  # noqa: BLE001 - any other SDK/transport failure
                logger.exception("Unexpected error calling Gemini")
                raise GeminiProviderError("Unexpected error calling Gemini") from exc
            else:
                return _from_gemini_response(response)


# -- Our types -> Gemini SDK types -------------------------------------------


def _to_gemini_contents(messages: list[ChatMessage]) -> tuple[Optional[str], list[types.Content]]:
    system_instruction: Optional[str] = None
    contents: list[types.Content] = []

    for message in messages:
        if message.role == "system":
            # Gemini takes one system_instruction string, not per-turn
            # system messages — concatenate in the rare case of more than one.
            system_instruction = (
                f"{system_instruction}\n{message.content}" if system_instruction else message.content
            )
            continue

        if message.role == "user":
            contents.append(types.Content(role="user", parts=[types.Part.from_text(text=message.content)]))
        elif message.role == "assistant":
            contents.append(types.Content(role="model", parts=[types.Part.from_text(text=message.content)]))
        elif message.role == "tool":
            contents.append(
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_function_response(
                            name=message.name or "unknown_tool",
                            response=_safe_json_load(message.content),
                        )
                    ],
                )
            )

    return system_instruction, contents


def _safe_json_load(raw: str) -> dict:
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else {"result": parsed}
    except (TypeError, ValueError):
        return {"result": raw}


def _to_gemini_tool(tools: list[ToolDefinition]) -> types.Tool:
    return types.Tool(
        functionDeclarations=[
            types.FunctionDeclaration(
                name=tool.name,
                description=tool.description,
                parametersJsonSchema=tool.parameters,
            )
            for tool in tools
        ]
    )


# -- Gemini SDK types -> our types -------------------------------------------


def _from_gemini_response(response: types.GenerateContentResponse) -> LLMResponse:
    function_calls = response.function_calls or []

    if function_calls:
        tool_calls = [
            ToolCall(
                id=call.id or f"call_{uuid.uuid4().hex[:8]}",
                name=call.name or "",
                arguments=dict(call.args or {}),
            )
            for call in function_calls
        ]
        # Reject a malformed call up front (no tool name) rather than
        # letting an empty tool name reach the orchestrator's tool lookup.
        if any(not call.name for call in tool_calls):
            raise GeminiProviderError("Gemini returned a malformed tool call with no function name.")
        return LLMResponse(tool_calls=tool_calls)

    return LLMResponse(message=response.text or "")
