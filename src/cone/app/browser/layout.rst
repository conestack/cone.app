cone.app layout
===============


Default Layout
--------------

To change the default layout, change the main template::

    >>> import cone.app
    >>> cone.app.cfg.main_template
    '...'

    >>> main = 'cone.app.testing:dummy_main.pt'
    >>> cone.app.cfg.main_template = main

An unprotected tile named 'content' registered for all sorts of node::

    >>> from cone.tile import registerTile
    >>> from cone.tile import tile
    >>> from cone.tile import Tile

    >>> @tile('content', permission='login')
    ... class ContentTile(Tile):
    ...     def render(self):
    ...         return '<div>Content</div>'

Dummy environ::

    >>> from cone.app.model import BaseNode
    >>> request = layer.new_request()
    >>> model = BaseNode()

Render main template. The function accepts an optional ``contenttile``
argument. if omitted, reserved name 'content' is used::

    >>> from cone.app.browser import render_main_template
    >>> res = render_main_template(model, request)
    >>> res.body
    '<!DOCTYPE html...<div>Content</div>...</html>'

    >>> registerTile('othername', class_=ContentTile, permission='login')
    >>> res = render_main_template(model, request, contenttile='othername')
    >>> res.body
    '<!DOCTYPE html...<div>Content</div>...</html>'

Switch back to default main template::

    >>> main = 'cone.app.browser:templates/main.pt'
    >>> cone.app.cfg.main_template = main

Non authenticated users only gets unprotected content tile, no controls like
navtree, mainmenu, etc::

    >>> res = render_main_template(model, request, contenttile='othername')
    >>> res.body.find('id="mainmenu"') > -1
    False

    >>> res.body.find('id="navtree"') > -1
    False

    >>> res.body.find('id="personaltools"') > -1
    False

    >>> res.body.find('<div>Content</div>') > -1
    True

Authenticate non privileged::

    >>> layer.login('max')
    >>> request = layer.new_request()

All tiles protected by 'view' permission are now available to the user::

    >>> res = render_main_template(model, request, contenttile='othername')
    >>> res.body.find('id="mainmenu"') > -1
    True

    >>> res.body.find('id="navtree"') > -1
    True

    >>> res.body.find('id="personaltools"') > -1
    True


Protected content tile
----------------------

A login form should be rendered instead of the content for anonymous users.

Class ``cone.app.browser.layout.ProtectedContentTile`` provides this behavior::

    >>> import cone.app.browser.login
    >>> from cone.app.browser.layout import ProtectedContentTile
    >>> class ProtectedContent(ProtectedContentTile):
    ...     def render(self):
    ...         return '<div>Content</div>'

    >>> class ProtectedModel(BaseNode): pass

    >>> registerTile('content',
    ...              interface=ProtectedModel,
    ...              class_=ProtectedContent,
    ...              permission='login')

Render protected tile.::

    >>> from cone.tile import render_tile

    >>> layer.logout()
    >>> request = layer.new_request()
    >>> render_tile(ProtectedModel(), request, 'content')
    u'<form action="http://example.com/login" 
    class="form-horizontal" 
    enctype="multipart/form-data" id="form-loginform" method="post" 
    novalidate="novalidate">...'

    >>> layer.login('max')
    >>> result = render_tile(ProtectedModel(), request, 'content')
    >>> result.find('<div>Content</div>') > -1
    True

    >>> layer.logout()


Main menu
---------

::

    >>> root = BaseNode()
    >>> root['1'] = BaseNode()
    >>> root['2'] = BaseNode()

Render main menu at root.

Unauthorized::

    >>> res = render_tile(root, request, 'mainmenu')
    >>> res.find('href="http://example.com/1"') > -1
    False

    >>> res.find('href="http://example.com/2"') > -1
    False

Authorized::

    >>> layer.login('max')
    >>> res = render_tile(root, request, 'mainmenu')
    >>> res.find('ajax:target="http://example.com/1"') > -1
    True

    >>> res.find('ajax:target="http://example.com/2"') > -1
    True

    >>> res.find('href="http://example.com/1"') > -1
    True

    >>> res.find('href="http://example.com/2"') > -1
    True

Render main menu at child. Child is marked selected::

    >>> res = render_tile(root['1'], request, 'mainmenu')
    >>> res.find('<li class="active node-1">') > -1
    True

