=========================
Application Configuration
=========================

``cone.app`` uses `PasteDeploy <http://pastedeploy.readthedocs.io/en/latest/>`_ for application
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

- **cone.authenticator**: Utility registration name of a
  ``cone.app.interfaces.IAuthenticator`` impementation.


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


User and Group Management Backend Configuration
-----------------------------------------------

In ``cone.app``, providing a User and Group database is done by using a concrete
`User and Group Management (UGM) <http://pypi.python.org/pypi/node.ext.ugm>`_
implementation.

If desired, the concrete UGM implementation is created on application startup.

- **ugm.backend**: Registration name of UGM implementation.

A default file based UGM factory is registered under name ``file``, which
creates a ``cone.ugm.file.Ugm`` instance.

Configuration is done through the following parameters.

- **ugm.users_file**: Path to users file

- **ugm.groups_file**: Path to groups file

- **ugm.roles_file**: Path to roles file

- **ugm.datadir**: Path to userdata directory

- **ugm.user_expires_attr**: Name of the attribute used to store account
      expiration information.

NOTE: If no UGM backend is configured, the only available user in the
      application is the one defined as ``cone.admin_user``.


Main Template
-------------

The main template can be set in the application configuration file.

- **cone.main_template**: Main template to use.


Available Languages
-------------------

If it's desired to allow the user to change UI language on the fly, define
available languages in configuration file.

- **cone.available_languages**: Comma separated list of available languages.

If available languages are defined, a language selection dropdown menu gets
displayed in the mainmenu.


Plugin Loading
--------------

Application Plugins needs to be defined in the application configuration in
order to be included. Plugins are included in defined order.

First the :ref:`ZCML <plugin_zcml>` configuration of all Plugins is invoked.
Then all :ref:`Plugin main hook functions <plugin_main_hook>` are called.

- **cone.plugins**: List of plugin package names.


Application Root
----------------

By default, a ``cone.app.model.AppRoot`` node is created as root node.
This node contains ``cone.app.model.AppSettings`` at ``settings`` key.

Some aspects of the default root node can be configured in the application
configuration file.

- **cone.root.title**: Title of the application.

- **cone.root.default_child**: Key of the default child which should be
  displayed instead of root node when accessing root URL.

- **cone.root.default_content_tile**: Default content tile for root node.

- **cone.root.mainmenu_empty_title**: Flag whether to suppress rendering main
  menu titles.

Root node creation can be customized. Therefor a factory must be defined.

- **cone.root.node_factory**: Import path of the factory function

This factory gets passed the settings dict as argument and returns an
``IApplicationNode`` implementing instance. If it's desired to consider the
root node properties above on the custom root object, call
``cone.app.configure_root`` with the root node and the settings dict as
arguments.
