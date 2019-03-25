try:  # pragma: no cover
    from urllib2 import quote
    from urllib2 import unquote
    import ConfigParser as configparser
    import urlparse
except ImportError:  # pragma: no cover
    from urllib.parse import quote
    from urllib.parse import unquote
    import configparser
    import urllib.parse as urlparse
import sys
import types


IS_PY2 = sys.version_info[0] < 3
STR_TYPE = basestring if IS_PY2 else str
UNICODE_TYPE = unicode if IS_PY2 else str
ITER_TYPES = (types.ListType, types.TupleType) if IS_PY2 else (list, tuple)
NUMBER_TYPES = (types.IntType, types.FloatType) if IS_PY2 else (int, float)
