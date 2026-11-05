"""Refuse requests which change state if a browser sends them for another site."""

from fnmatch import fnmatchcase
from pyramid.httpexceptions import HTTPForbidden
from pyramid.settings import aslist
import logging


logger = logging.getLogger('cone.app')

SAFE_METHODS = frozenset(('GET', 'HEAD', 'OPTIONS'))
OWN_FETCH_SITES = frozenset(('same-origin', 'none'))


def is_foreign_request(request, trusted_origins):
    """Check whether a browser sends this request on behalf of another site.

    Clients other than browsers send neither ``Origin`` nor ``Sec-Fetch-Site``
    and no cookies of a browser, they pass.

    :param request: The request.
    :param trusted_origins: List of origins which always pass, ``*`` matches any
        characters.
    :return: Whether the request is to be refused.
    """
    origin = request.headers.get('Origin')
    # A bracket encloses an IPv6 address, for fnmatch it starts a character class.
    if origin is not None and any(
        fnmatchcase(origin, trusted.replace('[', '[[]')) for trusted in trusted_origins
    ):
        return False
    fetch_site = request.headers.get('Sec-Fetch-Site')
    if fetch_site is not None:
        return fetch_site not in OWN_FETCH_SITES
    if origin is None:
        return False
    # Browsers send ``Sec-Fetch-Site`` to secure origins only, the host is what is
    # left. The scheme differs behind a proxy terminating TLS.
    return origin.partition('://')[2] != request.host


def origin_check_tween_factory(handler, registry):
    """Create the tween refusing requests a browser sends for another site.

    :param handler: The next handler.
    :param registry: The registry, ``cone.trusted_origins`` in its settings lists
        the origins which always pass.
    :return: The tween.
    """
    trusted_origins = aslist(registry.settings.get('cone.trusted_origins', ''))

    def origin_check_tween(request):
        if request.method in SAFE_METHODS or not is_foreign_request(
            request, trusted_origins
        ):
            return handler(request)
        path = request.environ.get('PATH_INFO')
        origin = request.headers.get('Origin')
        site = request.headers.get('Sec-Fetch-Site')
        logger.warning(
            f'Refused {request.method} of {path!r} from origin {origin!r}, '
            f'fetch site {site!r}'
        )
        return HTTPForbidden()

    return origin_check_tween