Render main menu with default child::

    >>> model = BaseNode()
    >>> model['1'] = BaseNode()
    >>> model['2'] = BaseNode()
    >>> model.properties.default_child = '2'
    >>> res = render_tile(model, request, 'mainmenu')
    >>> res.find('<li class="active node-2">') > -1
    True

Render main menu on child '1' and check if '2' is unselected now::

    >>> res = render_tile(model['1'], request, 'mainmenu')
    >>> res.find('<li class="active node-2">') > -1
    False

    >>> res.find('<li class="active node-1">') > -1
    True

Check rendering of main menu with empty title. This is needed if main menu
items are supposed to be displayed as icons via CSS::

    >>> model.properties.mainmenu_empty_title = True
    >>> res = render_tile(model, request, 'mainmenu')
    >>> res
    u'...<li class=" node-1">\n\n        
    <a href="http://example.com/1"\n           
    title="1"\n          
    ajax:bind="click"\n           
    ajax:target="http://example.com/1"\n           
    ajax:event="contextchanged:#layout"\n          
    ajax:path="href"\n          
    ><span class="glyphicon glyphicon-asterisk"></span>\n          
    <span></span></a>\n\n      
    </li>\n\n      \n      \n\n    \n\n      \n      
    <li class="active node-2">\n\n        
    <a href="http://example.com/2"\n           
    title="2"\n          
    ajax:bind="click"\n           
    ajax:target="http://example.com/2"\n           
    ajax:event="contextchanged:#layout"\n           
    ajax:path="href"\n           
    ><span class="glyphicon glyphicon-asterisk"></span>\n          
    <span></span></a>\n\n      
    </li>...'

Child nodes which do not grant permission 'view' are skipped::

    >>> from cone.app.security import DEFAULT_SETTINGS_ACL
    >>> class InvisibleNode(BaseNode):
    ...     __acl__ =  DEFAULT_SETTINGS_ACL

    >>> model['3'] = InvisibleNode()
    >>> res = render_tile(model, request, 'mainmenu')
    >>> res.find('<li class=" node-3">') > -1
    False

    >>> layer.login('manager')
    >>> request = layer.current_request

    >>> res = render_tile(model, request, 'mainmenu')
    >>> res.find('<li class=" node-3">') > -1
    True

    >>> layer.logout()


Navtree
-------

Test navigation tree tile.

Unauthorized::

    >>> request = layer.new_request()
    >>> res = render_tile(root, request, 'navtree')
    >>> res.find('id="navtree"') != -1
    False

Empty navtree, no items are marked to be displayed::

    >>> layer.login('max')
    >>> res = render_tile(root, request, 'navtree')
    >>> res.find('id="navtree"') != -1
    True

    >>> res.find('ajax:bind="contextchanged"') != -1
    True

    >>> res.find('ajax:action="navtree:#navtree:replace"') != -1
    True

    >>> res.find('class="contextsensitiv list-group"') != -1
    True

Node's which are in navtree::

    >>> root = BaseNode()
    >>> root.properties.in_navtree = True
    >>> root['1'] = BaseNode()
    >>> root['1']['11'] = BaseNode()
    >>> root['1']['11'].properties.in_navtree = True
    >>> root['1'].properties.in_navtree = True
    >>> root['2'] = BaseNode()
    >>> root['2'].properties.in_navtree = True

``in_navtree`` is read from ``node.properties`` and defines display UI contract
with the navtree tile::

    >>> res = render_tile(root, request, 'navtree')
    >>> res.find('ajax:target="http://example.com/1"') > -1
    True

Render navtree on ``root['1']``, must be selected::

    >>> res = render_tile(root['1'], request, 'navtree')
    >>> res
    u'...<li class="active navtreelevel_1">\n\n      
    <a href="http://example.com/1"\n         
    ajax:bind="click"\n         
    ajax:target="http://example.com/1"\n         
    ajax:event="contextchanged:#layout"\n        
    ajax:path="href">\n        
    <i class="glyphicon glyphicon-asterisk" alt="..."></i>\n        1\n      
    </a>...'

