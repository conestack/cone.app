cone.app layout
===============

Resources
---------

CSS and JS resources are currently defined in ``cone.app.cfg.css`` and 
``cone.app.cfg.js`` and rendered by 'resources' tile.

XXX: Use either resources providing middleware or resource management lib
     in application directly
     
CSS Resource::

    >>> import cone.app
    >>> cone.app.cfg.css
    <cone.app.model.Properties object at ...>
    
    >>> cone.app.cfg.css.keys()
    ['protected', 'public']

Contain CSS resources for authenticated users::

    >>> cone.app.cfg.css.protected
    [...'++resource++yafowil.widget.dict/widget.css'...]

Contain CSS resource for all users::

    >>> cone.app.cfg.css.public
    [...'static/style.css'...]

JS Resources::

    >>> cone.app.cfg.js
    <cone.app.model.Properties object at ...>
    
    >>> cone.app.cfg.js.keys()
    ['protected', 'public']

Contain CSS resources for authenticated users::

    >>> cone.app.cfg.js.protected
    [...'++resource++yafowil.widget.dict/widget.js'...]

Contain CSS resource for all users::

    >>> cone.app.cfg.js.public
    [...'static/cdn/jquery.min.js'...]

Render resources tile unauthorized::

    >>> from cone.tile import render_tile
    >>> request = layer.new_request()
    >>> result = render_tile(cone.app.root, request, 'resources')
    >>> result.find('static/style.css') > -1
    True
    
    >>> result.find('static/cdn/jquery.min.js') > -1
    True
    
    >>> result.find('++resource++yafowil.widget.dict/widget.css') > -1
    False
    
    >>> result.find('++resource++yafowil.widget.dict/widget.js') > -1
    False

Render resources tile authorized::

    >>> layer.login('max')
    >>> request = layer.new_request()
    
    >>> result = render_tile(cone.app.root, request, 'resources')
    >>> result.find('static/style.css') > -1
    True
    
    >>> result.find('static/cdn/jquery.min.js') > -1
    True
    
    >>> result.find('++resource++yafowil.widget.dict/widget.css') > -1
    True
    
    >>> result.find('++resource++yafowil.widget.dict/widget.js') > -1
    True
    
    >>> layer.logout()


Default Layout
--------------

To change the default layout, change the main template::

    >>> import cone.app
    >>> cone.app.cfg.main_template
    '...'
    
    >>> main = 'cone.app.tests:dummy_main.pt'
    >>> cone.app.cfg.main_template = main

An unprotected tile named 'content' registered for all sorts of node::

    >>> from cone.tile import registerTile, tile, Tile
    >>> @tile('content', permission='login')
    ... class ContentTile(Tile):
    ...     def render(self):
    ...         return '<div>Content</div>'

Dummy environ::

    >>> from cone.app.model import BaseNode
    >>> request = layer.new_request()
    >>> model = BaseNode()

Render main template. The function accepts an optional ``contenttilename``
argument. if omitted, reserved name 'content' is used::

    >>> from cone.app.browser import render_main_template
    >>> res = render_main_template(model, request)
    >>> res.body
    '<...
    <body>\n    <div>Content</div>\n  
    </body>\n</html>'

    >>> registerTile('othername', class_=ContentTile, permission='login')
    >>> res = render_main_template(model, request, contenttilename='othername')
    >>> res.body
    '<...
    <body>\n    <div>Content</div>\n  
    </body>\n</html>'

Switch back to default main template::

    >>> main = 'cone.app.browser:templates/main.pt'
    >>> cone.app.cfg.main_template = main

Reset possible layout changes from plugin for tests::

    >>> cone.app.cfg.layout.livesearch = True
    >>> cone.app.cfg.layout.personaltools = True
    >>> cone.app.cfg.layout.mainmenu = True
    >>> cone.app.cfg.layout.pathbar = True
    >>> cone.app.cfg.layout.sidebar_left = ['navtree']

Non authenticated users only gets unprotected content tile, no controls like
navtree, mainmenu, etc::

    >>> res = render_main_template(model, request, contenttilename='othername')
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

    >>> res = render_main_template(model, request, contenttilename='othername')
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

    >>> layer.logout()
    >>> request = layer.new_request()
    >>> render_tile(ProtectedModel(), request, 'content')
    u'<form action="http://example.com/login" 
    enctype="multipart/form-data" id="form-loginform" method="post" 
    novalidate="novalidate">...
    
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
    >>> res.find('href="http://example.com/1"') > -1
    True
    
    >>> res.find('href="http://example.com/2"') > -1
    True

