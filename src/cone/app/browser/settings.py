from cone.app import DefaultLayoutConfig
from cone.app import layout_config
from cone.app.browser.ajax import AjaxAction
from cone.app.browser.ajax import ajax_form_fiddle
from cone.app.browser.authoring import ContentEditForm
from cone.app.browser.authoring import render_form
from cone.app.browser.utils import make_url
from cone.app.browser.utils import request_property
from cone.app.interfaces import ISettingsNode
from cone.app.model import AppSettings
from cone.app.model import NO_SETTINGS_CATEGORY
from cone.app.model import SettingsNode
from cone.tile import Tile
from cone.tile import render_tile
from cone.tile import tile
from odict import odict
from plumber import Behavior
from plumber import default
from plumber import override
from plumber import plumb
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.i18n import TranslationStringFactory
from pyramid.view import view_config
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
                    'Node {} not implements ``ISettingsNode`` and gets '
                    'ignored as of cone.app 1.2.'.format(child.path),
                    DeprecationWarning
                )
                category = categories.setdefault(self.no_category, [])
            else:
                if not child.display:
                    continue
                category = categories.setdefault(child.category, [])
            category.append({
                'title': child.metadata.title,
                'icon': child.nodeinfo.icon,
                'target': make_url(self.request, node=child),
                'current': child.name == self.model.name
            })
        ret = odict()
        for name in sorted(categories):
            ret[name] = categories[name]
        return ret


@tile(name='settings_sidebar',
      path='templates/settings_sidebar.pt',
      interface=AppSettings,
      permission='view')
@tile(name='settings_sidebar',
      path='templates/settings_sidebar.pt',
      interface=SettingsNode,
      permission='view')
class SettingsSidebar(SettingsTile):
    """Settings sidebar tile."""


@tile(name='content',
      path='templates/settings.pt',
      interface=AppSettings,
      permission='view')
class AppSettings(SettingsTile):
    """Settings content tile."""


@view_config(name='edit', context=SettingsNode, permission='view')
def edit_settings(model, request):
    return render_form(model, request, 'content')


@tile(name='content', interface=SettingsNode, permission='view')
class SettingsEditTile(Tile):
    """Tile rendering editform on settings node to content area."""

    def render(self):
        if not self.model.display:
            raise HTTPUnauthorized()
        return render_tile(self.model, self.request, 'editform')


class SettingsForm(ContentEditForm):
    """Form behavior rendering settings form to content area."""
    show_contextmenu = override(False)

    @override
    @property
    def form_heading(self):
        return self.model.nodeinfo.title

    @plumb
    def prepare(next_, self):
        if not self.model.display:
            raise HTTPUnauthorized()
        next_(self)


class settings_form(tile):
    """Settings form tile decorator."""

    def __init__(self, interface, permission='manage'):
        self.name = 'editform'
        self.path = None
        self.attribute = None
        self.interface = interface
        self.permission = permission
        self.strict = True


class SettingsBehavior(Behavior):
    """Settings node form behavior."""

    @plumb
    def prepare(next_, self):
        warnings.warn(
            '``SettingsBehavior`` is deprecated and will be removed as '
            'of cone.app 1.2. Use ``SettingsEditForm`` instead.',
            DeprecationWarning
        )
        next_(self)
        selector = '#form-{}'.format('-'.join(self.form.path))
        ajax_form_fiddle(self.request, selector, 'replace')

    @default
    def next(self, request):
        url = make_url(request.request, node=self.model)
        selector = '.{}'.format(self.model.name)
        return [AjaxAction(url, 'content', 'inner', selector)]
