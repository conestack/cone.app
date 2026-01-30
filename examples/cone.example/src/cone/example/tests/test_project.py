from cone.app import get_root
from cone.app.interfaces import INavigationLeaf
from cone.app.model import Metadata
from cone.app.model import Properties
from cone.app.model import get_node_info
from cone.example import testing
from cone.example.model import Translation
from cone.example.project.model import Project
from cone.example.project.model import ProjectBoard
from cone.example.project.model import Task
from cone.example.project.model import TaskData
from cone.tile import render_tile
from cone.tile.tests import TileTestCase
from datetime import datetime


class TestProjectModel(TileTestCase):
    layer = testing.security

    def test_ProjectBoard_node_info(self):
        info = get_node_info('project_board')
        self.assertEqual(info.name, 'project_board')
        self.assertEqual(info.icon, 'bi-kanban')
        self.assertEqual(info.addables, ['project'])

    def test_ProjectBoard(self):
        board = ProjectBoard()
        board.__name__ = 'projects'
        # ProjectBoard is a FactoryNode
        # Properties
        props = board.properties
        self.assertIsInstance(props, Properties)
        self.assertTrue(props.in_navtree)
        self.assertEqual(props.default_content_tile, 'listing')
        self.assertFalse(props.action_edit)
        self.assertTrue(props.action_add)
        # Metadata
        md = board.metadata
        self.assertIsInstance(md, Metadata)
        self.assertEqual(md.icon, 'bi-kanban')

    def test_ProjectBoard_factories(self):
        # ProjectBoard.factories contains factory callables
        # In the example, these are populated by populate_projects()
        root = get_root()
        board = root['projects']
        # Board should exist and be a ProjectBoard
        self.assertIsInstance(board, ProjectBoard)
        # After population, factories may contain entries
        # (depends on whether populate was called)
        self.assertIsInstance(board.factories, dict)

    def test_Project_node_info(self):
        info = get_node_info('project')
        self.assertEqual(info.name, 'project')
        self.assertEqual(info.icon, 'bi-clipboard')
        self.assertEqual(info.addables, ['task'])

    def test_Project(self):
        project = Project()
        project.__name__ = 'testproject'
        # Has categories
        self.assertEqual(len(project.categories), 2)
        # role_inheritance enabled
        self.assertTrue(project.role_inheritance)
        # principal_roles is empty dict
        self.assertEqual(project.principal_roles, {})
        # Properties
        props = project.properties
        self.assertTrue(props.in_navtree)
        self.assertEqual(props.default_content_tile, 'listing')
        self.assertTrue(props.action_up)
        self.assertTrue(props.action_view)
        self.assertTrue(props.action_edit)
        self.assertTrue(props.action_delete)
        self.assertTrue(props.action_list)
        self.assertTrue(props.action_sharing)
        self.assertTrue(props.action_add)

    def test_Project_metadata(self):
        project = Project()
        project.__name__ = 'testproject'
        # Set attributes
        title = Translation()
        title['en'] = 'Test Project'
        project.attrs['title'] = title
        description = Translation()
        description['en'] = 'A test project'
        project.attrs['description'] = description
        project.attrs['creator'] = 'testuser'
        project.attrs['created'] = datetime(2024, 1, 1, 12, 0, 0)
        # Get metadata
        md = project.metadata
        self.assertIsInstance(md, Metadata)
        self.assertEqual(md.icon, 'bi-clipboard')
        self.assertEqual(md.creator, 'testuser')

    def test_Project_uuid(self):
        # Project uses NamespaceUUID - UUID calculated from path + namespace
        project = Project()
        project.__name__ = 'testproject'
        uuid = project.uuid
        self.assertIsNotNone(uuid)

    def test_TaskData(self):
        # TaskData is the internal data model wrapped by Task
        data = TaskData()
        # Has attributes storage
        data.attrs['test'] = 'value'
        self.assertEqual(data.attrs['test'], 'value')

    def test_Task_node_info(self):
        info = get_node_info('task')
        self.assertEqual(info.name, 'task')
        self.assertEqual(info.icon, 'bi-check2-square')
        # Tasks are leaf nodes - empty addables
        self.assertEqual(info.addables, [])

    def test_Task(self):
        # Task wraps TaskData via AdapterNode
        data = TaskData()
        task = Task(model=data)
        task.__name__ = 'testtask'
        # Task implements INavigationLeaf
        self.assertTrue(INavigationLeaf.providedBy(task))
        # Has workflow
        self.assertEqual(task.workflow_name, 'task_workflow')
        # Has categories
        self.assertEqual(len(task.categories), 2)
        # role_inheritance enabled
        self.assertTrue(task.role_inheritance)
        # Properties
        props = task.properties
        self.assertTrue(props.in_navtree)
        self.assertTrue(props.action_up)
        self.assertTrue(props.action_view)
        self.assertTrue(props.action_edit)
        self.assertTrue(props.action_delete)
        self.assertTrue(props.action_sharing)

    def test_Task_metadata(self):
        data = TaskData()
        task = Task(model=data)
        task.__name__ = 'testtask'
        # Set attributes via task (proxied to data)
        title = Translation()
        title['en'] = 'Test Task'
        task.attrs['title'] = title
        description = Translation()
        description['en'] = 'A test task'
        task.attrs['description'] = description
        task.attrs['creator'] = 'testuser'
        # Get metadata
        md = task.metadata
        self.assertIsInstance(md, Metadata)
        self.assertEqual(md.icon, 'bi-check2-square')
        self.assertEqual(md.creator, 'testuser')

    def test_Task_uuid_as_name(self):
        # Task uses UUIDAsName - __name__ is UUID string
        data = TaskData()
        task = Task(model=data)
        # After UUID is set, name becomes UUID string
        uuid = task.uuid
        self.assertIsNotNone(uuid)
        # The task's name should be the UUID string
        self.assertEqual(task.__name__, str(uuid))


class TestProjectBrowser(TileTestCase):
    layer = testing.security

    def test_board_view_tile(self):
        root = get_root()
        board = root['projects']
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(board, request, 'view')
        self.assertIsNotNone(result)

    def test_tutorial_content_tile(self):
        root = get_root()
        board = root['projects']
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(board, request, 'tutorial_content')
        self.assertIsNotNone(result)
