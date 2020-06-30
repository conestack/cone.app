from cone.app import compat
from cone.app import testing
from cone.app.browser.ajax import AjaxEvent
from cone.app.browser.ajax import AjaxMessage
from cone.app.browser.copysupport import PasteAction
from cone.app.browser.utils import make_url
from cone.app.model import BaseNode
from cone.app.model import node_info
from cone.app.testing.mock import CopySupportNode
from cone.tile.tests import TileTestCase


class TestBrowserCopysupport(TileTestCase):
    layer = testing.security

    @testing.reset_node_info_registry
    def test_copysupport(self):
        @node_info(
            name='copy_support_node_a',
            title='CopySupportNodeA',
            addables=['copy_support_node_a', 'copy_support_node_b'])
        class CopySupportNodeA(CopySupportNode):
            pass

        @node_info(
            name='copy_support_node_b',
            title='CopySupportNodeB',
            addables=['copy_support_node_b'])
        class CopySupportNodeB(CopySupportNode):
            pass

        root = CopySupportNodeA()
        source = root['source'] = CopySupportNodeA()
        source['a_child'] = CopySupportNodeA()
        source['b_child'] = CopySupportNodeB()
        target = root['target'] = CopySupportNodeB()

        request = self.layer.new_request()
        copy_url = compat.quote(make_url(request, node=source['a_child']))
        request.cookies['cone.app.copysupport.copy'] = copy_url

        paste_tile = PasteAction(None, 'render', '')
        paste_tile(target, request)

        self.checkOutput("""
        Pasted 0 items<br /><strong>Pasting of 1 items
        failed</strong><br />Violation. 'CopySupportNodeB' is not allowed
        to contain 'CopySupportNodeA'
        """, request.environ['cone.app.continuation'][0].payload)

        copy_url = compat.quote(make_url(request, node=source['b_child']))
        request.cookies['cone.app.copysupport.copy'] = copy_url
        del request.environ['cone.app.continuation']

        paste_tile(target, request)
        self.assertEqual(target.messages, ['Called: target'])
        target.messages = []

        self.checkOutput("""
        cone.app.copysupport.copy=; Max-Age=0; Path=/; expires=...
        """, request.response.headers['Set-Cookie'])

        self.assertTrue(isinstance(
            request.environ['cone.app.continuation'][0],
            AjaxMessage
        ))
        self.assertTrue(isinstance(
            request.environ['cone.app.continuation'][1],
            AjaxEvent
        ))
        self.assertEqual(
            request.environ['cone.app.continuation'][1].target,
            'http://example.com/target?contenttile=listing'
        )

        self.checkOutput("""
        <class '...CopySupportNodeA'>: None
          <class '...CopySupportNodeA'>: source
            <class '...CopySupportNodeA'>: a_child
            <class '...CopySupportNodeB'>: b_child
          <class '...CopySupportNodeB'>: target
            <class '...CopySupportNodeB'>: b_child
        """, root.treerepr())

        target.properties.action_paste_tile = 'custom'
        del request.environ['cone.app.continuation']

        paste_tile(target, request)
        self.assertEqual(target.messages, ['Called: target'])
        target.messages = []

        self.assertEqual(
            request.environ['cone.app.continuation'][1].target,
            'http://example.com/target?contenttile=custom'
        )

        self.checkOutput("""
        <class '...CopySupportNodeA'>: None
          <class '...CopySupportNodeA'>: source
            <class '...CopySupportNodeA'>: a_child
            <class '...CopySupportNodeB'>: b_child
          <class '...CopySupportNodeB'>: target
            <class '...CopySupportNodeB'>: b_child
            <class '...CopySupportNodeB'>: b_child-1
        """, root.treerepr())

        cut_url = compat.quote(make_url(request, node=source['b_child']))
        request.cookies['cone.app.copysupport.cut'] = cut_url
        del request.cookies['cone.app.copysupport.copy']
        del request.environ['cone.app.continuation']

        paste_tile(target, request)
        self.assertEqual(target.messages, ['Called: target'])
        self.assertEqual(source.messages, ['Called: source'])
        target.messages = []
        source.messages = []

        self.checkOutput("""
        cone.app.copysupport.cut=; Max-Age=0; Path=/; expires=...
        """, request.response.headers['Set-Cookie'])

        self.checkOutput("""
        <class '...CopySupportNodeA'>: None
          <class '...CopySupportNodeA'>: source
            <class '...CopySupportNodeA'>: a_child
          <class '...CopySupportNodeB'>: target
            <class '...CopySupportNodeB'>: b_child
            <class '...CopySupportNodeB'>: b_child-1
            <class '...CopySupportNodeB'>: b_child-2
        """, root.treerepr())

        cut_url = compat.quote(make_url(request, node=source['a_child']))
        request.cookies['cone.app.copysupport.cut'] = cut_url
        del request.environ['cone.app.continuation']

        paste_tile(target, request)
        self.checkOutput("""
        <class '...CopySupportNodeA'>: None
          <class '...CopySupportNodeA'>: source
            <class '...CopySupportNodeA'>: a_child
          <class '...CopySupportNodeB'>: target
            <class '...CopySupportNodeB'>: b_child
            <class '...CopySupportNodeB'>: b_child-1
            <class '...CopySupportNodeB'>: b_child-2
        """, root.treerepr())

        self.checkOutput("""
        Pasted 0 items<br /><strong>Pasting of 1 items
        failed</strong><br />Violation. 'CopySupportNodeB' is not
        allowed to contain 'CopySupportNodeA'
        """, request.environ['cone.app.continuation'][0].payload)

        cut_url = compat.quote(make_url(request, node=source))
        del request.environ['cone.app.continuation']
        request.cookies['cone.app.copysupport.cut'] = cut_url

        paste_tile(root['source']['a_child'], request)
        self.checkOutput("""
        Pasted 0 items<br /><strong>Pasting of 1 items
        failed</strong><br />Cannot paste cut object to child of it: source
        """, request.environ['cone.app.continuation'][0].payload)

        cut_url = '::'.join([
            compat.quote(make_url(request, node=target['b_child'])),
            compat.quote(make_url(request, node=target['b_child-1'])),
        ])
        request.cookies['cone.app.copysupport.cut'] = cut_url
        del request.environ['cone.app.continuation']

        paste_tile(source, request)
        self.assertEqual(source.messages, ['Called: source'])
        self.assertEqual(target.messages, ['Called: target'])
        source.messages = []
        target.messages = []

        self.checkOutput("""
        <class '...CopySupportNodeA'>: None
          <class '...CopySupportNodeA'>: source
            <class '...CopySupportNodeA'>: a_child
            <class '...CopySupportNodeB'>: b_child
            <class '...CopySupportNodeB'>: b_child-1
          <class '...CopySupportNodeB'>: target
            <class '...CopySupportNodeB'>: b_child-2
        """, root.treerepr())

        root['unknown_source'] = BaseNode()
        root['unknown_target'] = BaseNode()

        cut_url = compat.quote(make_url(request, node=root['unknown_source']))
        request.cookies['cone.app.copysupport.cut'] = cut_url
        del request.environ['cone.app.continuation']

        paste_tile(target, request)
        self.checkOutput("""
        Pasted 0 items<br /><strong>Pasting of 1 items
        failed</strong><br />Cannot paste 'unknown_source'. Unknown source
        """, request.environ['cone.app.continuation'][0].payload)

        cut_url = compat.quote(make_url(request, node=source['b_child']))
        request.cookies['cone.app.copysupport.cut'] = cut_url
        del request.environ['cone.app.continuation']

        paste_tile(root['unknown_target'], request)
        self.checkOutput("""
        Pasted 0 items<br /><strong>Pasting of 1 items
        failed</strong><br />Cannot paste to 'unknown_target'. Unknown target
        """, request.environ['cone.app.continuation'][0].payload)

        del request.cookies['cone.app.copysupport.cut']
        del request.environ['cone.app.continuation']

        paste_tile(root['unknown_target'], request)
        self.assertEqual(
            request.environ['cone.app.continuation'][0].payload,
            u'Nothing to paste'
        )