Child nodes which do not grant permission 'view' are skipped::

    >>> class InvisibleNavNode(BaseNode):
    ...     __acl__ =  DEFAULT_SETTINGS_ACL

    >>> root['3'] = InvisibleNavNode()
    >>> root['3'].properties.in_navtree = True
    >>> res = render_tile(root, request, 'navtree')
    >>> res.find('ajax:target="http://example.com/3"') > -1
    False

    >>> layer.login('manager')
    >>> res = render_tile(root, request, 'navtree')
    >>> res.find('ajax:target="http://example.com/3"') > -1
    True

Default child behavior of navtree. Default children objects are displayed in 
navtree.::

    >>> root.properties.default_child = '1'
    >>> res = render_tile(root, request, 'navtree')
    >>> res
    u'...<li class="active navtreelevel_1">\n\n      
    <a href="http://example.com/1"\n         
    ajax:bind="click"\n         
    ajax:target="http://example.com/1"\n         
    ajax:event="contextchanged:#layout"\n        
    ajax:path="href">\n        
    <i class="glyphicon glyphicon-asterisk" alt="..."></i>\n        1\n      
    </a>...'

    >>> res = render_tile(root['1'], request, 'navtree')
    >>> res
    u'...<li class="active navtreelevel_1">\n\n      
    <a href="http://example.com/1"\n         
    ajax:bind="click"\n         
    ajax:target="http://example.com/1"\n         
    ajax:event="contextchanged:#layout"\n        
    ajax:path="href">\n        
    <i class="glyphicon glyphicon-asterisk" alt="..."></i>\n        1\n      
    </a>...'

If default child should not be displayed it navtree,
``node.properties.hide_if_default`` must be set to 'True'::

    >>> root['1'].properties.hide_if_default = True

In this case, also children context gets switched. Instead of remaining non
default children, children of default node are displayed.::

    >>> res = render_tile(root, request, 'navtree')
    >>> res.find('ajax:target="http://example.com/1"') > -1
    False

    >>> res.find('ajax:target="http://example.com/2"') > -1
    False

    >>> res.find('ajax:target="http://example.com/1/11"') > -1
    True

Check whether children subrendering works on nodes which have set
``hide_if_default``::

    >>> root['1']['11']['a'] = BaseNode()
    >>> root['1']['11']['a'].properties.in_navtree = True
    >>> root['1']['11']['a']['aa'] = BaseNode()
    >>> root['1']['11']['a']['aa'].properties.in_navtree = True
    >>> root['1']['11']['b'] = BaseNode()
    >>> root['1']['11']['b'].properties.in_navtree = True
    >>> root.printtree()
    <class 'cone.app.model.BaseNode'>: None
      <class 'cone.app.model.BaseNode'>: 1
        <class 'cone.app.model.BaseNode'>: 11
          <class 'cone.app.model.BaseNode'>: a
            <class 'cone.app.model.BaseNode'>: aa
          <class 'cone.app.model.BaseNode'>: b
      <class 'cone.app.model.BaseNode'>: 2
      <class 'InvisibleNavNode'>: 3

    >>> res = render_tile(root['1']['11'], request, 'navtree')
    >>> res.find('ajax:target="http://example.com/1/11/a"') > -1
    True

    >>> res.find('ajax:target="http://example.com/1/11/b"') > -1
    True

    >>> res = render_tile(root['1']['11']['a'], request, 'navtree')

    >>> res.find('ajax:target="http://example.com/1/11/a/aa"') > -1
    True

    >>> res = render_tile(root['1']['11']['a']['aa'], request, 'navtree')

    >>> res.find('ajax:target="http://example.com/1/11/a/aa"') > -1
    True

Render navtree on ``root['1']['11']``, check selected::

    >>> res = render_tile(root['1']['11'], request, 'navtree')
    >>> res
    u'...<li class="active navtreelevel_1">\n\n      
    <a href="http://example.com/1/11"\n         
    ajax:bind="click"\n         
    ajax:target="http://example.com/1/11"\n         
    ajax:event="contextchanged:#layout"\n        
    ajax:path="href">\n        
    <i class="glyphicon glyphicon-asterisk" alt="..."></i>\n        11\n      
    </a>...'

