from cone.app.compat import configparser
from cone.app.compat import IS_PY2
from cone.app.compat import ITER_TYPES
from cone.app.interfaces import IAdapterNode
from cone.app.interfaces import IApplicationEnvironment
from cone.app.interfaces import IApplicationNode
from cone.app.interfaces import ICopySupport
from cone.app.interfaces import IFactoryNode
from cone.app.interfaces import ILayoutConfig
from cone.app.interfaces import IMetadata
from cone.app.interfaces import INodeInfo
from cone.app.interfaces import IProperties
from cone.app.interfaces import ITranslation
from cone.app.interfaces import IUUIDAsName
from cone.app.security import acl_registry
from cone.app.utils import app_config
from cone.app.utils import DatetimeHelper
from node import schema
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
from node.behaviors import Schema
from node.behaviors import UUIDAware
from node.behaviors import VolatileStorageInvalidate
from node.interfaces import IOrdered
from node.interfaces import IUUID
from node.interfaces import IUUIDAware
from node.utils import instance_property
from node.utils import safe_decode
from node.utils import safe_encode
from odict import odict
from plumber import Behavior
from plumber import default
from plumber import finalize
from plumber import override
from plumber import plumbing
from pyramid.i18n import negotiate_locale_name
from pyramid.i18n import TranslationStringFactory
from pyramid.security import ALL_PERMISSIONS
from pyramid.security import Allow
from pyramid.security import Deny
from pyramid.security import Everyone
from pyramid.threadlocal import get_current_registry
from pyramid.threadlocal import get_current_request
from zope.interface import implementer
import copy
import logging
import os
import uuid


logger = logging.getLogger('cone.app')

try:
    from lxml import etree
except ImportError:  # pragma: no cover
    logger.warning(
        '``lxml`` not present. '
        '``cone.app.model.XMLProperties`` will not work')


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


@implementer(IApplicationEnvironment)
class AppEnvironment(Behavior):

    @default
    @property
    def request(self):
        return get_current_request()

    @default
    @property
    def registry(self):
        return get_current_registry()


@implementer(IApplicationNode)
class AppNode(Behavior):
    node_info_name = default('')

    @default
    @property
    def __acl__(self):
        return acl_registry.lookup(self.__class__, self.node_info_name)

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


@implementer(IUUID)
class NamespaceUUID(Behavior):
    """Behavior calculating ``uuid`` by node path and namespace.
    """
    uuid_namespace = default(uuid.UUID('83438507-fdff-45a2-af47-1e001884eab9'))

    @property
    def uuid(self):
        if self.__name__ is None and self.__parent__ is None:
            return None
        return uuid.uuid5(
            self.uuid_namespace,
            '/'.join([_ for _ in self.path if _ is not None])
        )

    @finalize
    @uuid.setter
    def uuid(self, uuid):
        msg = 'Ignore attempt to set {}.uuid'.format(self.__class__.__name__)
        raise NotImplementedError(msg)


class UUIDAttributeAware(UUIDAware):
    """UUIDAware deriving behavior storing the uid on node attributes.
    """

    @property
    def uuid(self):
        return self.attrs['uuid']

    @default
    @uuid.setter
    def uuid(self, value):
        self.attrs['uuid'] = value


@implementer(IUUIDAsName)
class UUIDAsName(UUIDAware):

    @property
    def __name__(self):
        return str(self.uuid)

    @finalize
    @__name__.setter
    def __name__(self, name):
        pass

    @finalize
    def set_uuid_for(self, node, override=False, recursiv=False):
        if IUUIDAware.providedBy(node):
            if override or not node.uuid:
                node.uuid = self.uuid_factory()
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


class LanguageSchema:

    def __iter__(self):
        from cone.app import cfg
        return iter(cfg.available_languages)

    def __contains__(self, key):
        return key in iter(self)

    def __getitem__(self, key):
        if key in self:
            return schema.Str()
        raise KeyError(key)

    def get(self, key, default=None):
        if key in self:
            return self[key]
        return default

    def keys(self):
        return list(iter(self))


