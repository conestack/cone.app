from cone.app import get_root
from cone.app.interfaces import INavigationLeaf
from cone.app.model import Metadata
from cone.app.model import Properties
from cone.app.model import get_node_info
from cone.example import testing
from cone.example.document.model import Document
from cone.example.document.model import DocumentFolder
from cone.example.document.model import DocumentLibrary
from cone.example.model import Translation
from cone.tile import render_tile
from cone.tile.tests import TileTestCase
from datetime import datetime


class TestDocumentModel(TileTestCase):
    layer = testing.security

    def test_DocumentLibrary_node_info(self):
        info = get_node_info('document_library')
        self.assertEqual(info.name, 'document_library')
        self.assertEqual(info.icon, 'bi-collection')
        self.assertEqual(info.addables, ['document_folder', 'document'])

    def test_DocumentLibrary(self):
        library = DocumentLibrary()
        library.__name__ = 'documents'
        # Properties
        props = library.properties
        self.assertIsInstance(props, Properties)
        self.assertFalse(props.mainmenu_display_children)
        self.assertTrue(props.in_navtree)
        self.assertEqual(props.default_content_tile, 'listing')
        # Can add folders and documents
        folder = DocumentFolder()
        folder.__name__ = 'folder1'
        library['folder1'] = folder
        self.assertIn('folder1', library)

    def test_DocumentFolder_node_info(self):
        info = get_node_info('document_folder')
        self.assertEqual(info.name, 'document_folder')
        self.assertEqual(info.icon, 'bi-folder')
        self.assertEqual(info.addables, ['document_folder', 'document'])

    def test_DocumentFolder(self):
        folder = DocumentFolder()
        folder.__name__ = 'folder'
        # Properties
        props = folder.properties
        self.assertTrue(props.action_delete)
        self.assertTrue(props.in_navtree)
        # Can nest folders
        subfolder = DocumentFolder()
        subfolder.__name__ = 'subfolder'
        folder['subfolder'] = subfolder
        self.assertIn('subfolder', folder)
        # Can add documents
        doc = Document()
        doc.__name__ = 'doc'
        folder['doc'] = doc
        self.assertIn('doc', folder)

    def test_Document_node_info(self):
        info = get_node_info('document')
        self.assertEqual(info.name, 'document')
        self.assertEqual(info.icon, 'bi-file-earmark-text')
        # Documents are leaf nodes - empty addables
        self.assertEqual(info.addables, [])

    def test_Document(self):
        doc = Document()
        doc.__name__ = 'testdoc'
        # Document implements INavigationLeaf
        self.assertTrue(INavigationLeaf.providedBy(doc))
        # Has workflow
        self.assertEqual(doc.workflow_name, 'document_workflow')
        # Properties
        props = doc.properties
        self.assertTrue(props.in_navtree)
        self.assertTrue(props.action_up)
        self.assertTrue(props.action_view)
        self.assertTrue(props.action_edit)
        self.assertTrue(props.action_delete)
        self.assertTrue(props.action_sharing)
        # role_inheritance enabled
        self.assertTrue(doc.role_inheritance)
        # principal_roles is empty dict
        self.assertEqual(doc.principal_roles, {})

    def test_Document_metadata(self):
        doc = Document()
        doc.__name__ = 'testdoc'
        # Set attributes
        title = Translation()
        title['en'] = 'Test Document'
        doc.attrs['title'] = title
        description = Translation()
        description['en'] = 'A test document'
        doc.attrs['description'] = description
        doc.attrs['creator'] = 'testuser'
        doc.attrs['created'] = datetime(2024, 1, 1, 12, 0, 0)
        doc.attrs['modified'] = datetime(2024, 1, 2, 12, 0, 0)
        # Get metadata
        md = doc.metadata
        self.assertIsInstance(md, Metadata)
        self.assertEqual(md.icon, 'bi-file-earmark-text')
        self.assertEqual(md.creator, 'testuser')
        self.assertEqual(md.created, datetime(2024, 1, 1, 12, 0, 0))
        self.assertEqual(md.modified, datetime(2024, 1, 2, 12, 0, 0))

    def test_Document_protected_properties(self):
        from cone.app.model import ProtectedProperties
        root = get_root()
        request = self.layer.new_request()
        # Document has OwnerSupport which requires request context
        with self.layer.authenticated('max'):
            doc = Document()
            doc.__name__ = 'testdoc'
            doc.__parent__ = root['documents']
            doc.attrs['body'] = 'Document body content'
            # protected_properties returns a ProtectedProperties instance
            pp = doc.protected_properties
            self.assertIsInstance(pp, ProtectedProperties)
            # Body attribute exists on protected_properties
            self.assertTrue(hasattr(pp, 'body'))

    def test_Document_uuid(self):
        # Document uses UUIDAttributeAware - UUID stored in attrs
        doc = Document()
        doc.__name__ = 'testdoc'
        # Access uuid triggers creation
        uuid = doc.uuid
        self.assertIsNotNone(uuid)
        # UUID is stored in attrs
        self.assertIn('uuid', doc.attrs)


class TestDocumentBrowser(TileTestCase):
    layer = testing.security

    def test_library_view_tile(self):
        root = get_root()
        library = root['documents']
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(library, request, 'view')
        # View tile should render without error
        self.assertIsNotNone(result)

    def test_document_content_tile(self):
        root = get_root()
        library = root['documents']
        # Create a document
        doc = Document()
        doc.__name__ = 'testdoc'
        title = Translation()
        title['en'] = 'Test Doc'
        doc.attrs['title'] = title
        library['testdoc'] = doc
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(doc, request, 'content')
        self.assertIsNotNone(result)
        # Clean up
        del library['testdoc']

    def test_tutorial_content_tile(self):
        root = get_root()
        library = root['documents']
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(library, request, 'tutorial_content')
        # Tutorial content should render code examples
        self.assertIsNotNone(result)
