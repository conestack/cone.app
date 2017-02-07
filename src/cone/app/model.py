from cone.app.interfaces import IAdapterNode
from cone.app.interfaces import IApplicationNode
from cone.app.interfaces import ICopySupport
from cone.app.interfaces import IFactoryNode
from cone.app.interfaces import ILayout
from cone.app.interfaces import IMetadata
from cone.app.interfaces import INodeInfo
from cone.app.interfaces import IProperties
from cone.app.interfaces import IUUIDAsName
from cone.app.security import acl_registry
from cone.app.utils import DatetimeHelper
from cone.app.utils import app_config
from cone.app.utils import safe_decode
from cone.app.utils import safe_encode
from node.behaviors import Adopt
from node.behaviors import AsAttrAccess
from node.behaviors import Attributes
from node.behaviors import ChildFactory
from node.behaviors import DefaultInit
from node.behaviors import Lifecycle
from node.behaviors import NodeChildValidate
from node.behaviors import Nodespaces
from node.behaviors import Nodify
from node.behaviors import OdictStorage
from node.behaviors import UUIDAware
from node.behaviors import VolatileStorageInvalidate
from node.interfaces import IOrdered
from node.interfaces import IUUIDAware
from node.utils import instance_property
from odict import odict
from plumber import Behavior
from plumber import default
from plumber import finalize
from plumber import plumbing
from pyramid.i18n import TranslationStringFactory
from pyramid.security import ALL_PERMISSIONS
from pyramid.security import Allow
from pyramid.security import Deny
from pyramid.security import Everyone
from pyramid.security import has_permission
from pyramid.threadlocal import get_current_registry
from pyramid.threadlocal import get_current_request
from zope.interface import implementer
import ConfigParser
import logging
import os
import types
import uuid


logger = logging.getLogger('cone.app')

try:
    from lxml import etree
except ImportError:
    logger.warning('``lxml`` not present. ``cone.app.model.XMLProperties`` '
                   'will not work')


_ = TranslationStringFactory('cone.app')


_node_info_registry = dict()


def register_node_info(name, info):
    _node_info_registry[name] = info

# B/C removed as of cone.app 1.1
registerNodeInfo = register_node_info


def get_node_info(name):
    if name in _node_info_registry:
        return _node_info_registry[name]

# B/C removed as of cone.app 1.1
getNodeInfo = get_node_info


class node_info(object):
    """Node info decorator.
    """

    def __init__(self, name, title=None, description=None,
                 factory=None, icon=None, addables=[]):
        self.name = name
        self.title = title
        self.description = description
        self.factory = factory
        self.icon = icon
        self.addables = addables

    def __call__(self, cls):
        cls.node_info_name = self.name
        info = NodeInfo()
        info.node = cls
        info.title = self.title
        info.description = self.description
        info.factory = self.factory
        info.addables = self.addables
        info.icon = self.icon
        register_node_info(cls.node_info_name, info)
        return cls


@implementer(IApplicationNode)
class AppNode(Behavior):
    node_info_name = default('')

    @default
    @property
    def __acl__(self):
        return acl_registry.lookup(self.__class__, self.node_info_name)

    @default
    @property
    def layout(self):
        props = self.properties
        if props.default_child:
            return self[props.default_child].layout
        # XXX: consider adding and return add model layout here?
        return get_current_registry().getAdapter(self, ILayout)

    @default
    @instance_property
    def properties(self):
        props = Properties()
        props.in_navtree = False
        return props

    @default
    @instance_property
    def metadata(self):
        name = self.name
        if not name:
            name = _('no_title', default='No Title')
        metadata = Metadata()
        metadata.title = name
        return metadata

    @default
    @property
    def nodeinfo(self):
        info = get_node_info(self.node_info_name)
        if not info:
            info = NodeInfo()
            info.title = str(self.__class__)
            info.node = self.__class__
            info.icon = app_config().default_node_icon
        return info


@plumbing(
    AppNode,
    AsAttrAccess,
    NodeChildValidate,
    Adopt,
    Nodespaces,
    Attributes,
    DefaultInit,
    Nodify,
    Lifecycle,
    OdictStorage)
class BaseNode(object):
    pass


@implementer(IFactoryNode)
@plumbing(
    VolatileStorageInvalidate,
    ChildFactory)
class FactoryNode(BaseNode):
    pass


class AppRoot(FactoryNode):
    """Application root.
    """
    factories = odict()

    @instance_property
    def properties(self):
        return Properties()

    @instance_property
    def metadata(self):
        return Metadata()


