Referencebrowser
================

Load requirements::

    >>> import yafowil.loader
    >>> import cone.app.browser.referencebrowser

Test widget::

    >>> from yafowil.base import factory


Single valued
-------------

Render without any value::

    >>> widget = factory(
    ...     'reference',
    ...     'ref',
    ...     props={
    ...         'label': 'Reference',
    ...         'multivalued': False,
    ...         'target': lambda: 'http://example.com/foo',
    ...     })
    >>> widget()
    u'<span ajax:target="http://example.com/foo"><input 
    class="referencebrowser" id="input-ref" name="ref" type="text" 
    value="" /><input name="ref.uid" type="hidden" value="" /></span>'

Render required with empty value::

    >>> widget = factory(
    ...     'reference',
    ...     'ref',
    ...     props={
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

Required with valid value::

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

Single valued expects 2-tuple as value with (uid, label)::

    >>> widget = factory(
    ...     'reference',
    ...     'ref',
    ...     value=('uid', 'Label'),
    ...     props={
    ...         'label': 'Reference',
    ...         'multivalued': False,
    ...         'required': 'Ref Required',
    ...     })
    >>> widget()
    u'<input class="referencebrowser required" id="input-ref" name="ref" 
    type="text" value="Label" /><input name="ref.uid" type="hidden" 
    value="uid" />'

Extract from request and render widget with data::

    >>> data = widget.extract(request)
    >>> widget(data=data)
    u'<input class="referencebrowser required" id="input-ref" name="ref" 
    type="text" value="Title" /><input name="ref.uid" type="hidden" 
    value="123" />'

Render widget with request::

    >>> widget(request=request)
    u'<input class="referencebrowser required" id="input-ref" name="ref" 
    type="text" value="Title" /><input name="ref.uid" type="hidden" 
    value="123" />'

Single value display renderer::

    >>> widget = factory(
    ...     'reference',
    ...     'ref',
    ...     props={
    ...         'label': 'Reference',
    ...         'multivalued': False,
    ...     },
    ...     mode='display')
    >>> widget()
    u'<div class="display-referencebrowser" id="display-ref"></div>'
    
    >>> widget = factory(
    ...     'reference',
    ...     'ref',
    ...     value=('uid', 'Label'),
    ...     props={
    ...         'label': 'Reference',
    ...         'multivalued': False,
    ...     },
    ...     mode='display')
    >>> widget()
    u'<div class="display-referencebrowser" id="display-ref">Label</div>'


Multi valued
------------

Render without any value::

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

Render required with empty value::

    >>> widget = factory(
    ...     'reference',
    ...     'ref',
    ...     props={
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

Required with valid value::

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

Multi value display renderer::

    >>> widget = factory(
    ...     'reference',
    ...     'ref',
    ...     value=['uid1', 'uid2'],
    ...     props={
    ...         'label': 'Reference',
    ...         'multivalued': True,
    ...         'vocabulary': [
    ...             ('uid1', 'Title1'),
    ...             ('uid2', 'Title2'),
    ...         ],
    ...     },
    ...     mode='display')
    >>> widget()
    u'<ul class="display-referencebrowser" 
    id="display-ref"><li>Title1</li><li>Title2</li></ul>'


ActionAddReference
------------------
::
    >>> from plumber import plumber
    >>> from node.parts import UUIDAware
    >>> from cone.app.model import BaseNode
    >>> from cone.app.browser.referencebrowser import ActionAddReference
    
    >>> model = BaseNode()
    >>> request = layer.new_request()
    
    >>> action = ActionAddReference()
    >>> action(model, request)
    u''
    
    >>> model.properties.action_add_reference = True
    >>> action(model, request)
    u''
    
    >>> layer.login('manager')
    >>> action(model, request)
    u''
    
    >>> class UUIDNode(BaseNode):
    ...     __metaclass__ = plumber
    ...     __plumbing__ = UUIDAware
    >>> model = UUIDNode(name='model')
    >>> model.properties.action_add_reference = True
    
    >>> action(model, request)
    u'...<a\n     
    id="ref-..."\n     
    href="http://example.com/model"\n     
    class="add16_16 addreference"\n     
    title="Add reference"\n     
    ajax:bind="click">&nbsp;</a>\n\n<span class="reftitle" 
    style="display:none;">model</span>'
    
    >>> model.properties.action_add_reference = False
    
    >>> layer.logout()


ReferencableChildrenLink
------------------------
::
    >>> from cone.app.browser.referencebrowser import ReferencableChildrenLink
    >>> action = ReferencableChildrenLink('tabletile', 'tableid')
    >>> action(model, request)
    u''
    
    >>> layer.login('manager')
    >>> action(model, request)
    u'...<a\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/model"\n     
    ajax:event="contextchanged:.refbrowsersensitiv"\n     
    ajax:action="tabletile:#tableid:replace">model</a>...'
    
    >>> layer.logout()


Reference Pathbar
-----------------

::
    >>> from cone.tile import render_tile
    >>> model = UUIDNode()
    >>> model['a'] = UUIDNode()
    >>> model['a']['b'] = UUIDNode()
    >>> node = model['a']['b']['c'] = UUIDNode()
    
    >>> request = layer.new_request()
    >>> res = render_tile(node, request, 'referencebrowser_pathbar')
    Traceback (most recent call last):
      ...
    HTTPForbidden: Unauthorized: tile 
    <cone.app.browser.referencebrowser.ReferenceBrowserPathBar object at ...> 
    failed permission check
    
    >>> layer.login('max')
    >>> res = render_tile(node, request, 'referencebrowser_pathbar')
    >>> res.find('"http://example.com/"') > -1
    True
    
    >>> res.find('"http://example.com/a"') > -1
    True
    
    >>> res.find('"http://example.com/a/b"') > -1
    True
    
    >>> model['a'].properties.referenceable_root = True
    >>> res = render_tile(node, request, 'referencebrowser_pathbar')
    >>> res.find('"http://example.com/"') > -1
    False
    
    >>> res.find('"http://example.com/a"') > -1
    True
    
    >>> res.find('"http://example.com/a/b"') > -1
    True
    
    >>> layer.logout()

Reference listing tile
----------------------

Create dummy environ::

    >>> from datetime import datetime
    >>> from datetime import timedelta
    
    >>> created = datetime(2011, 3, 15)
    >>> delta = timedelta(1)
    >>> modified = created + delta
    
    >>> model = UUIDNode()
    >>> for i in range(20):
    ...     model[str(i)] = UUIDNode()
    ...     # set listing display metadata
    ...     model[str(i)].metadata.title = str(i)
    ...     model[str(i)].metadata.created = created
    ...     model[str(i)].metadata.modified = modified
    ...     if i % 2 == 0:
    ...         # make node referencable
    ...         model[str(i)].properties.action_add_reference = True
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

    >>> res
    u'\n  <div id="referencebrowser"\n       
      ...
    <a\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/5"\n     
    ajax:event="contextchanged:.refbrowsersensitiv"\n     
    ajax:action="referencelisting:#referencebrowser:replace">5</a>...

Referencable nodes renders add reference action related markup::

    >>> res
    u'\n  <div id="referencebrowser"\n       
      ...
    <a\n     
    id="ref-..."\n     
    href="http://example.com/6"\n     
    class="add16_16 addreference"\n     
    title="Add reference"\n     
    ajax:bind="click">&nbsp;</a>\n\n<span class="reftitle" 
    style="display:none;">6</span>\n...
    
    >>> layer.logout()
