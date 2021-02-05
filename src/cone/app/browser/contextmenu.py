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
from cone.app.browser.actions import Toolbar
from cone.tile import Tile
from cone.tile import render_template
from cone.tile import tile
from odict import odict
from pyramid.i18n import TranslationStringFactory


_ = TranslationStringFactory('cone.app')


class ContextMenuToolbar(Toolbar):

    def __call__(self, model, request):
        if not self.display:
            return u''
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
            if action.selected:
                rendered = u'<li class="active">%s</li>' % rendered
            else:
                rendered = u'<li>%s</li>' % rendered
            rendered_actions.append(rendered)
        if not rendered_actions:
            return u''
        rendered_actions = u'\n'.join(rendered_actions)
        css = u'nav navbar-nav'
        if self.css:
            css += ' ' + self.css
        return u'<ul class="%s">%s</ul>' % (css, rendered_actions)


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
        return render_template(
            self.template,
            request=request,
            model=model,
            context=self
        )

    def __setitem__(self, name, value):
        if not isinstance(value, LinkAction):
            raise ValueError(u'Only ``LinkAction`` deriving objects can be '
                             u'added to ``ContextMenuDropdown`` instances.')
        super(ContextMenuDropdown, self).__setitem__(name, value)


# context menu group registry
context_menu = odict()


class context_menu_group(object):
    """Decorator defining a context menu group.
    """

    def __init__(self, name):
        self.name = name

    def __call__(self, factory):
        context_menu[self.name] = factory()
        return factory


class context_menu_item(object):
    """Decorator defining a context menu item inside a group.
    """

    def __init__(self, group, name):
        self.group = group
        self.name = name

    def __call__(self, factory):
        context_menu[self.group][self.name] = factory()
        return factory


@context_menu_group(name='navigation')
class NavigationToolbar(ContextMenuToolbar):
    """Context menu navigation toolbar.
    """


context_menu_item(group='navigation', name='up')(ActionUp)


@context_menu_group(name='contentviews')
class ContentViewsDropdown(ContextMenuDropdown):
    """Context menu content views dropdown.
    """
    title = _('display', default=u'Display')


context_menu_item(group='contentviews', name='list')(ActionList)
context_menu_item(group='contentviews', name='view')(ActionView)
context_menu_item(group='contentviews', name='edit')(ActionEdit)
context_menu_item(group='contentviews', name='sharing')(ActionSharing)


@context_menu_group(name='childactions')
class ChildActionsDropdown(ContextMenuDropdown):
    """Context menu content views dropdown.
    """
    title = _('actions', default=u'Actions')


context_menu_item(group='childactions', name='cut')(ActionCut)
context_menu_item(group='childactions', name='copy')(ActionCopy)
context_menu_item(group='childactions', name='paste')(ActionPaste)
# context_menu_item(group='childactions', name='delete')(ActionDeleteChildren)


@context_menu_group(name='contextactions')
class ContextActionsToolbar(ContextMenuToolbar):
    """Context menu navigation toolbar.
    """


context_menu_item(group='contextactions', name='change_state')(ActionState)
context_menu_item(group='contextactions', name='add')(ActionAdd)
context_menu_item(group='contextactions', name='delete')(ActionDelete)


@tile(name='contextmenu', path='templates/contextmenu.pt', permission='view')
class ContextMenu(Tile):

    @property
    def toolbars(self):
        return context_menu.values()
