from cone.app import testing
from cone.app.ugm import BCFileUGMBackend
from cone.app.ugm import FileUGMBackend
from cone.app.ugm import principal_data
from cone.app.ugm import ugm_backend
from cone.app.ugm import UGMBackend
from node.ext.ugm.file import Ugm as FileUgm
from node.tests import NodeTestCase


def restore_ugm_backend(fn):
    def wrapper(*a, **kw):
        registry = ugm_backend.registry
        name = ugm_backend.name
        factory = ugm_backend.factory
        ugm = ugm_backend.ugm
        try:
            fn(*a, **kw)
        finally:
            ugm_backend.name = name
            ugm_backend.factory = factory
            ugm_backend.ugm = ugm
            ugm_backend.registry = registry
    return wrapper


class TestUgm(NodeTestCase):
    layer = testing.security

    def test_UGMBackend(self):
        self.expect_error(NotImplementedError, UGMBackend, {})

        class DummyUGMBackend(UGMBackend):
            def __init__(self, settings):
                pass

        self.expect_error(NotImplementedError, DummyUGMBackend({}).__call__)

    @restore_ugm_backend
    def test_ugm_backend(self):
        ugm_backend.registry = dict()
        ugm_backend.name = None
        ugm_backend.factory = None
        ugm_backend.ugm = None

        class DummyUGM(object):
            pass

        @ugm_backend('dummy')
        class DummyUGMBackend(UGMBackend):
            def __init__(self, settings):
                pass

            def __call__(self):
                return DummyUGM()

        self.assertEqual(ugm_backend.registry, {'dummy': DummyUGMBackend})

        err = self.expect_error(ValueError, ugm_backend.load, 'inexistent', {})
        self.assertEqual(str(err), 'Unknown UGM backend "inexistent"')

        err = self.expect_error(ValueError, ugm_backend.initialize)
        self.assertEqual(str(err), 'UGM backend not loaded')

        self.assertEqual(ugm_backend.name, None)
        self.assertEqual(ugm_backend.factory, None)
        self.assertEqual(ugm_backend.ugm, None)

        ugm_backend.load('dummy', {})

        self.assertEqual(ugm_backend.name, 'dummy')
        self.assertTrue(isinstance(ugm_backend.factory, DummyUGMBackend))
        self.assertEqual(ugm_backend.ugm, None)

        ugm_backend.initialize()
        self.assertTrue(isinstance(ugm_backend.ugm, DummyUGM))

        ugm = ugm_backend.ugm
        ugm_backend.initialize()
        self.assertFalse(ugm is ugm_backend.ugm)

    @restore_ugm_backend
    def test_FileUGMBackend(self):
        self.assertTrue('file' in ugm_backend.registry)
        self.assertTrue(ugm_backend.registry['file'] is FileUGMBackend)

        ugm_backend.load('file', {
            'ugm.users_file': 'users',
            'ugm.groups_file': 'groups',
            'ugm.roles_file': 'roles',
            'ugm.datadir': 'userdata'
        })
        ugm_backend.initialize()
        ugm = ugm_backend.ugm

        self.assertTrue(isinstance(ugm, FileUgm))
        self.assertEqual(ugm.users_file, 'users')
        self.assertEqual(ugm.groups_file, 'groups')
        self.assertEqual(ugm.roles_file, 'roles')
        self.assertEqual(ugm.data_directory, 'userdata')

    @restore_ugm_backend
    def test_BCFileUGMBackend(self):
        self.assertTrue('node.ext.ugm' in ugm_backend.registry)
        self.assertTrue(ugm_backend.registry['node.ext.ugm'] is BCFileUGMBackend)

        ugm_backend.load('node.ext.ugm', {
            'node.ext.ugm.users_file': 'users',
            'node.ext.ugm.groups_file': 'groups',
            'node.ext.ugm.roles_file': 'roles',
            'node.ext.ugm.datadir': 'userdata'
        })
        ugm_backend.initialize()
        ugm = ugm_backend.ugm

        self.assertTrue(isinstance(ugm, FileUgm))
        self.assertEqual(ugm.users_file, 'users')
        self.assertEqual(ugm.groups_file, 'groups')
        self.assertEqual(ugm.roles_file, 'roles')
        self.assertEqual(ugm.data_directory, 'userdata')

    def test_principal_data(self):
        # Fetch principal data
        self.assertEqual(principal_data('manager').items(), [
            (u'fullname', u'Manager User'),
            (u'email', u'manager@bar.com')
        ])
        self.assertEqual(principal_data('inexistent'), {})

        # If UGM implementation raises an exception when trying to fetch the
        # principal it get logged
        orgin_ugm = ugm_backend.ugm
        ugm_backend.ugm = None

        self.assertEqual(principal_data('inexistent'), {})
        # XXX: check logs

        ugm_backend.ugm = orgin_ugm
