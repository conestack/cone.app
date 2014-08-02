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
    >>> result
    u'...  <!-- javascripts -->\n  ...'

Render resources tile authorized::

    >>> layer.login('max')
    >>> request = layer.new_request()

    >>> result = render_tile(cone.app.root, request, 'resources')
    >>> result
    u'...  <!-- javascripts -->\n  ...'

    >>> layer.logout()

Merged Assets::

    >>> import os
    >>> import pkg_resources
    >>> assets = cone.app.cfg.merged.js.public
    >>> assets
    [(<pyramid.static.static_view object at ...>, 'jquery-1.9.1.js'), 
    (<pyramid.static.static_view object at ...>, 'jquery.migrate-1.2.1.js'), 
    (<pyramid.static.static_view object at ...>, 'jqueryui/jquery-ui-1.10.3.custom.js'), 
    (<pyramid.static.static_view object at ...>, 'bootstrap/js/bootstrap.js')...]

    >>> static = assets[0][0]
    >>> resource = assets[0][1]
    >>> static.app.package_name
    'cone.app.browser'

    >>> static.app.resource_name
    'static'

    >>> subpath = os.path.join(static.app.resource_name, resource)
    >>> path = pkg_resources.resource_filename(static.app.package_name, subpath)
    >>> path
    '/.../cone/app/browser/static/jquery-1.9.1.js'

    >>> data = ''
    >>> with open(path, 'r') as file:
    ...     data += file.read() + '\n\n'

    >>> data
    '...\n\n'

    >>> from cone.app.browser.resources import MergedAssets
    >>> request = layer.new_request()
    >>> assets = MergedAssets(request)
    >>> len(assets.merged_js) > 0
    True

    >>> assets.merged_css
    '...'

    >>> layer.login('admin')
    >>> len(assets.merged_js) > 0
    True

    >>> assets.merged_css
    '...'

    >>> layer.logout()
