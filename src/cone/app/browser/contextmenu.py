from cone.app.browser.actions import ActionAdd
from cone.app.browser.actions import ActionCopy
from cone.app.browser.actions import ActionCut
from cone.app.browser.actions import ActionDelete
from cone.app.browser.actions import ActionDeleteChildren
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
        self.model= model
        self.request = request
        return render_template(self.template,
                               request=request,
                               model=model,
                               context=self)

    def __setitem__(self, name, value):
        if not isinstance(value, LinkAction):
            raise ValueError(u'Only ``LinkAction`` deriving objects can be '
                             u'added to ``ContextMenuDropdown`` instances.')
        super(ContextMenuDropdown, self).__setitem__(name, value)


context_menu = odict()

context_menu['navigation'] = ContextMenuToolbar()
context_menu['navigation']['up'] = ActionUp()

contentviews_title = _('display', default=u'Display')
context_menu['contentviews'] = ContextMenuDropdown(title=contentviews_title)
context_menu['contentviews']['list'] = ActionList()
context_menu['contentviews']['view'] = ActionView()
context_menu['contentviews']['edit'] = ActionEdit()
context_menu['contentviews']['sharing'] = ActionSharing()

childactions_title = _('actions', default=u'Actions')
context_menu['childactions'] = ContextMenuDropdown(title=childactions_title)
context_menu['childactions']['cut'] = ActionCut()
context_menu['childactions']['copy'] = ActionCopy()
context_menu['childactions']['paste'] = ActionPaste()
#context_menu['childactions']['delete'] = ActionDeleteChildren()

context_menu['contextactions'] = ContextMenuToolbar()
context_menu['contextactions']['change_state'] = ActionState()
context_menu['contextactions']['add'] = ActionAdd()
context_menu['contextactions']['delete'] = ActionDelete()


@tile('contextmenu', 'templates/contextmenu.pt', permission='view')
class ContextMenu(Tile):

    @property
    def toolbars(self):
        return context_menu.values()
