from odict import odict
from pyramid.security import has_permission
from pyramid.i18n import TranslationStringFactory
from cone.tile import (
    render_template,
    render_tile,
)
from ..interfaces import (
    IWorkflowState,
    IPrincipalACL,
    ICopySupport,
)
from .utils import make_url

_ = TranslationStringFactory('cone.app')


class ActionContext(object):
    """The action context is used to calculate action scopes. The action scope
    is used by browser actions to calculate it's own state, i.e. if it is
    selected, displayed or disabled.

    The action scope is bound to either the content tile name used in main
    template, or to the requested ajax action name if ajax request.

    XXX: Better class name.
    """

    def __init__(self, model, request, tilename):
        """Created by ``render_mail_template`` and ``ajax_action``.

        Instance is written to request.environ['action_context'].
        """
        request.environ['action_context'] = self
        self.model = model
        self.request = request
        self.tilename = tilename

    @property
    def scope(self):
        scope = self.tilename
        # if bdajax.action found on request, return it as current scope
        if self.request.params.get('bdajax.action'):
            scope = self.request.params.get('bdajax.action')
        model = self.model
        # change model if default child defined
        if model.properties.default_child:
            model = model[model.properties.default_child]
        # change scope if default content rendering and custom default
        # content tile
        if model.properties.default_content_tile and scope == 'content':
            scope = model.properties.default_content_tile
        return scope


class Toolbar(odict):
    """A toolbar rendering actions.
    """
    display = True
    css = None

    def __init__(self, **kw):
        self.__dict__.update(kw)

    def __call__(self, model, request):
        if not self.display:
            return u''
        rendered_actions = list()
        for action in self.values():
            rendered = action(model, request)
            if not rendered:
                continue
            rendered_actions.append(rendered)
        if not rendered_actions:
            return u''
        rendered_actions = u'\n'.join(rendered_actions)
        if not self.css:
            return u'<div>%s</div>' % rendered_actions
        return u'<div class="%s">%s</div>' % (self.css, rendered_actions)


class Action(object):
    """Abstract Action.
    """
    display = True

    def __call__(self, model, request):
        self.model = model
        self.request = request
        if not self.display:
            return u''
        return self.render()

    @property
    def action_scope(self):
        action_context = self.request.environ.get('action_context', None)
        if action_context is None:
            return ''
        return action_context.scope

    def permitted(self, permission):
        return has_permission(permission, self.model, self.request)

    def render(self):
        raise NotImplementedError(u"Abstract ``Action`` does not implement "
                                  u"render.")


class TileAction(Action):
    """Action rendered by a tile.
    """
    tile = u''

    def render(self):
        return render_tile(self.model, self.request, self.tile)


class TemplateAction(Action):
    """Action rendered by a template.
    """
    template = u''

    def render(self):
        return render_template(self.template,
                               request=self.request,
                               model=self.model,
                               context=self)


class DropdownAction(TemplateAction):
    """Action rendering a dropdown.
    """
    template = u'cone.app.browser:templates/dropdown_action.pt'
    href = None
    css = None
    title = None

    @property
    def items(self):
        """Return list of ``cone.app.model.Properties`` instances providing
        attributes ``icon``, ``url``, ``target``, ``action`` and ``title``. 
        """
        raise NotImplementedError(u"Abstract ``DropdownAction`` does not "
                                  u"implement  ``items``")


class LinkAction(TemplateAction):
    """Action rendering a HTML link, optional with bdajax attributes.
    """
    template = 'cone.app.browser:templates/link_action.pt'
    bind = 'click'    # ajax:bind attribute
    id = None         # id attribute
    href = None       # href attribute
    css = None        # in addition for computed class attribute
    title = None      # title attribute
    action = None     # ajax:action attribute
    event = None      # ajax:event attribute
    confirm = None    # ajax:confirm attribute
    overlay = None    # ajax:overlay attribute
    text = None       # link text
    enabled = True    # if false, link gets 'disabled' css class
    selected = False  # if true, link get 'selected' css class
    icon = None       # if set, render <i> tag with value as CSS class on link

    def __init__(self, **kw):
        self.__dict__.update(kw)

    @property
    def css_class(self):
        css = not self.enabled and 'disabled' or ''
        css = self.selected and '%s selected' % css or css
        if self.css:
            css = '%s %s' % (self.css, css)
        css = css.strip()
        return css and css or None

    @property
    def target(self):
        return make_url(self.request, node=self.model)


class ActionUp(LinkAction):
    """One level up action.
    """
    id = 'toolbaraction-up'
    css = ''
    icon = 'glyphicon glyphicon-arrow-up'
    event = 'contextchanged:.contextsensitiv'
    title = _('action_one_level_up', 'One level up')
    text = title

    @property
    def action(self):
        action = self.model.properties.action_up_tile
        if not action:
            action = 'listing'
        return '%s:#content:inner' % action

    @property
    def display(self):
        return self.model.properties.action_up \
            and has_permission('view', self.model.parent, self.request) \
            and self.permitted('view')

    @property
    def target(self):
        container = self.model.parent
        default_child = container.properties.default_child
        if default_child and self.model.name == default_child:
            container = container.parent
        return make_url(self.request, node=container)

    href = target