Render main menu at child. Child is marked selected::

    >>> res = render_tile(root['1'], request, 'mainmenu')
    >>> res.find('class="first current_page_item mainmenulink"') > -1
    True

Render main menu with default child::

    >>> model = BaseNode()
    >>> model['1'] = BaseNode()
    >>> model['2'] = BaseNode()
    >>> model.properties.default_child = '2'
    >>> res = render_tile(model, request, 'mainmenu')
    >>> res.find('current_page_item mainmenulink">2</a>') > -1
    True

Render main menu on child '1' and check if '2' is unselected now::

    >>> res = render_tile(model['1'], request, 'mainmenu')
    >>> res.find('current_page_item mainmenulink">2</a>') > -1
    False
    
    >>> res.find('current_page_item mainmenulink">1</a>') > -1
    True

Check rendering of main menu with empty title. This is needed if main menu
items are supposed to be displayed as icons via CSS::

    >>> model.properties.mainmenu_empty_title = True
    >>> res = render_tile(model, request, 'mainmenu')
    
    >>> res.find('<li class="node-1">') > -1
    True
    
    >>> res.find('<li class="node-2">') > -1
    True
    
    >>> res.find('mainmenulink" title="1">') > -1
    True
    
    >>> res.find('mainmenulink" title="2">') > -1
    True

Child nodes which do not grant permission 'view' are skipped::

    >>> from cone.app.security import DEFAULT_SETTINGS_ACL
    >>> class InvisibleNode(BaseNode):
    ...     __acl__ =  DEFAULT_SETTINGS_ACL
    
    >>> model['3'] = InvisibleNode()
    >>> res = render_tile(model, request, 'mainmenu')
    >>> res.find('<li class="node-3">') > -1
    False
    
    >>> layer.login('manager')
    >>> request = layer.current_request
    
    >>> res = render_tile(model, request, 'mainmenu')
    >>> res.find('<li class="node-3">') > -1
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
    
    >>> res.find('class="contextsensitiv navtree"') != -1
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
    >>> res.find('href="http://example.com/1"') > -1
    True

Render navtree on ``root['1']``, must be selected::

    >>> res = render_tile(root['1'], request, 'navtree')
    >>> res.find('class="selected navtreelevel_1">1</a>') > -1
    True

Child nodes which do not grant permission 'view' are skipped::

    >>> class InvisibleNavNode(BaseNode):
    ...     __acl__ =  DEFAULT_SETTINGS_ACL
    
    >>> root['3'] = InvisibleNavNode()
    >>> root['3'].properties.in_navtree = True
    >>> res = render_tile(root, request, 'navtree')
    >>> res.find('href="http://example.com/3"') > -1
    False
    
    >>> layer.login('manager')
    >>> res = render_tile(root, request, 'navtree')
    >>> res.find('href="http://example.com/3"') > -1
    True

Default child behavior of navtree. Default children objects are displayed in 
navtree.::

    >>> root.properties.default_child = '1'
    >>> res = render_tile(root, request, 'navtree')
    >>> res.find('class="selected navtreelevel_1">1</a>') > -1
    True
    
    >>> res = render_tile(root['1'], request, 'navtree')
    >>> res.find('class="selected navtreelevel_1">1</a>') > -1
    True

If default child should not be displayed it navtree,
``node.properties.hide_if_default`` must be set to 'True'::

    >>> root['1'].properties.hide_if_default = True

In this case, also children context gets switched. Instead of remaining non
default children, children of default node are displayed.::

    >>> res = render_tile(root, request, 'navtree')
    >>> res.find('href="http://example.com/1"') > -1
    False
    
    >>> res.find('href="http://example.com/2"') > -1
    False
    
    >>> res.find('href="http://example.com/1/11"') > -1
    True

Render navtree on ``root['1']['11']``, check selected::

    >>> res = render_tile(root['1']['11'], request, 'navtree')
    >>> res.find('class="selected navtreelevel_1">11</a>') > -1
    True

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
    >>> res.find('pathbaritem') != -1
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
    <p class="byline">
      Created by: <strong>max</strong>,
      on <strong>14.03.2011 00:00</strong>.
      Last modified: <strong>14.03.2011 00:00</strong>
    </p>
    
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
