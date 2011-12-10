import logging
from datetime import datetime
from pyramid.threadlocal import get_current_request
from pyramid.security import authenticated_userid


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


# XXX: move somewhere else, probably plumbing part for node
def add_creation_metadata(request, mapping):
    mapping['creator'] = authenticated_userid(request)
    mapping['created'] = timestamp()
    mapping['modified'] = mapping['created']


# XXX: move somewhere else, probably plumbing part for node
def update_creation_metadata(request, mapping):
    mapping['modified'] = timestamp()