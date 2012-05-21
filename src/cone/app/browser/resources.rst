cone.app resources
==================


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
    [...]

Contain CSS resource for all users::

    >>> cone.app.cfg.css.public
    [...]

JS Resources::

    >>> cone.app.cfg.js
    <cone.app.model.Properties object at ...>
    
    >>> cone.app.cfg.js.keys()
    ['protected', 'public']

Contain CSS resources for authenticated users::

    >>> cone.app.cfg.js.protected
    [...]

Contain CSS resource for all users::

    >>> cone.app.cfg.js.public
    [...]

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