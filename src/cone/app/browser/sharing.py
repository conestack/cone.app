from pyramid.view import view_config
from cone.tile import (
    tile,
    registerTile,
)
from cone.app import security
from cone.app.browser.layout import ProtectedContentTile
from cone.app.browser.table import (
    Table,
    RowData,
    Item,
    Action,
)


registerTile('sharing',
             'cone.app:browser/templates/sharing.pt',
             class_=ProtectedContentTile,
             permission='login')


@tile('local_acl', 'cone.app:browser/templates/table.pt',
      permission='manage') # XXX: manage_permissions
class SharingTable(Table):
    
    table_id = 'localacltable'
    table_tile_name = 'local_acl'
    default_sort = 'principal'
    default_order = 'asc'
    slicesize = 15
    query_whitelist = ['term']
    
    @property
    def col_defs(self):
        col_defs = [
            {
                'id': 'actions',
                'title': 'Actions',
                'sort_key': None,
                'sort_title': None,
                'content': 'actions',
                'link': False,
            },
            {
                'id': 'principal',
                'title': 'Principal',
                'sort_key': 'principal',
                'sort_title': 'Sort by principal',
                'content': 'string',
                'link': True,
            },
        ]
        for role in security.DEFAULT_ROLES:
            col_defs.append({
                'id': role[0],
                'title': role[1],
                'sort_key': None,
                'sort_title': None,
                'content': 'structure',
                'link': False,
            })
        return col_defs
    
    @property
    def item_count(self):
        term = self.request.params.get('term')
        if term:
            principals = security.search_for_principals('*%s*' % term)
            return len(principals)
        return len(self.model.principal_roles.keys())
    
    def sorted_rows(self, start, end, sort, order):
        rows = list()
        chb = '<input type="checkbox" />'
        term = self.request.params.get('term')
        if term:
            principal_ids = security.search_for_principals('*%s*' % term)
        else:
            principal_roles = self.model.principal_roles
            principal_ids = principal_roles.keys()
        ids = principal_ids
        if order == 'desc':
            ids.reverse()
        for principal_id in ids[start:end]:
            principal = security.principal_by_id(principal_id)
            if not principal:
                # XXX: mark not found
                title = principal_id
            else:
                title = principal.attrs.get('fullname', principal_id)
            row_data = RowData()
            row_data['actions'] = Item(actions=[])
            row_data['principal'] = Item(title)
            row_data['editor'] = Item('<input type="checkbox" />')
            row_data['admin'] = Item('<input type="checkbox" />')
            row_data['manager'] = Item('<input type="checkbox" />')
            rows.append(row_data)
        return rows


@view_config(name='add_principal_role', accept='application/json',
             renderer='json', permission='manage') # XXX: manage_permissions
def add_principal_role(model, request):
    principal_id = request.params['id']
    role = request.params['role']
    roles = model.principal_roles
    if not id in roles:
        model.principal_roles[principal_id] = [role]
        return
    existing = set(model.principal_roles[principal_id])
    existing.add(role)
    model.principal_roles[principal_id] = list(existing)


@view_config(name='remove_principal_role', accept='application/json',
             renderer='json', permission='manage') # XXX: manage_permissions
def remove_principal_role(model, request):
    principal_id = request.params['id']
    role = request.params['role']
    roles = model.principal_roles
    if not id in roles:
        raise
    existing = model.principal_roles[principal_id]
    existing.remove(role)
    model.principal_roles[principal_id] = existing