"""SSRF-safe bounded HTTP fetcher for the source-discovery layer.

Every outbound request passes the same guard chain:

  1. scheme allow-list (http/https only);
  2. DNS resolution -> every resolved address must be public and routable
     (loopback, private, link-local, multicast, reserved, CGNAT, benchmark
     and documentation ranges are rejected; resolution happens *before* any
     connection and again per redirect hop);
  3. redirects are followed manually with per-hop re-validation (max 5);
  4. bounded reads (per-request timeout, max body bytes, MIME allow-list);
  5. active content is never executed: we only keep plain text.

Tests inject a fake resolver and an ``httpx`` transport so no real network or
DNS is ever touched.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Awaitable, Callable
from urllib.parse import urljoin

import httpx

from app.config import settings
from app.syvai.discovery.urls import is_unsafe_ip, normalize_url, resolve_hosts
from app.syvai.errors import FetchError

logger = logging.getLogger(__name__)

ALLOWED_MEDIA_PREFIX = ("text/", "application/json", "application/xml", "application/xhtml+xml")
MAX_REDIRECTS = 5

Resolver = Callable[[str], list[str]]


@dataclass
class FetcherConfig:
    timeout_seconds: float = 15.0
    max_bytes: int = 500_000
    user_agent: str = "SyverroSyvAI/0.2 (+https://syverro.com)"


@dataclass
class FetchedPage:
    url: str
    final_url: str
    status_code: int
    content_type: str
    text: str
    headers: dict[str, str] = field(default_factory=dict)


def _content_type_allowed(content_type: str) -> bool:
    media = content_type.split(";", 1)[0].strip().lower()
    if not media or media == "*/*":
        return False
    if media.startswith("text/"):
        return True
    if media == "application/json" or media == "application/xml" or media == "application/xhtml+xml":
        return True
    if media.endswith("+json") or media.endswith("+xml"):
        return True
    return False


def _decode(body: bytes, content_type: str) -> str:
    charset = "utf-8"
    for part in content_type.split(";"):
        part = part.strip()
        if part.lower().startswith("charset="):
            charset = part.split("=", 1)[1].strip("\"' ")
            break
    return body.decode(charset, errors="replace")


class SafeFetcher:
    def __init__(
        self,
        config: FetcherConfig | None = None,
        *,
        resolver: Resolver | None = None,
        transport: httpx.AsyncBaseTransport | None = None,
    ):
        self.config = config or FetcherConfig(
            timeout_seconds=settings.SYVAI_DISCOVERY_TIMEOUT_SECONDS,
            max_bytes=settings.SYVAI_DISCOVERY_MAX_PAGE_BYTES,
            user_agent=settings.SYVAI_DISCOVERY_USER_AGENT,
        )
        self._resolver = resolver or resolve_hosts
        self._transport = transport

    def _validate_host(self, host: str) -> None:
        addresses = self._resolver(host)
        if not addresses:
            raise FetchError(f"could not resolve host: {host}", code="dns_failed")
        unsafe = [address for address in addresses if is_unsafe_ip(address)]
        if unsafe:
            logger.warning("ssrf_guard host=%s blocked_addresses=%s", host, unsafe)
            raise FetchError(f"blocked non-public address for host: {host}", code="ssrf_blocked")

    async def fetch(self, url: str) -> FetchedPage:
        normalized = normalize_url(url)
        if not normalized:
            raise FetchError("only http/https URLs may be fetched", code="unsupported_scheme")

        headers = {
            "User-Agent": self.config.user_agent,
            "Accept": "text/html,text/plain,application/json,application/xml;q=0.9,*/*;q=0.1",
        }
        timeout = httpx.Timeout(self.config.timeout_seconds, read=self.config.timeout_seconds)
        current = normalized
        redirects = 0

        async with httpx.AsyncClient(
            timeout=timeout,
            follow_redirects=False,
            transport=self._transport,
        ) as client:
            while True:
                parsed_host = httpx.URL(current).host
                if not parsed_host:
                    raise FetchError(f"invalid URL: {current}", code="invalid_url")
                self._validate_host(parsed_host)

                async with client.stream("GET", current, headers=headers) as response:
                    status = response.status_code
                    content_type = response.headers.get("content-type", "")

                    if status in (301, 302, 303, 307, 308):
                        location = response.headers.get("location")
                        if not location:
                            raise FetchError(
                                f"redirect without Location: {status}", code="redirect_without_location"
                            )
                        redirects += 1
                        if redirects > MAX_REDIRECTS:
                            raise FetchError("too many redirects", code="too_many_redirects")
                        current = urljoin(current, location)
                        continue

                    if status < 200 or status >= 300:
                        raise FetchError(
                            f"unexpected HTTP {status} from {current}", code="http_error"
                        )
                    if not _content_type_allowed(content_type):
                        raise FetchError(
                            f"disallowed content-type: {content_type or 'unknown'}",
                            code="content_type_blocked",
                        )

                    body = bytearray()
                    async for chunk in response.aiter_bytes():
                        body.extend(chunk)
                        if len(body) > self.config.max_bytes:
                            raise FetchError(
                                f"response exceeds {self.config.max_bytes} bytes",
                                code="response_too_large",
                            )
                    text = _decode(bytes(body), content_type)

                    return FetchedPage(
                        url=url,
                        final_url=current,
                        status_code=status,
                        content_type=content_type,
                        text=text,
                        headers={str(k): str(v) for k, v in response.headers.items()},
                    )
