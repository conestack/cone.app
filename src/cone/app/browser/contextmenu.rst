ContextMenu
-----------
::
    >>> layer.login('manager')

    >>> from cone.tile import render_tile
    >>> from cone.app.model import BaseNode
    >>> from cone.app.testing.mock import SharingNode

    >>> parent = BaseNode('root')
    >>> model = parent['model'] = SharingNode()
    >>> model.properties.action_up = True
    >>> model.properties.action_view = True
    >>> model.properties.action_list = True
    >>> model.properties.action_edit = True

    >>> model.properties.action_delete = True

    >> model.properties.action_delete_children = True

    >>> from cone.app.browser.actions import ActionContext

    >>> request = layer.new_request()

    >>> ac = ActionContext(model, request, 'content')

    >>> rendered = render_tile(model, request, 'contextmenu')

    >>> rendered.find('toolbaraction-up') > -1
    True

    >>> rendered.find('toolbaraction-view') > -1
    True

    >>> rendered.find('toolbaraction-list') > -1
    True

    >>> rendered.find('toolbaraction-edit') > -1
    True

    >>> rendered.find('toolbaraction-delete') > -1
    True

    >>> rendered.find('toolbaraction-share') > -1
    True

    >>> from cone.app.testing.mock import CopySupportNode

    >>> model = CopySupportNode()

    >>> ac = ActionContext(model, request, 'listing')

    >>> rendered = render_tile(model, request, 'contextmenu')
    >>> rendered.find('toolbaraction-cut') > -1
    True

    >>> rendered.find('toolbaraction-copy') > -1
    True

    >>> rendered.find('toolbaraction-paste') > -1
    True

    >>> layer.logout()
