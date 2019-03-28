from cone.app import compat
from datetime import datetime
import logging
import sys
import traceback


logger = logging.getLogger('cone.app')


def app_config():
    import cone.app
    return cone.app.cfg


def safe_encode(value, encoding='utf-8'):
    if isinstance(value, compat.UNICODE_TYPE):
        value = value.encode(encoding)
    return value


def safe_decode(value, encoding='utf-8'):
    if not isinstance(value, compat.UNICODE_TYPE):
        value = value.decode(encoding)
    return value


def timestamp():
    return datetime.now()


def format_traceback():
    etype, value, tb = sys.exc_info()
    return ''.join(traceback.format_exception(etype, value, tb))


class DatetimeHelper(object):

    def w_value(self, val):
        if val is None:
            return 'None'
        if isinstance(val, datetime):
            return self.dt_to_iso(val)
        if not isinstance(val, compat.UNICODE_TYPE):
            val = bytes(val).decode('utf-8')
        return val

    def r_value(self, val):
        try:
            return self.dt_from_iso(val)
        except (ValueError, TypeError):
            if not isinstance(val, compat.UNICODE_TYPE):
                val = bytes(val).decode('utf-8')
            return val

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