Nodes can be marked as navigation root::

    >>> from cone.app.browser.layout import NavTree

    >>> class TestNavTree(NavTree):
    ...     def __init__(self, model, request):
    ...         self.model = model
    ...         self.request = request

    >>> ignored_root = BaseNode(name='ignored_root')
    >>> ignored_root.properties.in_navtree = True
    >>> ignored_root['navroot'] = BaseNode()
    >>> ignored_root['navroot'].properties.in_navtree = True
    >>> ignored_root['navroot'].properties.is_navroot = True
    >>> ignored_root['navroot']['child_1'] = BaseNode()
    >>> ignored_root['navroot']['child_1'].properties.in_navtree = True
    >>> ignored_root['navroot']['child_2'] = BaseNode()
    >>> ignored_root['navroot']['child_2'].properties.in_navtree = True

    >>> navtree = TestNavTree(ignored_root['navroot'], request)
    >>> navtree.navroot
    <BaseNode object 'navroot' at ...>

    >>> len(navtree.navtree()['children'])
    2

    >>> layer.logout()


Personal Tools
--------------

Unauthorized::

    >>> request = layer.new_request()
    >>> res = render_tile(root, request, 'personaltools')
    >>> res.find('id="personaltools"') != -1
    False

Authorized::

    >>> layer.login('max')
    >>> res = render_tile(root, request, 'personaltools')
    >>> res.find('id="personaltools"') != -1
    True

    >>> res.find('href="http://example.com/logout"') != -1
    True

    >>> layer.logout()


Pathbar
-------

Unauthorized::

    >>> request = layer.new_request()
    >>> res = render_tile(root, request, 'pathbar')
    >>> res.find('pathbaritem') != -1
    False

    >>> layer.login('max')
    >>> res = render_tile(root['1'], request, 'pathbar')
    >>> res.find('id="pathbar"') != -1
    True

Default child behavior of pathbar::

    >>> root = BaseNode()
    >>> root['1'] = BaseNode()
    >>> root['2'] = BaseNode()

    >>> res = render_tile(root, request, 'pathbar')
    >>> res.find('<strong>Home</strong>') > -1
    True

    >>> res = render_tile(root['1'], request, 'pathbar')
    >>> res.find('>Home</a>') > -1
    True

    >>> res.find('<strong>1</strong>') > -1
    True

    >>> res = render_tile(root['2'], request, 'pathbar')
    >>> res.find('>Home</a>') > -1
    True

    >>> res.find('<strong>2</strong>') > -1
    True

    >>> root.properties.default_child = '1'
    >>> res = render_tile(root['1'], request, 'pathbar')
    >>> res.find('<strong>Home</strong>') > -1
    True

    >>> res.find('<strong>1</strong>') > -1
    False

    >>> res = render_tile(root['2'], request, 'pathbar')
    >>> res.find('>Home</a>') > -1
    True

    >>> res.find('<strong>2</strong>') > -1
    True

    >>> root['1'].properties.default_child = '12'
    >>> root['1']['11'] = BaseNode()
    >>> root['1']['12'] = BaseNode()
    >>> res = render_tile(root['1']['11'], request, 'pathbar')
    >>> res.find('<strong>11</strong>') > -1
    True

    >>> res = render_tile(root['1']['12'], request, 'pathbar')
    >>> res.find('<strong>Home</strong>') > -1
    True

    >>> layer.logout()


Byline
------

Byline renders ``model.metadata.creator``, `model.metadata.created`` and
`model.metadata.modified``::

    >>> from datetime import datetime
    >>> dt = datetime(2011, 3, 14)
    >>> root.metadata.created = dt
    >>> root.metadata.modified = dt
    >>> root.metadata.creator = 'max'

Unauthenticated::

    >>> request = layer.new_request()
    >>> res = render_tile(root, request, 'byline')
    >>> res
    u''

Authenticated::

    >>> layer.login('max')
    >>> res = render_tile(root, request, 'byline')
    >>> print res
    <BLANKLINE>
      <p class="byline">
        <span>Created by</span>:
        <strong>max</strong>,
        <span>on</span>
        <strong>14.03.2011 00:00</strong>.
        <span>Last modified</span>:
        <strong>14.03.2011 00:00</strong>
      </p>
    <BLANKLINE>

    >>> layer.logout()


Test default root content tile
------------------------------

::
    >>> from cone.app.model import AppRoot
    >>> root = AppRoot()
    >>> layer.login('max')
    >>> res = render_tile(root, request, 'content')
    >>> print res
    <div>
        Default Root
    </div>

    >>> root.factories['1'] = BaseNode
    >>> root.properties.default_child = '1'
    >>> res = render_tile(root, request, 'content')
    >>> print res
    <div>Content</div>

    >>> layer.logout()
