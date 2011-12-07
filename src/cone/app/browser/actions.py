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


class Toolbar(odict):
    display = True
    
    def __call__(self, model, request):
        if not self.display:
            return u''
        return '\n'.join([action(model, request) for action in self.values()])


class Action(object):
    display = True
    
    def __call__(self, model, request):
        self.model = model
        self.request = request
        if not self.display:
            return u''
        return self.render()
    
    def permitted(self, permission):
        return has_permission(permission, self.model, self.request)
    
    def render(self):
        raise NotImplementedError(u"Abstract ``Action`` does not implement "
                                  u"render.")


class TileAction(Action):
    tile = u''
    
    def render(self):
        return render_tile(self.model, self.request, self.tile)


class TemplateAction(Action):
    template = u''
    
    def render(self):
        return render_template(self.template,
                               request=self.request,
                               model=self.model,
                               context=self)


class LinkAction(TemplateAction):
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
    
    @property
    def css_class(self):
        css = not self.enabled and 'disabled' or ''
        if self.css:
            css = '%s %s' % (self.css, css)
        css = css.strip()
        return css and css or None
    
    @property
    def target(self):
        return make_url(self.request, node=self.model)


class ActionUp(LinkAction):
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
    css = 'view16_16'
    title = 'View'
    action = 'content:#content:inner'
    href = LinkAction.target
    
    @property
    def display(self):
        return self.model.properties.action_view and self.permitted('view')


class ViewLink(ActionView):
    css = None
    
    @property
    def text(self):
        return self.model.metadata.get('title', self.model.name)
    
    @property
    def display(self):
        return self.permitted('view')


class ActionList(LinkAction):
    css = 'listing16_16'
    title = 'Listing'
    action = 'listing:#content:inner'
    
    @property
    def href(self):
        return '%s/listing' % self.target
    
    @property
    def display(self):
        return self.model.properties.action_list and self.permitted('view')


class ActionSharing(LinkAction):
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


class ActionState(TileAction):
    tile = 'wf_dropdown'
    
    @property
    def display(self):
        return IWorkflowState.providedBy(self.model) \
            and self.permitted('change_state')


class ActionAdd(TileAction):
    tile = 'add_dropdown'
    
    @property
    def display(self):
        return self.permitted('add') and self.model.nodeinfo.addables


class ActionEdit(LinkAction):
    css = 'edit16_16'
    title = 'Edit'
    action = 'edit:#content:inner'
    
    @property
    def href(self):
        return '%s/edit' % self.target
    
    @property
    def display(self):
        return self.model.properties.action_edit and self.permitted('edit')


class ActionDelete(LinkAction):
    css = 'delete16_16'
    title = 'Delete'
    action = 'delete:NONE:NONE'
    confirm = 'Do you really want to delete this Item?'
    
    @property
    def href(self):
        return '%s/delete' % self.target
    
    @property
    def display(self):
        return self.model.properties.action_delete \
            and has_permission('delete', self.model.parent, self.request) \
            and self.permitted('delete')


class ActionDeleteChildren(LinkAction):
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
            and self.permitted('cut')


class ActionCopy(LinkAction):
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
            and self.permitted('copy')


class ActionPaste(LinkAction):
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
            and self.permitted('paste')
    
    @property
    def enabled(self):
        return self.request.cookies.get('cone.app.copysupport.cut') \
            or self.request.cookies.get('cone.app.copysupport.copy')