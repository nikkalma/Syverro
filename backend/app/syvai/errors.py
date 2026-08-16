"""SyvAI error taxonomy. Provider output and configuration failures are
classified here so API boundaries can sanitize them before they reach clients.
"""


class SyvaiError(Exception):
    """Base class for all SyvAI domain errors."""


class ConfigurationError(SyvaiError):
    """Provider configuration is missing or invalid. Never contains secrets."""


class ProviderError(SyvaiError):
    """A provider call failed (network, HTTP, timeout). May carry a safe message."""


class StructuredOutputError(SyvaiError):
    """Provider returned content that could not be parsed into the expected schema."""


class DiscoveryError(SyvaiError):
    """The bounded source-discovery layer could not complete its task."""


class FetchError(DiscoveryError):
    """A safe fetch failed (SSRF guard, timeout, size cap, or HTTP error)."""

    def __init__(self, message: str, code: str | None = None):
        super().__init__(message)
        self.code = code or "fetch_failed"
