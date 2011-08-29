Contents listing
================

A tile named ``contents`` is available which renders the given model's children
in a sortable, batched table.

Imports and dummy context::

    >>> from cone.app.model import BaseNode
    
    >>> from datetime import datetime, timedelta
    >>> created = datetime(2011, 3, 14)
    >>> delta = timedelta(1)
    >>> modified = created + delta
    >>> model = BaseNode()
    >>> for i in range(19):
    ...     model[str(i)] = BaseNode()
    ...     model[str(i)].properties.editable = True
    ...     model[str(i)].properties.deletable = True
    ...     model[str(i)].metadata.title = str(i) + ' Title'
    ...     model[str(i)].metadata.creator = 'admin ' + str(19 - i)
    ...     model[str(i)].metadata.created = created
    ...     model[str(i)].metadata.modified = modified
    ...     created = created + delta
    ...     modified = modified + delta
    
    >>> from pyramid.security import (
    ...     Everyone,
    ...     Deny,
    ...     ALL_PERMISSIONS,
    ... )
    
    >>> class NeverShownChild(BaseNode):
    ...     __acl__ = [(Deny, Everyone, ALL_PERMISSIONS)]
    
    >>> model['nevershown'] = NeverShownChild()

    >>> from cone.app.browser.contents import ContentsTile
    >>> contents = ContentsTile('cone.app:browser/templates/table.pt',
    ...                         None, 'contents')
    
    >>> layer.login('manager')
    >>> contents.model = model
    >>> contents.request = request = layer.new_request()

``sorted_rows`` returns sorted listing items. ``start``, ``end``, ``sort`` and 
``order`` are expected by this function::

    >>> contents.sorted_rows(None, None, 'created', 'desc')[0]['title'].value
    '0 Title'
    
    >>> contents.sorted_rows(None, None, 'created', 'desc')[-1]['title'].value
    '18 Title'
    
    >>> contents.sorted_rows(None, None, 'created', 'asc')[0]['title'].value
    '18 Title'
    
    >>> contents.sorted_rows(None, None, 'created', 'asc')[-1]['title'].value
    '0 Title'

``contents.slice.slice`` return current batch start and positions::

    >>> contents.slice
    <cone.app.browser.table.TableSlice object at ...>

    >>> contents.slice.slice
    (0, 10)
    
    >>> request.params['b_page'] = '1'
    >>> contents.slice.slice
    (10, 20)
    
    >>> del request.params['b_page']
    
``contents.slice.rows`` return the current sorted row data for listing.

Items returned by default sorting::

    >>> contents.slice.rows[0]['title'].value
    '0 Title'
    
    >>> contents.slice.rows[-1]['title'].value
    '9 Title'

Inverse order::

    >>> request.params['order'] = 'asc'
    >>> contents.slice.rows[0]['title'].value
    '18 Title'
    
    >>> contents.slice.rows[-1]['title'].value
    '9 Title'

Switch batch page with inversed order::

    >>> request.params['b_page'] = '1'
    >>> contents.slice.rows[0]['title'].value
    '8 Title'
    
    >>> contents.slice.rows[-1]['title'].value
    '0 Title'

Reset order and batch page::

    >>> del request.params['order']
    >>> del request.params['b_page']

Sort by creator::

    >>> request.params['sort'] = 'creator'
    >>> contents.slice.rows[0]['creator'].value
    'admin 1'
    
    >>> contents.slice.rows[-1]['creator'].value
    'admin 18'
    
    >>> len(contents.slice.rows)
    10
    
    >>> [row['creator'].value for row in contents.slice.rows]
    ['admin 1', 'admin 10', 'admin 11', 'admin 12', 'admin 13', 'admin 14', 
    'admin 15', 'admin 16', 'admin 17', 'admin 18']
    
    >>> request.params['b_page'] = '1'
    >>> contents.slice.rows[0]['creator'].value
    'admin 19'
    
    >>> contents.slice.rows[-1]['creator'].value
    'admin 9'
    
    >>> [row['creator'].value for row in contents.slice.rows]
    ['admin 19', 'admin 2', 'admin 3', 'admin 4', 'admin 5', 
    'admin 6', 'admin 7', 'admin 8', 'admin 9']

Sort by created::

    >>> request.params['b_page'] = '0'
    >>> request.params['sort'] = 'created'
    >>> contents.slice.rows[0]['created'].value
    datetime.datetime(2011, 3, 14, 0, 0)
    
    >>> contents.slice.rows[-1]['created'].value
    datetime.datetime(2011, 3, 23, 0, 0)
    
    >>> request.params['b_page'] = '1'
    >>> request.params['sort'] = 'modified'
    >>> contents.slice.rows[0]['modified'].value
    datetime.datetime(2011, 3, 25, 0, 0)
    
    >>> contents.slice.rows[-1]['modified'].value
    datetime.datetime(2011, 4, 2, 0, 0)
    
    >>> del request.params['b_page']
    >>> del request.params['sort']
    
Test batch::

    >>> rendered = contents.batch
    >>> rendered = contents.batch
    >>> rendered.find('class="current">1</strong>') != -1
    True
    
    >>> rendered.find('http://example.com/?sort=&amp;b_page=1') != -1
    True

Change page::

    >>> request.params['b_page'] = '1'
    >>> rendered = contents.batch
    >>> rendered.find('class="current">2</strong>') != -1
    True
    
    >>> rendered.find('http://example.com/?sort=&amp;b_page=0') != -1
    True

Change sort and order. Sort is proxied by batch::

    >>> request.params['sort'] = 'modified'
    >>> rendered = contents.batch
    >>> rendered.find('http://example.com/?sort=modified&amp;b_page=0') != -1
    True

Rendering fails unauthorized, 'view' permission is required::

    >>> layer.logout()
    >>> request = layer.new_request()
    >>> from cone.tile import render_tile
    >>> render_tile(model, request, 'contents')
    Traceback (most recent call last):
      ...
    HTTPForbidden: Unauthorized: tile 
    <cone.app.browser.contents.ContentsTile object at ...> failed 
    permission check

Render authenticated::

    >>> layer.login('manager')
    >>> request = layer.new_request()
    >>> request.params['sort'] = 'modified'
    >>> request.params['b_page'] = '1'
    >>> rendered = render_tile(model, request, 'contents')
    >>> expected = \
    ... '<a href="http://example.com?b_page=1&amp;sort=created&amp;order=desc"'
    
    >>> rendered.find(expected) != -1
    True
    
    >>> layer.logout()
