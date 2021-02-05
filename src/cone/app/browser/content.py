from cone.app.browser import render_main_template
from cone.app.browser.actions import LinkAction
from cone.app.browser.contextmenu import context_menu
from cone.app.browser.utils import make_url
from cone.tile import register_tile
from cone.tile import tile
from zope.interface import Interface
import sys


class content_view_tile(tile):
    """Extended tile decorator for registering content tiles.

    Additionally registers a view with the same name as the tile traversable
    via browser URL.
    """

    def create_content_view(self, ob):
        def content_view(model, request):
            return render_main_template(model, request, contenttile=self.name)

        view_name = '{}_content_view'.format(self.name)
        content_view.__doc__ = (
            'Dynamically created by '
            'cone.app.browser.content.content_view_tile'
        )
        content_view.__name__ = view_name
        content_view.__qualname__ = view_name
        content_view.__module__ = ob.__module__
        module = sys.modules[ob.__module__]
        setattr(module, view_name, content_view)

        def callback(context, name, ob_):
            config = context.config.with_package(info.module)
            config.add_view(
                view=ob_,
                name=self_.name,
                context=self_.interface,
                permission=self_.permission
            )
        self_ = self
        info = self.venusian.attach(
            content_view,
            callback,
            category='pyramid',
            depth=2
        )

    def __call__(self, ob):
        self.create_content_view(ob)

        def callback(context, name, ob_):
            register_tile(
                name=self_.name,
                path=self_.path,
                attribute=self_.attribute,
                interface=self_.interface,
                class_=ob_,
                permission=self_.permission,
                strict=self_.strict
            )
        self_ = self
        self.venusian.attach(ob, callback, category='pyramid', depth=1)
        return ob


class ContentViewAction(LinkAction):
    """View action for the contentviews group of the contextmenu.

    Gets created by ``content_view_action`` decorator.
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
        permitted = True
        if self.permission:
            permitted = self.permitted(self.permission)
        if self.interface:
            if issubclass(self.interface, Interface):
                return self.interface.providedBy(self.model) and permitted
            return isinstance(self.model, self.interface) and permitted
        return permitted

    @property
    def selected(self):
        return self.action_scope == self.name

    @property
    def href(self):
        return make_url(self.request, node=self.model, resource=self.name)


class content_view_action(object):
    """Decorator providing a shortcut for creating a view action and
    registering in the contentviews group of the contextmenu.
    """

    def __init__(self, name, tilename=None, interface=None,
                 permission=None, text=None, icon=None):
        self.name = name
        self.tilename = tilename if tilename is not None else name
        self.interface = interface
        self.permission = permission
        self.text = text
        self.icon = icon

    def __call__(self, ob):
        context_menu['contentviews'][self.name] = ContentViewAction(
            name=self.tilename,
            interface=self.interface,
            permission=self.permission,
            text=self.text,
            icon=self.icon
        )
        return ob
