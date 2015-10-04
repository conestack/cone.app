Copysupport::

    >>> from cone.app.testing.mock import CopySupportNode
    >>> from cone.app.model import NodeInfo
    >>> from cone.app.model import register_node_info

    >>> class CopySupportNodeA(CopySupportNode):
    ...     node_info_name = 'copy_support_node_a'
    >>> info = NodeInfo()
    >>> info.title = 'CopySupportNodeA'
    >>> info.addables = ['copy_support_node_a', 'copy_support_node_b']
    >>> register_node_info('copy_support_node_a', info)

    >>> class CopySupportNodeB(CopySupportNode):
    ...     node_info_name = 'copy_support_node_b'
    >>> info = NodeInfo()
    >>> info.title = 'CopySupportNodeB'
    >>> info.addables = ['copy_support_node_b']
    >>> register_node_info('copy_support_node_b', info)

    >>> root = CopySupportNodeA()
    >>> source = root['source'] = CopySupportNodeA()
    >>> source['a_child'] = CopySupportNodeA()
    >>> source['b_child'] = CopySupportNodeB()
    >>> target = root['target'] = CopySupportNodeB()

    >>> root.printtree()
    <class 'CopySupportNodeA'>: None
      <class 'CopySupportNodeA'>: source
        <class 'CopySupportNodeA'>: a_child
        <class 'CopySupportNodeB'>: b_child
      <class 'CopySupportNodeB'>: target

    >>> import urllib
    >>> from cone.app.browser.utils import make_url

    >>> request = layer.new_request()
    >>> copy_url = urllib.quote(make_url(request, node=source['a_child']))
    >>> request.cookies['cone.app.copysupport.copy'] = copy_url

    >>> from cone.app.browser.copysupport import PasteAction

    >>> paste_tile = PasteAction(None, 'render', '')
    >>> res = paste_tile(target, request)

    >>> request.environ['cone.app.continuation'][0].payload
    u"Pasted 0 items<br /><strong>Pasting of 1 items 
    failed</strong><br />Violation. 'CopySupportNodeB' is not allowed 
    to contain 'CopySupportNodeA'"

    >>> copy_url = urllib.quote(make_url(request, node=source['b_child']))
    >>> request.cookies['cone.app.copysupport.copy'] = copy_url
    >>> del request.environ['cone.app.continuation']

    >>> res = paste_tile(target, request)
    Called: target

    >>> request.response.headers['Set-Cookie']
    'cone.app.copysupport.copy=; Max-Age=0; Path=/; expires=...'

    >>> request.environ['cone.app.continuation']
    [<cone.app.browser.ajax.AjaxMessage object at ...>, 
    <cone.app.browser.ajax.AjaxAction object at ...>, 
    <cone.app.browser.ajax.AjaxEvent object at ...>]

    >>> root.printtree()
    <class 'CopySupportNodeA'>: None
      <class 'CopySupportNodeA'>: source
        <class 'CopySupportNodeA'>: a_child
        <class 'CopySupportNodeB'>: b_child
      <class 'CopySupportNodeB'>: target
        <class 'CopySupportNodeB'>: b_child

    >>> res = paste_tile(target, request)
    Called: target

    >>> root.printtree()
    <class 'CopySupportNodeA'>: None
      <class 'CopySupportNodeA'>: source
        <class 'CopySupportNodeA'>: a_child
        <class 'CopySupportNodeB'>: b_child
      <class 'CopySupportNodeB'>: target
        <class 'CopySupportNodeB'>: b_child
        <class 'CopySupportNodeB'>: b_child-1

    >>> cut_url = urllib.quote(make_url(request, node=source['b_child']))
    >>> request.cookies['cone.app.copysupport.cut'] = cut_url
    >>> del request.cookies['cone.app.copysupport.copy']
    >>> res = paste_tile(target, request)
    Called: target
    Called: source

    >>> request.response.headers['Set-Cookie']
    'cone.app.copysupport.cut=; Max-Age=0; Path=/; expires=...'

    >>> root.printtree()
    <class 'CopySupportNodeA'>: None
      <class 'CopySupportNodeA'>: source
        <class 'CopySupportNodeA'>: a_child
      <class 'CopySupportNodeB'>: target
        <class 'CopySupportNodeB'>: b_child
        <class 'CopySupportNodeB'>: b_child-1
        <class 'CopySupportNodeB'>: b_child-2

    >>> cut_url = urllib.quote(make_url(request, node=source['a_child']))
    >>> request.cookies['cone.app.copysupport.cut'] = cut_url
    >>> del request.environ['cone.app.continuation']
    >>> res = paste_tile(target, request)
    >>> root.printtree()
    <class 'CopySupportNodeA'>: None
      <class 'CopySupportNodeA'>: source
        <class 'CopySupportNodeA'>: a_child
      <class 'CopySupportNodeB'>: target
        <class 'CopySupportNodeB'>: b_child
        <class 'CopySupportNodeB'>: b_child-1
        <class 'CopySupportNodeB'>: b_child-2

    >>> request.environ['cone.app.continuation'][0].payload
    u"Pasted 0 items<br /><strong>Pasting of 1 items 
    failed</strong><br />Violation. 'CopySupportNodeB' is not 
    allowed to contain 'CopySupportNodeA'"

    >>> cut_url = urllib.quote(make_url(request, node=source))
    >>> del request.environ['cone.app.continuation']
    >>> request.cookies['cone.app.copysupport.cut'] = cut_url
    >>> res = paste_tile(root['source']['a_child'], request)
    >>> request.environ['cone.app.continuation'][0].payload
    u'Pasted 0 items<br /><strong>Pasting of 1 items 
    failed</strong><br />Cannot paste cut object to child of it: source'

    >>> cut_url = '::'.join([
    ...     urllib.quote(make_url(request, node=target['b_child'])),
    ...     urllib.quote(make_url(request, node=target['b_child-1'])),
    ... ])
    >>> request.cookies['cone.app.copysupport.cut'] = cut_url
    >>> del request.environ['cone.app.continuation']
    >>> res = paste_tile(source, request)
    Called: source
    Called: target

    >>> root.printtree()
    <class 'CopySupportNodeA'>: None
      <class 'CopySupportNodeA'>: source
        <class 'CopySupportNodeA'>: a_child
        <class 'CopySupportNodeB'>: b_child
        <class 'CopySupportNodeB'>: b_child-1
      <class 'CopySupportNodeB'>: target
        <class 'CopySupportNodeB'>: b_child-2

    >>> from cone.app.model import BaseNode

    >>> root['unknown_source'] = BaseNode()
    >>> root['unknown_target'] = BaseNode()

    >>> cut_url = urllib.quote(make_url(request, node=root['unknown_source']))
    >>> request.cookies['cone.app.copysupport.cut'] = cut_url
    >>> del request.environ['cone.app.continuation']
    >>> res = paste_tile(target, request)
    >>> request.environ['cone.app.continuation'][0].payload
    u"Pasted 0 items<br /><strong>Pasting of 1 items 
    failed</strong><br />Cannot paste 'unknown_source'. Unknown source"

    >>> cut_url = urllib.quote(make_url(request, node=source['b_child']))
    >>> request.cookies['cone.app.copysupport.cut'] = cut_url
    >>> del request.environ['cone.app.continuation']
    >>> res = paste_tile(root['unknown_target'], request)
    >>> request.environ['cone.app.continuation'][0].payload
    u"Pasted 0 items<br /><strong>Pasting of 1 items 
    failed</strong><br />Cannot paste to 'unknown_target'. Unknown target"

    >>> del request.cookies['cone.app.copysupport.cut']
    >>> del request.environ['cone.app.continuation']
    >>> res = paste_tile(root['unknown_target'], request)
    >>> request.environ['cone.app.continuation'][0].payload
    u'Nothing to paste'
