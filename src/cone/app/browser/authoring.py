from cone.app.browser import render_main_template
from cone.app.browser.actions import ActionContext
from cone.app.browser.ajax import AjaxEvent
from cone.app.browser.ajax import AjaxOverlay
from cone.app.browser.ajax import AjaxPath
from cone.app.browser.ajax import ajax_continue
from cone.app.browser.ajax import ajax_form_fiddle
from cone.app.browser.ajax import ajax_message
from cone.app.browser.ajax import render_ajax_form
from cone.app.browser.utils import make_query
from cone.app.browser.utils import make_url
from cone.app.browser.utils import node_path
from cone.app.model import AdapterNode
from cone.app.model import BaseNode
from cone.app.model import Properties
from cone.app.model import get_node_info
from cone.app.utils import app_config
from cone.tile import Tile
from cone.tile import render_template
from cone.tile import render_tile
from cone.tile import tile
from plumber import Behavior
from plumber import default
from plumber import override
from plumber import plumb
from pyramid.i18n import TranslationStringFactory
from pyramid.i18n import get_localizer
from pyramid.view import view_config
from urllib2 import urlparse
from webob.exc import HTTPFound
from yafowil.base import factory
import logging
import urllib2


logger = logging.getLogger('cone.app')
_ = TranslationStringFactory('cone.app')


###############################################################################
# general
###############################################################################

def is_ajax(request):
    return bool(request.params.get('ajax'))


def render_form(model, request, tilename):
    """If form is invoked without hidden ajax field, the main template is
    rendered with tile ``tilename`` as content tile, otherwise
    ``render_ajax_form`` is called, which renders the tile wrapped by some
    javascript calls into a script tag. The ajax response will be rendered into
    the hidden iframe on client side, where ajax continuation is processed.

    XXX: move to cone.app.browser.form
    """
    if is_ajax(request):
        ActionContext(model, request, tilename)
        return render_ajax_form(model, request, tilename)
    return render_main_template(model, request, contenttile=tilename)


class _FormRenderingTile(Tile):
    form_tile_name = ''

    def render(self):
        return render_tile(self.model, self.request, self.form_tile_name)


###############################################################################
# form continuation control
###############################################################################

class CameFromNext(Behavior):
    """Form behavior for form tiles considering ``came_from`` parameter on
    request for form continuation.
    """

    default_came_from = default(None)
    """Default ``came_from`` value considered in ``next`` if no ``came_from``
    parameter given on request.
    """

    write_history_on_next = default(False)
    """Flag whether to write browser history on ``next`` via ``AjaxPath``
    continuation if ajax request.
    """

    @plumb
    def prepare(_next, self):
        """Hook after prepare and set ``came_from`` as proxy field to
        ``self.form``.
        """
        _next(self)
        # read came_from from request
        came_from = self.request.get('came_from')
        # fall back to default_came_from if came_from not passed on request
        if came_from is None:
            came_from = self.default_came_from
        # came_from might be None, set to empty string
        if not came_from:
            came_from = ''
        self.form['came_from'] = factory('proxy', value=came_from)

    @default
    def next(self, request):
        """Read ``came_from`` parameter from request and compute next URL.

        If ``came_from`` not found on request, ``default_came_from`` property
        is used.

        If ``came_from`` is special value ``parent``, URL of model parent is
        computed.

        If ``came_from`` is set, it is considered as URL to use. The given URL
        must match the basic application URL, otherwise an error gets logged
        and URL of current model is computed.

        If ``came_from`` is set to empty value, URL of current model is
        computed.
        """
        # read came_from from request
        came_from = request.get('came_from')
        # fall back to default_came_from if came_from not passed on request
        if came_from is None:
            came_from = self.default_came_from
        # use model URL and path if no came_from
        if not came_from:
            url = make_url(request.request, node=self.model)
            path = '/'.join(node_path(self.model))
        # use model parent URL and path if came_from is 'parent'
        elif came_from == 'parent':
            url = make_url(request.request, node=self.model.parent)
            path = '/'.join(node_path(self.model.parent))
        # consider came_from a URL
        else:
            url = urllib2.unquote(came_from)
            parsed = urlparse.urlparse(url)
            app_loc = urlparse.urlparse(self.request.application_url).netloc
            # behave as if no came_from given if application location not
            # matches came_from location
            if app_loc != parsed.netloc:
                logger.error((
                    'CameFromNext.next(): Application location "{}" does not '
                    'match came_from location "{}". Use model for URL '
                    'computing instead'
                ).format(app_loc, parsed.netloc))
                url = make_url(request.request, node=self.model)
                path = '/'.join(node_path(self.model))
            # include query to path
            elif parsed.query:
                path = '{}?{}'.format(parsed.path, parsed.query)
            # query without path
            else:
                path = '{}'.format(parsed.path)
        # ajax continuation definitions if ajax request
        if self.ajax_request:
            event = AjaxEvent(url, 'contextchanged', '#layout')
            # return continuation path and event if browser history should be
            # written
            if self.write_history_on_next:
                cpath = AjaxPath(
                    path,
                    target=url,
                    event='contextchanged:#layout'
                )
                return [cpath, event]
            # return event only if writing browser history should be skipped
            return [event]
        # regular redirection if no ajax request
        return HTTPFound(location=url)


