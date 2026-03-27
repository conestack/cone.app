from cone.app import get_root
from cone.app.interfaces import INavigationLeaf
from cone.app.model import Metadata
from cone.app.model import Properties
from cone.app.model import ProtectedProperties
from cone.app.model import get_node_info
from cone.example import testing
from cone.example.model import Translation
from cone.example.wiki.model import Wiki
from cone.example.wiki.model import WikiFolder
from cone.example.wiki.model import WikiPage
from cone.tile import render_tile
from cone.tile.tests import TileTestCase
from datetime import datetime


class TestWikiModel(TileTestCase):
    layer = testing.security

    def test_Wiki_node_info(self):
        info = get_node_info('wiki')
        self.assertEqual(info.name, 'wiki')
        self.assertEqual(info.icon, 'bi-book')
        self.assertEqual(info.addables, ['wiki_folder', 'wiki_page'])

    def test_Wiki(self):
        wiki = Wiki()
        wiki.__name__ = 'wiki'
        # Properties
        props = wiki.properties
        self.assertIsInstance(props, Properties)
        self.assertFalse(props.mainmenu_display_children)
        self.assertTrue(props.in_navtree)
        self.assertEqual(props.default_content_tile, 'listing')
        # Can add wiki pages and folders
        page = WikiPage()
        page.__name__ = 'page1'
        wiki['page1'] = page
        self.assertIn('page1', wiki)
        folder = WikiFolder()
        folder.__name__ = 'folder1'
        wiki['folder1'] = folder
        self.assertIn('folder1', wiki)

    def test_WikiFolder_node_info(self):
        info = get_node_info('wiki_folder')
        self.assertEqual(info.name, 'wiki_folder')
        self.assertEqual(info.icon, 'bi-folder')
        self.assertEqual(info.addables, ['wiki_folder', 'wiki_page'])

    def test_WikiFolder(self):
        folder = WikiFolder()
        folder.__name__ = 'testfolder'
        # Properties
        props = folder.properties
        self.assertIsInstance(props, Properties)
        self.assertTrue(props.in_navtree)
        self.assertTrue(props.action_delete)
        # Can nest folders and pages
        subfolder = WikiFolder()
        subfolder.__name__ = 'subfolder'
        folder['subfolder'] = subfolder
        self.assertIn('subfolder', folder)
        page = WikiPage()
        page.__name__ = 'page1'
        folder['page1'] = page
        self.assertIn('page1', folder)

    def test_WikiPage_node_info(self):
        info = get_node_info('wiki_page')
        self.assertEqual(info.name, 'wiki_page')
        self.assertEqual(info.icon, 'bi-journal-text')
        # Wiki pages are leaf nodes - empty addables
        self.assertEqual(info.addables, [])

    def test_WikiPage(self):
        page = WikiPage()
        page.__name__ = 'testpage'
        # WikiPage implements INavigationLeaf
        self.assertTrue(INavigationLeaf.providedBy(page))
        # Has categories
        self.assertEqual(len(page.categories), 3)
        # role_inheritance enabled
        self.assertTrue(page.role_inheritance)
        # principal_roles is empty dict
        self.assertEqual(page.principal_roles, {})
        # Properties
        props = page.properties
        self.assertTrue(props.in_navtree)
        self.assertTrue(props.action_up)
        self.assertTrue(props.action_view)
        self.assertTrue(props.action_edit)
        self.assertTrue(props.action_delete)
        self.assertTrue(props.action_sharing)

    def test_WikiPage_workflow(self):
        # WikiPage uses WorkflowNode with wiki_workflow
        page = WikiPage()
        page.__name__ = 'testpage'
        self.assertEqual(page.workflow_name, 'wiki_workflow')
        # Default state is draft
        self.assertEqual(page.state, 'draft')

    def test_WikiPage_protected_properties(self):
        # WikiPage has protected_properties with body requiring edit permission
        page = WikiPage()
        page.__name__ = 'testpage'
        page.attrs['body'] = 'Test content'
        props = page.protected_properties
        self.assertIsInstance(props, ProtectedProperties)
        self.assertEqual(props.body, 'Test content')

    def test_WikiPage_metadata(self):
        page = WikiPage()
        page.__name__ = 'testpage'
        # Set attributes
        title = Translation()
        title['en'] = 'Test Page'
        page.attrs['title'] = title
        description = Translation()
        description['en'] = 'A test wiki page'
        page.attrs['description'] = description
        page.attrs['creator'] = 'testuser'
        page.attrs['created'] = datetime(2024, 1, 1, 12, 0, 0)
        page.attrs['modified'] = datetime(2024, 1, 2, 12, 0, 0)
        # Get metadata
        md = page.metadata
        self.assertIsInstance(md, Metadata)
        self.assertEqual(md.icon, 'bi-journal-text')
        self.assertEqual(md.creator, 'testuser')
        self.assertEqual(md.created, datetime(2024, 1, 1, 12, 0, 0))

    def test_WikiPage_uuid(self):
        # WikiPage uses UUIDAttributeAware - UUID stored in attrs
        page = WikiPage()
        page.__name__ = 'testpage'
        uuid = page.uuid
        self.assertIsNotNone(uuid)
        # UUID is stored in attrs
        self.assertIn('uuid', page.attrs)

    def test_WikiPage_references(self):
        # WikiPage can store references to other pages
        page = WikiPage()
        page.__name__ = 'testpage'
        # References are stored as a list of UUIDs
        page.attrs['references'] = []
        self.assertEqual(page.attrs['references'], [])
        # Add a reference UUID
        import uuid
        ref_uuid = str(uuid.uuid4())
        page.attrs['references'].append(ref_uuid)
        self.assertEqual(len(page.attrs['references']), 1)


