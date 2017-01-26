========
Security
========

``cone.app`` uses the security mechanism of
`Pyramid <http://docs.pylonsproject.org/projects/pyramid/en/latest/narr/security.html>`_
for managing access to parts of the application.

Similar to `Zope <https://zope.org>`_, security rules are implemented as a
cascade of ``roles``, where each role defines a set of ``permissions``. A
``user`` or a ``group`` of users are then assigned to this roles.

For retrieval of users, groups and the assigned roles, ``node.ext.ugm`` is
used. A UGM instance is created in the
:ref:`Plugin main hook function <plugin_main_hook>` and set to
``cone.app.cfg.auth``.

As authentication policy ``pyramid.authentication.AuthTktAuthenticationPolicy``
is used. ``cone.app`` passes the ``cone.app.security.groups_callback`` to the
authentication policy which bridges roles to users and groups.

Authorization is implemented by Access Control Lists. As authorization policy
``pyramid.authorization.ACLAuthorizationPolicy`` is used. Security declaration
on application model nodes is provided by the ``__acl__`` property, which is
expected by the authorization policy and described in the
``cone.app.interfaces.ISecured`` interface.

If no UGM implementation is registered, the only user which can authenticate is
the admin user defined in application configuration ``.ini`` file.

By default, unauthenticed access to all application model nodes is prohibited.


Permissions
-----------

The permissions used by default in ``cone.app`` are:

- **view**: Grants access to view an application model node.

- **list**: Grants access to list the application model node children.

- **add**: Grants access to add an application model node.

- **edit**: Grants access to edit an application model node.

- **delete**: Grants access to delete an application model node.

- **cut**: Grants access to cut an application model node.

- **copy**: Grants access to copy an application model node.

- **paste**: Grants access to paste an application model node to a container.

- **manage_permissions**: Grants access to grant access to application model
  nodes and it's children.

- **change_state**: Grants access to change workflow state of an application
  model node.

- **manage**: Grants access to manage application settings.

- **login**: Grants access to login to the application.


.. _security_roles:

Roles
-----

The roles which come out of the box with ``cone.app`` are:

- **authenticated**: Every authenticated user. By default, permissions assigned
  to this role are ``view``.

- **viewer**: This role is supposed to grant users permissions needed to
  view addidional information the default ``authenticated`` role forbids. By
  default, permissions assigned to this role are ``authenticated`` role
  permissions and ``list``.

- **editor**: This role is supposed to grant users permissions needed to
  add and edit application model nodes. By default, permissions assigned to
  this role are ``viewer`` role permissions and ``add`` and ``edit``.

- **admin**: This role is supposed to grant users permissions to duplicate
  model nodes, change the workflow state or grant access to parts of the
  application model to other uses. By default, permissions assigned to
  this role are ``editor`` role permissions and ``delete``, ``cut``, ``copy``,
  ``paste``, ``manage_permissions`` and ``change_state``.

- **manager**: This role is supposed to grant users permissions to access and
  modify the application settings. By default, permissions assigned to this
  role are ``admin`` role permissions and ``manage``.

- **owner**: This is a special role which takes effect if an application model
  node provides ``cone.app.interfaces.IOwnerSupport``. This role is added to
  the related model node ACL if the current authenticated user is the creator
  of the model node. By default an ``owner`` gets the same permissions granted
  as the ``admin`` role.

- **everyone**: Every visitor of the application, authenticated or not. By
  default the only permission granted to ``everyone`` is ``login``.


Access Control Lists
--------------------

The default permission sets for the roles described above are defined in
``cone.app.security.DEFAULT_ACL``.

The plumbing behavior ``cone.app.model.AppNode`` already provides the
``__acl__`` property which always returns the ``DEFAULT_ACL`` if no ACL is
:ref:`registered <security_acl_registry>` for the this application model node.

If it's desired to globally change the default permission sets for the whole
application the ``DEFAULT_ACL`` must be overwritten.

ACLs can also be defined by overriding the ``__acl__`` property of the
application node.

.. code-block:: python

    from cone.app.model import BaseNode
    from pyramid.security import ALL_PERMISSIONS
    from pyramid.security import Allow
    from pyramid.security import Deny
    from pyramid.security import Everyone

    class ExampleNode(BaseNode):

        @property
        def __acl__(self):
            return [
                (Allow, 'role:manager', ['view', 'manage']),
                (Allow, Everyone, 'login'),
                (Deny, Everyone, ALL_PERMISSIONS)
            ]


