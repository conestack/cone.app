from cone.app import security
from cone.app.browser import RelatedViewProvider
from cone.app.browser import render_main_template
from cone.app.browser.ajax import ajax_message
from cone.app.browser.table import RowData
from cone.app.browser.table import Table
from cone.tile import Tile
from cone.tile import tile
from plumber import plumbing
from pyramid.i18n import TranslationStringFactory
from pyramid.i18n import get_localizer
from pyramid.view import view_config
from yafowil.base import factory
import logging


logger = logging.getLogger('cone.app')
_ = TranslationStringFactory('cone.app')


@tile(name='sharing',
      path='templates/sharing.pt',
      permission='manage_permissions')
@plumbing(RelatedViewProvider)
class SharingTile(Tile):
    """Tile rendering the sharing table.
    """
    related_view = 'sharing'


@view_config('sharing', permission='manage_permissions')
def sharing(model, request):
    """Sharing view
    """
    return render_main_template(model, request, 'sharing')


@tile('local_acl', 'templates/table.pt',
      permission='manage_permissions')
class SharingTable(Table):
    table_id = 'localacltable'
    table_tile_name = 'local_acl'
    default_sort = 'principal'
    default_order = 'asc'
    show_filter = True

    @property
    def col_defs(self):
        col_defs = [
            {
                'id': 'principal',
                'title': _('principal', default='Principal'),
                'sort_key': 'principal',
                'sort_title': _('sort_by_principal',
                                default='Sort by principal'),
                'content': 'string',
            },
        ]
        for role in security.DEFAULT_ROLES:
            col_defs.append({
                'id': role[0],
                'title': role[1],
                'sort_key': None,
                'sort_title': None,
                'content': 'structure',
            })
        return col_defs

    @property
    def table_title(self):
        localizer = get_localizer(self.request)
        title = localizer.translate(self.model.metadata.title)
        return _('sharing_table_title',
                 default='Sharing: ${title}',
                 mapping={'title': title})

    @property
    def item_count(self):
        term = self.filter_term
        if term:
            principals = security.search_for_principals('*%s*' % term)
            return len(principals)
        return len(self.model.principal_roles.keys())

    def sorted_rows(self, start, end, sort, order):
        rows = list()
        term = self.filter_term
        model = self.model
        principal_roles = model.principal_roles
        inheritance = model.role_inheritance
        if term:
            principal_ids = security.search_for_principals('*%s*' % term)
        else:
            if inheritance:
                principal_ids = model.aggregated_roles.keys()
            else:
                principal_ids = principal_roles.keys()
        ids = principal_ids
        if order == 'desc':
            ids.reverse()
        for principal_id in ids[start:end]:
            principal = security.principal_by_id(principal_id)
            if not principal:
                logger.warning('principal %s not found' % principal_id)
                continue
            else:
                default = principal_id
                if principal_id.startswith('group:'):
                    default = principal_id[6:]
                title = principal.attrs.get('fullname', default)
            row_data = RowData()
            row_data['principal'] = title
            ugm_roles = principal.roles
            local_roles = principal_roles.get(principal_id, list())
            if inheritance:
                for role in model.aggregated_roles_for(principal_id):
                    if not role in local_roles:
                        ugm_roles.append(role)
            for role in security.DEFAULT_ROLES:
                inherited = role[0] in ugm_roles
                local = role[0] in local_roles
                row_data[role[0]] = \
                    self._role_column(principal_id, role[0], local, inherited)
            rows.append(row_data)
        return rows

    def _role_column(self, id, role, local, inherited):
        props = {
            'class': 'add_remove_role_for_principal',
            'disabled': inherited,
            'format': 'string',
        }
        props['checked'] = local or inherited
        cb = factory('checkbox', name=id, value=role, props=props)
        ret = '<span ajax:target="%s">' % self.nodeurl
        ret = '%s%s</span>' % (ret, cb())
        return ret


@tile('add_principal_role', permission='manage_permissions')
class AddPrincipalRole(Tile):

    def render(self):
        model = self.model
        request = self.request
        try:
            principal_id = request.params['id']
            role = request.params['role']
            roles = model.principal_roles
            if not principal_id in roles:
                model.principal_roles[principal_id] = [role]
                return u''
            existing = set(model.principal_roles[principal_id])
            existing.add(role)
            model.principal_roles[principal_id] = list(existing)
        except Exception, e:
            logger.error(e)
            localizer = get_localizer(self.request)
            message = localizer.translate(
                _('cannot_add_role_for_principal',
                  default="Can not add role '${role}' for principal '${pid}'"),
                  mapping={'role': role, 'pid': principal_id})
            ajax_message(self.request, message, 'error')
        return u''


@tile('remove_principal_role', permission='manage_permissions')
class RemovePrincipalRole(Tile):

    def render(self):
        model = self.model
        request = self.request
        try:
            principal_id = request.params['id']
            role = request.params['role']
            roles = model.principal_roles
            if not principal_id in roles:
                raise
            existing = model.principal_roles[principal_id]
            existing.remove(role)
            if not existing:
                del model.principal_roles[principal_id]
            else:
                model.principal_roles[principal_id] = existing
        except Exception, e:
            logger.error(e)
            localizer = get_localizer(self.request)
            message = localizer.translate(
                _('cannot_remove_role_for_principal',
                  default="Can not remove role '${role}' for "
                          "principal '${pid}'"),
                  mapping={'role': role, 'pid': principal_id})
            ajax_message(self.request, message, 'error')
        return u''
