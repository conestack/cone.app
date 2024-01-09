from cone.app import DefaultLayoutConfig
from cone.app import layout_config
from cone.app.browser.ajax import AjaxAction
from cone.app.browser.ajax import ajax_form_fiddle
from cone.app.browser.utils import make_url
from cone.app.browser.utils import request_property
from cone.app.interfaces import ISettingsNode
from cone.app.model import AppSettings
from cone.app.model import NO_SETTINGS_CATEGORY
from cone.app.model import SettingsNode
from cone.tile import Tile
from cone.tile import tile
from odict import odict
from plumber import Behavior
from plumber import default
from plumber import plumb
from pyramid.i18n import TranslationStringFactory
import warnings


_ = TranslationStringFactory('cone.app')


@layout_config(AppSettings)
@layout_config(SettingsNode)
class SettingsLayoutConfig(DefaultLayoutConfig):

    def __init__(self, model=None, request=None):
        super(SettingsLayoutConfig, self).__init__(model=model, request=request)
        self.sidebar_left = ['settings_sidebar']


class SettingsTile(Tile):
    no_category = NO_SETTINGS_CATEGORY

    @request_property
    def categorized_children(self):
        categories = dict()
        for child in self.model.root['settings'].values():
            if not ISettingsNode.providedBy(child):
                warnings.warn(
                    (
                        'Node {} not implements ``ISettingsNode`` '
                        'and gets ignored as of cone.app 1.2.'
                    ).format(child.path),
                    DeprecationWarning
                )
                category = categories.setdefault(self.no_category, [])
            else:
                category = categories.setdefault(child.category, [])
            category.append({
                'title': child.metadata.title,
                'icon': child.nodeinfo.icon,
                'target': make_url(self.request, node=child)
            })
        ret = odict()
        for name in sorted(categories):
            ret[name] = categories[name]
        return ret


@tile(name='settings_sidebar',
      path='templates/settings_sidebar.pt',
      interface=AppSettings,
      permission='manage')
@tile(name='settings_sidebar',
      path='templates/settings_sidebar.pt',
      interface=SettingsNode,
      permission='manage')
class SettingsSidebar(SettingsTile):
    """Settings sidebar tile."""


@tile(name='content',
      path='templates/settings.pt',
      interface=AppSettings,
      permission='manage')
@tile(name='content',
      path='templates/settings.pt',
      interface=SettingsNode,
      permission='manage')
class AppSettings(SettingsTile):
    """Settings content tile."""


class SettingsForm(Behavior):
    """Settings node form behavior."""

    @plumb
    def prepare(_next, self):
        _next(self)
        selector = '#form-{}'.format('-'.join(self.form.path))
        ajax_form_fiddle(self.request, selector, 'replace')

    @default
    def next(self, request):
        url = make_url(request.request, node=self.model)
        selector = '.{}'.format(self.model.name)
        return [AjaxAction(url, 'content', 'inner', selector)]


# B/C removed as of cone.app 1.2
SettingsBehavior = SettingsForm