class AppSettings(FactoryNode):
    """Applications Settings container.
    """
    __acl__ = [
        (Allow, 'role:manager', ['view', 'manage']),
        (Allow, Everyone, 'login'),
        (Deny, Everyone, ALL_PERMISSIONS),
    ]
    factories = odict()

    @instance_property
    def properties(self):
        props = Properties()
        props.in_navtree = False
        props.skip_mainmenu = True
        props.icon = 'ion-ios7-gear'
        return props

    @instance_property
    def metadata(self):
        metadata = Metadata()
        metadata.title = _('settings', default='Settings')
        return metadata


@implementer(IAdapterNode)
class AdapterNode(BaseNode):

    def __init__(self, model, name, parent):
        BaseNode.__init__(self, name)
        self.model = model
        self.__name__ = name
        self.__parent__ = parent

    def __iter__(self):
        for key in self.model:
            yield key

    iterkeys = __iter__

    @property
    def attrs(self):
        return self.model.attrs


class UUIDAttributeAware(UUIDAware):

    def _get_uuid(self):
        return self.attrs['uuid']

    def _set_uuid(self, value):
        self.attrs['uuid'] = value

    uuid = default(property(_get_uuid, _set_uuid))


@implementer(IUUIDAsName)
class UUIDAsName(UUIDAware):

    def _get_name(self):
        return str(self.uuid)

    def _set_name(self, name):
        pass

    __name__ = finalize(property(_get_name, _set_name))

    @finalize
    def set_uuid_for(self, node, override=False, recursiv=False):
        if IUUIDAware.providedBy(node):
            if override or not node.uuid:
                node.uuid = uuid.uuid4()
        if recursiv:
            for k, v in node.items():
                self.set_uuid_for(v, override, recursiv)
                if IUUIDAware.providedBy(v) and override:
                    if IOrdered.providedBy(v):
                        # XXX: improve
                        node.storage.alter_key(k, v.name)
                    else:
                        del node[k]
                        node[v.name] = v


@implementer(ICopySupport)
class CopySupport(Behavior):
    """Plumbing behavior for copy support.
    """
    supports_cut = default(True)
    supports_copy = default(True)
    supports_paste = default(True)


@implementer(IProperties)
class Properties(object):

    def __init__(self, data=None):
        if data is None:
            data = dict()
        object.__setattr__(self, '_data', data)

    def _get_data(self):
        return object.__getattribute__(self, '_data')

    def __setitem__(self, key, value):
        setattr(self, key, value)

    def __getitem__(self, key):
        return self._get_data()[key]

    def get(self, key, default=None):
        return self._get_data().get(key, default)

    def __contains__(self, key):
        return key in self._get_data()

    def __getattr__(self, key):
        return self._get_data().get(key)

    def __setattr__(self, key, value):
        self._get_data()[key] = value

    def keys(self):
        return self._get_data().keys()


class ProtectedProperties(Properties):

    def __init__(self, context, permissions, data=None):
        """
        >>> properties = ProtectedProperties(
        ...     context,
        ...     permissions={
        ...         'propname': ['permission1', 'permission2']
        ...     })
        """
        super(ProtectedProperties, self).__init__(data=data)
        object.__setattr__(self, '_context', context)
        object.__setattr__(self, '_permissions', permissions)

    def _permits(self, property):
        context = object.__getattribute__(self, '_context')
        permissions = object.__getattribute__(self, '_permissions')
        required = permissions.get(property)
        if not required:
            # no security check
            return True
        request = get_current_request()
        for permission in required:
            if has_permission(permission, context, request):
                return True
        return False

    def __getitem__(self, key):
        if not self._permits(key):
            raise KeyError(u"No permission to access '%s'" % key)
        return super(ProtectedProperties, self).__getitem__(key)

    def get(self, key, default=None):
        if not self._permits(key):
            return default
        return super(ProtectedProperties, self).get(key, default)

    def __contains__(self, key):
        if not self._permits(key):
            return False
        return super(ProtectedProperties, self).__contains__(key)

    def __getattr__(self, name):
        if not self._permits(name):
            return None
        return super(ProtectedProperties, self).get(name)

    def keys(self):
        keys = super(ProtectedProperties, self).keys()
        keys = [key for key in keys if self._permits(key)]
        return keys


@implementer(ILayout)
class Layout(Properties):

    def __init__(self, model=None):
        super(Layout, self).__init__()
        self.model = model


@implementer(IMetadata)
class Metadata(Properties):
    pass


@implementer(INodeInfo)
class NodeInfo(Properties):
    pass


