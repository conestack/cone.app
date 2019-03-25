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
