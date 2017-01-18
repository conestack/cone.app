cone main
---------

::

    >>> import cone.app

``get_root``::

    >>> import os
    >>> root = cone.app.get_root()
    >>> root
    <AppRoot object 'None' at ...>

AppRoot contains a settings node by default::

    >>> 'settings' in root.factories.keys()
    True

Settings contains metadata.title by default::

    >>> root['settings'].metadata.keys()
    ['title']

    >>> root['settings'].metadata.title
    u'settings'

Settings is displayed in navtree by default::

    >>> root['settings'].properties.keys()
    ['skip_mainmenu', 'in_navtree', 'icon']

    >>> root['settings'].properties.in_navtree
    False

    >>> root['settings'].properties.skip_mainmenu
    True

``register_plugin``::

    >>> from cone.app.model import BaseNode
    >>> cone.app.register_plugin('dummy', BaseNode)
    >>> 'dummy' in root.factories.keys()
    True

    >>> cone.app.register_plugin('dummy', BaseNode)
    Traceback (most recent call last):
      ...
    ValueError: Entry with name 'dummy' already registered.

``register_plugin_config``::

    >>> cone.app.register_plugin_config('dummy', BaseNode)
    >>> 'dummy' in root['settings'].factories.keys()
    True

    >>> cone.app.register_plugin_config('dummy', BaseNode)
    Traceback (most recent call last):
      ...
    ValueError: Config with name 'dummy' already registered.

``register_main_hook``::

    >>> def custom_main_hook(configurator, global_config, settings):
    ...     print "Custom main hook called"

    >>> cone.app.register_main_hook(custom_main_hook)

``auth_tkt_factory``::

    >>> cone.app.auth_tkt_factory(secret='12345')
    <pyramid.authentication.AuthTktAuthenticationPolicy object at ...>

``acl_factory``::

    >>> cone.app.acl_factory()
    <pyramid.authorization.ACLAuthorizationPolicy object at ...>

``main``::

    >>> settings = {
    ...     'cone.admin_user': 'admin',
    ...     'cone.admin_password': 'admin',
    ...     'cone.auth_secret': '12345',
    ...     'cone.auth_reissue_time': '300',
    ...     'cone.auth_max_age': '600',
    ... }
    >>> cone.app.main({}, **settings)
    Custom main hook called
    <pyramid.router.Router object at ...>

Remove custom main hook after testing::

    >>> cone.app.main_hooks.remove(custom_main_hook)

Remote address middleware::

    >>> from cone.app import make_remote_addr_middleware

    >>> class DummyApp(object):
    ...     def __call__(self, environ, start_response):
    ...         print environ['REMOTE_ADDR']

    >>> app = DummyApp()
    >>> filter = make_remote_addr_middleware(app, {})

    >>> environ = {}
    >>> environ['HTTP_X_REAL_IP'] = '1.2.3.4'
    >>> filter(environ, None)
    1.2.3.4
