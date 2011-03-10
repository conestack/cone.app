from cone.app.model import Properties

# main UI configuration
ui = Properties()

# used main template
ui.main_template = 'cone.app.browser:templates/main.pt'

# JS resources
ui.js = Properties()
ui.js.public = [
    'static/cdn/jquery.min.js',
    'static/cdn/jquery.tools.min.js',
    '++resource++bdajax/bdajax.js',
]
ui.js.protected = [
    'static/jquery-ui/jquery-ui-1.8.1.custom.min.js',
    'tiny_mce/jquery.tinymce.js',
    '++resource++yafowil.widget.datetime/widget.js',
    '++resource++yafowil.widget.richtext/widget.js',
    '++resource++yafowil.widget.dict/widget.js',
    'static/cone.app.js',
]

# CSS Resources
ui.css = Properties()
ui.css.public = [
    'static/style.css',
    '++resource++bdajax/bdajax.css',
]
ui.css.protected = [
    'static/jquery-ui/jquery-ui-1.8.1.custom.css',
]

# ui.layout used to enable/disable tiles in main template
ui.layout = Properties()
ui.layout.livesearch = True
ui.layout.personaltools = True
ui.layout.mainmenu = True
ui.layout.pathbar = True
ui.layout.sidebar_left = ['navtree']
