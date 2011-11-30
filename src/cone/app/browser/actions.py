from odict import odict
from cone.tile import (
    render_template,
    render_tile,
)


class Section(object):
    factories = odict()
    display = True
    
    def __init__(self, model, request):
        self.model = model
        self.request = request
    
    @property
    def actions(self):
        actions = list()
        for factory in self.factories.values():
            actions.append(factory(self.model, self.request))
        return actions


class Action(object):
    display = True
    enabled = True
    
    def __call__(self, model, request):
        self.model = model
        self.request = request
        if not self.display:
            return u''
        return self.render()
    
    def render(self):
        raise NotImplementedError(u"Abstract ``Action`` does not implement "
                                  u"render.")


class TileAction(Action):
    tile = u''
    
    def render(self):
        return render_tile(self.model, self.request, self.tile)


class TemplateAction(Action):
    template = u''
    
    def render(self):
        return render_template(self.template,
                               request=self.request,
                               model=self.model,
                               context=self)


class LinkAction(TemplateAction):
    template = 'cone.app.browser:templates/link_action.pt'
    
    def __init__(self,
                 css=None,
                 title=None,
                 text='&nbsp;',
                 href=None,
                 target=None,
                 action=None,
                 event=None,
                 confirm=None,
                 overlay=None):
        """Action definition rendering bdajax action triggers.
        css
            Action class attribute.
        title
            Action title.
        text
            Text displayed in link.
        href
            Action href attribute.
        target
            Action ajax:target attribute.
        action
            Action ajax:action attribute.
        event
            Action ajax:event attribute.
        confirm
            Action ajax:confirm attribute.
        overlay
            Action ajax:overlay attribute.
        """
        self.css = css
        self.title = title
        self.text = text
        self.href = link
        self.target = target
        self.action = action
        self.event = event
        self.confirm = confirm
        self.overlay = overlay
    
    @property
    def css_class(self):
        css = not self.enabled and 'disabled' or ''
        if self.css:
            css = '%s %s' % (self.css, css)
        css = css.strip()
        return css and css or None