from odict import odict
from pyramid.security import has_permission
from cone.tile import (
    render_template,
    render_tile,
)
from cone.app.interfaces import (
    IWorkflowState,
    IPrincipalACL,
)


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
        return has_permission('view', self.model, self.request)
    
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
    href = None       # href attribute
    css = None        # in addition for computed class attribute
    title = None      # title attribute
    action = None     # ajax:action attribute
    event = None      # ajax:event attribute
    confirm = None    # ajax:confirm attribute
    overlay=None      # ajax:overlay attribute
    text = '&nbsp;'   # link text
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
        return self.model.properies.action_view and self.permitted('view')


class ActionList(LinkAction):
    css = 'listing16_16'
    title = 'Listing'
    action = 'listing:#content:inner'
    
    @property
    def href(self):
        return '%s/listing' % self.target
    
    @property
    def display(self):
        return self.model.properies.action_list and self.permitted('view')


class ActionSharing(LinkAction):
    css_class = 'sharing16_16'
    title = 'Sharing'
    action = 'sharing:#content:inner'
    
    @property
    def href(self):
        return '%s/sharing' % self.target
    
    @property
    def display(self):
        if not IPrincipalACL.providedBy(self.model):
            return False
        return self.permitted('manage_permissions')


class ActionState(TileAction):
    tile = 'wf_dropdown'
    
    @property
    def display(self):
        return IWorkflowState.providedBy(self.model)
    
    @property
    def enabled(self):
        return self.permitted('change_state')


class ActionAdd(TileAction):
    tile = 'add_dropdown'
    
    @property
    def display(self):
        return self.permitted('add') and self.model.nodeinfo.addables


class ActionEdit(LinkAction):
    css_class = 'edit16_16'
    title = 'Edit'
    action = 'edit:#content:inner'
    
    @property
    def href(self):
        return '%s/edit' % self.target
    
    @property
    def display(self):
        return self.permitted('edit')


class ActionDelete(LinkAction):
    css_class = 'delete16_16'
    title = 'Delete'
    action = 'delete:NONE:NONE'
    confirm = 'Do you really want to delete this Item?'
    
    @property
    def href(self):
        return '%s/delete' % self.target
    
    @property
    def display(self):
        return self.permitted('delete')


class ActionDeleteChildren(LinkAction):
    css_class = 'delete16_16'
    title = 'Delete selected children'
    bind = None
    
    @property
    def href(self):
        return '%s/delete_children' % self.target
    
    @property
    def display(self):
        return self.permitted('delete')


class ActionCut(LinkAction):
    css_class = 'cut16_16'
    title = 'Cut'
    bind = None
    
    @property
    def href(self):
        return '%s/cut' % self.target
    
    @property
    def display(self):
        return ICopySupport.providedBy(self.model) and self.permitted('cut')


class ActionCopy(LinkAction):
    css_class = 'copy16_16'
    title = 'Copy'
    bind = None
    
    @property
    def href(self):
        return '%s/copy' % self.target
    
    @property
    def display(self):
        return ICopySupport.providedBy(self.model) and self.permitted('copy')


class ActionPaste(LinkAction):
    css_class = 'paste16_16'
    title = 'Paste'
    bind = None
    
    @property
    def href(self):
        return '%s/paste' % self.target
    
    @property
    def display(self):
        return ICopySupport.providedBy(self.model) and self.permitted('paste')
    
    @property
    def enabled(self):
        return self.request.cookies.get('cone.app.copysupport.cut') \
            or self.request.cookies.get('cone.app.copysupport.copy')