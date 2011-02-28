from plumber import (
    plumber,
    Part,
    default,
    plumb,
)
from yafowil.base import factory
from yafowil.controller import Controller
from cone.tile import Tile
from cone.app.browser.ajax import AjaxAction
from cone.app.browser.utils import make_url
from webob.exc import HTTPFound


class Form(Tile):
    """A form tile.
    """

    form = None # yafowil compound expected.
    
    def prepare(self):
        """Responsible to prepare ``self.form``.
        """
        raise NotImplementedError(u"``prepare`` function must be provided "
                                  u"by deriving object.")
    
    def __call__(self, model, request):
        self.model = model
        self.request = request
        return self._process_form()
    
    def _process_form(self):
        self.prepare()
        if not self.show:
            return ''
        controller = Controller(self.form, self.request)
        if not controller.next:
            return controller.rendered
        if isinstance(controller.next, HTTPFound):
            self.redirect(controller.next.location)
            return
        if isinstance(controller.next, AjaxAction):
            self.request['cone.app.continuation'] = controller.next
            return ''
        return controller.next


class AddPart(Part):
    """form hooking the hidden value 'factory' to self.form on __call__
    """
    
    @plumb
    def prepare(_next, self):
        """Hook after prepare and set factory as proxy field to ``self.form``
        """
        _next(self)
        self.form['factory'] = factory(
            'proxy',
            value=self.request.params.get('factory'),
        )
    
    @default
    def next(self, request):
        url = make_url(request.request, node=self.model.__parent__)
        if request.get('ajax'):
            return AjaxAction(url, 'content', 'inner', '#content')
        return HTTPFound(location=url)


class EditPart(Part):
    """form hooking the hidden value 'from' to self.form on __call__
    """
    
    @plumb
    def prepare(_next, self):
        """Hook after prepare and set factory as proxy field to ``self.form``
        """
        _next(self)
        self.form['from'] = factory(
            'proxy',
            value=self.request.params.get('from'),
        )
    
    @default
    def next(self, request):
        if request.get('from') == 'parent':
            url = make_url(request.request, node=self.model.__parent__)
        else:
            url = make_url(request.request, node=self.model)
        if request.get('ajax'):
            return AjaxAction(url, 'content', 'inner', '#content')
        return HTTPFound(location=url)


###############################################################################
# deprecated below, will be removed. use Form with related parts
###############################################################################


class AddForm(Form):
    """form hooking the hidden value 'factory' to self.form on __call__
    """
    
    def __call__(self, model, request):
        self.model = model
        self.request = request
        form = self.form
        form['factory'] = factory('proxy', value=request.params.get('factory'))
        return self._process_form()
    
    def next(self, request):
        url = make_url(request.request, node=self.model.__parent__)
        if request.get('ajax'):
            return AjaxAction(url, 'content', 'inner', '#content')
        return HTTPFound(location=url)


class EditForm(Form):
    """form hooking the hidden value 'from' to self.form on __call__
    """
    
    def __call__(self, model, request):
        self.model = model
        self.request = request
        form = self.form
        form['from'] = factory('proxy', value=request.params.get('from'))
        return self._process_form()
    
    def next(self, request):
        if request.get('from') == 'parent':
            url = make_url(request.request, node=self.model.__parent__)
        else:
            url = make_url(request.request, node=self.model)
        if request.get('ajax'):
            return AjaxAction(url, 'content', 'inner', '#content')
        return HTTPFound(location=url)
