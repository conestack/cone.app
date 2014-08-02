Imports::

    >>> from cone.tile import render_tile
    >>> from cone.app.testing.mock import SharingNode

Create model root::

    >>> root = SharingNode('root')
    >>> root
    <SharingNode object 'root' at ...>

Render sharing tile::

    >>> layer.login('manager')

    >>> request = layer.new_request()

    >>> from cone.app.browser.actions import ActionContext
    >>> ac = ActionContext(root, request, 'content')

    >>> res = render_tile(root, request, 'sharing')

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

Add role for user::

    >>> from cone.app.browser.ajax import ajax_tile

    >>> request.params['id'] = 'viewer'
    >>> request.params['role'] = 'manager'
    >>> request.params['bdajax.action'] = 'add_principal_role'
    >>> request.params['bdajax.mode'] = 'NONE'
    >>> request.params['bdajax.selector'] = 'NONE'

Nothing happens if success::

    >>> ajax_tile(child, request)
    {'continuation': False, 
    'payload': u'', 
    'mode': 'NONE', 
    'selector': 'NONE'}

Principal roles has changed::

    >>> child.principal_roles
    {'viewer': ['admin', 'manager'], 
    'inexistent': ['viewer'], 
    'editor': ['admin']}

Add role for user not added yet::

    >>> request.params['id'] = 'otheruser'
    >>> request.params['role'] = 'manager'
    >>> ajax_tile(child, request)
    {'continuation': False, 
    'payload': u'', 
    'mode': 'NONE', 
    'selector': 'NONE'}

    >>> child.principal_roles
    {'viewer': ['admin', 'manager'], 
    'inexistent': ['viewer'], 
    'editor': ['admin'], 
    'otheruser': ['manager']}

If an error occurs, a message gets displayed::

    >>> from cone.app.model import BaseNode
    >>> invalid_node = BaseNode()
    >>> request.params['id'] = 'viewer'
    >>> ajax_tile(invalid_node, request)
    {'continuation': 
    [{'flavor': 'error', 
    'type': 'message', 
    'payload': u"Can not add role 'manager' for principal 'viewer'", 
    'selector': None}], 
    'payload': u'', 
    'mode': 'NONE', 
    'selector': 'NONE'}

Remove role for user::

    >>> request = layer.new_request()
    >>> request.params['id'] = 'viewer'
    >>> request.params['role'] = 'manager'
    >>> request.params['bdajax.action'] = 'remove_principal_role'
    >>> request.params['bdajax.mode'] = 'NONE'
    >>> request.params['bdajax.selector'] = 'NONE'

Nothing happens if success::

    >>> ajax_tile(child, request)
    {'continuation': False, 
    'payload': u'', 
    'mode': 'NONE', 
    'selector': 'NONE'}

Principal roles has changed::

    >>> child.principal_roles
    {'viewer': ['admin'], 
    'inexistent': ['viewer'], 
    'editor': ['admin'], 
    'otheruser': ['manager']}

Principal id gets removed if no more roles left::

    >>> request.params['id'] = 'otheruser'
    >>> request.params['role'] = 'manager'
    >>> ajax_tile(child, request)
    {'continuation': False, 
    'payload': u'', 
    'mode': 'NONE', 
    'selector': 'NONE'}

    >>> child.principal_roles
    {'viewer': ['admin'], 
    'inexistent': ['viewer'], 
    'editor': ['admin']}

If an error occurs, a message gets displayed.
Inexistent role::

    >>> request.params['id'] = 'viewer'
    >>> request.params['role'] = 'inexistent'
    >>> ajax_tile(child, request)
    {'continuation': 
    [{'flavor': 'error', 
    'type': 'message', 
    'payload': u"Can not remove role 'inexistent' for principal 'viewer'", 
    'selector': None}], 
    'payload': u'', 
    'mode': 'NONE', 
    'selector': 'NONE'}

Inexistent userid::

    >>> request = layer.new_request()
    >>> request.params['id'] = 'foo'
    >>> request.params['role'] = 'manager'
    >>> request.params['bdajax.action'] = 'remove_principal_role'
    >>> request.params['bdajax.mode'] = 'NONE'
    >>> request.params['bdajax.selector'] = 'NONE'
    >>> ajax_tile(child, request)
    {'continuation': 
    [{'flavor': 'error', 
    'type': 'message', 
    'payload': u"Can not remove role 'manager' for principal 'foo'", 
    'selector': None}], 
    'payload': u'', 
    'mode': 'NONE', 
    'selector': 'NONE'}

    >>> layer.logout()
