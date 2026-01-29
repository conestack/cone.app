from cone.app.browser.authoring import ContentAddForm
from cone.app.browser.authoring import ContentEditForm
from cone.app.browser.batch import BatchedItems
from cone.app.browser.form import AddFormTarget
from cone.app.browser.form import EditFormTarget
from cone.app.browser.form import Form
from cone.app.browser.layout import ProtectedContentTile
from cone.app.browser.utils import make_url
from cone.app.utils import add_creation_metadata
from cone.app.utils import update_creation_metadata
from cone.example.model import Translation
from cone.example.model import _
from cone.example.project.model import Project
from cone.example.project.model import ProjectBoard
from cone.example.project.model import Task
from cone.example.project.model import TaskData
from cone.tile import tile
from cone.tile import Tile
from node.utils import UNSET
from plumber import plumbing
from yafowil.base import factory
from yafowil.persistence import write_mapping_writer


# View tiles
@tile(name='view',
      path='cone.example.project:templates/board_view.pt',
      interface=ProjectBoard,
      permission='login')
class ProjectBoardView(ProtectedContentTile):
    pass


@tile(name='view',
      path='cone.example.browser:templates/view.pt',
      interface=Project,
      permission='login')
class ProjectView(ProtectedContentTile):
    pass


@tile(name='content',
      path='cone.example.project:templates/task_view.pt',
      interface=Task,
      permission='login')
class TaskView(ProtectedContentTile):
    pass


# BatchedItems tile for ProjectBoard - demonstrates batched/searchable items
@tile(name='batched_projects',
      path='cone.app.browser:templates/batched_items.pt',
      interface=ProjectBoard,
      permission='view')
class ProjectBatchedItems(BatchedItems):
    items_id = 'projects'
    slice_template = 'cone.example.project:templates/project_items.pt'
    default_slice_size = 10
    show_title = True
    show_filter = True

    @property
    def title(self):
        return self.model.metadata.title

    @property
    def item_count(self):
        term = self.filter_term
        if term:
            return len([
                c for c in self.model.values()
                if term.lower() in (c.metadata.title or '').lower()
            ])
        return len(self.model)

    @property
    def slice_items(self):
        start, end = self.current_slice
        children = list(self.model.values())
        term = self.filter_term
        if term:
            children = [
                c for c in children
                if term.lower() in (c.metadata.title or '').lower()
            ]
        items = []
        for child in children[start:end]:
            items.append({
                'title': child.metadata.title,
                'description': child.metadata.description or '',
                'icon': child.metadata.icon or 'bi-clipboard',
                'target': make_url(self.request, node=child),
            })
        return items


# Project form
class ProjectForm(Form):

    def prepare(self):
        self.form = form = factory(
            'form',
            name='projectform',
            props={
                'action': self.form_action,
                'persist_writer': write_mapping_writer
            })
        form['title'] = factory(
            'field:label:help:error:translation:text',
            value=self.model.attrs.get('title', UNSET),
            props={
                'factory': Translation,
                'label': _('title', default='Title'),
                'help': _('project_title_help', default='Enter a project title'),
                'required': _('title_required', default='Title is required')
            })
        form['description'] = factory(
            'field:label:help:error:translation:textarea',
            value=self.model.attrs.get('description', UNSET),
            props={
                'factory': Translation,
                'label': _('description', default='Description'),
                'help': _('project_desc_help', default='Enter a project description'),
                'rows': 4
            })
        form['save'] = factory(
            'submit',
            props={
                'action': 'save',
                'expression': True,
                'handler': self.save,
                'next': self.next,
                'label': _('save', default='Save')
            })
        form['cancel'] = factory(
            'submit',
            props={
                'action': 'cancel',
                'expression': True,
                'skip': True,
                'next': self.next,
                'label': _('cancel', default='Cancel')
            })

    def save(self, widget, data):
        data.write(self.model.attrs)


