from datetime import datetime

from cone.example.model import Translation


def make_translation(en_value, de_value):
    t = Translation()
    t['en'] = en_value
    t['de'] = de_value
    return t


def populate_wiki(wiki):
    """Populate Wiki with example pages and folders."""
    if len(wiki) > 0:
        return

    from cone.example.wiki.model import WikiFolder
    from cone.example.wiki.model import WikiPage

    # Getting started page at root level (published)
    getting_started = WikiPage()
    getting_started.attrs['title'] = make_translation('Getting Started', 'Erste Schritte')
    getting_started.attrs['description'] = make_translation(
        'Introduction to the wiki system', 'Einführung in das Wiki System')
    getting_started.attrs['body'] = (
        'Welcome to the Wiki.\n\n'
        'This example demonstrates:\n'
        '- Workflow states (draft, review, published, archived)\n'
        '- Folders for organizing pages hierarchically\n'
        '- Reference browser widget for linking pages\n'
        '- Categories (General, Technical, How-To)\n'
        '- Protected properties (body requires edit permission)\n'
        '- UUID-aware nodes'
    )
    getting_started.attrs['creator'] = 'admin'
    getting_started.attrs['created'] = datetime(2025, 1, 1)
    getting_started.attrs['modified'] = datetime(2025, 1, 1)
    getting_started.attrs['state'] = 'published'
    wiki['getting-started'] = getting_started

    # Folder with nested pages
    docs_folder = WikiFolder()
    docs_folder.attrs['title'] = make_translation('Documentation', 'Dokumentation')
    docs_folder.attrs['description'] = make_translation(
        'Technical documentation and guides',
        'Technische Dokumentation und Anleitungen'
    )
    docs_folder.attrs['creator'] = 'admin'
    docs_folder.attrs['created'] = datetime(2025, 1, 5)
    docs_folder.attrs['modified'] = datetime(2025, 1, 5)
    wiki['docs'] = docs_folder

    # Page inside folder (published)
    api_ref = WikiPage()
    api_ref.attrs['title'] = make_translation('API Reference', 'API Referenz')
    api_ref.attrs['description'] = make_translation(
        'Technical API documentation', 'Technische API Dokumentation')
    api_ref.attrs['body'] = (
        'cone.app API\n\n'
        'Model:\n'
        '- node_info: Declare node type metadata\n'
        '- BaseNode / FactoryNode: Node base classes\n'
        '- WorkflowNode: Nodes with workflow state support\n\n'
        'Browser:\n'
        '- tile: Register view tiles\n'
        '- layout_config: Configure page layout'
    )
    api_ref.attrs['creator'] = 'admin'
    api_ref.attrs['created'] = datetime(2025, 1, 5)
    api_ref.attrs['modified'] = datetime(2025, 1, 10)
    api_ref.attrs['state'] = 'published'
    docs_folder['api-reference'] = api_ref

    # Page in review state
    architecture = WikiPage()
    architecture.attrs['title'] = make_translation('Architecture Overview', 'Architektur Übersicht')
    architecture.attrs['description'] = make_translation(
        'System architecture and design patterns',
        'Systemarchitektur und Design Patterns'
    )
    architecture.attrs['body'] = (
        'Architecture Overview\n\n'
        'cone.app uses a layered architecture:\n'
        '- Model layer: Node-based content tree\n'
        '- Security layer: ACL and workflow permissions\n'
        '- Browser layer: Tiles and forms'
    )
    architecture.attrs['creator'] = 'admin'
    architecture.attrs['created'] = datetime(2025, 1, 8)
    architecture.attrs['modified'] = datetime(2025, 1, 8)
    architecture.attrs['state'] = 'review'
    docs_folder['architecture'] = architecture

    # Draft page at root
    draft_page = WikiPage()
    draft_page.attrs['title'] = make_translation('Work in Progress', 'In Arbeit')
    draft_page.attrs['description'] = make_translation(
        'Draft page demonstrating workflow',
        'Entwurfsseite zur Demonstration des Workflows'
    )
    draft_page.attrs['body'] = (
        'This page is still in draft state.\n\n'
        'Use the workflow dropdown to transition through states:\n'
        '- Submit for review\n'
        '- Publish\n'
        '- Archive'
    )
    draft_page.attrs['creator'] = 'editor'
    draft_page.attrs['created'] = datetime(2025, 3, 1)
    draft_page.attrs['modified'] = datetime(2025, 3, 1)
    draft_page.attrs['state'] = 'draft'
    wiki['work-in-progress'] = draft_page
