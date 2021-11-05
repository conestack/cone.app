from cone.app.browser.ajax import ajax_continue
from cone.app.browser.ajax import ajax_message
from cone.app.browser.ajax import AjaxEvent
from cone.app.browser.utils import make_query
from cone.app.browser.utils import make_url
from cone.tile import Tile
from cone.tile import tile
from node.interfaces import IOrder
from pyramid.i18n import get_localizer
from pyramid.i18n import TranslationStringFactory


_ = TranslationStringFactory('cone.app')


class MoveAction(Tile):

    def move(self):
        raise NotImplementedError(
            'Abstract ``MoveAction`` does not implement ``move``'
        )

    def continuation(self, url):
        return [AjaxEvent(url, 'contextchanged', '#layout')]

    def show_error(self, message):
        localizer = get_localizer(self.request)
        ajax_message(self.request, localizer.translate(message), 'error')

    def render(self):
        model = self.model
        parent = model.parent
        if not IOrder.providedBy(parent):
            title = model.metadata.get('title', model.name)
            message = _(
                'object_not_movable',
                default='Object "${title}" not movable',
                mapping={'title': title}
            )
            self.show_error(message)
            return u''
        if (
            not parent.properties.action_move
            or not self.request.has_permission('change_order', parent)
        ):
            message = _(
                'object_moving_not_permitted',
                default='You are not permitted to move this object'
            )
            self.show_error(message)
            return u''
        self.move()
        parent()
        query = make_query(
            contenttile='listing',
            b_page=self.request.params.get('b_page'),
            size=self.request.params.get('size')
        )
        url = make_url(self.request, node=parent, query=query)
        ajax_continue(self.request, self.continuation(url))
        return u''


@tile(name='move_up', permission='view')
class MoveUpAction(MoveAction):

    def move(self):
        model = self.model
        parent = model.parent
        parent.swap(model, parent[parent.prev_key(model.name)])


@tile(name='move_down', permission='view')
class MoveDownAction(MoveAction):

    def move(self):
        model = self.model
        parent = model.parent
        parent.swap(model, parent[parent.next_key(model.name)])
