from cone.app.browser import render_main_template
from cone.app.browser.actions import LinkAction
from cone.app.browser.context_menu import context_menu
from cone.app.browser.utils import make_url
from cone.tile import tile
from zope.interface import Interface
from pyramid.view import view_config


class content_tile(tile):
    """Extended tile decorator for registering content tiles. Additionally
    registers a view with the same name as the tile traversable via browser URL.
    """

    def __call__(self, ob):
        super(content_tile, self).__call__(ob)
        name = self.name

        def content_view(model, request):
            return render_main_template(model, request, name)

        view_name = '{}_content_view'.format(name)
        content_view.__name__ = view_name
        module = ob.__module__
        setattr(module, view_name, content_view)
        view_config(
            name=name,
            context=self.interface,
            permission=self.permission
        )(content_view)


class ContentViewAction(LinkAction):
    """View action for the contentviews group of the contextmenu. Gets created
    by ``content_view_action`` decorator.
    """

    def __init__(self, name, interface=None,
                 permission=None, text=None, icon=None):
        self.name = name
        self.interface = interface
        self.permission = permission
        self.text = text
        self.icon = icon

    @property
    def display(self):
        permitted = self.permitted(self.permission)
        if issubclass(Interface):
            return self.interface.providedBy(self.model) and permitted
        return isinstance(self.model, self.interface) and permitted

    @property
    def selected(self):
        return self.action_scope == self.name

    @property
    def href(self):
        return '{}/{}'.format(
            make_url(self.request, node=self.model),
            self.name
        )


class content_view_action(object):
    """Decorator providing a shortcut for creating a view action and registering
    it in the contentviews group of the contextmenu.
    """

    def __init__(self, name, interface=None, permission=None,
                 text=None, icon=None):
        self.name = name
        self.interface = interface
        self.permission = permission
        self.text = text
        self.icon = icon

    def __call__(self, ob):
        context_menu['contentviews'][self.name] = ContentViewAction(
            name=self.name,
            interface=self.interface,
            permission=self.permission,
            text=self.text,
            icon=self.icon
        )
