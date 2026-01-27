from datetime import datetime

from cone.example.model import Translation


def make_translation(en_value, de_value):
    t = Translation()
    t['en'] = en_value
    t['de'] = de_value
    return t


def populate_documents(library):
    """Populate DocumentLibrary with example nodes."""
    if len(library) > 0:
        return

    from cone.example.document.model import Document
    from cone.example.document.model import DocumentFolder

    # Folder with a published document inside
    folder = DocumentFolder()
    folder.attrs['title'] = make_translation('Reports', 'Berichte')
    folder.attrs['description'] = make_translation(
        'Quarterly and annual reports', 'Vierteljährliche und jährliche Berichte')
    folder.attrs['creator'] = 'admin'
    folder.attrs['created'] = datetime(2025, 1, 15)
    folder.attrs['modified'] = datetime(2025, 1, 15)
    library['reports'] = folder

    report = Document()
    report.attrs['title'] = make_translation('Q4 Sales Report', 'Q4 Verkaufsbericht')
    report.attrs['description'] = make_translation(
        'Fourth quarter sales summary', 'Zusammenfassung der Verkäufe im vierten Quartal')
    report.attrs['body'] = (
        'Total revenue: $1.2M\n'
        'Growth: 15% YoY\n'
        'Top region: EMEA'
    )
    report.attrs['creator'] = 'admin'
    report.attrs['created'] = datetime(2025, 1, 10)
    report.attrs['modified'] = datetime(2025, 1, 12)
    report.attrs['state'] = 'published'
    folder['q4-sales-report'] = report

    # Draft document at root
    guide = Document()
    guide.attrs['title'] = make_translation('Getting Started Guide', 'Einsteigeranleitung')
    guide.attrs['description'] = make_translation(
        'How to use the document library', 'So verwenden Sie die Dokumentebibliothek')
    guide.attrs['body'] = (
        'Welcome to the Document Library.\n\n'
        'This example demonstrates:\n'
        '- Hierarchical folders and documents\n'
        '- Workflow states (draft, review, published, archived)\n'
        '- Protected properties (body requires edit permission)\n'
        '- Translation-aware title and description fields'
    )
    guide.attrs['creator'] = 'admin'
    guide.attrs['created'] = datetime(2025, 2, 1)
    guide.attrs['modified'] = datetime(2025, 2, 1)
    # state stays 'draft' (initial)
    library['getting-started'] = guide

    # Document in review
    notes = Document()
    notes.attrs['title'] = make_translation('Release Notes v2.0', 'Versionshinweise v2.0')
    notes.attrs['description'] = make_translation(
        'Upcoming release notes pending review',
        'Ausstehende Versionshinweise zur Überprüfung'
    )
    notes.attrs['body'] = (
        'New features:\n'
        '- Improved search\n'
        '- Batch operations\n'
        '- Reference browser widget'
    )
    notes.attrs['creator'] = 'editor'
    notes.attrs['created'] = datetime(2025, 3, 5)
    notes.attrs['modified'] = datetime(2025, 3, 8)
    notes.attrs['state'] = 'review'
    library['release-notes-v2'] = notes


