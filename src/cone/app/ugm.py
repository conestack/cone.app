from node.ext.ugm.file import Ugm as FileUgm
import logging


logger = logging.getLogger('cone.app')


class ugm_backend(object):
    """UGM backend configuration.
    """
    registry = dict()
    name = None
    factory = None
    ugm = None
    user_display_attr = 'fullname'
    group_display_attr = 'groupname'

    def __init__(self, name):
        self._reg_name = name

    def __call__(self, factory):
        self.registry[self._reg_name] = factory
        return factory

    @classmethod
    def load(cls, name, settings):
        if name not in cls.registry:
            raise ValueError('Unknown UGM backend "{}"'.format(name))
        cls.name = name
        cls.factory = cls.registry[name](settings)

    @classmethod
    def initialize(cls):
        if not cls.factory:
            raise ValueError('UGM backend not loaded')
        cls.ugm = cls.factory()


class UGMFactory(object):
    """UGM backend factory.
    """

    def __init__(self, settings):
        """Gets called by ``ugm_backend.load`` and is responsible to read
        UGM related configuration from passed ``settings`` dict.
        """
        raise NotImplementedError(
            'Abstract ``UGMFactory`` does not implement ``__init__``')

    def __call__(self):
        """Gets calles by ``ugm_backend.initialize`` and is responsible to
        instanciate and return a concrete ``node.ext.ugm.Ugm`` implementation.
        """
        raise NotImplementedError(
            'Abstract ``UGMFactory`` does not implement ``__call__``')


@ugm_backend('file')
class FileUGMFactory(UGMFactory):
    """UGM backend factory for file based UGM implementation.
    """

    def __init__(self, settings):
        self.users_file = settings.get('ugm.users_file')
        self.groups_file = settings.get('ugm.groups_file')
        self.roles_file = settings.get('ugm.roles_file')
        self.datadir = settings.get('ugm.datadir')

    def __call__(self):
        return FileUgm(
            name='ugm',
            users_file=self.users_file,
            groups_file=self.groups_file,
            roles_file=self.roles_file,
            data_directory=self.datadir
        )


@ugm_backend('node.ext.ugm')
class BCFileUGMFactory(FileUGMFactory):
    """B/C factory as replacement for the removed main hook from
    ``node.ext.ugm``. Actually the same as ``FileUGMFactory`` but reads
    settings from different names.
    """

    def __init__(self, settings):
        self.users_file = settings.get('node.ext.ugm.users_file')
        self.groups_file = settings.get('node.ext.ugm.groups_file')
        self.roles_file = settings.get('node.ext.ugm.roles_file')
        self.datadir = settings.get('node.ext.ugm.datadir')


def principal_data(principal_id):
    data = dict()
    ugm = ugm_backend.ugm
    try:
        user = ugm.users.get(principal_id)
        if not user:
            return data
        data = user.attrs
    except Exception as e:
        logger.error(str(e))
    return data
