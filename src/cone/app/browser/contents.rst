Contents listing
================

A tile named ``contents`` is available which renders the given model's children
in a sortable, batched table.

Imports and dummy context::

    >>> from cone.app.model import BaseNode

    >>> from datetime import datetime
    >>> from datetime import timedelta

    >>> created = datetime(2011, 3, 14)
    >>> delta = timedelta(1)
    >>> modified = created + delta
    >>> model = BaseNode()
    >>> for i in range(19):
    ...     model[str(i)] = BaseNode()
    ...     model[str(i)].properties.action_view = True
    ...     model[str(i)].properties.action_edit = True
    ...     model[str(i)].properties.action_delete = True
    ...     model[str(i)].metadata.title = str(i) + ' Title'
    ...     model[str(i)].metadata.creator = 'admin ' + str(19 - i)
    ...     model[str(i)].metadata.created = created
    ...     model[str(i)].metadata.modified = modified
    ...     created = created + delta
    ...     modified = modified + delta

    >>> from pyramid.security import Everyone
    >>> from pyramid.security import Deny
    >>> from pyramid.security import ALL_PERMISSIONS

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

    >>> contents.sorted_rows(None, None, 'created', 'desc')[0]['title']
    u'...0 Title...'

    >>> contents.sorted_rows(None, None, 'created', 'desc')[-1]['title']
    u'...18 Title...'

    >>> contents.sorted_rows(None, None, 'created', 'asc')[0]['title']
    u'...18 Title...'

    >>> contents.sorted_rows(None, None, 'created', 'asc')[-1]['title']
    u'...0 Title...'

``contents.slice.slice`` return current batch start and positions::

    >>> contents.slice
    <cone.app.browser.table.TableSlice object at ...>

    >>> contents.slice.slice
    (0, 15)

    >>> request.params['b_page'] = '1'
    >>> contents.slice.slice
    (15, 30)

    >>> del request.params['b_page']

``contents.slice.rows`` return the current sorted row data for listing.

Items returned by default sorting::

    >>> contents.slice.rows[0]['title']
    u'...0 Title...'

    >>> contents.slice.rows[-1]['title']
    u'...14 Title...'

Inverse order::

    >>> request.params['order'] = 'asc'
    >>> contents.slice.rows[0]['title']
    u'...18 Title...'

    >>> contents.slice.rows[-1]['title']
    u'...4 Title...'

Switch batch page with inversed order::

    >>> request.params['b_page'] = '1'
    >>> contents.slice.rows[0]['title']
    u'...3 Title...'

    >>> contents.slice.rows[-1]['title']
    u'...0 Title...'

Reset order and batch page::

    >>> del request.params['order']
    >>> del request.params['b_page']

Sort by creator::

    >>> request.params['sort'] = 'creator'
    >>> [row['creator'] for row in contents.slice.rows]
    ['admin 1', 'admin 10', 'admin 11', 'admin 12', 'admin 13', 'admin 14', 
    'admin 15', 'admin 16', 'admin 17', 'admin 18', 'admin 19', 'admin 2', 
    'admin 3', 'admin 4', 'admin 5']

    >>> request.params['b_page'] = '1'
    >>> [row['creator'] for row in contents.slice.rows]
    ['admin 6', 'admin 7', 'admin 8', 'admin 9']

Sort by created::

    >>> request.params['b_page'] = '0'
    >>> request.params['sort'] = 'created'

    >>> contents.slice.rows[0]['created']
    datetime.datetime(2011, 3, 14, 0, 0)

    >>> contents.slice.rows[-1]['created']
    datetime.datetime(2011, 3, 28, 0, 0)

    >>> request.params['b_page'] = '1'
    >>> request.params['sort'] = 'modified'

    >>> contents.slice.rows[0]['modified']
    datetime.datetime(2011, 3, 30, 0, 0)

    >>> contents.slice.rows[-1]['modified']
    datetime.datetime(2011, 4, 2, 0, 0)

    >>> del request.params['b_page']
    >>> del request.params['sort']

Test batch::

    >>> rendered = contents.batch
    >>> rendered = contents.batch
    >>> expected = '<li class="active">\n          <a href="javascript:void(0)">1</a>'
    >>> rendered.find(expected) != -1
    True

    >>> rendered.find('http://example.com/?sort=created&amp;order=desc&amp;b_page=1&amp;size=15') != -1
    True

Change page::

    >>> request.params['b_page'] = '1'
    >>> rendered = contents.batch
    >>> expected = '<li class="active">\n          <a href="javascript:void(0)">2</a>'
    >>> rendered.find(expected) != -1
    True

    >>> rendered.find('http://example.com/?sort=created&amp;order=desc&amp;b_page=0&amp;size=15') != -1
    True

Change sort and order. Sort is proxied by batch::

    >>> request.params['sort'] = 'modified'
    >>> rendered = contents.batch
    >>> rendered.find('http://example.com/?sort=modified&amp;order=desc&amp;b_page=0&amp;size=15') != -1
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
    ... '<a href="http://example.com/?sort=title&amp;order=desc&amp;b_page=1&amp;size=15"'
    >>> rendered.find(expected) != -1
    True

Copysupport Attributes::

    >>> from cone.app.testing.mock import CopySupportNode

    >>> model = CopySupportNode()
    >>> model['child'] = CopySupportNode()
    >>> request = layer.new_request()
    >>> rendered = render_tile(model, request, 'contents')
    >>> expected = 'class="selectable copysupportitem"'
    >>> rendered.find(expected) > -1
    True

    >>> import urllib
    >>> from cone.app.browser.utils import make_url

    >>> request = layer.new_request()
    >>> cut_url = urllib.quote(make_url(request, node=model['child']))
    >>> request.cookies['cone.app.copysupport.cut'] = cut_url
    >>> rendered = render_tile(model, request, 'contents')
    >>> expected = 'class="selectable copysupportitem copysupport_cut"'
    >>> rendered.find(expected) > -1
    True

    >>> layer.logout()
