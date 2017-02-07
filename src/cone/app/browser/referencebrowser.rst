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
    ...         'referencable': 'dummy',
    ...     })
    >>> widget()
    u'<span 
    ajax:target="http://example.com/foo?selected=&root=/&referencable=dummy"><input 
    class="referencebrowser" id="input-ref" name="ref" readonly="readonly" 
    type="text" value="" /><input name="ref.uid" type="hidden" value="" /></span>'

Render required with empty value::

    >>> widget = factory(
    ...     'reference',
    ...     'ref',
    ...     props={
    ...         'label': 'Reference',
    ...         'multivalued': False,
    ...         'required': 'Ref Required',
    ...         'target': 'http://example.com/foo',
    ...         'referencable': 'dummy',
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
    u'<span ajax:target="http://example.com/foo?selected=&root=/&referencable=dummy"><input 
    class="referencebrowser required" id="input-ref" name="ref" readonly="readonly" type="text" 
    value="" /><input name="ref.uid" type="hidden" value="" /></span>'

Required with valid value::

    >>> request.params['ref'] = 'Title'
    >>> request.params['ref.uid'] = '123'
    >>> data = widget.extract(request)
    >>> data.extracted
    '123'

    >>> data.errors
    []

    >>> widget(data=data)
    u'<span ajax:target="http://example.com/foo?selected=&root=/&referencable=dummy"><input 
    class="referencebrowser required" id="input-ref" name="ref" readonly="readonly" type="text" 
    value="Title" /><input name="ref.uid" type="hidden" value="123" /></span>'

Single valued expects 2-tuple as value with (uid, label)::

    >>> widget = factory(
    ...     'reference',
    ...     'ref',
    ...     value=('uid', 'Label'),
    ...     props={
    ...         'label': 'Reference',
    ...         'multivalued': False,
    ...         'required': 'Ref Required',
    ...         'target': 'http://example.com/foo',
    ...         'referencable': 'dummy',
    ...     })
    >>> widget()
    u'<span ajax:target="http://example.com/foo?selected=uid&root=/&referencable=dummy"><input 
    class="referencebrowser required" id="input-ref" name="ref" readonly="readonly" type="text" 
    value="Label" /><input name="ref.uid" type="hidden" value="uid" /></span>'

Extract from request and render widget with data::

    >>> data = widget.extract(request)
    >>> widget(data=data)
    u'<span ajax:target="http://example.com/foo?selected=uid&root=/&referencable=dummy"><input 
    class="referencebrowser required" id="input-ref" name="ref" readonly="readonly" type="text" 
    value="Title" /><input name="ref.uid" type="hidden" value="123" /></span>'

Render widget with request::

    >>> widget(request=request)
    u'<span ajax:target="http://example.com/foo?selected=uid&root=/&referencable=dummy"><input 
    class="referencebrowser required" id="input-ref" name="ref" readonly="readonly" type="text" 
    value="Title" /><input name="ref.uid" type="hidden" value="123" /></span>'

Single value display renderer::

    >>> widget = factory(
    ...     'reference',
    ...     'ref',
    ...     props={
    ...         'label': 'Reference',
    ...         'multivalued': False,
    ...         'target': 'http://example.com/foo',
    ...         'referencable': 'dummy',
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
    ...         'target': 'http://example.com/foo',
    ...         'referencable': 'dummy',
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
    ...         'target': 'http://example.com/foo',
    ...         'referencable': 'dummy',
    ...     })
    >>> widget()
    u'<span ajax:target="http://example.com/foo?selected=&root=/&referencable=dummy"><input 
    id="exists-ref" name="ref-exists" type="hidden" value="exists" /><select 
    class="referencebrowser" id="input-ref" multiple="multiple" 
    name="ref" /></span>'

Render required with empty value::

    >>> widget = factory(
    ...     'reference',
    ...     'ref',
    ...     props={
    ...         'label': 'Reference',
    ...         'multivalued': True,
    ...         'required': 'Ref Required',
    ...         'target': 'http://example.com/foo',
    ...         'referencable': 'dummy',
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
    u'<span ajax:target="http://example.com/foo?selected=&root=/&referencable=dummy"><input 
    id="exists-ref" name="ref-exists" type="hidden" value="exists" /><select 
    class="referencebrowser required" id="input-ref" multiple="multiple" 
    name="ref" required="required"><option 
    id="input-ref-uid1" value="uid1">Title1</option><option 
    id="input-ref-uid2" value="uid2">Title2</option></select></span>'

Required with valid value::

    >>> request.params['ref'] = ['uid1', 'uid2']
    >>> data = widget.extract(request)
    >>> data.extracted
    ['uid1', 'uid2']

    >>> data.errors
    []

    >>> widget(data=data)
    u'<span ajax:target="http://example.com/foo?selected=&root=/&referencable=dummy"><input 
    id="exists-ref" name="ref-exists" type="hidden" value="exists" /><select 
    class="referencebrowser required" id="input-ref" 
    multiple="multiple" name="ref" required="required"><option 
    id="input-ref-uid1" selected="selected" value="uid1">Title1</option><option 
    id="input-ref-uid2" selected="selected" 
    value="uid2">Title2</option></select></span>'

Multi value display renderer::

    >>> widget = factory(
    ...     'reference',
    ...     'ref',
    ...     value=['uid1', 'uid2'],
    ...     props={
    ...         'label': 'Reference',
    ...         'target': 'http://example.com/foo',
    ...         'referencable': 'dummy',
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

    >>> from plumber import plumbing
    >>> from node.behaviors import UUIDAware
    >>> from cone.app.model import BaseNode
    >>> from cone.app.browser.referencebrowser import ActionAddReference

    >>> model = BaseNode()
    >>> request = layer.new_request()
    >>> request.params['referencable'] = 'dummy'
    >>> request.params['selected'] = ''
    >>> request.params['root'] = '/'

    >>> action = ActionAddReference()
    >>> action(model, request)
    u''

    >>> layer.login('manager')
    >>> action(model, request)
    u''

    >>> @plumbing(UUIDAware)
    ... class UUIDNode(BaseNode):
    ...     node_info_name = 'dummy'

    >>> model = UUIDNode(name='model')

    >>> action(model, request)
    u'...<a\n     
    id="ref-..."\n     
    href="http://example.com/model"\n     
    class="addreference"\n     
    title="Add reference"\n     
    data-toggle="tooltip"\n     
    data-placement="top"\n     
    ajax:bind="click"\n    
    ><span class="ion-plus-round"></span></a>\n\n\n<span class="reftitle" 
    style="display:none;">model</span>'

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
    href="#"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/model?selected=&amp;root=/&amp;referencable=dummy"\n     
    ajax:event="contextchanged:.refbrowsersensitiv"\n     
    ajax:action="tabletile:#tableid:replace"\n    
    ><span class="glyphicon glyphicon-asterisk"></span\n    \n    
    >&nbsp;model</a>...'

    >>> layer.logout()


Reference Pathbar
-----------------

::

    >>> from cone.tile import render_tile
    >>> model = UUIDNode()
    >>> model['a'] = UUIDNode()
    >>> model['a']['b'] = UUIDNode()
    >>> model['z'] = UUIDNode()
    >>> node = model['a']['b']['c'] = UUIDNode()

    >>> request = layer.new_request()
    >>> request.params['referencable'] = 'dummy'
    >>> request.params['selected'] = ''
    >>> request.params['root'] = '/'

Case Unauthorized::

    >>> res = render_tile(node, request, 'referencebrowser_pathbar')
    Traceback (most recent call last):
      ...
    HTTPForbidden: Unauthorized: tile 
    <cone.app.browser.referencebrowser.ReferenceBrowserPathBar object at ...> 
    failed permission check

Case reference root is application root::

    >>> layer.login('max')

    >>> request = layer.new_request()
    >>> request.params['referencable'] = 'dummy'
    >>> request.params['selected'] = ''
    >>> request.params['root'] = '/'

    >>> res = render_tile(node, request, 'referencebrowser_pathbar')

    >>> res.find('"http://example.com/?') > -1
    True

    >>> res.find('"http://example.com/a?') > -1
    True

    >>> res.find('"http://example.com/a/b?') > -1
    True

Case reference root is in current sub tree::

    >>> request = layer.new_request()
    >>> request.params['referencable'] = 'dummy'
    >>> request.params['selected'] = ''
    >>> request.params['root'] = 'a'
    >>> res = render_tile(node, request, 'referencebrowser_pathbar')
    >>> res.find('"http://example.com/?') > -1
    False

    >>> res.find('"http://example.com/a?') > -1
    True

    >>> res.find('"http://example.com/a/b?') > -1
    True

Case reference root is in sibling sub tree::

    >>> request = layer.new_request()
    >>> request.params['referencable'] = 'dummy'
    >>> request.params['selected'] = ''
    >>> request.params['root'] = '/z'
    >>> res = render_tile(node, request, 'referencebrowser_pathbar')
    >>> res.find('"http://example.com/?') > -1
    False

    >>> res.find('"http://example.com/a?') > -1
    False

    >>> res.find('"http://example.com/a/b?') > -1
    False

    >>> res.find('<strong>z</strong>') > -1
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
    >>> request.params['referencable'] = 'dummy'
    >>> request.params['selected'] = ''
    >>> request.params['root'] = '/'

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
    u'...<div id="referencebrowser"...'

Referencable nodes renders add reference action related markup::

    >>> res
    u'...
    <a\n     
    id="ref-..."\n     
    href="http://example.com/1"\n     
    class="addreference"\n     
    title="Add reference"\n     
    data-toggle="tooltip"\n     
    data-placement="top"\n     
    ajax:bind="click"\n    ><span class="ion-plus-round"></span></a>...'

    >>> layer.logout()
