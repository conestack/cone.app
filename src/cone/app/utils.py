from cone.app import compat
from datetime import datetime
from node.utils import safe_decode as _safe_decode
from node.utils import safe_encode as _safe_encode
import logging
import sys
import traceback


logger = logging.getLogger('cone.app')


def app_config():
    import cone.app
    return cone.app.cfg


# B/C
# deprecated: will be removed in cone.app 2.0
def safe_encode(value, encoding='utf-8'):
    return _safe_encode(value, encoding=encoding)


# B/C
# deprecated: will be removed in cone.app 2.0
def safe_decode(value, encoding='utf-8'):
    return _safe_decode(value, encoding=encoding)


def timestamp():
    return datetime.now()


def format_traceback():
    etype, value, tb = sys.exc_info()
    return ''.join(traceback.format_exception(etype, value, tb))


def node_path(node):
    # XXX: move to ``cone.app.utils``
    return [_safe_decode(p) for p in node.path if p is not None]


def navigation_root(node):
    """Node the navigation is rooted at.

    The nearest ancestor of ``node`` - or ``node`` itself - flagged with
    ``properties.is_navroot``. Falls back to the application root's
    ``default_child`` if that one is flagged, and to the application root
    otherwise.

    :param node: Node to look up the navigation root for.
    :return: The navigation root node.
    """
    root = node.root
    while node is not root:
        if node.properties.is_navroot:
            return node
        node = node.parent
    default_child = root.properties.default_child
    if default_child:
        child = root.get(default_child)
        if child is not None and child.properties.is_navroot:
            return child
    return root


class DatetimeHelper(object):

    def w_value(self, val):
        if val is None:
            return 'None'
        if isinstance(val, datetime):
            return self.dt_to_iso(val)
        if isinstance(val, bytes):
            return val.decode('utf-8')
        return compat.UNICODE_TYPE(val)

    def r_value(self, val):
        try:
            return self.dt_from_iso(val)
        except (ValueError, TypeError):
            if isinstance(val, bytes):
                return val.decode('utf-8')
            return compat.UNICODE_TYPE(val)

    def dt_from_iso(self, str):
        return datetime.strptime(str, '%Y-%m-%dT%H:%M:%S')

    def dt_to_iso(self, dt):
        iso = dt.isoformat()
        if iso.find('.') != -1:
            iso = iso[:iso.rfind('.')]
        return iso


# XXX: move somewhere else, probably plumbing behavior for node
def add_creation_metadata(request, mapping):
    mapping['creator'] = request.authenticated_userid
    mapping['created'] = timestamp()
    mapping['modified'] = mapping['created']


# XXX: move somewhere else, probably plumbing behavior for node
def update_creation_metadata(request, mapping):
    mapping['modified'] = timestamp()
