from cone.app.model import Properties

# main UI uiuration
ui = Properties()
# used main template
ui.main_template = 'cone.app.browser:templates/main.pt'
# CSS resources
# XXX use some resource management instead of lists later
ui.js = list()
# JS Resources
# XXX use some resource management instead of lists later
ui.css = list()
# ui.layout used to enable/disable tiles in main template
ui.layout = Properties()
# render livesearch
ui.layout.livesearch = True
# render personaltools
ui.layout.personaltools = True
# render mainmenu
ui.layout.mainmenu = True
# render pathbar
ui.layout.pathbar = True
# render sidebar_left
ui.layout.sidebar_left = ['navtree']
