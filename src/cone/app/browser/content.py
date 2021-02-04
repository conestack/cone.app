from cone.app.browser import render_main_template
from cone.app.browser.actions import LinkAction
from cone.app.browser.context_menu import context_menu
from cone.app.browser.utils import make_url
from cone.tile import tile


class ContentViewAction(LinkAction):
    """
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
        return (
            isinstance(self.model, self.interface)
            and self.permitted(self.permission)
        )

    @property
    def selected(self):
        return self.action_scope == self.name

    @property
    def href(self):
        return '{}/{}'.format(
            make_url(self.request, node=self.model),
            self.name
        )


class content_tile(tile):
    """Extended tile decorator for registering content tiles. Additionally
    registers a view with the same name as the tile traversable via browser URL.
    """

    def __init__(self, name=None, path=None, attribute=None,
                 interface=Interface, permission='view',
                 strict=True, _level=2, create_view_action=False,
                 action_title=None, action_icon=None):
        """
        """
        super(content_tile, self).__init__(
            name=name, path=path, attribute=attribute,
            interface=interface, permission=permission,
            strict=strict, _level=_level
        )
        self.create_view_action = create_view_action
        self.action_title = action_title
        self.action_icon = action_icon

    def __call__(self, ob):
        super(content_tile, self).__call__(ob)
        name = self.name

        def content_view(model, request):
            return render_main_template(model, request, name)

        view_name =  '{}_content_view'.format(name)
        content_view.__name__ = view_name
        module = ob.__module__
        setattr(module, view_name, content_view)
        config.add_view(
            view=content_view,
            name=name,
            context=self.interface,
            permission=self.permission
        )
        if not self.create_view_action:
            return
        # XXX: dotted path
        action_name = '{}_{}'.format(ob.__class__.__name__, name)
        context_menu['contentviews'][action_name] = ContentViewAction(
            name=name,
            interface=self.interface,
            permission=self.permission,
            text=self.action_title,
            icon=self.action_icon
        )
