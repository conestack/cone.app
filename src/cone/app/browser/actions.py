from odict import odict
from pyramid.security import has_permission
from cone.tile import (
    render_template,
    render_tile,
)
from cone.app.interfaces import (
    IWorkflowState,
    IPrincipalACL,
    ICopySupport,
)
from cone.app.browser.utils import make_url


class ActionContext(object):
    """The action context is used to calculate action scopes. The action scope
    is used by actions to calculate it's own state, i.e. if it is selected,
    displayed or disabled.
    
    The action scope is bound to either the content tile name used in main
    template, or to the requested ajax action name if ajax request.
    
    XXX: Think of better class name.
    """
    
    def __init__(self, model, request, tilename):
        """Created by ``render_mail_template`` and ``ajax_action``.
        
        Instance is wtitten to request.environ['action_context'].
        """
        request.environ['action_context'] = self
        self.model = model
        self.request = request
        self.tilename = tilename
    
    @property
    def scope(self):
        """default_content_tile of application model is returned if recent
        action scope is 'content' and default content tile property found.
        Otherwise tile name is returned as found.
        """
        scope = self.tilename
        if self.request.params.get('bdajax.action'):
            scope = self.request.params.get('bdajax.action')
        if self.model.properties.default_content_tile and scope == 'content':
            scope = self.model.properties.default_content_tile
        return scope


class Toolbar(odict):
    """A toolbar rendering actions.
    """
    display = True
    
    def __call__(self, model, request):
        if not self.display:
            return u''
        ret = u'\n'.join([action(model, request) for action in self.values()])
        ret = ret.strip()
        if not ret:
            return ret
        return u'<div class="toolbar">%s</div>' % ret


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
        return self.request.environ['action_context'].scope
    
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
    overlay=None      # ajax:overlay attribute
    text = None       # link text
    enabled = True    # if false, link gets 'disabled' css class
    selected = False  # if true, link get 'selected' css class
    
    @property
    def css_class(self):
        css = not self.enabled and 'disabled' or ''
        css = self.selected and '%s selected' % css or css
        css = css.strip()
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
    css = 'up16_16'
    title = 'One level up'
    event = 'contextchanged:.contextsensitiv'
    
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
        return make_url(self.request, node=self.model.parent)
    
    href = target


class ActionView(LinkAction):
    """View action.
    """
    css = 'view16_16'
    title = 'View'
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
    
    @property
    def text(self):
        return self.model.metadata.get('title', self.model.name)
    
    @property
    def display(self):
        return self.permitted('view')


class ActionList(LinkAction):
    """Contents listing action.
    """
    css = 'listing16_16'
    title = 'Listing'
    action = 'listing:#content:inner'
    
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
    css = 'sharing16_16'
    title = 'Sharing'
    action = 'sharing:#content:inner'
    
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
    css = 'edit16_16'
    title = 'Edit'
    action = 'edit:#content:inner'
    
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
    css = 'delete16_16'
    title = 'Delete'
    action = 'delete:NONE:NONE'
    confirm = 'Do you really want to delete this Item?'
    
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
    css = 'delete16_16'
    title = 'Delete selected children'
    action = 'delete_children:NONE:NONE'
    confirm = 'Do you really want to delete selected Items?'
    
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
    css = 'cut16_16'
    title = 'Cut'
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
    css = 'copy16_16'
    title = 'Copy'
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
    css = 'paste16_16'
    title = 'Paste'
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