class ActionView(LinkAction):
    """View action.
    """
    id = 'toolbaraction-view'
    css = ''
    icon = 'glyphicon glyphicon-eye-open'
    title = _('action_view', 'View')
    text = title
    href = LinkAction.target

    @property
    def action(self):
        contenttile = 'content'
        if self.model.properties.default_content_tile:
            contenttile = 'view'
        return '%s:#content:inner' % contenttile

    @property
    def display(self):
        return self.model.properties.action_view and self.permitted('view')

    @property
    def selected(self):
        if self.model.properties.default_content_tile:
            return self.action_scope == 'view'
        return self.action_scope == 'content'


class ViewLink(ActionView):
    """View link
    """
    css = None
    icon = None

    @property
    def text(self):
        return self.model.metadata.get('title', self.model.name)

    @property
    def display(self):
        return self.permitted('view')


class ActionList(LinkAction):
    """Contents listing action.
    """
    id = 'toolbaraction-list'
    css = ''
    icon = 'glyphicon glyphicon-th-list'
    action = 'listing:#content:inner'
    title = _('action_listing', 'Listing')
    text = title

    @property
    def href(self):
        return '%s/listing' % self.target

    @property
    def display(self):
        return self.model.properties.action_list and self.permitted('view')

    @property
    def selected(self):
        return self.action_scope == 'listing'


class ActionSharing(LinkAction):
    """Sharing action.
    """
    id = 'toolbaraction-share'
    css = ''
    icon = 'glyphicon glyphicon-share'
    action = 'sharing:#content:inner'
    title = _('action_sharing', 'Sharing')
    text = title

    @property
    def href(self):
        return '%s/sharing' % self.target

    @property
    def display(self):
        return IPrincipalACL.providedBy(self.model) \
            and self.permitted('manage_permissions')

    @property
    def selected(self):
        return self.action_scope == 'sharing'


class ActionState(TileAction):
    """Change state action.
    """
    tile = 'wf_dropdown'

    @property
    def display(self):
        return IWorkflowState.providedBy(self.model) \
            and self.permitted('change_state')


class ActionAdd(TileAction):
    """Add dropdown action.
    """
    tile = 'add_dropdown'

    @property
    def display(self):
        return self.permitted('add') \
            and self.model.nodeinfo.addables \
            and self.action_scope == 'listing'


class ActionEdit(LinkAction):
    """Edit action.
    """
    id = 'toolbaraction-edit'
    css = ''
    icon = 'glyphicon glyphicon-pencil'
    action = 'edit:#content:inner'
    title = _('action_edit', 'Edit')
    text = title

    @property
    def href(self):
        return '%s/edit' % self.target

    @property
    def display(self):
        return self.model.properties.action_edit and self.permitted('edit')

    @property
    def selected(self):
        return self.action_scope == 'edit'


class ActionDelete(LinkAction):
    """Delete action.
    """
    id = 'toolbaraction-delete'
    css = ''
    icon = 'glyphicon glyphicon-remove'
    action = 'delete:NONE:NONE'
    confirm = _('delete_item_confirm',
                'Do you really want to delete this Item?')
    title = _('action_delete', 'Delete')
    text = title

    @property
    def href(self):
        return '%s/delete' % self.target

    @property
    def display(self):
        # XXX: scope in subclass for contextmenu
        scope = self.action_scope == 'content'
        if self.model.properties.default_content_tile:
            scope = self.action_scope == 'view'
        return self.model.properties.action_delete \
            and has_permission('delete', self.model.parent, self.request) \
            and self.permitted('delete') \
            and scope


class ActionDeleteChildren(LinkAction):
    """Delete children action.
    """
    id = 'toolbaraction-delete-children'
    css = ''
    icon = 'glyphicon glyphicon-remove'
    action = 'delete_children:NONE:NONE'
    confirm = _('delete_items_confirm',
                'Do you really want to delete selected Items?')
    title = _('action_delete_selected_children', 'Delete selected children')
    text = title

    @property
    def href(self):
        return '%s/delete_children' % self.target

    @property
    def display(self):
        return self.model.properties.action_delete_children \
            and self.permitted('delete')

    @property
    def enabled(self):
        return self.request.cookies.get('cone.app.selected')


class ActionCut(LinkAction):
    """Cut children action.
    """
    id = 'toolbaraction-cut'
    css = ''
    icon = 'glyphicon glyphicon-cut'
    title = _('action_cut', 'Cut')
    text = title
    bind = None

    @property
    def href(self):
        return '%s/cut' % self.target

    @property
    def display(self):
        return ICopySupport.providedBy(self.model) \
            and self.model.supports_cut \
            and self.permitted('cut') \
            and self.action_scope == 'listing'


class ActionCopy(LinkAction):
    """Copy children action.
    """
    id = 'toolbaraction-copy'
    css = ''
    icon = 'glyphicon glyphicon-copy'
    title = _('action_copy', 'Copy')
    text = title
    bind = None

    @property
    def href(self):
        return '%s/copy' % self.target

    @property
    def display(self):
        return ICopySupport.providedBy(self.model) \
            and self.model.supports_copy \
            and self.permitted('copy') \
            and self.action_scope == 'listing'


class ActionPaste(LinkAction):
    """Paste children action.
    """
    id = 'toolbaraction-paste'
    css = ''
    icon = 'glyphicon glyphicon-paste'
    title = _('action_paste', 'Paste')
    text = title
    bind = None

    @property
    def href(self):
        return '%s/paste' % self.target

    @property
    def display(self):
        return ICopySupport.providedBy(self.model) \
            and self.model.supports_paste \
            and self.permitted('paste') \
            and self.action_scope == 'listing'

    @property
    def enabled(self):
        return self.request.cookies.get('cone.app.copysupport.cut') \
            or self.request.cookies.get('cone.app.copysupport.copy')