def populate_wiki(wiki):
    """Populate Wiki with example pages."""
    if len(wiki) > 0:
        return

    from cone.example.wiki.model import WikiPage

    getting_started = WikiPage()
    getting_started.attrs['title'] = make_translation('Getting Started', 'Erste Schritte')
    getting_started.attrs['description'] = make_translation(
        'Introduction to the wiki system', 'Einführung in das Wiki System')
    getting_started.attrs['body'] = (
        'Welcome to the Wiki.\n\n'
        'This example demonstrates:\n'
        '- Reference browser widget for linking pages\n'
        '- Categories (General, Technical, How-To)\n'
        '- UUID-aware nodes'
    )
    getting_started.attrs['creator'] = 'admin'
    getting_started.attrs['created'] = datetime(2025, 1, 1)
    getting_started.attrs['modified'] = datetime(2025, 1, 1)
    wiki['getting-started'] = getting_started

    api_ref = WikiPage()
    api_ref.attrs['title'] = make_translation('API Reference', 'API Referenz')
    api_ref.attrs['description'] = make_translation(
        'Technical API documentation', 'Technische API Dokumentation')
    api_ref.attrs['body'] = (
        'cone.app API\n\n'
        'Model:\n'
        '- node_info: Declare node type metadata\n'
        '- BaseNode / FactoryNode: Node base classes\n'
        '- AdapterNode: Wrap external data models\n\n'
        'Browser:\n'
        '- tile: Register view tiles\n'
        '- layout_config: Configure page layout'
    )
    api_ref.attrs['creator'] = 'admin'
    api_ref.attrs['created'] = datetime(2025, 1, 5)
    api_ref.attrs['modified'] = datetime(2025, 1, 10)
    wiki['api-reference'] = api_ref

    deploy = WikiPage()
    deploy.attrs['title'] = make_translation('How to Deploy', 'So wird deployed')
    deploy.attrs['description'] = make_translation(
        'Step-by-step deployment guide', 'Schritt-für-Schritt Anleitung zum Deployment')
    deploy.attrs['body'] = (
        'Deployment Steps:\n\n'
        '1. Install dependencies: pip install -e .\n'
        '2. Configure mx.ini\n'
        '3. Run: pserve mx.ini'
    )
    deploy.attrs['creator'] = 'admin'
    deploy.attrs['created'] = datetime(2025, 2, 1)
    deploy.attrs['modified'] = datetime(2025, 2, 1)
    # Set references to other pages
    refs = []
    if hasattr(getting_started, 'uuid') and getting_started.uuid:
        refs.append(str(getting_started.uuid))
    if hasattr(api_ref, 'uuid') and api_ref.uuid:
        refs.append(str(api_ref.uuid))
    if refs:
        deploy.attrs['references'] = refs
    wiki['how-to-deploy'] = deploy


def populate_projects():
    """Register example project factories on ProjectBoard.

    FactoryNode children are defined via class-level ``factories`` dict.
    Each factory creates a pre-configured Project with Tasks.
    """
    from cone.example.project.model import ProjectBoard

    if ProjectBoard.factories:
        return

    def make_website_redesign(name=None, parent=None):
        from cone.example.project.model import Project, Task, TaskData
        project = Project()
        project.attrs['title'] = make_translation('Website Redesign', 'Website Neugestaltung')
        project.attrs['description'] = make_translation(
            'Redesign the company website with modern UI', 'Neugestaltung der Firmenwebsite mit modernem UI')
        project.attrs['creator'] = 'admin'
        project.attrs['created'] = datetime(2025, 1, 1)
        project.attrs['modified'] = datetime(2025, 3, 1)

        task1 = Task(TaskData(), None, None)
        task1.attrs['title'] = make_translation('Design mockups', 'Gestaltung von Mockups')
        task1.attrs['description'] = make_translation(
            'Create wireframes and visual mockups', 'Erstellung von Wireframes und Visual Mockups')
        task1.attrs['creator'] = 'designer'
        task1.attrs['created'] = datetime(2025, 1, 5)
        task1.attrs['modified'] = datetime(2025, 2, 1)
        task1.attrs['state'] = 'in_progress'
        project[str(task1.uuid)] = task1

        task2 = Task(TaskData(), None, None)
        task2.attrs['title'] = make_translation('Implement frontend', 'Frontend implementieren')
        task2.attrs['description'] = make_translation(
            'Build responsive frontend components', 'Bauen von responsive Frontend-Komponenten')
        task2.attrs['creator'] = 'developer'
        task2.attrs['created'] = datetime(2025, 2, 1)
        task2.attrs['modified'] = datetime(2025, 2, 1)
        project[str(task2.uuid)] = task2

        return project

    def make_mobile_app(name=None, parent=None):
        from cone.example.project.model import Project, Task, TaskData
        project = Project()
        project.attrs['title'] = make_translation('Mobile App', 'Mobile App')
        project.attrs['description'] = make_translation(
            'Native mobile application for iOS and Android', 'Native Mobile Applikation für iOs und Android')
        project.attrs['creator'] = 'admin'
        project.attrs['created'] = datetime(2025, 2, 15)
        project.attrs['modified'] = datetime(2025, 3, 10)

        task = Task(TaskData(), None, None)
        task.attrs['title'] = make_translation('Setup CI/CD pipeline', 'CI/CD-Pipeline einrichten')
        task.attrs['description'] = make_translation(
            'Configure automated builds and deployment',
            'Automatisierte Builds und Deployment konfigurieren'
        )
        task.attrs['creator'] = 'devops'
        task.attrs['created'] = datetime(2025, 2, 20)
        task.attrs['modified'] = datetime(2025, 3, 5)
        task.attrs['state'] = 'done'
        project[str(task.uuid)] = task

        return project

    ProjectBoard.factories['website-redesign'] = make_website_redesign
    ProjectBoard.factories['mobile-app'] = make_mobile_app
