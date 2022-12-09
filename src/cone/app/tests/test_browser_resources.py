from cone.app import get_root
from cone.app import testing
from cone.app.browser import resources
from cone.app.browser.ajax import AjaxEvent
from cone.app.browser.ajax import AjaxPath
from cone.app.model import AppResources
from cone.app.testing import reset_resource_registry
from cone.tile import render_tile
from cone.tile.tests import TileTestCase
from pyramid.config import Configurator
from pyramid.httpexceptions import HTTPFound
from pyramid.static import static_view
from yafowil.base import factory
import functools
import os
import webresource as wr


def np(path):
    return path.replace('/', os.path.sep)


class TestBrowserResources(TileTestCase):
    layer = testing.security

    def test_jquery_resources(self):
        resources_ = resources.jquery_resources
        self.assertTrue(resources_.directory.endswith(np('/static/jquery')))
        self.assertEqual(resources_.name, 'cone.app-jquery')
        self.assertEqual(resources_.path, 'jquery')

        scripts = resources_.scripts
        self.assertEqual(len(scripts), 1)

        self.assertTrue(scripts[0].directory.endswith(np('/static/jquery')))
        self.assertEqual(scripts[0].path, 'jquery')
        self.assertEqual(scripts[0].file_name, 'jquery-3.6.0.min.js')
        self.assertTrue(os.path.exists(scripts[0].file_path))

        styles = resources_.styles
        self.assertEqual(len(styles), 0)

    def test_bootstrap_resources(self):
        resources_ = resources.bootstrap_resources
        self.assertTrue(resources_.directory.endswith(np('/static/bootstrap')))
        self.assertEqual(resources_.name, 'cone.app-bootstrap')
        self.assertEqual(resources_.path, 'bootstrap')

        scripts = resources_.scripts
        self.assertEqual(len(scripts), 1)

        self.assertTrue(scripts[0].directory.endswith(np('/static/bootstrap/js')))
        self.assertEqual(scripts[0].path, 'bootstrap/js')
        self.assertEqual(scripts[0].file_name, 'bootstrap.min.js')
        self.assertTrue(os.path.exists(scripts[0].file_path))

        styles = resources_.styles
        self.assertEqual(len(styles), 2)

        self.assertTrue(styles[0].directory.endswith(np('/static/bootstrap/css')))
        self.assertEqual(styles[0].path, 'bootstrap/css')
        self.assertEqual(styles[0].file_name, 'bootstrap.min.css')
        self.assertTrue(os.path.exists(styles[0].file_path))

        self.assertTrue(styles[1].directory.endswith(np('/static/bootstrap/css')))
        self.assertEqual(styles[1].path, 'bootstrap/css')
        self.assertEqual(styles[1].file_name, 'bootstrap-theme.min.css')
        self.assertTrue(os.path.exists(styles[1].file_path))

    def test_typeahead_resources(self):
        resources_ = resources.typeahead_resources
        self.assertTrue(resources_.directory.endswith(np('/static/typeahead')))
        self.assertEqual(resources_.name, 'cone.app-typeahead')
        self.assertEqual(resources_.path, 'typeahead')

        scripts = resources_.scripts
        self.assertEqual(len(scripts), 1)

        self.assertTrue(scripts[0].directory.endswith(np('/static/typeahead')))
        self.assertEqual(scripts[0].path, 'typeahead')
        self.assertEqual(scripts[0].file_name, 'typeahead.bundle.js')
        self.assertTrue(os.path.exists(scripts[0].file_path))

        styles = resources_.styles
        self.assertEqual(len(styles), 1)

        self.assertTrue(styles[0].directory.endswith(np('/static/typeahead')))
        self.assertEqual(styles[0].path, 'typeahead')
        self.assertEqual(styles[0].file_name, 'typeahead.css')
        self.assertTrue(os.path.exists(styles[0].file_path))

    def test_ionicons_resources(self):
        resources_ = resources.ionicons_resources
        self.assertTrue(resources_.directory.endswith(np('/static/ionicons')))
        self.assertEqual(resources_.name, 'cone.app-ionicons')
        self.assertEqual(resources_.path, 'ionicons')

        scripts = resources_.scripts
        self.assertEqual(len(scripts), 0)

        styles = resources_.styles
        self.assertEqual(len(styles), 1)

        self.assertTrue(styles[0].directory.endswith(np('/static/ionicons/css')))
        self.assertEqual(styles[0].path, 'ionicons/css')
        self.assertEqual(styles[0].file_name, 'ionicons.css')
        self.assertTrue(os.path.exists(styles[0].file_path))

    def test_cone_resources(self):
        resources_ = resources.cone_resources
        self.assertTrue(resources_.directory.endswith(np('/static/cone')))
        self.assertEqual(resources_.name, 'cone.app-cone')
        self.assertEqual(resources_.path, 'cone')

        scripts = resources_.scripts
        self.assertEqual(len(scripts), 2)

        self.assertTrue(scripts[0].directory.endswith(np('/static/cone')))
        self.assertEqual(scripts[0].path, 'cone')
        self.assertEqual(scripts[0].file_name, 'cone.app.public.min.js')
        self.assertTrue(os.path.exists(scripts[0].file_path))

        self.assertTrue(scripts[1].directory.endswith(np('/static/cone')))
        self.assertEqual(scripts[1].path, 'cone')
        self.assertEqual(scripts[1].file_name, 'cone.app.protected.min.js')
        self.assertTrue(os.path.exists(scripts[1].file_path))

        styles = resources_.styles
        self.assertEqual(len(styles), 2)

        self.assertTrue(styles[0].directory.endswith(np('/static/cone')))
        self.assertEqual(styles[0].path, 'cone')
        self.assertEqual(styles[0].file_name, 'cone.app.css')
        self.assertTrue(os.path.exists(styles[0].file_path))

        self.assertTrue(styles[1].directory.endswith(np('/static/cone')))
        self.assertEqual(styles[1].path, 'cone')
        self.assertEqual(styles[1].file_name, 'cone.app.print.css')
        self.assertTrue(os.path.exists(styles[1].file_path))

    @reset_resource_registry
    def test_register_resources_view(self):
        class TestConfigurator:
            def add_view(self, view_path, name, context):
                self.view_path = view_path
                self.name = name
                self.context = context

            def add_directive(self, name, callback):
                setattr(self, name, functools.partial(callback, self))

        config = TestConfigurator()
        resources.ResourceRegistry.initialize(config, {})
        registry = resources._registry

        self.assertFalse(hasattr(resources, 'test_resources_static_view'))

        directory = os.path.join('path', 'to', 'resources')
        registry._register_resources_view(
            config,
            resources,
            'test-resources',
            directory
        )

        self.assertTrue(hasattr(resources, 'test_resources_static_view'))
        self.assertIsInstance(resources.test_resources_static_view, static_view)
        self.assertEqual(
            config.view_path,
            'cone.app.browser.resources.test_resources_static_view'
        )
        self.assertEqual(config.name, 'test-resources')
        self.assertTrue(config.context is AppResources)

        del resources.test_resources_static_view

    @reset_resource_registry
    def test_set_resource_include(self):
        config = Configurator()
        resources.ResourceRegistry.initialize(config, {})

        config.set_resource_include('name-1', True)
        config.set_resource_include('name-2', False)
        self.assertEqual(resources._registry._includes, {
            'name-1': True,
            'name-2': False
        })

    @reset_resource_registry
    def test_configure_default_resource_includes(self):
        addon_resources = wr.ResourceGroup(name='addon', path='test-addon')
        addon_resources.add(wr.ScriptResource(
            name='addon-js',
            resource='addon.js'
        ))
        addon_resources.add(wr.StyleResource(
            name='addon-css',
            resource='addon.css'
        ))
        try:
            factory.push_state()
            factory.register_resources('default', 'addon', addon_resources)

            config = Configurator()
            resources.ResourceRegistry.initialize(config, {})
            config.configure_default_resource_includes()

            includes = resources._registry._includes
            self.assertEqual(includes['addon-css'], 'authenticated')
            self.assertEqual(includes['addon-js'], 'authenticated')
            self.assertEqual(
                includes['cone-app-protected-js'],
                'authenticated'
            )

            settings = {'yafowil.resources_public': 'true'}
            config.configure_default_resource_includes()
            includes = resources._registry._includes
            self.assertEqual(
                includes['cone-app-protected-js'],
                'authenticated'
            )
        finally:
            factory.pop_state()

    @reset_resource_registry
    def test_ResourceInclude(self):
        includes = {
            'authenticated-resource': 'authenticated',
            'excluded-resource': False,
            'included-resource': True
        }

        include = resources.ResourceInclude(includes, 'authenticated-resource')
        self.assertFalse(include())
        with self.layer.authenticated('admin'):
            self.assertTrue(include())

        include = resources.ResourceInclude(includes, 'excluded-resource')
        self.assertFalse(include())

        include = resources.ResourceInclude(includes, 'included-resource')
        self.assertTrue(include())

        include = resources.ResourceInclude(includes, 'any-resource')
        self.assertTrue(include())

    @reset_resource_registry
    def test_configure_resources(self):
        class TestConfigurator:
            views = []

            def add_view(self, view_path, name, context):
                self.views.append(dict(
                    view_path=view_path,
                    name=name,
                    context=context
                ))

            def add_directive(self, name, callback):
                setattr(self, name, functools.partial(callback, self))

        config = TestConfigurator()
        resources.ResourceRegistry.initialize(config, {})
        directory = os.path.join('path', 'to', 'resources')

        test_resources = wr.ResourceGroup(
            name='test-resources',
            directory=directory,
            path='test-resources',
        )
        test_resources.add(wr.ScriptResource(
            name='base-js',
            resource='base.js'
        ))
        # add duplicate resource, gets removed
        test_resources.add(wr.ScriptResource(
            name='base-js',
            resource='duplcate-base.js'
        ))
        config.register_resource(test_resources)

        # add duplicate group, gets removed
        config.register_resource(wr.ResourceGroup(
            name='duplcate-test-resources',
            path='test-resources',
        ))

        # yafowil addon resources
        addon_resources = wr.ResourceGroup(
            name='yafowil-addon-resources',
            directory=directory,
            path='test-addon-resources'
        )
        addon_resources.add(wr.ScriptResource(
            name='addon-js',
            resource='addon.js'
        ))
        addon_resources.add(wr.StyleResource(
            name='addon-css',
            resource='addon.css'
        ))

        try:
            factory.push_state()
            factory.register_resources('default', 'addon', addon_resources)

            self.assertFalse(wr.config.development)

            config.configure_resources(True)

            self.assertTrue(wr.config.development)

            self.assertEqual(config.views[:8], [{
                'view_path': 'cone.app.browser.resources.jquery_static_view',
                'name': 'jquery',
                'context': AppResources
            }, {
                'view_path': 'cone.app.browser.resources.bootstrap_static_view',
                'name': 'bootstrap',
                'context': AppResources
            }, {
                'view_path': 'cone.app.browser.resources.typeahead_static_view',
                'name': 'typeahead',
                'context': AppResources
            }, {
                'view_path': 'cone.app.browser.resources.ionicons_static_view',
                'name': 'ionicons',
                'context': AppResources
            }, {
                'view_path': 'cone.app.browser.resources.cone_static_view',
                'name': 'cone',
                'context': AppResources
            }, {
                'view_path': 'cone.app.browser.resources.test_resources_static_view',
                'name': 'test-resources',
                'context': AppResources
            }, {
                'view_path': 'cone.app.browser.resources.treibstoff_static_view',
                'name': 'treibstoff',
                'context': AppResources
            }, {
                'view_path': 'cone.app.browser.resources.test_addon_resources_static_view',
                'name': 'test-addon-resources',
                'context': AppResources
            }])

            self.assertTrue(hasattr(resources, 'test_resources_static_view'))
            self.assertTrue(hasattr(resources, 'treibstoff_static_view'))
            self.assertTrue(hasattr(resources, 'test_addon_resources_static_view'))

            configured_resources = resources._registry.resources
            self.assertEqual(
                configured_resources.members[5].name,
                'test-resources'
            )
            self.assertEqual(
                configured_resources.members[6].name,
                'treibstoff'
            )
            self.assertEqual(
                configured_resources.members[7].name,
                'yafowil-addon-resources'
            )
            self.assertEqual(len(configured_resources.members[5].members), 1)
            self.assertEqual(
                configured_resources.members[5].members[0].resource,
                'base.js'
            )
        finally:
            if hasattr(resources, 'test_resources_static_view'):
                del resources.test_resources_static_view
            if hasattr(resources, 'treibstoff_static_view'):
                del resources.treibstoff_static_view
            if hasattr(resources, 'test_addon_resources_static_view'):
                del resources.test_addon_resources_static_view
            factory.pop_state()
            wr.config.development = False

    def test_Resources(self):
        model = get_root()
        request = self.layer.new_request()
        res = render_tile(model, request, 'resources')

        self.checkOutput("""
        <!-- stylesheets -->
        <link ...

        <!-- javascripts -->
        <script ...
        """, res)

        self.assertFalse(res.find('cone.app.protected') > -1)

        with self.layer.authenticated('admin'):
            res = render_tile(model, request, 'resources')

        self.assertTrue(res.find('cone.app.protected') > -1)

    def test_resources_view(self):
        model = get_root()
        request = self.layer.new_request()
        res = resources.resources_view(model, request)

        self.assertIsInstance(res, HTTPFound)
        self.assertEqual(res.location, 'http://example.com')

    def test_ResourcesContent(self):
        model = get_root()['resources']
        request = self.layer.new_request()
        render_tile(model, request, 'content')
        continuation = request.environ['cone.app.continuation']

        self.assertEqual(len(continuation), 2)
        self.assertIsInstance(continuation[0], AjaxPath)
        self.assertIsInstance(continuation[1], AjaxEvent)

        self.assertEqual(continuation[0].path, '/')
        self.assertEqual(continuation[0].target, 'http://example.com')
        self.assertEqual(continuation[0].event, 'contextchanged:#layout')

        self.assertEqual(continuation[1].target, 'http://example.com')
        self.assertEqual(continuation[1].name, 'contextchanged')
        self.assertEqual(continuation[1].selector, '#layout')
