from cone.app.browser.actions import ActionAdd
from cone.app.browser.actions import ActionCopy
from cone.app.browser.actions import ActionCut
from cone.app.browser.actions import ActionDelete
# from cone.app.browser.actions import ActionDeleteChildren
from cone.app.browser.actions import ActionEdit
from cone.app.browser.actions import ActionList
from cone.app.browser.actions import ActionPaste
from cone.app.browser.actions import ActionSharing
from cone.app.browser.actions import ActionState
from cone.app.browser.actions import ActionUp
from cone.app.browser.actions import ActionView
from cone.app.browser.actions import LinkAction
from cone.app.browser.actions import TemplateAction
from cone.app.browser.actions import Toolbar
from cone.tile import Tile
from cone.tile import render_template
from cone.tile import tile
from odict import odict
from pyramid.i18n import TranslationStringFactory


_ = TranslationStringFactory('cone.app')


class ContextMenuToolbar(Toolbar):
    css = u'nav-item py-2'

    def __call__(self, model, request):
        if not self.display:
            return ''
        rendered_actions = list()
        for action in self.values():
            rendered = action(model, request)
            if not rendered:
                continue
            # expect correct markup if no link action
            if not isinstance(action, LinkAction):
                rendered_actions.append(rendered)
                continue
            # wrap link action in list item
            rendered_actions.append(
                f'<li class="nav-item py-2">{rendered}</li>'
            )
        if not rendered_actions:
            return ''
        rendered_actions = '\n'.join(rendered_actions)
        if not self.css:
            return f'<li>{rendered_actions}</li>'
        return f'<li class="{self.css}">{rendered_actions}</li>'


class ContextMenuDropdown(Toolbar):
    template = 'cone.app.browser:templates/contextmenu_dropdown.pt'
    icon = None
    title = None

    @property
    def display(self):
        for val in self.values():
            val.model = self.model
            val.request = self.request
            if val.display:
                return True
        return False

    def __call__(self, model, request):
        self.model = model
        self.request = request
        if not self.display:
            return u''
        return render_template(
            self.template,
            request=request,
            model=model,
            context=self
        )

    def __setitem__(self, name, value):
        if not isinstance(value, TemplateAction):
            raise ValueError(
                'Only ``TemplateAction`` deriving objects can be '
                'added to ``ContextMenuDropdown`` instances.'
            )
        super().__setitem__(name, value)


# context menu group registry
context_menu = odict()


class context_menu_group(object):
    """Decorator defining a context menu group."""

    def __init__(self, name):
        self.name = name

    def __call__(self, factory):
        context_menu[self.name] = factory()
        return factory


class context_menu_item(object):
    """Decorator defining a context menu item inside a group."""

    def __init__(self, group, name):
        self.group = group
        self.name = name

    def __call__(self, factory):
        context_menu[self.group][self.name] = factory()
        return factory


@context_menu_group(name='navigation')
class NavigationToolbar(ContextMenuToolbar):
    """Context menu navigation toolbar."""


@context_menu_item(group='navigation', name='up')
class ContextMenuActionUp(ActionUp):
    css = 'nav-link'


@context_menu_group(name='contentviews')
class ContentViewsDropdown(ContextMenuDropdown):
    """Context menu content views dropdown."""
    title = _('display', default=u'Display')


@context_menu_item(group='contentviews', name='list')
class ContextMenuActionList(ActionList):
    css = 'dropdown-item'
    selected_css = 'active'


@context_menu_item(group='contentviews', name='view')
class ContextMenuActionView(ActionView):
    css = 'dropdown-item'
    selected_css = 'active'


@context_menu_item(group='contentviews', name='edit')
class ContextMenuActionEdit(ActionEdit):
    css = 'dropdown-item'
    selected_css = 'active'


@context_menu_item(group='contentviews', name='sharing')
class ContextMenuActionSharing(ActionSharing):
    css = 'dropdown-item'
    selected_css = 'active'


@context_menu_group(name='childactions')
class ChildActionsDropdown(ContextMenuDropdown):
    """Context menu content views dropdown."""
    title = _('actions', default=u'Actions')


@context_menu_item(group='childactions', name='cut')
class ContextMenuActionCut(ActionCut):
    css = 'dropdown-item'
    selected_css = 'active'


@context_menu_item(group='childactions', name='copy')
class ContextMenuActionCopy(ActionCopy):
    css = 'dropdown-item'
    selected_css = 'active'


@context_menu_item(group='childactions', name='paste')
class ContextMenuActionPaste(ActionPaste):
    css = 'dropdown-item'
    selected_css = 'active'


#@context_menu_item(group='childactions', name='delete')
#class ContextMenuActionDeleteChildren(ActionDeleteChildren):
#    css = 'dropdown-item'


@context_menu_group(name='contextactions')
class ContextActionsToolbar(ContextMenuToolbar):
    """Context menu navigation toolbar."""


@context_menu_item(group='contextactions', name='change_state')
class ContextMenuActionState(ActionState):
    ...


@context_menu_item(group='contextactions', name='add')
class ContextMenuActionAdd(ActionAdd):
    ...


@context_menu_item(group='contextactions', name='delete')
class ContextMenuActionDelete(ActionDelete):
    ...


@tile(name='contextmenu', path='templates/contextmenu.pt', permission='view')
class ContextMenu(Tile):

    @property
    def rendered_toolbars(self):
        rendered_toolbars = []
        for toolbar in context_menu.values():
            rendered_toolbar = toolbar(self.model, self.request)
            if rendered_toolbar:
                rendered_toolbars.append(rendered_toolbar)
        return rendered_toolbars
