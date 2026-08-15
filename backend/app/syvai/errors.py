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
