from cone.app import get_root
from cone.app.browser.utils import make_url
from cone.app.model import AppRoot
from cone.tile import tile
from cone.tile import Tile

TUTORIAL_TITLES = {
    'document_library': 'Document Library',
    'document_folder': 'Document Folder',
    'document': 'Document',
    'project_board': 'Project Board',
    'project': 'Project',
    'task': 'Task',
    'wiki': 'Wiki',
    'wiki_page': 'Wiki Page',
    'layout_demo': 'Layout',
    'ajax_playground': 'AJAX',
}


@tile(
    name='tutorial',
    path='templates/tutorial.pt',
    permission='view',
    strict=False,
)
class SidebarTutorial(Tile):

    @property
    def root_view(self):
        root = get_root(self.model)
        return self.model is root

    @property
    def title(self):
        name = getattr(self.model, 'node_info_name', '')
        return TUTORIAL_TITLES.get(name, 'Tutorial')

    @property
    def toggle_url(self):
        return make_url(self.request, node=self.model)


# tutorial

@tile(
    name='tutorial_content',
    path='templates/tutorial_content.pt',
    interface=AppRoot,
    permission='view',
    strict=False,
)
class DocumentTutorial(Tile):
    ...