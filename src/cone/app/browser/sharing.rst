Imports::

    >>> from plumber import plumber
    >>> from node.parts import (
    ...     Adopt,
    ...     Nodespaces,
    ...     Attributes,
    ...     Nodify,
    ...     OdictStorage,
    ...     DefaultInit,
    ... )
    >>> from node.utils import instance_property
    >>> from cone.tile import render_tile
    >>> from cone.app.model import AppNode
    >>> from cone.app.security import (
    ...     PrincipalACL,
    ...     DEFAULT_ACL,
    ... )

Dummy node for tests::

    >>> class SharingNode(object):
    ...    __metaclass__ = plumber
    ...    __plumbing__ = (
    ...        PrincipalACL,
    ...        AppNode,
    ...        Adopt,
    ...        Nodespaces,
    ...        Attributes,
    ...        DefaultInit,
    ...        Nodify,
    ...        OdictStorage,
    ...    )
    ...    @property
    ...    def __acl__(self):
    ...        return DEFAULT_ACL
    ...    @instance_property
    ...    def principal_roles(self):
    ...        return dict()

Create model root::

    >>> root = SharingNode('root')
    >>> root
    <SharingNode object 'root' at ...>

Render sharing tile::

    >>> layer.login('manager')
    
    >>> request = layer.new_request()
    >>> res = render_tile(root, request, 'sharing')
    >>> res.find('Sharing for root') > -1
    True

Render sharing tile with search term.
XXX: node.ext.ugm.file search implementations::
    >>> request.params['term'] = 'manager'
    >>> res = render_tile(root, request, 'sharing')

    >> res

Existing principal roles are not rendered if term found on request::

    >>> root.principal_roles['viewer'] = ['editor']
    >>> res = render_tile(root, request, 'sharing')
    >>> expected = '<input checked="checked" ' + \
    ...     'class="add_remove_role_for_principal" ' +\
    ...     'id="input-viewer" name="viewer" type="checkbox" value="editor" />'
    >>> res.find(expected) > -1
    False

Existing principal roles are rendered if no term found::

    >>> del request.params['term']
    >>> res = render_tile(root, request, 'sharing')
    >>> res.find(expected) > -1
    True

Inherited principal roles::

    >>> child = root['child'] = SharingNode()
    >>> child.role_inheritance = True
    >>> child.principal_roles['viewer'] = ['admin']
    >>> res = render_tile(child, request, 'sharing')
    >>> expected = '<input checked="checked" ' +\
    ...     'class="add_remove_role_for_principal" disabled="disabled" ' +\
    ...     'id="input-viewer" name="viewer" type="checkbox" value="editor" />'
    >>> res.find(expected) > -1
    True
    
    >>> expected = '<input checked="checked" ' +\
    ...     'class="add_remove_role_for_principal" id="input-viewer" ' +\
    ...     'name="viewer" type="checkbox" value="admin" />'
    >>> res.find(expected) > -1
    True
    
    >>> expected = '<input class="add_remove_role_for_principal" ' +\
    ...     'id="input-viewer" name="viewer" type="checkbox" ' +\
    ...     'value="manager" />'
    >>> res.find(expected) > -1
    True

Sharing table sorting::

    >>> child.principal_roles['editor'] = ['admin']
    >>> res = render_tile(child, request, 'sharing')
    >>> res.find('Editor User') > res.find('Viewer User')
    True
    
    >>> request.params['order'] = 'desc'
    >>> res = render_tile(child, request, 'sharing')
    >>> res.find('Editor User') > res.find('Viewer User')
    False
    
    >>> del request.params['order']

Users defined in ``principal_roles`` but not exists in ugm are skipped. This
could happen if user was deleted but principal roles were not::

    >>> child.principal_roles['inexistent'] = ['viewer']
    >>> res = render_tile(child, request, 'sharing')
    >>> res.find('name="inexistent"') > -1
    False
    
    >>> layer.logout()