.. _security_acl_registry:

ALC Registry
------------

A less immersive way for providing ACLs for model nodes is to use the
ALC registry. The plumbing behavior ``cone.app.model.AppNode`` only returns
the ``cone.app.security.DEFAULT_ACL`` if no dedicated ALC for this node has
been registered in the registry.

Registering a custom ACL for application root which grants view access to the
application root model node for unauthenticated uses kools like so:

.. code-block:: python

    from cone.app.model import AppRoot
    from cone.app.security import acl_registry
    from pyramid.security import ALL_PERMISSIONS
    from pyramid.security import Allow
    from pyramid.security import Deny
    from pyramid.security import Everyone

    # permission sets
    authenticated_permissions = ['view']
    viewer_permissions = authenticated_permissions + ['list']
    editor_permissions = viewer_permissions + ['add', 'edit']
    admin_permissions = editor_permissions + [
        'delete', 'cut', 'copy', 'paste', 'change_state',
    ]
    manager_permissions = admin_permissions + ['manage']
    everyone_permissions = ['login', 'view']

    # custom ACL
    custom_acl = [
        (Allow, 'system.Authenticated', authenticated_permissions),
        (Allow, 'role:viewer', viewer_permissions),
        (Allow, 'role:editor', editor_permissions),
        (Allow, 'role:admin', admin_permissions),
        (Allow, 'role:manager',  manager_permissions),
        (Allow, Everyone, everyone_permissions),
        (Deny, Everyone, ALL_PERMISSIONS),
    ]

    acl_registry.register(custom_acl, AppRoot)

``cone.app.model.AppNode.__acl__`` tries to find a registered ALC by
``self.__class__`` and ``self.node_info_name``, thus application nodes must be
registered by both.

.. code-block:: python

    from cone.app.model import BaseNode
    from cone.app.model import node_info

    @node_info(name='example')
    class ExampleNode(BaseNode):
        pass

    acl_registry.register(
        example_acl,
        obj=ExampleNode,
        node_info_name='example'
    )


Owner Support
-------------

As described in :ref:`Roles section <security_roles>`, a special role ``owner``
exists which provides dedicated permissions for the current authenticated user
on application model nodes.

Owner support for application model nodes is implemented as plumbing behavior
and must be enabled explicitely for every application model node by applying
this behavior.

The ``cone.app.security.OwnerSupport`` behavior extends the model node by an
``owner`` attribute, hooks up to the ``__init__`` function where ``self.owner``
gets set to the current authenticated user id, and extends the ACL by ``owner``
ACE for the current user by hooking up to the ``__acl__`` property.

The owner attribute maps to ``self.attrs['owner']`` and must be
overwritten if owner persistence happens elsewhere.

.. code-block:: python

    from cone.app.model import BaseNode
    from cone.app.security import OwnerSupport
    from plumber import plumbing

    @plumbing(OwnerSupport)
    class ExampleNodeWithOwnerSupport(BaseNode):
        pass


Principal ACL
-------------

In many applications it's required to grant access for specific parts of the
application model to specific users and groups. ``cone.app`` ships with a
plumbing behavior providing principal related roles.

The ``cone.app.security.PrincipalACL`` behavior extends the model node by
the ``role_inheritance`` property, which is used to define whether principal
related ACL should be inherited from parent nodes and defaults to ``False``.

Further the behavior hooks up to the ``__acl__`` proptety where default model
node ACL gets extended by the principal related ACL.

The property ``principal_roles`` is a dict like mapping where keys represent
the principal id and values are a list of principal related roles. Since by
nature we know nothing about concrete persistence implementation it's up to the
integration providing this property properly.

The ``PrincipalACL`` relates to the ``sharing`` tile, which provides a user
interface for managing principal related permissions. The vocabulary defining
the available roles shown up in the sharing tile are defined at
``cone.app.security.DEFAULT_ROLES``.

A concrete shareable node looks like.

.. code-block:: python

    from cone.app.model import BaseNode
    from cone.app.security import PrincipalACL
    from plumber import plumbing

    @plumbing(PrincipalACL)
    class ExampleNodeWithPrincipalACL(BaseNode):
        role_inheritance = True

        @property
        def principal_roles(self):
            # this must be a persistent mapping between principal id and
            # list of roles
            return dict()