@implementer(ITranslation)
class Translation(Schema, AppEnvironment):
    schema = override(LanguageSchema())

    @default
    @property
    def value(self):
        request = self.request
        if request:
            lang = negotiate_locale_name(request)
        else:
            settings = self.registry.settings or {}
            lang = settings.get('default_locale_name', 'en')
        value = self.get(lang)
        if not value:
            value = self.name
        return value


o_getattr = object.__getattribute__
o_setattr = object.__setattr__


@implementer(IProperties)
class Properties(object):
    # XXX: extend by schema

    def __init__(self, data=None):
        if data is None:
            data = dict()
        o_setattr(self, '_data', data)

    def __setitem__(self, key, value):
        setattr(self, key, value)

    def __getitem__(self, key):
        return o_getattr(self, '_data')[key]

    def get(self, key, default=None):
        return o_getattr(self, '_data').get(key, default)

    def __contains__(self, key):
        return key in o_getattr(self, '_data')

    def __getattr__(self, name):
        if name == '__provides__':
            return self.__getattribute__(name)
        return o_getattr(self, '_data').get(name)

    def __setattr__(self, name, value):
        o_getattr(self, '_data')[name] = value

    def keys(self):
        return o_getattr(self, '_data').keys()

    def __copy__(self):
        return self.__class__(
            data=copy.copy(o_getattr(self, '_data'))
        )

    def __deepcopy__(self, memo):
        return self.__class__(
            data=copy.deepcopy(o_getattr(self, '_data'), memo)
        )


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
        o_setattr(self, '_context', context)
        o_setattr(self, '_permissions', permissions)

    def _permits(self, property):
        context = o_getattr(self, '_context')
        permissions = o_getattr(self, '_permissions')
        required = permissions.get(property)
        if not required:
            # no security check
            return True
        request = get_current_request()
        for permission in required:
            if request.has_permission(permission, context):
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
        if name == '__provides__':
            return self.__getattribute__(name)
        if not self._permits(name):
            return None
        return super(ProtectedProperties, self).get(name)

    def keys(self):
        keys = super(ProtectedProperties, self).keys()
        keys = [key for key in keys if self._permits(key)]
        return keys

    def __copy__(self):
        return self.__class__(
            context=copy.copy(o_getattr(self, '_context')),
            permissions=copy.copy(o_getattr(self, '_permissions')),
            data=copy.copy(o_getattr(self, '_data'))
        )

    def __deepcopy__(self, memo):
        return self.__class__(
            context=copy.copy(o_getattr(self, '_context')),
            permissions=copy.deepcopy(o_getattr(self, '_permissions'), memo),
            data=copy.deepcopy(o_getattr(self, '_data'), memo)
        )


@implementer(ILayoutConfig)
class LayoutConfig(Properties):

    def __init__(self, model=None, request=None):
        super(LayoutConfig, self).__init__(data=None)
        self.model = model
        self.request = request


# B/C, removed as of cone.app 1.1
Layout = LayoutConfig


@implementer(IMetadata)
class Metadata(Properties):
    pass


@implementer(INodeInfo)
class NodeInfo(Properties):
    pass


