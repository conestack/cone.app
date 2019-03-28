from cone.app import testing
from cone.app.ugm import principal_data
from cone.app.ugm import ugm_backend
from node.tests import NodeTestCase


class TestUgm(NodeTestCase):
    layer = testing.security

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
