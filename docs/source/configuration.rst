=========================
Application Configuration
=========================

``cone.app`` uses `PasteDeploy <pythonpaste.org/deploy>`_ for application
configuration. PasteDeploy defines a way to declare WSGI application
configuration in an ``.ini`` file.

Basic application and plugin configuration is done in the ``[app:]`` section
of the ``.ini`` file.

A complete list of Pyramid related Settings can be found in the
`Pyramid documentation <http://docs.pylonsproject.org/projects/pyramid/en/latest/narr/environment.html>`_

:doc:`Plugin <plugins>` configuration can also be implemented using the ``.ini``
file. The settings are passed to the
:ref:`Plugin main hook functions <plugin_main_hook>`.

Basic application related configuration parameters can be found below.


Static User and Password
------------------------

If no user database is desired, admin user and an admin password must be
defined.

It's recommended to avoid setting a global superuser via ini file for live
deployments.

- **cone.admin_user**: Login name of superuser.

- **cone.admin_password**: Password of superuser.


Authentication Policy Configuration
-----------------------------------

The application uses the
`AuthTktAuthenticationPolicy <http://docs.pylonsproject.org/projects/pyramid/en/latest/api/authentication.html#pyramid.authentication.AuthTktAuthenticationPolicy>`_.

The policy gets configured through the following parameters.

- **cone.auth_secret**: Cookie encryption password.

- **cone.auth_cookie_name**: Defaults to ``auth_tkt``. The name used for auth
  cookie.

- **cone.auth_secure**: Defaults to ``False``. Only send the cookie back over a
  secure connection.

- **cone.auth_include_ip**: Defaults to ``False``. Make the requesting IP
  address part of the authentication data in the cookie.

- **cone.auth_timeout**: Defaults to ``None``. Maximum number of seconds which
  a newly issued ticket will be considered valid.

- **cone.auth_reissue_time**: Defaults to ``None``. If this parameter is set,
  it represents the number of seconds that must pass before an authentication
  token cookie is reissued.

- **cone.auth_max_age**: Default to ``None``. The max age of the auth_tkt
  cookie, in seconds. This differs from ``timeout`` inasmuch as ``timeout``
  represents the lifetime of the ticket contained in the cookie, while this
  value represents the lifetime of the cookie itself.

- **cone.auth_http_only**: Defaults to ``False``. Hide cookie from JavaScript
  by setting the HttpOnly flag.

- **cone.auth_path**: Defaults to ``/``. The path for which the authentication
  cookie is valid.

- **cone.auth_wild_domain**: Defaults to ``True``. An authentication cookie
  will be generated for the wildcard domain.


User and Group Backend Configuration
------------------------------------

In ``cone.app``, providing a User and Group database is done by using a concrete
`User and Group Management (UGM) <http://pypi.python.org/pypi/node.ext.ugm>`_
implementation.

It is used for authentication and principal authorization. If not set, only
``cone.admin_user`` is available.

- **cone.auth_impl**: UGM implementation package name. Used for authentication
  and principal authorization. If not set, only ``cone.admin_user``is
  available. This setting is not considered at any place directly in ``cone.app``.
  This is left to the UGM implementation creating application hook callback.


Plugin Loading
--------------

Application Plugins needs to be defined in the application configuration in
order to be included. Plugins are included in defined order.

First the :ref:`ZCML <plugin_zcml>` configuration of all Plugins is invoked.
Then all :ref:`Plugin main hook functions <plugin_main_hook>` are called.


- **cone.plugins**: List of plugin package names.


Root Model Configuration
------------------------

Some aspects of the model root node can be set via the application
configuration file.

- **cone.root.title**: Title of the application.

- **cone.root.default_child**: Key of the default child which should be
  displayed instead of root model node when accessing root URL.

- **cone.root.default_content_tile**: Default content tile for root model node.

- **cone.root.mainmenu_empty_title**: Flag whether to suppress rendering main
  menu titles.
