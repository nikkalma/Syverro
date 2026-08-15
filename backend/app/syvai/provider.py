"""Minimal SyvAI provider abstraction.

The provider boundary is deliberately small: one structured completion call,
model name, timeout, temperature, and usage metadata. No routing, no
multi-vendor fallback, no local ML stack.

Provider selection for 0.1A: OpenAI Chat Completions via raw HTTPS.
Why:
  - the repository has no existing LLM integration and no HTTP client in
    production requirements, so we add only ``httpx``;
  - Chat Completions is a widely supported, simple JSON-over-HTTP contract;
  - the abstraction stays vendor-neutral, so swapping in Anthropic/Gemini/etc.
    only requires a new Provider implementation.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Protocol

import httpx

from app.config import settings
from app.syvai.errors import ConfigurationError, ProviderError


# ---------------------------------------------------------------------------
# Usage / result types
# ---------------------------------------------------------------------------


@dataclass
class ProviderUsage:
    provider: str
    model: str
    input_tokens: int | None = None
    output_tokens: int | None = None
    total_tokens: int | None = None
    duration_ms: int | None = None
    calls: int = 1
    estimated_cost_usd: float | None = None


@dataclass
class ProviderResult:
    text: str
    usage: ProviderUsage


# ---------------------------------------------------------------------------
# Minimal pricing table for estimated cost telemetry.
# Rates are USD per 1M tokens (input, output). Unknown models => None cost.
# ---------------------------------------------------------------------------

MODEL_PRICING: dict[str, tuple[float, float]] = {
    "gpt-4o-mini": (0.15, 0.60),
    "gpt-4o": (2.50, 10.00),
    "gpt-4.1-mini": (0.40, 1.60),
    "gpt-4.1": (2.00, 8.00),
    "gpt-4o-mini-2024-07-18": (0.15, 0.60),
}


def estimate_cost_usd(model: str, input_tokens: int | None, output_tokens: int | None) -> float | None:
    rates = MODEL_PRICING.get(model)
    if not rates or not input_tokens:
        return None
    input_rate, output_rate = rates
    return (input_tokens / 1_000_000) * input_rate + ((output_tokens or 0) / 1_000_000) * output_rate


# ---------------------------------------------------------------------------
# Provider protocol
# ---------------------------------------------------------------------------


class Provider(Protocol):
    name: str
    model: str

    async def complete(self, system: str, user: str) -> ProviderResult:
        """Perform one structured completion call and return raw text + usage."""
        ...


# ---------------------------------------------------------------------------
# OpenAI-compatible provider (raw HTTPS via httpx)
# ---------------------------------------------------------------------------


@dataclass
class ProviderConfig:
    model: str = "gpt-4o-mini"
    base_url: str = "https://api.openai.com/v1"
    api_key: str = ""
    timeout_seconds: float = 60.0
    temperature: float = 0.0
    max_tokens: int = 4096

    @classmethod
    def from_env(cls) -> "ProviderConfig":
        api_key = settings.SYVAI_OPENAI_API_KEY
        if not api_key:
            raise ConfigurationError(
                "SyvAI provider is not configured: SYVAI_OPENAI_API_KEY is missing"
            )
        return cls(
            model=settings.SYVAI_OPENAI_MODEL,
            base_url=settings.SYVAI_OPENAI_BASE_URL.rstrip("/"),
            api_key=api_key,
            timeout_seconds=settings.SYVAI_PROVIDER_TIMEOUT_SECONDS,
            temperature=settings.SYVAI_PROVIDER_TEMPERATURE,
            max_tokens=settings.SYVAI_PROVIDER_MAX_TOKENS,
        )


class OpenAICompatibleProvider:
    """Minimal OpenAI Chat Completions client.

    Uses the ``response_format: {"type": "json_object"}`` contract for
    structured output. Retries once on transient HTTP failures.
    """

    name = "openai-compatible"

    def __init__(self, config: ProviderConfig):
        self._config = config
        self.model = config.model

    async def complete(self, system: str, user: str) -> ProviderResult:
        if not self._config.api_key:
            raise ConfigurationError(
                "SyvAI provider is not configured: API key missing"
            )
        started = time.monotonic()
        last_error: Exception | None = None
        payload = {
            "model": self._config.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": self._config.temperature,
            "max_tokens": self._config.max_tokens,
            "response_format": {"type": "json_object"},
        }
        headers = {
            "Authorization": f"Bearer {self._config.api_key}",
            "Content-Type": "application/json",
        }

        for attempt in range(2):
            try:
                async with httpx.AsyncClient(timeout=self._config.timeout_seconds) as client:
                    response = await client.post(
                        f"{self._config.base_url}/chat/completions",
                        headers=headers,
                        json=payload,
                    )
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                last_error = exc
                continue

            if response.status_code == 429 or response.status_code >= 500:
                last_error = ProviderError(f"provider returned HTTP {response.status_code}")
                continue
            if response.status_code != 200:
                # Never leak the provider body to clients; log a sanitized summary.
                raise ProviderError(f"provider returned HTTP {response.status_code}")

            data = response.json()
            text = data["choices"][0]["message"]["content"]
            usage = data.get("usage") or {}
            input_tokens = usage.get("prompt_tokens")
            output_tokens = usage.get("completion_tokens")
            total_tokens = usage.get("total_tokens")
            duration_ms = int((time.monotonic() - started) * 1000)
            return ProviderResult(
                text=text,
                usage=ProviderUsage(
                    provider=self.name,
                    model=self.model,
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    total_tokens=total_tokens,
                    duration_ms=duration_ms,
                    calls=attempt + 1,
                    estimated_cost_usd=estimate_cost_usd(self.model, input_tokens, output_tokens),
                ),
            )

        raise ProviderError(f"provider call failed after retries: {last_error}")


# ---------------------------------------------------------------------------
# Fake provider for automated tests and the offline benchmark
# ---------------------------------------------------------------------------


class FakeProvider:
    """Deterministic provider used by tests and the offline Sapphire benchmark.

    ``response`` may be a static string or an async callable ``(system, user)
    -> str``. Records every call for assertions.
    """

    name = "fake"
    model = "fake-model"

    def __init__(
        self,
        response: str | Callable[[str, str], Awaitable[str] | str],
        *,
        usage: ProviderUsage | None = None,
    ):
        self._response = response
        self._usage = usage
        self.calls: list[tuple[str, str]] = []

    async def complete(self, system: str, user: str) -> ProviderResult:
        self.calls.append((system, user))
        if callable(self._response):
            text = self._response(system, user)
            if hasattr(text, "__await__"):
                text = await text
        else:
            text = self._response
        usage = self._usage or ProviderUsage(
            provider=self.name,
            model=self.model,
            input_tokens=100,
            output_tokens=50,
            total_tokens=150,
            duration_ms=42,
            calls=1,
            estimated_cost_usd=0.00002,
        )
        return ProviderResult(text=text, usage=usage)
