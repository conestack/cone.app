from cone.app.utils import app_config
from cone.app.utils import safe_encode
from cone.app.utils import safe_decode
from pyramid.i18n import TranslationStringFactory
from pyramid.security import authenticated_userid
import datetime
import re
import types
import urllib2


_ = TranslationStringFactory('cone.app')


def authenticated(request):
    """XXX: remove this. use ``authenticated_userid`` directly.
    """
    return authenticated_userid(request)


def nodepath(node):
    return [safe_decode(p) for p in node.path if p is not None]


def make_query(**kw):
    query = list()
    for name, param in kw.items():
        if param is None:
            continue
        if isinstance(param, basestring):
            param = [param]
        if type(param) is types.IntType:
            param = [str(param)]
        for p in param:
            query.append('{0}={1}'.format(name, p))
    query = '&'.join(query)
    if query:
        return '?{0}'.format(query)


def make_url(request, path=None, node=None, resource=None, query=None):
    # if path=[] in signature, path gets aggregated in recursive calls ???
    # happens on icon lookup in navtree.
    # ^^^ that is because the [] (a list, mutable) is generated at compile
    # time. mutable values should not be in function signatures to avoid this.
    if path is None:
        path = []
    if node is not None:
        path = nodepath(node)
    if resource is not None:
        path.append(resource)
    path = [urllib2.quote(safe_encode(it)) for it in path]
    url = '{0}/{1}'.format(request.application_url, '/'.join(path))
    if not query:
        return url
    return '{0}{1}'.format(url, query)


def choose_name(container, name):
    name = re.sub(
        r'-{2,}', '-',
        re.sub('^\w-|-\w-|-\w$', '-',
               re.sub(r'\W', '-', name.strip()))).strip('-').lower()
    n = name
    i = 0
    while n in container:
        i += 1
        n = u'%s-%s' % (name, i)
    return n.replace('/', '-').lstrip('+@')


def format_date(dt, long=True):
    if not isinstance(dt, datetime.datetime):
        return _('unknown', default='Unknown')
    return long and dt.strftime('%d.%m.%Y %H:%M') or dt.strftime('%d.%m.%Y')


def node_icon(request, node):
    if node.properties.icon:
        return node.properties.icon
    info = node.nodeinfo
    if not info.icon:
        return app_config().default_node_icon
    return info.icon


def request_property(func):
    """Decorator like ``property``, but underlying function is only called once
    per request.

    Cache attribute on request.environ under key
    ``instanceid.classname.funcname``.

    Works only on instances providing a request attribute.
    """
    def wrapper(self):
        cache_key = '{0}.{1}.{2}'.format(
            str(id(self)),
            self.__class__.__name__,
            func.__name__
        )
        try:
            return self.request.environ[cache_key]
        except KeyError:
            val = self.request.environ[cache_key] = func(self)
            return val
    wrapper.__doc__ = func.__doc__
    return property(wrapper)
