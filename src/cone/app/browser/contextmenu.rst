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
    >>> request.environ['action_context'] = \
    ...     ActionContext(model, request, 'content')
    >>> rendered = render_tile(model, request, 'contextmenu')
    
    >>> rendered.find('up16_16') > -1
    True
    
    >>> rendered.find('view16_16') > -1
    True
    
    >>> rendered.find('listing16_16') > -1
    True
    
    >>> rendered.find('edit16_16') > -1
    True
    
    >>> rendered.find('delete16_16') > -1
    True
    
    >>> rendered.find('sharing16_16') > -1
    True
    
    >>> from cone.app.testing.mock import CopySupportNode
    >>> model = CopySupportNode()
    >>> request.environ['action_context'] = \
    ...     ActionContext(model, request, 'listing')
    >>> rendered = render_tile(model, request, 'contextmenu')
    >>> rendered.find('cut16_16') > -1
    True
    
    >>> rendered.find('copy16_16') > -1
    True
    
    >>> rendered.find('paste16_16') > -1
    True
    
    >>> layer.logout()