# Task form
class TaskForm(Form):

    def prepare(self):
        self.form = form = factory(
            'form',
            name='taskform',
            props={
                'action': self.form_action,
                'persist_writer': write_mapping_writer
            })
        form['title'] = factory(
            'field:label:help:error:translation:text',
            value=self.model.attrs.get('title', UNSET),
            props={
                'factory': Translation,
                'label': _('title', default='Title'),
                'help': _('task_title_help', default='Enter a task title'),
                'required': _('title_required', default='Title is required')
            })
        form['description'] = factory(
            'field:label:help:error:translation:textarea',
            value=self.model.attrs.get('description', UNSET),
            props={
                'factory': Translation,
                'label': _('description', default='Description'),
                'help': _('task_desc_help', default='Enter a task description'),
                'rows': 4
            })
        form['save'] = factory(
            'submit',
            props={
                'action': 'save',
                'expression': True,
                'handler': self.save,
                'next': self.next,
                'label': _('save', default='Save')
            })
        form['cancel'] = factory(
            'submit',
            props={
                'action': 'cancel',
                'expression': True,
                'skip': True,
                'next': self.next,
                'label': _('cancel', default='Cancel')
            })

    def save(self, widget, data):
        data.write(self.model.attrs)


@plumbing(AddFormTarget)
class ProjectAddForm(ProjectForm):

    def save(self, widget, data):
        from cone.app.browser.utils import choose_name
        add_creation_metadata(self.request, self.model.attrs)
        super(ProjectAddForm, self).save(widget, data)
        parent = self.model.parent
        parent[choose_name(parent, self.model.metadata.title)] = self.model


@plumbing(EditFormTarget)
class ProjectEditForm(ProjectForm):

    def save(self, widget, data):
        update_creation_metadata(self.request, self.model.attrs)
        super(ProjectEditForm, self).save(widget, data)


# For Task add form, we need to create a TaskData and wrap in Task
def task_addmodel_factory(parent, nodeinfo):
    """Custom add model factory for Task.
    Creates a TaskData wrapped by Task (AdapterNode)."""
    task = Task(TaskData(), None, None)
    task.__parent__ = parent
    return task


@plumbing(AddFormTarget)
class TaskAddForm(TaskForm):

    def save(self, widget, data):
        add_creation_metadata(self.request, self.model.attrs)
        super(TaskAddForm, self).save(widget, data)
        parent = self.model.parent
        # UUIDAsName: name is determined by UUID
        parent[self.model.__name__] = self.model


@plumbing(EditFormTarget)
class TaskEditForm(TaskForm):

    def save(self, widget, data):
        update_creation_metadata(self.request, self.model.attrs)
        super(TaskEditForm, self).save(widget, data)


@tile(name='addform', interface=Project, permission='add')
@plumbing(ContentAddForm)
class ProjectContentAddForm(ProjectAddForm):
    ...


@tile(name='editform', interface=Project, permission='edit')
@plumbing(ContentEditForm)
class ProjectContentEditForm(ProjectEditForm):
    ...


@tile(name='addform', interface=Task, permission='add')
@plumbing(ContentAddForm)
class TaskContentAddForm(TaskAddForm):
    ...


@tile(name='editform', interface=Task, permission='edit')
@plumbing(ContentEditForm)
class TaskContentEditForm(TaskEditForm):
    ...


# tutorial

@tile(
    name='tutorial_content',
    path='templates/tutorial_board.pt',
    interface=ProjectBoard,
    permission='view',
    strict=False,
)
class ProjectBoardTutorial(Tile):
    ...


@tile(
    name='tutorial_content',
    path='templates/tutorial_project.pt',
    interface=Project,
    permission='view',
    strict=False,
)
class ProjectTutorial(Tile):
    ...


@tile(
    name='tutorial_content',
    path='templates/tutorial_task.pt',
    interface=Task,
    permission='view',
    strict=False,
)
class TaskTutorial(Tile):
    ...
