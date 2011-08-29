Referencebrowser
================

Load requirements.::

    >>> import yafowil.loader
    >>> import cone.app.browser.referencebrowser

Test widget.::

    >>> from yafowil.base import factory


Single valued
-------------

Render without any value.::

    >>> widget = factory(
    ...     'reference',
    ...     'ref',
    ...     props = {
    ...         'label': 'Reference',
    ...         'multivalued': False,
    ...         'target': lambda: 'http://example.com/foo',
    ...     })
    >>> widget()
    u'<span ajax:target="http://example.com/foo"><input 
    class="referencebrowser" id="input-ref" name="ref" type="text" 
    value="" /><input name="ref.uid" type="hidden" value="" /></span>'

Render required with empty value.::

    >>> widget = factory(
    ...     'reference',
    ...     'ref',
    ...     props = {
    ...         'label': 'Reference',
    ...         'multivalued': False,
    ...         'required': 'Ref Required',
    ...     })
    
    >>> request = layer.new_request()
    >>> request.params['ref'] = ''
    >>> request.params['ref.uid'] = ''
    
    >>> data = widget.extract(request)
    >>> data.extracted
    ''
    
    >>> data.errors
    [ExtractionError('Ref Required',)]
    
    >>> widget(data=data)
    u'<input class="referencebrowser required" id="input-ref" name="ref" 
    type="text" value="" /><input name="ref.uid" type="hidden" value="" />'

Required with valid value.::

    >>> request.params['ref'] = 'Title'
    >>> request.params['ref.uid'] = '123'
    >>> data = widget.extract(request)
    >>> data.extracted
    '123'
    
    >>> data.errors
    []
    
    >>> widget(data=data)
    u'<input class="referencebrowser required" id="input-ref" name="ref" 
    type="text" value="Title" /><input name="ref.uid" type="hidden" 
    value="123" />'

Single valued expects 2-tuple as value with (uid, label).::

    >>> widget = factory(
    ...     'reference',
    ...     'ref',
    ...     value = ('uid', 'Label'),
    ...     props = {
    ...         'label': 'Reference',
    ...         'multivalued': False,
    ...         'required': 'Ref Required',
    ...     })
    >>> widget()
    u'<input class="referencebrowser required" id="input-ref" name="ref" 
    type="text" value="Label" /><input name="ref.uid" type="hidden" 
    value="uid" />'

Extract from request and render widget with data.::

    >>> data = widget.extract(request)
    >>> widget(data=data)
    u'<input class="referencebrowser required" id="input-ref" name="ref" 
    type="text" value="Title" /><input name="ref.uid" type="hidden" 
    value="123" />'

Render widget with request.::

    >>> widget(request=request)
    u'<input class="referencebrowser required" id="input-ref" name="ref" 
    type="text" value="Title" /><input name="ref.uid" type="hidden" 
    value="123" />'


Multi valued
------------

Render without any value.::

    >>> widget = factory(
    ...     'reference',
    ...     'ref',
    ...     props = {
    ...         'label': 'Reference',
    ...         'multivalued': True,
    ...     })
    >>> widget()
    u'<input id="exists-ref" name="ref-exists" type="hidden" value="exists" 
    /><select class="referencebrowser" id="input-ref" multiple="multiple" 
    name="ref" />'

Render required with empty value.::

    >>> widget = factory(
    ...     'reference',
    ...     'ref',
    ...     props = {
    ...         'label': 'Reference',
    ...         'multivalued': True,
    ...         'required': 'Ref Required',
    ...         'vocabulary': [
    ...             ('uid1', 'Title1'),
    ...             ('uid2', 'Title2'),
    ...         ],
    ...     })
    
    >>> request = layer.new_request()
    >>> request.params['ref'] = ''
    
    >>> data = widget.extract(request)
    >>> data.extracted
    ''
    
    >>> data.errors
    [ExtractionError('Ref Required',)]
    
    >>> widget(data=data)
    u'<input id="exists-ref" name="ref-exists" type="hidden" value="exists" 
    /><select class="referencebrowser required" id="input-ref" 
    multiple="multiple" name="ref" required="required"><option 
    id="input-ref-uid1" value="uid1">Title1</option><option 
    id="input-ref-uid2" value="uid2">Title2</option></select>'

Required with valid value.::

    >>> request.params['ref'] = ['uid1', 'uid2']
    >>> data = widget.extract(request)
    >>> data.extracted
    ['uid1', 'uid2']
    
    >>> data.errors
    []
    
    >>> widget(data=data)
    u'<input id="exists-ref" name="ref-exists" type="hidden" value="exists" 
    /><select class="referencebrowser required" id="input-ref" 
    multiple="multiple" name="ref" required="required"><option 
    id="input-ref-uid1" selected="selected" value="uid1">Title1</option><option 
    id="input-ref-uid2" selected="selected" 
    value="uid2">Title2</option></select>'


Reference listing tile
----------------------

Create dummy environ::

    >>> from cone.tile import render_tile
    >>> from cone.app.model import BaseNode
    
    >>> from datetime import datetime
    >>> from datetime import timedelta
    
    >>> created = datetime(2011, 3, 15)
    >>> delta = timedelta(1)
    >>> modified = created + delta
    
    >>> import uuid
    >>> model = BaseNode()
    >>> for i in range(20):
    ...     model[str(i)] = BaseNode()
    ...     # set listing display metadata
    ...     model[str(i)].metadata.title = str(i)
    ...     model[str(i)].metadata.created = created
    ...     model[str(i)].metadata.modified = modified
    ...     # node needs a uid to be referencable
    ...     model[str(i)].metadata.uid = uuid.uuid4()
    ...     if i % 2 == 0:
    ...         # make node referencable
    ...         model[str(i)].properties.referencable = True
    ...         # do not render link to children
    ...         model[str(i)].properties.leaf = True
    ...     created = created + delta
    ...     modified = modified + delta

Unauthorized fails::

    >>> request = layer.new_request()
    >>> res = render_tile(model, request, 'referencelisting')
    Traceback (most recent call last):
      ...
    HTTPForbidden: Unauthorized: tile 
    <cone.app.browser.referencebrowser.ReferenceListing object at ...> 
    failed permission check
    
Authorized::

    >>> layer.login('max')
    >>> res = render_tile(model, request, 'referencelisting')
    >>> res.find('id="referencebrowser"') > -1
    True

Referencable nodes renders add reference action related markup::

    >>> expected = 'add16_16 addreference" '
    >>> expected += 'href="http://example.com/6" id="ref-'
    >>> res.find(expected) > -1
    True
    
    >>> layer.logout()
