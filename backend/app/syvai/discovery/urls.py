"""URL parsing, normalization, and SSRF-safe host validation.

Everything the discovery layer touches goes through these helpers so that
"fetch any URL" never happens: only http/https URLs with normalized forms and
publicly routable hosts are ever handed to an HTTP client.
"""

from __future__ import annotations

import ipaddress
import socket
from urllib.parse import parse_qsl, unquote, urlencode, urlparse, urlunparse

TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "fbclid", "gclid", "gclsrc", "dclid", "msclkid", "ref", "ref_src",
    "mc_cid", "mc_eid", "mkt_tok",
}


def normalize_url(url: str) -> str | None:
    """Return a canonical absolute URL or None for non-http(s) / unparseable input.

    Canonicalization is conservative: lowercase scheme+host, strip default
    ports, fragment, tracking parameters, and a trailing slash on non-empty
    paths. It never follows redirects or consults DNS.
    """
    if not url or not isinstance(url, str):
        return None
    url = url.strip()
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return None

    host = parsed.hostname
    if not host:
        return None
    host = host.lower()
    port = parsed.port
    if (parsed.scheme == "http" and port == 80) or (parsed.scheme == "https" and port == 443):
        port = None

    netloc = host
    if port is not None:
        netloc = f"{host}:{port}"

    query = ""
    if parsed.query:
        params = [(k, v) for k, v in parse_qsl(parsed.query, keep_blank_values=True) if k.lower() not in TRACKING_PARAMS]
        if params:
            query = urlencode(params, doseq=True)

    path = parsed.path or "/"
    path = unquote(path)
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")
        if not path:
            path = "/"

    return urlunparse((parsed.scheme, netloc, path, "", query, ""))


def registrable_domain(url: str) -> str:
    """Return a coarse 'source family' domain for a URL.

    Uses the public suffix list where available (via ``tldextract`` if the
    project ever adds it); without it we fall back to the last two labels,
    which is sufficient for the discovery family-cap because the allow-listed
    providers only ever produce well-known registrable domains.
    """
    host = urlparse(url).hostname
    if not host:
        return ""
    parts = host.lower().rsplit(".", 2)
    if len(parts) < 2:
        return host.lower()
    return ".".join(parts[-2:])


def resolve_hosts(host: str) -> list[str]:
    """Resolve ``host`` to IPv4/IPv6 addresses. Never raises to callers."""
    try:
        infos = socket.getaddrinfo(host, None, proto=socket.IPPROTO_TCP)
    except socket.gaierror:
        return []
    seen: set[str] = set()
    for info in infos:
        ip = info[4][0]
        if ip not in seen:
            seen.add(ip)
    return list(seen)


_UNSAFE_V4_NETWORKS = (
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("192.0.0.0/24"),
    ipaddress.ip_network("198.18.0.0/15"),
    ipaddress.ip_network("255.255.255.255/32"),
)


def is_unsafe_ip(ip_str: str) -> bool:
    """Fail-closed SSRF check: True means this address must not be fetched."""
    try:
        ip = ipaddress.ip_address(ip_str)
    except ValueError:
        return True
    if ip.version == 4:
        if (
            ip.is_loopback or ip.is_private or ip.is_link_local or ip.is_multicast or ip.is_reserved
            or any(ip in network for network in _UNSAFE_V4_NETWORKS)
            or not ip.is_global
        ):
            return True
        return False
    if (
        ip.is_loopback or ip.is_private or ip.is_link_local or ip.is_multicast or ip.is_reserved
        or ip in (ipaddress.ip_network("::/128"), ipaddress.ip_network("::1/128"))
        or not ip.is_global
    ):
        return True
    return False
