from cone.app import get_root
from cone.app.model import Metadata
from cone.app.model import get_node_info
from cone.example import testing
from cone.example.settings.model import ExampleSettings
from cone.tile import render_tile
from cone.tile.tests import TileTestCase
import os
import shutil
import tempfile


class TestSettingsModel(TileTestCase):
    layer = testing.security

    def test_ExampleSettings_node_info(self):
        info = get_node_info('example_settings')
        self.assertEqual(info.name, 'example_settings')
        self.assertEqual(info.icon, 'bi-sliders')

    def test_ExampleSettings(self):
        settings = ExampleSettings()
        settings.__name__ = 'example_settings'
        # Has category
        self.assertIsNotNone(settings.category)
        # Metadata
        md = settings.metadata
        self.assertIsInstance(md, Metadata)

    def test_ExampleSettings_config_properties(self):
        # Set up temp directory for config
        config_dir = tempfile.mkdtemp()
        os.environ['CONE_EXAMPLE_CONFIG_DIR'] = config_dir
        try:
            settings = ExampleSettings()
            settings.__name__ = 'example_settings'
            # Get config properties
            props = settings.config_properties
            # Check default values
            self.assertEqual(props.items_per_page, '15')
            self.assertEqual(props.enable_notifications, 'true')
            self.assertEqual(props.default_language, 'en')
            # Modify a value and save
            props.items_per_page = '20'
            props()  # Save to file
            # Verify the config file was written
            config_path = os.path.join(config_dir, 'example_settings.cfg')
            self.assertTrue(os.path.exists(config_path))
        finally:
            # Clean up
            del os.environ['CONE_EXAMPLE_CONFIG_DIR']
            shutil.rmtree(config_dir)


class TestSettingsBrowser(TileTestCase):
    layer = testing.security

    def test_settings_registered(self):
        root = get_root()
        settings_root = root['settings']
        # ExampleSettings should be registered
        self.assertIn('example_settings', settings_root)
        settings = settings_root['example_settings']
        self.assertIsInstance(settings, ExampleSettings)

    def test_settings_display(self):
        root = get_root()
        settings = root['settings']['example_settings']
        # Settings display requires manager permission
        request = self.layer.new_request()
        self.assertFalse(settings.display)
        with self.layer.authenticated('manager'):
            # With manager auth, display should be True
            self.assertTrue(settings.display)
