=========
Workflows
=========

.. _workflows_defining_a_workflow:

Defining a Workflow
-------------------

``cone.app`` utilizes `repoze.workflow <http://docs.repoze.org/workflow>`_ for
state based workflows.

Workflows are described in ZCML files.

``repoze.workflow`` is wired to ``cone.app`` as follows:

- The ``content_types`` attribute in the ``workflow`` directive contains the
  nodes this workflow can be used for.

- The ``permission_checker`` attribute in the ``workflow`` directive points
  to ``cone.app.workflow.permission_checker``, which is used to check whether
  permissions are granted on model node.

- The ``callback`` attribute in ``transition`` directives points to
  ``cone.app.workflow.persist_state``, which is used to write the new state
  to the ``state`` attribute and persists the model node by calling it.

A typical publication workflow would end up in a file named
``publication.zcml`` looks like so.

.. code-block:: xml

    <configure xmlns="http://namespaces.repoze.org/bfg"
           xmlns:i18n="http://xml.zope.org/namespaces/i18n"
           i18n:domain="cone.example">

      <include package="repoze.workflow" file="meta.zcml"/>

      <workflow type="publication"
                name="Publication workflow"
                state_attr="state"
                initial_state="draft"
                content_types="cone.example.model.ExampleNode
                               cone.example.model.AnotherNode"
                permission_checker="cone.app.workflow.permission_checker">

        <state name="draft"
               title="Draft"
               i18n:attributes="name">
          <key name="description" value="Item is not visible to the public" />
        </state>

        <state name="published"
               title="Published"
               i18n:attributes="name">
          <key name="description" value="Item is visible to the public" />
        </state>

        <state name="declined"
               title="Declined"
               i18n:attributes="name">
          <key name="description" value="Item has been declined" />
        </state>

        <transition
           name="draft_2_published"
           callback="cone.app.workflow.persist_state"
           from_state="draft"
           to_state="published"
           permission="change_state"
           i18n:attributes="name" />

        <transition
           name="draft_2_declined"
           callback="cone.app.workflow.persist_state"
           from_state="draft"
           to_state="declined"
           permission="change_state"
           i18n:attributes="name" />

        <transition
           name="published_2_draft"
           callback="cone.app.workflow.persist_state"
           from_state="published"
           to_state="draft"
           permission="change_state"
           i18n:attributes="name" />

        <transition
           name="published_2_declined"
           callback="cone.app.workflow.persist_state"
           from_state="published"
           to_state="declined"
           permission="change_state"
           i18n:attributes="name" />

        <transition
           name="declined_2_draft"
           callback="cone.app.workflow.persist_state"
           from_state="declined"
           to_state="draft"
           permission="change_state"
           i18n:attributes="name" />

        <transition
           name="declined_2_published"
           callback="cone.app.workflow.persist_state"
           from_state="declined"
           to_state="published"
           permission="change_state"
           i18n:attributes="name" />

      </workflow>

    </configure>

In order to load the workflow it must be included in the plugin
``configure.zcml``.

.. code-block:: xml

    <?xml version="1.0" encoding="utf-8" ?>
    <configure xmlns="http://pylonshq.com/pyramid">

      <include file="publication.zcml" />

    </configure>


Using a Workflow
----------------

To use workflows on application model nodes, two plumbing behaviors are
provided.


WorkflowState
~~~~~~~~~~~~~

The ``cone.app.workflow.WorkflowState`` plumbing behavior extends the model
node by the ``state`` property which reads and writes the workflow state to
``node.attrs['state']`` by default.

Further it plumbs to the ``__init__`` function to initialize the workflow on
node instanciation time.

The ``copy`` function also gets plumbed to set initial state for copy of node
and all children of it implementing ``cone.app.interfaces.IWorkflowState``.

A model node plumbed by ``WorkflowState`` must provide the name of the workflow
it uses at ``workflow_name`` which refers to the ``type`` attribute of the
``workflow`` directive in the workflow ZCML file.

A translation string factory can be provided via ``workflow_tsf`` property in
order to provide translations for the workflow.


WorkflowACL
~~~~~~~~~~~

The ``cone.app.workflow.WorkflowACL`` plumbing behavior extends the model by
the ``__acl__`` property. This property first tries to lookup an explicitly
defined ACL for current workflow state. If no ACL for state is found, the ACL
defined in ``default_acl`` is returned. This ACL permits ``change_state`` for
roles ``owner`` and ``manager`` by default.

Workflow related states are expected at ``state_acls`` property.


Integrating the Workflow
~~~~~~~~~~~~~~~~~~~~~~~~

An implementation integrating the publication workflow as described in
:ref:`Defining a Workflow <workflows_defining_a_workflow>` looks like so.

.. code-block:: python

    from cone.app.model import BaseNode
    from cone.app.workflow import WorkflowACL
    from cone.app.workflow import WorkflowState
    from plumber import plumbing
    from pyramid.i18n import TranslationStringFactory
    from pyramid.security import ALL_PERMISSIONS
    from pyramid.security import Allow
    from pyramid.security import Deny
    from pyramid.security import Everyone

    # translation string factory used for workflow translations
    _ = TranslationStringFactory('cone.example')

    # user role related permission sets
    authenticated_permissions = ['view']
    viewer_permissions = authenticated_permissions + ['list']
    editor_permissions = viewer_permissions + ['add', 'edit']
    admin_permissions = editor_permissions + ['delete', 'change_state']
    manager_permissions = admin_permissions + ['manage']

    # state ACLs for authenticated users
    authenticated_state_acls = [
        (Allow, 'system.Authenticated', authenticated_permissions),
        (Allow, 'role:viewer', viewer_permissions),
        (Allow, 'role:editor', editor_permissions),
        (Allow, 'role:admin', admin_permissions),
        (Allow, 'role:manager', manager_permissions)
    ]

    # publication workflow state related ACL's
    publication_state_acls = dict()
    publication_state_acls['draft'] = authenticated_state_acls + [
        (Allow, Everyone, ['login']),
        (Deny, Everyone, ALL_PERMISSIONS),
    ]
    publication_state_acls['published'] = authenticated_state_acls + [
        (Allow, Everyone, ['login', 'view']),
        (Deny, Everyone, ALL_PERMISSIONS),
    ]
    publication_state_acls['declined'] = authenticated_state_acls + [
        (Allow, Everyone, ['login']),
        (Deny, Everyone, ALL_PERMISSIONS),
    ]

    @plumbing(WorkflowState, WorkflowACL)
    class ExampleNode(BaseNode):
        """Application model node using the publication workflow.
        """
        # workflow registration name
        workflow_name = 'publication'
        # translation string factory used to translate workflow
        workflow_tsf = _
        # workflow state specific ACL's
        state_acls = publication_state_acls
