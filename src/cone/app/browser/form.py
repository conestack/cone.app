from plumber import (
    Part,
    default,
    extend,
)
from webob.exc import HTTPFound
from pyramid.security import has_permission
from yafowil.base import factory
from yafowil.controller import Controller
from yafowil.yaml import parse_from_YAML
from cone.tile import Tile
from cone.app.browser.ajax import AjaxAction
from cone.app.browser.ajax import AjaxEvent
from cone.app.browser.utils import make_url


class YAMLForm(Part):
    """Plumbing part for rendering yaml forms.
    """
    
    action_resource = default(u'')
    
    # BBB
    form_template_path = default(None)
    
    # use form_template for pointing yaml files
    form_template = default(None)
    message_factory = default(None)
    
    @default
    def form_action(self, widget, data):
        resource = self.action_resource
        return make_url(self.request, node=self.model, resource=resource)
    
    @extend
    def prepare(self):
        if self.form_template:
            self.form = parse_from_YAML(
                self.form_template, self, self.message_factory)
            return
        # BBB
        self.form = parse_from_YAML(
            self.form_template_path, self, self.message_factory)


class ProtectedAttributesForm(Part):
    """Plumbing part supposed to be used for yafowil forms calculating widget
    modes based on security checks.
    
    Security declarations for attributes are stored at
    ``self.attribute_permissions`` containing the attribute names as key, and
    a 2-tuple containing required edit and view permission for this attribute.
    """
    
    attribute_permissions = default(dict())
    attribute_default_permissions = default(('edit', 'view'))
    
    @default
    def mode_for(self, name):
        """Calculate mode by checking permission defined in
        ``self.attribute_permissions`` for attribute ``name`` against model.
        
        If no permissions defined for attribute name, return
        ``self.attribute_default_mode``
        """
        permissions = self.attribute_permissions.get(name)
        if not permissions:
            permissions = self.attribute_default_permissions
        if has_permission(permissions[0], self.model, self.request):
            return 'edit'
        if has_permission(permissions[1], self.model, self.request):
            return 'display'
        return 'skip'


class Form(Tile):
    """A form tile.
    """

    form = None # yafowil compound expected.
    ajax = True # render ajax form related by default.
    
    def prepare(self):
        """Responsible to prepare ``self.form``.
        """
        raise NotImplementedError(u"``prepare`` function must be provided "
                                  u"by deriving object.")
    
    def prepare_ajax(self):
        """Set ajax class attribute on self.form.
        """
        if not self.ajax:
            return
        if self.form.attrs.get('class') \
          and self.form.attrs['class'].find('ajax') == -1:
            self.form.attrs['class'] += ' ajax'
        else:
            self.form.attrs['class'] = 'ajax'
    
    @property
    def ajax_request(self):
        """Flag whether to handle current request as ajax request.
        """
        return self.request.params.get('ajax') and self.ajax
    
    def __call__(self, model, request):
        self.model = model
        self.request = request
        return self._process_form()
    
    def _process_form(self):
        self.prepare()
        self.prepare_ajax()
        if not self.show:
            return u''
        controller = Controller(self.form, self.request)
        if not controller.next:
            return controller.rendered
        if isinstance(controller.next, HTTPFound):
            self.redirect(controller.next)
            return
        if isinstance(controller.next, AjaxAction) \
          or isinstance(controller.next, AjaxEvent):
            self.request.environ['cone.app.continuation'] = [controller.next]
            return u''
        if isinstance(controller.next, list):
            # we assume a list of AjaxAction and/or AjaxEvent instances
            self.request.environ['cone.app.continuation'] = controller.next
            return u''
        return controller.next