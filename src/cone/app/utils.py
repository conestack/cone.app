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
