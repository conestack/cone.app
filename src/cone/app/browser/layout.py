from pyramid.security import has_permission
from cone.tile import (
    tile,
    Tile,
    render_tile,
    render_template,
    registerTile,
)
import cone.app
from cone.app.model import AppRoot
from cone.app.browser.utils import (
    authenticated,
    nodepath,
    make_url,
    format_date,
)


@tile('resources', 'templates/resources.pt', permission='login')
class Resources(Tile):
    """Resources tile.
    
    XXX: either switch to resource management lib here or use resource
         management middleware.
    """
    
    @property
    def authenticated(self):
        return authenticated(self.request)
    
    @property
    def js(self):
        return cone.app.cfg.js
    
    @property
    def css(self):
        return cone.app.cfg.css


class ProtectedContentTile(Tile):
    """A tile rendering the loginform instead default if user is not
    authenticated.
    
    Normally used for 'content' tiles if page should render login form in place
    instead of throwing Unauthorized.
    """
    
    def __call__(self, model, request):
        if not authenticated(request):
            return render_tile(model, request, 'loginform')
        return Tile.__call__(self, model, request)


registerTile('livesearch',
             'cone.app:browser/templates/livesearch.pt',
             permission='view',
             strict=False)


@tile('personaltools', 'templates/personaltools.pt',
      permission='view', strict=False)
class PersonalTools(Tile):
    """Personal tool tile.
    
    XXX: extend by items, currently only 'logout' link hardcoded in template
    """


@tile('mainmenu', 'templates/mainmenu.pt', 
      permission='view', strict=False)
class MainMenu(Tile):
    """Main Menu tile.
    
    * set ``mainmenu_empty_title`` on ``model.root.properties`` to ``True``
      if you want to render empty links in mainmenu for setting icons via css.
      Therefor 'node-nodeid' gets rendered as CSS class on ``li`` DOM element.
    
    * If ``default_child`` is set on ``model.root.properties``, it is marked
      selected if no other current path is found.
    """
    
    @property
    def menuitems(self):
        ret = list()
        count = 0
        path = nodepath(self.model)
        if path:
            curpath = path[0]
        else:
            curpath = ''
        # work with ``self.model.root.keys()``, ``values()`` propably not works
        # due to the use of factory node.
        root = self.model.root
        # check for default child id if no curpath
        if not curpath and root.properties.default_child:
            curpath = root.properties.default_child
        # check wether to render mainmenu item title
        empty_title = root.properties.mainmenu_empty_title
        for key in root.keys():
            child = root[key]
            if not has_permission('view', child, self.request):
                continue
            item = dict()
            item['id'] = key
            if empty_title:
                item['title'] = ' '
                item['description'] = child.metadata.title
            else:
                item['title'] = child.metadata.title
                item['description'] = child.metadata.description
            item['url'] = make_url(self.request, path=[key])
            item['selected'] = curpath == key
            item['first'] = count == 0
            ret.append(item)
            count += 1
        return ret


@tile('pathbar', 'templates/pathbar.pt', 
      permission='view', strict=False)
class PathBar(Tile):
    
    @property
    def items(self):
        items = list()
        node = self.model
        while node is not None:
            items.append({
                'title': node.metadata.title,
                'url': make_url(self.request, node=node),
                'selected': False,
                'id': node.__name__,
                'default_child': node.properties.default_child,
            })
            node = node.__parent__
        items.reverse()
        ret = list()
        count = len(items)
        for i in range(count):
            default_child = items[i]['default_child']
            if default_child \
              and i < count - 1 \
              and default_child == items[i + 1]['id']:
                continue
            ret.append(items[i])
        ret[0]['title'] = 'Home'
        ret[-1]['selected'] = True
        return ret


@tile('navtree', 'templates/navtree.pt',
      permission='view', strict=False)
class NavTree(Tile):
    """Navigation tree tile.
    """
    
    def navtreeitem(self, title, url, path):
        item = dict()
        item['title'] = title
        item['url'] = url
        item['selected'] = False
        item['path'] = path
        item['showchildren'] = False
        item['children'] = list()
        return item
    
    def fillchildren(self, model, path, tree):
        if path:
            curpath = path[0]
        else:
            curpath = None
        for key in model:
            node = model[key]
            if not has_permission('view', node, self.request):
                continue
            if not node.properties.get('in_navtree'):
                continue
            title = node.metadata.title
            url = make_url(self.request, node=node)
            curnode = curpath == key and True or False
            child = self.navtreeitem(title, url, nodepath(node))
            child['showchildren'] = curnode
            if curnode:
                self.fillchildren(node, path[1:], child)
            selected = False
            if nodepath(self.model) == nodepath(node):
                selected = True
            child['selected'] = selected
            child['showchildren'] = curnode
            tree['children'].append(child)
    
    def navtree(self):
        root = self.navtreeitem(None, None, '')
        model = self.model.root
        # XXX: default child
        path = nodepath(self.model)
        self.fillchildren(model, path, root)
        return root
    
    def rendertree(self, children, level=1):
        return render_template(
            'cone.app.browser:templates/navtree_recue.pt',
            model=self.model,
            request=self.request,
            context=self,
            children=children,
            level=level)


@tile('byline', 'templates/byline.pt',
      permission='view', strict=False)
class Byline(Tile):
    """Byline tile.
    """
    
    def format_date(self, dt):
        return format_date(dt)


registerTile('listing',
             'cone.app:browser/templates/listing.pt',
             class_=ProtectedContentTile,
             permission='login')


@tile('content', interface=AppRoot, permission='login')
class RootContent(ProtectedContentTile):
    
    def render(self):
        if self.model.properties.default_child:
            model = self.model[self.model.properties.default_child]
            return render_tile(model, self.request, 'content')
        return render_template(
            'cone.app.browser:templates/default_root.pt',
            model=self.model,
            request=self.request,
            context=self)        