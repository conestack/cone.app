from cone.app.browser.utils import make_query
from cone.app.browser.utils import make_url
from cone.app.interfaces import ICopySupport
from cone.app.interfaces import IPrincipalACL
from cone.app.interfaces import IWorkflowState
from cone.tile import render_template
from cone.tile import render_tile
from node.interfaces import IOrder
from odict import odict
from pyramid.i18n import TranslationStringFactory


_ = TranslationStringFactory('cone.app')


def get_action_context(request):
    return request.environ['action_context']


class ActionContext(object):
    """The action context is used to determine action scopes. The action scope
    is used by browser actions to check it's own state, e.g. if action button
    is selected, disabled or displayed at all.
    """

    def __init__(self, model, request, tilename):
        self.model = model
        self.request = request
        self.tilename = tilename
        request.environ['action_context'] = self

    @property
    def scope(self):
        model = self.model
        request = self.request
        scope = self.tilename
        # if ``bdajax.action`` found on request, use it as current scope
        if 'bdajax.action' in request.params:
            scope = request.params['bdajax.action']
        # if action is ``layout``, content tile name is passed
        if scope == 'layout':
            scope = request.params.get('contenttile', 'content')
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
        return self.request.has_permission(permission, self.model)

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
        return render_template(
            self.template,
            request=self.request,
            model=self.model,
            context=self
        )


class DropdownAction(TemplateAction):
    """Action rendering a dropdown.
    """
    template = u'cone.app.browser:templates/action_dropdown.pt'
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
    bind = 'click'       # ajax:bind attribute
    id = None            # id attribute
    href = '#'           # href attribute
    css = None           # in addition for computed class attribute
    title = None         # title attribute
    action = None        # ajax:action attribute
    event = None         # ajax:event attribute
    confirm = None       # ajax:confirm attribute
    overlay = None       # ajax:overlay attribute
    path = None          # ajax:path attribute
    path_target = None   # ajax:path-target attribute
    path_action = None   # ajax:path-action attribute
    path_event = None    # ajax:path-event attribute
    path_overlay = None  # ajax:path-overlay attribute
    text = None          # link text
    enabled = True       # if false, link gets 'disabled' css class
    selected = False     # if true, link get 'selected' css class
    icon = None          # if set, add span tag with value as CSS class in link

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


class ButtonAction(TemplateAction):
    """Action rendering a HTML button, optional with bdajax attributes.
    """
    template = 'cone.app.browser:templates/button_action.pt'
    bind = 'click'         # ajax:bind attribute
    id = None              # id attribute
    css = None             # in addition for computed class attribute
    title = None           # title attribute
    type = None            # type of button
    name = None            # name for the button
    value = None           # initial value for the button
    autofocus = None       # button gets focus on page load
    disabled = None        # button should be disabled
    form = None            # form the button belongs to
    formaction = None      # where to send the data when form is submitted
    formenctype = None     # how form-data should be encoded before sending
    formmethod = None      # specifies http method
    formnovalidate = None  # data should not be validated on submission
    formtarget = None      # where to display response after form submission
    action = None          # ajax:action attribute
    event = None           # ajax:event attribute
    confirm = None         # ajax:confirm attribute
    overlay = None         # ajax:overlay attribute
    path = None            # ajax:path attribute
    path_target = None     # ajax:path-target attribute
    path_action = None     # ajax:path-action attribute
    path_event = None      # ajax:path-event attribute
    path_overlay = None    # ajax:path-overlay attribute
    text = None            # button text
    icon = None            # if set, add i tag with value as CSS class

    def __init__(self, **kw):
        self.__dict__.update(kw)

    @property
    def target(self):
        return make_url(self.request, node=self.model)


class ActionUp(LinkAction):
    """One level up action.
    """
    id = 'toolbaraction-up'
    icon = 'glyphicon glyphicon-arrow-up'
    event = 'contextchanged:#layout'
    text = _('action_one_level_up', default='One level up')
    path = 'href'

    @property
    def display(self):
        return self.model.properties.action_up \
            and self.request.has_permission('view', self.model.parent) \
            and self.permitted('view')

    @property
    def href(self):
        return make_url(self.request, node=self.container)

    @property
    def target(self):
        contenttile = self.model.properties.action_up_tile
        if not contenttile:
            contenttile = 'listing'
        query = make_query(contenttile=contenttile)
        return make_url(self.request, node=self.container, query=query)

    @property
    def container(self):
        container = self.model.parent
        default_child = container.properties.default_child
        if default_child and self.model.name == default_child:
            container = container.parent
        return container


