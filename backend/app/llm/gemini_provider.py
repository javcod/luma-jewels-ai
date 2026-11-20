"""Gemini implementation of LLMProvider.

Converts between our provider-neutral types (app.llm.base) and the
google-genai SDK types, so the rest of the app never touches the SDK.
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

# 5xx errors (e.g. a 503 under high demand) are usually temporary, so they
# are retried. 4xx errors (bad key, invalid request) fail immediately.
_MAX_ATTEMPTS = 3
_RETRY_BACKOFF_SECONDS = 1.5


class GeminiProviderError(Exception):
    """Raised for any Gemini configuration or API failure."""


class GeminiProvider(LLMProvider):
    """`client` can be passed in to use a mock in tests."""

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
                # Temporary server error; retrying a generation request is safe
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
                # Client errors will not succeed on retry
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
            # Gemini accepts a single system instruction, so join them
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
        # Skip malformed calls without a tool name
        if any(not call.name for call in tool_calls):
            raise GeminiProviderError("Gemini returned a malformed tool call with no function name.")
        return LLMResponse(tool_calls=tool_calls)

    return LLMResponse(message=response.text or "")
