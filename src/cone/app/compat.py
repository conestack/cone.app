try:
    from urllib2 import quote
    from urllib2 import unquote
    import ConfigParser as configparser
    import urlparse
except ImportError:
    from urllib.parse import quote
    from urllib.parse import unquote
    import configparser
    import urllib.parse as urlparse
import sys
import types


IS_PY2 = sys.version_info[0] < 3
BYTES_TYPE = str if IS_PY2 else bytes
STR_TYPE = basestring if IS_PY2 else str
UNICODE_TYPE = unicode if IS_PY2 else str
LONG_TYPE = long if IS_PY2 else int
ITER_TYPES = (types.ListType, types.TupleType) if IS_PY2 else (list, tuple)
