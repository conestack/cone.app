from yafowil.base import factory
from yafowil.controller import Controller
from paste.httpexceptions import HTTPFound
from cone.tile import Tile
from cone.app.browser.utils import make_url


class Form(Tile):
    
    @property
    def form(self):
        """Return yafowil compound.
        
        Not implemented in base class.
        """
        raise NotImplementedError(u"``form`` property must be provided "
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
            self.redirect(controller.next.location())
            return
        return controller.next


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
        return HTTPFound(make_url(request.request, node=self.model.__parent__))


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
        return HTTPFound(url)

