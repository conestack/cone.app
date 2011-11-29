from odict import odict
from cone.tile import (
    tile,
    Tile,
)
from cone.app.browser.utils import make_url


@tile('contextmenu', 'templates/contextmenu.pt', permission='view')
class ContextMenu(Tile):
    
    @property
    def sections(self):
        sections = list()
        for factory in context_menu_sections.values():
            sections.append(factory(self.model, self.request))
        return sections


class ContextAction(object):
    type = 'direct'
    bind = 'click'
    href = None
    css_class = None
    title = None
    target = None
    event = None
    action = None
    confirm = None
    tile = None
    display = True
    enabled = True
    
    @property
    def target(self):
        return make_url(self.request, node=self.model)
    
    @property
    def css(self):
        css = not self.enabled and 'disabled' or ''
        if self.css_class:
            css = '%s %s' % (self.css_class, css)
        css = css.strip()
        return css and css or None
    
    def __init__(self, model, request):
        self.model = model
        self.request = request


class ContextActionsSection(object):
    factories = odict()
    display = True
    
    def __init__(self, model, request):
        self.model = model
        self.request = request
    
    @property
    def actions(self):
        actions = list()
        for factory in self.factories.values():
            actions.append(factory(self.model, self.request))
        return actions


class ActionUp(ContextAction):
    css_class = 'up16_16'
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
        return self.model.properties.action_up
    
    @property
    def target(self):
        return make_url(self.request, node=self.model.parent)
    
    href = target


class ActionView(ContextAction):
    css_class = 'view16_16'
    title = 'View'
    action = 'content:#content:inner'
    href = ContextAction.target
    
    @property
    def display(self):
        return self.model.properties.action_view


class ActionList(ContextAction):
    css_class = 'listing16_16'
    title = 'Listing'
    action = 'listing:#content:inner'
    
    @property
    def href(self):
        return '%s/listing' % self.target
    
    @property
    def display(self):
        return self.model.properties.action_list


class ActionAdd(ContextAction):
    type = 'tile'
    tile = 'add_dropdown'
    
    @property
    def display(self):
        return self.model.nodeinfo.addables


class ActionEdit(ContextAction):
    css_class = 'edit16_16'
    title = 'Edit'
    action = 'edit:#content:inner'
    
    @property
    def href(self):
        return '%s/edit' % self.target
    
    @property
    def display(self):
        return self.model.properties.editable


class ActionDelete(ContextAction):
    css_class = 'delete16_16'
    title = 'Delete'
    action = 'delete:NONE:NONE'
    confirm = 'Do you really want to delete this Item?'
    
    @property
    def href(self):
        return '%s/delete' % self.target
    
    @property
    def display(self):
        return self.model.properties.deletable


class ActionSharing(ContextAction):
    css_class = 'sharing16_16'
    title = 'Sharing'
    action = 'sharing:#content:inner'
    
    @property
    def href(self):
        return '%s/sharing' % self.target
    
    @property
    def display(self):
        return hasattr(self.model, 'principal_roles') \
            and self.model.properties.shareable


class ActionState(ContextAction):
    type = 'tile'
    tile = 'wf_dropdown'
    
    @property
    def display(self):
        return self.model.properties.wf_state


class ActionCut(ContextAction):
    css_class = 'cut16_16'
    title = 'Cut'
    action = None
    bind = None
    
    @property
    def href(self):
        return '%s/cut' % self.target
    
    @property
    def display(self):
        return self.model.properties.action_cut


class ActionCopy(ContextAction):
    css_class = 'copy16_16'
    title = 'Copy'
    action = None
    bind = None
    
    @property
    def href(self):
        return '%s/copy' % self.target
    
    @property
    def display(self):
        return self.model.properties.action_copy


class ActionPaste(ContextAction):
    css_class = 'paste16_16'
    title = 'Paste'
    action = None
    bind = None
    
    @property
    def href(self):
        return '%s/paste' % self.target
    
    @property
    def display(self):
        return self.model.properties.action_paste
    
    @property
    def enabled(self):
        return self.request.cookies.get('cone.app.copysupport.cut') \
            or self.request.cookies.get('cone.app.copysupport.copy')


class GeneralActions(ContextActionsSection):
    factories = odict()


class ObjectActions(ContextActionsSection):
    factories = odict()


GeneralActions.factories['action_up'] = ActionUp
GeneralActions.factories['action_view'] = ActionView
GeneralActions.factories['action_list'] = ActionList
    
ObjectActions.factories['action_add'] = ActionAdd
ObjectActions.factories['action_edit'] = ActionEdit
ObjectActions.factories['action_sharing'] = ActionSharing
ObjectActions.factories['action_cut'] = ActionCut
ObjectActions.factories['action_copy'] = ActionCopy
ObjectActions.factories['action_paste'] = ActionPaste
ObjectActions.factories['action_delete'] = ActionDelete
ObjectActions.factories['action_state'] = ActionState

context_menu_sections = odict()
context_menu_sections['general'] = GeneralActions
context_menu_sections['object'] = ObjectActions