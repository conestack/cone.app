"""Aliases for stdlib names this package imports from one place.

Was the Python 2 compatibility layer. Python 2 is gone - ``requires-python``
is ``>=3.10`` - so the version switches went with it; what remains are plain
re-exports kept because the import sites reference them by this module.
"""
from io import StringIO  # noqa
from urllib.parse import quote  # noqa
from urllib.parse import unquote  # noqa
import configparser  # noqa
import urllib.parse as urlparse  # noqa