class TestWikiBrowser(TileTestCase):
    layer = testing.security

    def test_wiki_content_tile(self):
        root = get_root()
        wiki = root['wiki']
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(wiki, request, 'content')
        self.assertIsNotNone(result)

    def test_wiki_folder_content_tile(self):
        root = get_root()
        wiki = root['wiki']
        # Get an existing folder from populate
        folder = wiki.get('technical')
        if folder is None:
            folder = WikiFolder()
            folder.__name__ = 'testfolder'
            title = Translation()
            title['en'] = 'Test Folder'
            folder.attrs['title'] = title
            wiki['testfolder'] = folder
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(folder, request, 'content')
        self.assertIsNotNone(result)

    def test_wiki_page_content_tile(self):
        root = get_root()
        wiki = root['wiki']
        # Create a wiki page
        page = WikiPage()
        page.__name__ = 'testpage'
        title = Translation()
        title['en'] = 'Test Page'
        page.attrs['title'] = title
        page.attrs['references'] = []
        wiki['testpage'] = page
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(page, request, 'content')
        self.assertIsNotNone(result)
        # Clean up
        del wiki['testpage']

    def test_tutorial_content_tile_wiki(self):
        root = get_root()
        wiki = root['wiki']
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(wiki, request, 'tutorial_content')
        self.assertIsNotNone(result)

    def test_tutorial_content_tile_folder(self):
        root = get_root()
        wiki = root['wiki']
        folder = wiki.get('technical')
        if folder is None:
            folder = WikiFolder()
            folder.__name__ = 'testfolder'
            wiki['testfolder'] = folder
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(folder, request, 'tutorial_content')
        self.assertIsNotNone(result)

    def test_tutorial_content_tile_page(self):
        root = get_root()
        wiki = root['wiki']
        page = wiki.get('getting-started')
        if page is None:
            page = WikiPage()
            page.__name__ = 'testpage'
            wiki['testpage'] = page
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(page, request, 'tutorial_content')
        self.assertIsNotNone(result)
