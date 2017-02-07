from datetime import datetime
from pyramid.security import authenticated_userid
import logging


logger = logging.getLogger('cone.app')


def app_config():
    import cone.app
    return cone.app.cfg


def principal_data(principal_id):
    data = dict()
    ugm = app_config().auth
    try:
        user = ugm.users.get(principal_id)
        if not user:
            return data
        data = user.attrs
    except Exception, e:
        logger.error(str(e))
    return data


def safe_encode(value, encoding='utf-8'):
    if isinstance(value, unicode):
        value = value.encode(encoding)
    return value


def safe_decode(value, encoding='utf-8'):
    if not isinstance(value, unicode):
        value = value.decode(encoding)
    return value


def timestamp():
    return datetime.now()


class DatetimeHelper(object):

    def w_value(self, val):
        if isinstance(val, datetime):
            return self.dt_to_iso(val)
        if not isinstance(val, unicode):
            val = str(val).decode('utf-8')
        return val

    def r_value(self, val):
        try:
            return self.dt_from_iso(val)
        except ValueError:
            if not isinstance(val, unicode):
                val = str(val).decode('utf-8')
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
    mapping['creator'] = authenticated_userid(request)
    mapping['created'] = timestamp()
    mapping['modified'] = mapping['created']


# XXX: move somewhere else, probably plumbing behavior for node
def update_creation_metadata(request, mapping):
    mapping['modified'] = timestamp()
