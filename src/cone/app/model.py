import os
import types
import ConfigParser
from lxml import etree
from datetime import datetime
from odict import odict
from plumber import plumber
from node.parts import (
    AsAttrAccess,
    NodeChildValidate,
    Adopt,
    Nodespaces,
    Attributes,
    DefaultInit,
    Nodify,
    Lifecycle,
    OdictStorage,
)
from zope.interface import implements
from pyramid.threadlocal import get_current_request
from pyramid.security import (
    authenticated_userid,
    Everyone,
    Allow,
    Deny,
    ALL_PERMISSIONS,
)
from cone.app.interfaces import (
    IApplicationNode,
    IFactoryNode,
    IAdapterNode,
    IProperties,
    IMetadata,
    INodeInfo,
)
from cone.app.security import DEFAULT_ACL
from cone.app.utils import DatetimeHelper

_node_info_registry = dict()

def registerNodeInfo(name, info):
    _node_info_registry[name] = info


def getNodeInfo(name):
    if name in _node_info_registry:
        return _node_info_registry[name]


class BaseNode(object):
    __metaclass__ = plumber
    __plumbing__ = (
        AsAttrAccess,
        NodeChildValidate,
        Adopt,
        Nodespaces,
        Attributes,
        DefaultInit,
        Nodify,
        Lifecycle,
        OdictStorage,
    )
    implements(IApplicationNode)
    
    __acl__ = DEFAULT_ACL
    
    # set this to name of registered node info on deriving class
    node_info_name = ''
    
    @property
    def properties(self):
        props = Properties()
        props.in_navtree = False
        props.editable = False
        return props
    
    @property
    def metadata(self):
        name = self.__name__
        if not name:
            name = 'No Title'
        metadata = BaseMetadata()
        metadata.title = name
        return metadata
    
    @property
    def nodeinfo(self):
        info = getNodeInfo(self.node_info_name)
        if not info:
            info = BaseNodeInfo()
            info.title = str(self.__class__)
            info.node = self.__class__
        return info


class FactoryNode(BaseNode):
    implements(IFactoryNode)
    
    factories = odict()
    
    def __iter__(self):
        keys = set()
        for key in self.factories.keys():
            keys.add(key)
        # access from self.storage, defined by OdictStrorage,
        # XXX: more general solution
        for key in self.storage:
            keys.add(key)
        for key in keys:
            yield key
    
    iterkeys = __iter__
    
    def __getitem__(self, key):
        try:
            # access from self.storage, defined by OdictStrorage,
            # XXX: more general solution
            child = self.storage[key]
        except KeyError, e:
            if not key in self.iterkeys():
                raise KeyError
            child = self.factories[key]()
            self[key] = child
        return child


class AppRoot(FactoryNode):
    """Application root.
    """
    factories = odict()

    @property
    def properties(self):
        if not hasattr(self, '_properties'):
            self._properties = Properties()
        return self._properties

    @property
    def metadata(self):
        if not hasattr(self, '_metadata'):
            self._metadata = BaseMetadata()
        return self._metadata


class AppSettings(FactoryNode):
    """Applications Settings container.
    """
    __acl__ = [
        (Allow, 'role:manager', ['view', 'manage']),
        (Allow, Everyone, 'login'),
        (Deny, Everyone, ALL_PERMISSIONS),
    ]
    factories = odict()
    
    @property
    def properties(self):
        if not hasattr(self, '_properties'):
            self._properties = Properties()
            self._properties.in_navtree = True
        return self._properties
    
    @property
    def metadata(self):
        if not hasattr(self, '_metadata'):
            self._metadata = BaseMetadata()
            self._metadata.title = "Settings"
        return self._metadata


class AdapterNode(BaseNode):
    implements(IAdapterNode)
    
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


class Properties(object):
    implements(IProperties)
    
    def __init__(self, data=None):
        if data is None:
            data = dict()
        object.__setattr__(self, '_data', data)
    
    def _get_data(self):
        return object.__getattribute__(self, '_data')
    
    def __getitem__(self, key):
        return self._get_data()[key]
    
    def get(self, key, default=None):
        return self._get_data().get(key, default)
    
    def __contains__(self, key):
        return key in self._get_data()
    
    def __getattr__(self, name):
        return self._get_data().get(name)
    
    def __setattr__(self, name, value):
        self._get_data()[name] = value
    
    def keys(self):
        return self._get_data().keys()


class BaseMetadata(Properties):
    implements(IMetadata)


class BaseNodeInfo(Properties):
    implements(INodeInfo)


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
            return self.config().get('properties', key)
        except ConfigParser.NoOptionError:
            raise KeyError(key)
    
    def get(self, key, default=None):
        try:
            return self.config().get('properties', key)
        except ConfigParser.NoOptionError:
            return default
    
    def __contains__(self, key):
        try:
            value = self.config().get('properties', key)
            return True
        except ConfigParser.NoOptionError:
            return False
    
    def __getattr__(self, name):
        try:
            return self.config().get('properties', name)
        except ConfigParser.NoOptionError:
            return
    
    def __setattr__(self, name, value):
        self.config().set('properties', name, value)
    
    def __delitem__(self, name):
        config = self.config()
        try:
            value = config.get('properties', name)
        except ConfigParser.NoOptionError:
            raise KeyError(u"property %s does not exist" % name)
        config.remove_option('properties', name)
    
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
            config.add_section('properties')
        object.__setattr__(self, '_config', config)
        return object.__getattribute__(self, '_config')
    
    def _init(self):
        data = object.__getattribute__(self, '_data')
        config = self.config()
        for key, value in data.items():
            config.set('properties', key, value)