class XMLProperties(Properties):

    def __init__(self, path, data=None):
        o_setattr(self, '_path', path)
        o_setattr(self, '_data', odict())
        if data:
            o_getattr(self, '_data').update(data)
        self._init()

    def __call__(self):
        file = open(o_getattr(self, '_path'), 'wb')
        file.write(self._xml_repr())
        file.close()

    def __delitem__(self, name):
        data = o_getattr(self, '_data')
        if name in data:
            del data[name]
        else:
            raise KeyError(u"property %s does not exist" % name)

    def _init(self):
        dth = DatetimeHelper()
        path = o_getattr(self, '_path')
        if not path or not os.path.exists(path):
            return
        file = open(path, 'r')
        tree = etree.parse(file)
        file.close()
        root = tree.getroot()
        data = o_getattr(self, '_data')
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
        data = o_getattr(self, '_data')
        for key, value in data.items():
            sub = etree.SubElement(root, key)
            if type(value) in ITER_TYPES:
                for item in value:
                    item_elem = etree.SubElement(sub, 'item')
                    item_elem.text = dth.w_value(item)
            elif isinstance(value, dict) or isinstance(value, odict):
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
        return o_getattr(self, '_data').keys()

    def _values(self):
        return o_getattr(self, '_data').values()

    def __copy__(self):
        return self.__class__(
            path=copy.copy(o_getattr(self, '_path')),
            data=copy.copy(o_getattr(self, '_data'))
        )

    def __deepcopy__(self, memo):
        return self.__class__(
            path=copy.deepcopy(o_getattr(self, '_path'), memo),
            data=copy.deepcopy(o_getattr(self, '_data'), memo)
        )


class ConfigProperties(Properties):
    properties_section = 'properties'
    encoding = 'utf-8'

    def __init__(self, path, data=None):
        o_setattr(self, '_path', path)
        o_setattr(self, '_data', dict())
        if data:
            o_getattr(self, '_data').update(data)
        self._init()

    def __call__(self):
        path = o_getattr(self, '_path')
        config = self.config()
        mode = 'wb' if IS_PY2 else 'w'
        with open(path, mode) as configfile:
            config.write(configfile)

    def __getitem__(self, key):
        try:
            value = self.config().get(self.properties_section, key)
            return safe_decode(value, encoding=self.encoding)
        except configparser.NoOptionError:
            raise KeyError(key)

    def get(self, key, default=None):
        try:
            value = self.config().get(self.properties_section, key)
            return safe_decode(value, encoding=self.encoding)
        except configparser.NoOptionError:
            return default

    def __contains__(self, key):
        try:
            self.config().get(self.properties_section, key)
            return True
        except configparser.NoOptionError:
            return False

    def __getattr__(self, name):
        if name == '__provides__':
            return self.__getattribute__(name)
        try:
            value = self.config().get(self.properties_section, name)
            return safe_decode(value, encoding=self.encoding)
        except configparser.NoOptionError:
            return None

    def __setattr__(self, name, value):
        value = safe_encode(value, encoding=self.encoding) if IS_PY2 else str(value)
        self.config().set(self.properties_section, name, value)

    def __delitem__(self, name):
        config = self.config()
        try:
            config.get(self.properties_section, name)
        except configparser.NoOptionError:
            raise KeyError(u"property %s does not exist" % name)
        config.remove_option(self.properties_section, name)

    def config(self):
        try:
            return o_getattr(self, '_config')
        except AttributeError:
            pass
        config = configparser.ConfigParser()
        path = o_getattr(self, '_path')
        if os.path.exists(path):
            config.read(path)
        else:
            config.add_section(self.properties_section)
        o_setattr(self, '_config', config)
        return o_getattr(self, '_config')

    def _init(self):
        data = o_getattr(self, '_data')
        config = self.config()
        for key, value in data.items():
            value = safe_encode(value, encoding=self.encoding) if IS_PY2 else str(value)
            config.set(self.properties_section, key, value)

    def __copy__(self):
        cpy = self.__class__(
            path=copy.copy(o_getattr(self, '_path')),
            data=copy.copy(o_getattr(self, '_data'))
        )
        cfg = copy.copy(o_getattr(self, '_config'))
        o_setattr(cpy, '_config', cfg)
        return cpy

    def __deepcopy__(self, memo):
        cpy = self.__class__(
            path=copy.deepcopy(o_getattr(self, '_path'), memo),
            data=copy.deepcopy(o_getattr(self, '_data'), memo)
        )
        cfg = copy.copy(o_getattr(self, '_config'))
        o_setattr(cpy, '_config', cfg)
        return cpy
