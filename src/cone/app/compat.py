try:  # pragma: no cover
    from StringIO import StringIO
    from urllib2 import quote
    from urllib2 import unquote
    import ConfigParser as configparser
    import urlparse
except ImportError:  # pragma: no cover
    from io import StringIO  # noqa
    from urllib.parse import quote  # noqa
    from urllib.parse import unquote  # noqa
    import configparser  # noqa
    import urllib.parse as urlparse  # noqa
import sys
import types


IS_PY2 = sys.version_info[0] < 3
STR_TYPE = basestring if IS_PY2 else str
UNICODE_TYPE = unicode if IS_PY2 else str
ITER_TYPES = (types.ListType, types.TupleType) if IS_PY2 else (list, tuple)
NUMBER_TYPES = (types.IntType, types.FloatType) if IS_PY2 else (int, float)