class XMLProperties(Properties):

    def __init__(self, path, data=None):
        object.__setattr__(self, '_path', path)
        object.__setattr__(self, '_data', odict())
        if data:
            object.__getattribute__(self, '_data').update(data)
        self._init()

    def __call__(self):
        file = open(object.__getattribute__(self, '_path'), 'w')
        file.write(self._xml_repr())
        file.close()

    def __delitem__(self, name):
        data = object.__getattribute__(self, '_data')
        if name in data:
            del data[name]
        else:
            raise KeyError(u"property %s does not exist" % name)

    def get_path(self):
        return object.__getattribute__(self, '_path')

    def set_path(self, path):
        object.__setattr__(self, '_path', path)

    def _init(self):
        dth = DatetimeHelper()
        path = object.__getattribute__(self, '_path')
        if not path or not os.path.exists(path):
            return
        file = open(path, 'r')
        tree = etree.parse(file)
        file.close()
        root = tree.getroot()
        data = object.__getattribute__(self, '_data')
        for elem in root.getchildren():
            children = elem.getchildren()
            if children:
                subchildren = children[0].getchildren()
                # case dict like
                if subchildren:
                    val = odict()
                    for subelem in children:
                        entry_elems = subelem.getchildren()
                        val[entry_elems[0].text] = entry_elems[1].text
                # case list like
                else:
                    val = list()
                    for subelem in children:
                        value = subelem.text
                        if not value:
                            value = ''
                        val.append(dth.r_value(value.strip()))
                data[elem.tag] = val
            else:
                value = elem.text
                if not value:
                    value = ''
                data[elem.tag] = dth.r_value(value.strip())
        file.close()

    def _xml_repr(self):
        dth = DatetimeHelper()
        root = etree.Element('properties')
        data = object.__getattribute__(self, '_data')
        for key, value in data.items():
            sub = etree.SubElement(root, key)
            if type(value) in [types.ListType, types.TupleType]:
                for item in value:
                    item_elem = etree.SubElement(sub, 'item')
                    item_elem.text = dth.w_value(item)
            elif type(value) is types.DictType or isinstance(value, odict):
                for key, val in value.items():
                    dict_entry_elem = etree.SubElement(sub, 'elem')
                    key_elem = etree.SubElement(dict_entry_elem, 'key')
                    value_elem = etree.SubElement(dict_entry_elem, 'value')
                    key_elem.text = dth.w_value(key)
                    value_elem.text = dth.w_value(val)
            else:
                sub.text = dth.w_value(value)
        return etree.tostring(root, pretty_print=True)

    # testing
    def _keys(self):
        return object.__getattribute__(self, '_data').keys()

    def _values(self):
        return object.__getattribute__(self, '_data').values()


class ConfigProperties(Properties):
    properties_section = 'properties'
    encoding = 'utf-8'

    def __init__(self, path, data=None):
        object.__setattr__(self, '_path', path)
        object.__setattr__(self, '_data', dict())
        if data:
            object.__getattribute__(self, '_data').update(data)
        self._init()

    def __call__(self):
        path = object.__getattribute__(self, '_path')
        config = self.config()
        with open(path, 'wb') as configfile:
            config.write(configfile)

    def __getitem__(self, key):
        try:
            value = self.config().get(self.properties_section, key)
            return safe_decode(value, encoding=self.encoding)
        except ConfigParser.NoOptionError:
            raise KeyError(key)

    def get(self, key, default=None):
        try:
            value = self.config().get(self.properties_section, key)
            return safe_decode(value, encoding=self.encoding)
        except ConfigParser.NoOptionError:
            return default

    def __contains__(self, key):
        try:
            self.config().get(self.properties_section, key)
            return True
        except ConfigParser.NoOptionError:
            return False

    def __getattr__(self, name):
        try:
            value = self.config().get(self.properties_section, name)
            return safe_decode(value, encoding=self.encoding)
        except ConfigParser.NoOptionError:
            return None

    def __setattr__(self, name, value):
        value = safe_encode(value, encoding=self.encoding)
        self.config().set(self.properties_section, name, value)

    def __delitem__(self, name):
        config = self.config()
        try:
            config.get(self.properties_section, name)
        except ConfigParser.NoOptionError:
            raise KeyError(u"property %s does not exist" % name)
        config.remove_option(self.properties_section, name)

    def config(self):
        try:
            return object.__getattribute__(self, '_config')
        except AttributeError:
            pass
        config = ConfigParser.ConfigParser()
        path = object.__getattribute__(self, '_path')
        if os.path.exists(path):
            config.read(path)
        else:
            config.add_section(self.properties_section)
        object.__setattr__(self, '_config', config)
        return object.__getattribute__(self, '_config')

    def _init(self):
        data = object.__getattribute__(self, '_data')
        config = self.config()
        for key, value in data.items():
            value = safe_encode(value, encoding=self.encoding)
            config.set(self.properties_section, key, value)
