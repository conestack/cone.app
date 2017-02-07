Fetch application configuration::

    >>> from cone.app.utils import app_config
    >>> cfg = app_config()
    >>> cfg
    <cone.app.model.Properties object at ...>

Fetch principal data::

    >>> from cone.app.utils import principal_data
    >>> principal_data('manager').items()
    [(u'fullname', u'Manager User'), (u'email', u'manager@bar.com')]

    >>> principal_data('inexistent')
    {}

If UGM implementation raises an exception when trying to fetch the principal
it get logged::

    >>> import cone.app
    >>> old_ugm = cone.app.cfg.auth
    >>> cone.app.cfg.auth = None
    >>> principal_data('inexistent')
    {}

    >>> cone.app.cfg.auth = old_ugm

Test safe_encode::

    >>> from cone.app.utils import safe_encode
    >>> safe_encode(u'\xc3\xa4\xc3\xb6\xc3\xbc')
    '\xc3\x83\xc2\xa4\xc3\x83\xc2\xb6\xc3\x83\xc2\xbc'

    >>> safe_encode('already_string')
    'already_string'

Test safe_decode::

    >>> from cone.app.utils import safe_decode
    >>> safe_decode('\xc3\x83\xc2\xa4\xc3\x83\xc2\xb6\xc3\x83\xc2\xbc')
    u'\xc3\xa4\xc3\xb6\xc3\xbc'

    >>> safe_decode(u'already_unicode')
    u'already_unicode'

Helper object for read/write operations with datetime values::

    >>> from datetime import datetime
    >>> from cone.app.utils import DatetimeHelper
    >>> helper = DatetimeHelper()
    >>> dt = datetime(2010, 1, 1, 10, 15)

    >>> dt.isoformat()
    '2010-01-01T10:15:00'

    >>> helper.dt_to_iso(dt)
    '2010-01-01T10:15:00'

    >>> dt = datetime(2010, 1, 1, 10, 15, 10, 5)
    >>> dt.isoformat()
    '2010-01-01T10:15:10.000005'

    >>> helper.dt_to_iso(dt)
    '2010-01-01T10:15:10'

    >>> helper.dt_from_iso('2010-01-01T10:15:00')
    datetime.datetime(2010, 1, 1, 10, 15)

    >>> helper.dt_from_iso(u'2010-01-01T10:15:00')
    datetime.datetime(2010, 1, 1, 10, 15)

    >>> helper.r_value(u'äöü')
    u'\xc3\xa4\xc3\xb6\xc3\xbc'

    >>> helper.r_value('\xc3\x83\xc2\xa4\xc3\x83\xc2\xb6\xc3\x83\xc2\xbc')
    u'\xc3\xa4\xc3\xb6\xc3\xbc'

    >>> helper.r_value('2010-01-01T10:15:00')
    datetime.datetime(2010, 1, 1, 10, 15)

    >>> helper.w_value('abc')
    u'abc'

    >>> helper.w_value(u'abc')
    u'abc'

    >>> helper.w_value(u'äöü')
    u'\xc3\xa4\xc3\xb6\xc3\xbc'

    >>> helper.w_value(dt)
    '2010-01-01T10:15:10'

Timestamp::

    >>> from cone.app.utils import timestamp
    >>> timestamp()
    datetime.datetime(..., ..., ..., ..., ..., ..., ...)

Creation metadata::

    >>> from cone.app.utils import add_creation_metadata
    >>> from cone.app.utils import update_creation_metadata
    >>> from cone.app.model import BaseNode
    >>> node = BaseNode()
    >>> layer.login('editor')

    >>> add_creation_metadata(layer.new_request(), node.attrs)
    >>> node.attrs.items()
    [('creator', 'editor'), 
    ('created', datetime.datetime(...)), 
    ('modified', datetime.datetime(...))]

    >>> node.attrs['created'] == node.attrs['modified']
    True

    >>> update_creation_metadata(layer.new_request(), node.attrs)
    >>> node.attrs.items()
    [('creator', 'editor'), 
    ('created', datetime.datetime(...)), 
    ('modified', datetime.datetime(...))]

    >>> node.attrs['created'] == node.attrs['modified']
    False

    >>> layer.logout()
