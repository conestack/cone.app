===============
Getting Started
===============

Application INI Configuration Parameters
----------------------------------------

General Application configuration is done in the ``app:`` section of the
Application INI file.


Static User and Password
~~~~~~~~~~~~~~~~~~~~~~~~

*cone.admin_user*
    Login name of superuser.

*cone.admin_password*
    Password of superuser.


Auth TKT Configuration
----------------------

*cone.auth_secret*
    Cookie encryption password.

*cone.auth_cookie_name*
    Default: ``auth_tkt``. The name used for auth cookie.

*cone.auth_secure*
    Default: ``False``. Only send the cookie back over a secure connection.

*cone.auth_include_ip*
    Default: ``False``.  Make the requesting IP address part of the
    authentication data in the cookie.

*cone.auth_timeout*
    Default: ``None``.  Maximum number of seconds which a newly issued ticket
    will be considered valid.

*cone.auth_reissue_time*
    Default: ``None``.  If this parameter is set, it represents the number of
    seconds that must pass before an authentication token cookie is reissued.

*cone.auth_max_age*
    Default: ``None``.  The max age of the auth_tkt cookie, in seconds. This
    differs from ``timeout`` inasmuch as ``timeout`` represents the lifetime
    of the ticket contained in the cookie, while this value represents the
    lifetime of the cookie itself.

*cone.auth_http_only*
    Default: ``False``. Hide cookie from JavaScript by setting the HttpOnly
    flag.

*cone.auth_path*
    Default: ``/``. The path for which the authentication cookie is valid.

*cone.auth_wild_domain*
    Default: ``True``. An authentication cookie will be generated for the
    wildcard domain.


User and Group Backend Configuration
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

*cone.auth_impl*
    UGM implementation to use for authentication and principal authorization.
    If not set, only ``cone.admin_user`` is available. It's recommended
    to avoid setting a global superuser via ini file for live deployments.
    ``cone.auth_impl`` is not considered at any place in ``cone.app``. This is
    left to the UGM implementation creating application hook callback.


Plugin Loading
~~~~~~~~~~~~~~

*cone.plugins*
    List of ``cone.app`` plugin packages. Plugins are included by invoking the
    plugin package ``configure.zcml``.


Root Model Configuration
~~~~~~~~~~~~~~~~~~~~~~~~

*cone.root.title*
    Title of the application.

*cone.root.default_child*
    Default child of root model node.

*cone.root.default_content_tile*
    Default content tile for root model node.

*cone.root.mainmenu_empty_title*
    Flag whether to suppress rendering main menu titles.


.. code-block:: ini

    [DEFAULT]
    debug = true

    [server:main]
    use = egg:Paste#http
    host = 0.0.0.0
    port = 8081

    [app:example]
    use = egg:cone.app#main

    reload_templates = true

    # paster debugging flags
    debug_authorization = false
    debug_notfound = false
    debug_routematch = false
    debug_templates = true

    default_locale_name = en

    # cone.app admin user and password
    cone.admin_user = admin
    cone.admin_password = admin

    # cone.app auth tkt settings
    cone.auth_secret = 12345
    #cone.auth_cookie_name =
    #cone.auth_secure =
    #cone.auth_include_ip =
    #cone.auth_timeout =
    #cone.auth_reissue_time =
    #cone.auth_max_age =
    #cone.auth_http_only =
    #cone.auth_path =
    #cone.auth_wild_domain =
    #cone.auth_impl =

    # plugins to be loaded
    cone.plugins = cone.example

    # application root node settings
    cone.root.title = cone.example
    cone.root.default_child = example
    #cone.root.default_content_tile = 
    #cone.root.mainmenu_empty_title = false

    [pipeline:main]
    pipeline =
        example
