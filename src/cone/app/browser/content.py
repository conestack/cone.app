from cone.tile import tile


class content_tile(tile):
    """Extended tile decorator for registering content tiles. Additionally
    registers a view with the same name as the tile traversable via browser URL.
    """

    def __call__(ob):
        pass


class content_view_action(object):
    """Decorator providing a shortcut for creating a view action and registering
    it in the contentviews group of the contextmenu.
    """

    def __init__(self):
        pass

    def __call__(ob):
        pass