###############################################################################
# form heading
###############################################################################

class FormHeading(Behavior):

    @default
    @property
    def form_heading(self):
        raise NotImplementedError(u'Abstract ``FormHeading`` does not '
                                  u'implement ``form_heading``')


###############################################################################
# content area related forms
###############################################################################

class ContentForm(FormHeading):
    """Form behavior rendering to content area.
    """
    show_heading = default(True)
    show_contextmenu = default(True)

    @default
    @property
    def form_heading(self):
        return _('content_form_heading', default='Content Form Heading')

    @default
    @property
    def rendered_contextmenu(self):
        return render_tile(self.model, self.request, 'contextmenu')

    @plumb
    def __call__(_next, self, model, request):
        ajax_form_fiddle(request, '#content', 'inner')
        form = _next(self, model, request)
        if form is None:
            form = u''
        self.rendered_form = form
        path = self.path
        if not path:
            path = 'cone.app.browser:templates/content_form.pt'
        return render_template(
            path, request=request, model=model, context=self)


###############################################################################
# overlay forms
###############################################################################

@view_config('overlayform', permission='view')
def overlayform(model, request):
    return render_form(model, request, 'overlayformtile')


@tile('overlayformtile', permission='view')
class OverlayFormTile(_FormRenderingTile):
    form_tile_name = 'overlayform'


class OverlayForm(Behavior):
    """Form behavior rendering to overlay.
    """
    action_resource = override('overlayform')
    overlay_selector = override('#ajax-overlay')
    overlay_content_selector = override('.overlay_content')

    @plumb
    def __call__(_next, self, model, request):
        form = _next(self, model, request)
        selector = '%s %s' % (self.overlay_selector,
                              self.overlay_content_selector)
        ajax_form_fiddle(request, selector, 'inner')
        return form

    @default
    def next(self, request):
        return [AjaxOverlay(selector=self.overlay_selector, close=True)]

# B/C
# deprecated: will be removed in cone.app 1.1
OverlayBehavior = OverlayForm


###############################################################################
# adding
###############################################################################

def default_addmodel_factory(parent, nodeinfo):
    """Default addmodel factory.

    The addmodel factory is responsible to create a model suitable for
    rendering addforms refering to node info.

    parent
        The parent in which the new item should be added
    nodeinfo
        The nodeinfo instance
    """
    if AdapterNode in nodeinfo.node.__bases__:
        addmodel = nodeinfo.node(BaseNode(), None, None)
    else:
        addmodel = nodeinfo.node()
    addmodel.__parent__ = parent
    return addmodel


@tile('add_dropdown', 'templates/add_dropdown.pt',
      permission='add', strict=False)
class AddDropdown(Tile):

    def make_item(self, info_name, info):
        model = self.model
        request = self.request
        props = Properties()
        query = make_query(factory=info_name)
        url = make_url(request, node=model, resource='add', query=query)
        props.url = url
        target = make_url(request, node=model, query=query)
        props.target = target
        props.title = info.title
        icon = info.icon
        if not icon:
            icon = app_config().default_node_icon
        props.icon = icon
        return props

    @property
    def items(self):
        ret = list()
        addables = self.model.nodeinfo.addables
        if not addables:
            return ret
        for addable in addables:
            info = get_node_info(addable)
            if not info:
                continue
            ret.append(self.make_item(addable, info))
        return ret


@view_config('add', permission='add')
def add(model, request):
    return render_form(model, request, 'add')


@tile('add', permission='add')
class AddTile(_FormRenderingTile):
    """The add tile is responsible to render add forms depending on given
    factory name. Factory information is fetched from NodeInfo implementation
    registered by factory name.
    """
    form_tile_name = 'addform'

    def render(self):
        nodeinfo = self.info
        if not nodeinfo:
            return _('unknown_factory', default='Unknown factory')
        factory = nodeinfo.factory
        if not factory:
            factory = default_addmodel_factory
        addmodel = factory(self.model, nodeinfo)
        return render_tile(addmodel, self.request, self.form_tile_name)

    @property
    def info(self):
        factory = self.request.params.get('factory')
        allowed = self.model.nodeinfo.addables
        if not factory or not allowed or not factory in allowed:
            return None
        return get_node_info(factory)


