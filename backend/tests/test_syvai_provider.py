import pytest

from app.syvai.errors import ConfigurationError
from app.syvai.provider import (
    FakeProvider,
    MODEL_PRICING,
    OpenAICompatibleProvider,
    ProviderConfig,
    estimate_cost_usd,
)


@pytest.mark.asyncio
async def test_fake_provider_records_calls_and_usage():
    provider = FakeProvider('{"events": []}')
    result = await provider.complete("system", "user")
    assert result.text == '{"events": []}'
    assert provider.calls == [("system", "user")]
    assert result.usage.provider == "fake"
    assert result.usage.input_tokens == 100


@pytest.mark.asyncio
async def test_fake_provider_accepts_async_callable():
    async def respond(system, user):
        return '{"events": []}'

    provider = FakeProvider(respond)
    result = await provider.complete("s", "u")
    assert result.text == '{"events": []}'


def test_provider_config_from_env_requires_api_key(monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "SYVAI_OPENAI_API_KEY", "")
    with pytest.raises(ConfigurationError, match="SYVAI_OPENAI_API_KEY"):
        ProviderConfig.from_env()


def test_provider_config_from_env_defaults(monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "SYVAI_OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(settings, "SYVAI_OPENAI_BASE_URL", "https://api.openai.com/v1")
    monkeypatch.setattr(settings, "SYVAI_OPENAI_MODEL", "gpt-4o-mini")
    config = ProviderConfig.from_env()
    assert config.api_key == "test-key"
    assert config.base_url == "https://api.openai.com/v1"
    assert config.model == "gpt-4o-mini"


def test_estimate_cost_usd_known_model():
    cost = estimate_cost_usd("gpt-4o-mini", 1_000_000, 1_000_000)
    assert cost == pytest.approx(0.75)


def test_estimate_cost_usd_unknown_model():
    assert estimate_cost_usd("unknown-model", 100, 50) is None


@pytest.mark.asyncio
async def test_openai_provider_missing_key_raises():
    provider = OpenAICompatibleProvider(ProviderConfig(api_key=""))
    with pytest.raises(ConfigurationError):
        await provider.complete("s", "u")


def test_pricing_table_has_known_models():
    assert "gpt-4o-mini" in MODEL_PRICING
    assert "gpt-4o" in MODEL_PRICING
