from cone.app.model import ConfigProperties
from cone.app.model import Metadata
from cone.app.model import SettingsNode
from cone.app.model import node_info
from cone.example.model import _
from node.utils import instance_property
import os
import tempfile


@node_info(
    name='example_settings',
    title=_('example_settings', default='Example Settings'),
    description=_('example_settings_desc',
                  default='Configure example application settings'),
    icon='bi-sliders')
class ExampleSettings(SettingsNode):
    """Settings node demonstrating ConfigProperties.

    ConfigProperties persists settings to a config file using ConfigParser.
    The settings_form decorator (in browser.py) creates the edit form tile.
    """
    category = _('example_category', default='Example')

    @instance_property
    def config_properties(self):
        config_dir = os.environ.get(
            'CONE_EXAMPLE_CONFIG_DIR',
            os.path.join(tempfile.gettempdir(), 'cone_example')
        )
        os.makedirs(config_dir, exist_ok=True)
        config_path = os.path.join(config_dir, 'example_settings.cfg')
        return ConfigProperties(config_path, data={
            'items_per_page': '15',
            'enable_notifications': 'true',
            'default_language': 'en',
        })

    @instance_property
    def metadata(self):
        md = Metadata()
        md.title = self.nodeinfo.title
        md.description = self.nodeinfo.description
        return md