class ActionView(LinkAction):
    """View action.
    """
    id = 'toolbaraction-view'
    icon = 'glyphicon glyphicon-eye-open'
    text = _('action_view', default='View')
    href = LinkAction.target
    path = 'href'

    @property
    def action(self):
        # XXX: use layout:#layout:replace
        # XXX: consider related view if set?
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
    icon = 'glyphicon glyphicon-th-list'
    action = 'listing:#content:inner'
    path = 'href'
    text = _('action_listing', default='Listing')

    @property
    def href(self):
        return '{}/listing'.format(make_url(self.request, node=self.model))

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
    icon = 'glyphicon glyphicon-share'
    action = 'sharing:#content:inner'
    path = 'href'
    text = _('action_sharing', default='Sharing')

    @property
    def href(self):
        return '{}/sharing'.format(make_url(self.request, node=self.model))

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
        return self.permitted('add') and self.model.nodeinfo.addables


class ActionEdit(LinkAction):
    """Edit action.
    """
    id = 'toolbaraction-edit'
    icon = 'glyphicon glyphicon-pencil'
    action = 'edit:#content:inner'
    path = 'href'
    text = _('action_edit', default='Edit')

    @property
    def href(self):
        return '{}/edit'.format(make_url(self.request, node=self.model))

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
    icon = 'ion-trash-a'
    action = 'delete:NONE:NONE'
    confirm = _('delete_item_confirm',
                default='Do you really want to delete this Item?')
    text = _('action_delete', default='Delete')

    @property
    def display(self):
        # XXX: scope in subclass for contextmenu
        scope = self.action_scope == 'content'
        if self.model.properties.default_content_tile:
            scope = self.action_scope == 'view'
        return self.model.properties.action_delete \
            and self.permitted('delete') \
            and scope


class ActionDeleteChildren(LinkAction):
    """Delete children action.
    """
    id = 'toolbaraction-delete-children'
    icon = 'ion-trash-a'
    action = 'delete_children:NONE:NONE'
    confirm = _('delete_items_confirm',
                default='Do you really want to delete selected Items?')
    text = _('action_delete_selected_children',
             default='Delete selected children')

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
    icon = 'ion-scissors'
    text = _('action_cut', default='Cut')
    bind = None

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
    icon = 'ion-ios7-copy-outline'
    text = _('action_copy', default='Copy')
    bind = None

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
    icon = 'ion-clipboard'
    text = _('action_paste', default='Paste')
    bind = None

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


class _ActionMove(LinkAction):
    """Basic move action.
    """

    @property
    def display(self):
        if self.request.params.get('sort'):
            return False
        parent = self.model.parent
        return parent.properties.action_move \
            and IOrder.providedBy(parent) \
            and self.request.has_permission('change_order', parent)

    @property
    def target(self):
        request = self.request
        query = make_query(
            b_page=request.params.get('b_page'),
            size=request.params.get('size')
        )
        return make_url(self.request, node=self.model, query=query)


class ActionMoveUp(_ActionMove):
    """Move up action.
    """
    id = 'toolbaraction-move-up'
    icon = 'glyphicon glyphicon-chevron-up'
    action = 'move_up:NONE:NONE'
    text = _('move_up', default='Move up')

    @property
    def display(self):
        if not super(ActionMoveUp, self).display:
            return False
        return self.model.parent.first_key != self.model.name


class ActionMoveDown(_ActionMove):
    """Move down action.
    """
    id = 'toolbaraction-move-down'
    icon = 'glyphicon glyphicon-chevron-down'
    action = 'move_down:NONE:NONE'
    text = _('move_down', default='Move down')

    @property
    def display(self):
        if not super(ActionMoveDown, self).display:
            return False
        return self.model.parent.last_key != self.model.name