class AddFactoryProxy(Behavior):
    """Form behavior for add forms hooking the hidden field 'factory' to
    request parameters.
    """

    @plumb
    def prepare(_next, self):
        """Hook after prepare and set 'factory' as proxy field to form.
        """
        _next(self)
        self.form['factory'] = factory(
            'proxy',
            value=self.request.params.get('factory'),
        )


class AddFormHeading(FormHeading):

    @default
    @property
    def form_heading(self):
        localizer = get_localizer(self.request)
        title = localizer.translate(
            get_node_info(self.model.node_info_name).title)
        heading = localizer.translate(
            _('add_form_heading',
              default='Add: ${title}',
              mapping={'title': title}))
        return heading


class ContentAddForm(AddFactoryProxy,
                     AddFormHeading,
                     ContentForm,
                     CameFromNext):
    """Form behavior rendering add form to content area.
    """
    action_resource = override('add')

    @default
    @property
    def rendered_contextmenu(self):
        return render_tile(self.model.parent, self.request, 'contextmenu')

# B/C
# deprecated: will be removed in cone.app 1.1
AddBehavior = ContentAddForm


###############################################################################
# overlay adding
###############################################################################

@view_config('overlayadd', permission='add')
def overlayadd(model, request):
    return render_form(model, request, 'overlayadd')


@tile('overlayadd', permission='add')
class OverlayAddTile(AddTile):
    form_tile_name = 'overlayaddform'


class OverlayAddForm(OverlayForm,
                     AddFactoryProxy,
                     AddFormHeading):
    """Add form behavior rendering to overlay.
    """
    action_resource = override('overlayadd')


###############################################################################
# editing
###############################################################################

@view_config('edit', permission='edit')
def edit(model, request):
    return render_form(model, request, 'edit')


@tile('edit', permission='edit')
class EditTile(_FormRenderingTile):
    form_tile_name = 'editform'


class EditFormHeading(FormHeading):

    @default
    @property
    def form_heading(self):
        info = get_node_info(self.model.node_info_name)
        if info is None:
            return _('edit', default='Edit')
        localizer = get_localizer(self.request)
        heading = localizer.translate(
            _('edit_form_heading',
              default='Edit: ${title}',
              mapping={'title': localizer.translate(info.title)}))
        return heading


class ContentEditForm(EditFormHeading,
                      ContentForm,
                      CameFromNext):
    """Form behavior rendering edit form to content area.
    """
    action_resource = override('edit')

# B/C
# deprecated: will be removed in cone.app 1.1
EditBehavior = ContentEditForm


###############################################################################
# overlay editing
###############################################################################

@view_config('overlayedit', permission='edit')
def overlayedit(model, request):
    return render_form(model, request, 'overlayedit')


@tile('overlayedit', permission='edit')
class OverlayEditTile(_FormRenderingTile):
    form_tile_name = 'overlayeditform'


class OverlayEditForm(OverlayForm,
                      EditFormHeading):
    """Edit form behavior rendering to overlay.
    """
    action_resource = override('overlayedit')


###############################################################################
# deleting
###############################################################################

@tile('delete', permission="delete")
class DeleteAction(Tile):

    def continuation(self, url):
        return [AjaxEvent(url, 'contextchanged', '#layout')]

    def render(self):
        model = self.model
        title = model.metadata.get('title', model.name)
        if not model.properties.action_delete:
            ts = _('object_not_deletable',
                   default='Object "${title}" not deletable',
                   mapping={'title': title})
            localizer = get_localizer(self.request)
            message = localizer.translate(ts)
            ajax_message(self.request, message, 'error')
            return u''
        content_tile = model.properties.action_delete_tile
        if not content_tile:
            content_tile = 'content'
        parent = model.parent
        del parent[model.name]
        if hasattr(parent, '__call__'):
            parent()
        query = make_query(contenttile=content_tile)
        url = make_url(self.request, node=parent, query=query)
        ajax_continue(self.request, self.continuation(url))
        ts = _('deleted_object',
               default='Deleted: ${title}',
               mapping={'title': title})
        localizer = get_localizer(self.request)
        message = localizer.translate(ts)
        ajax_message(self.request, message, 'info')
        return u''
