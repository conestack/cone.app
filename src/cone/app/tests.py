from cone.app import testing
from plone.testing import layered
from zope.configuration.xmlconfig import XMLConfig
import cone.app.tests
import doctest
import interlude
import pprint
import unittest2 as unittest

optionflags = doctest.NORMALIZE_WHITESPACE | \
              doctest.ELLIPSIS | \
              doctest.REPORT_ONLY_FIRST_FAILURE

layer = testing.security

TESTFILES = [
    '__init__.rst',
    'testing/__init__.rst',
    'utils.rst',
    'security.rst',
    'model.rst',
    'workflow.rst',
    'browser/__init__.rst',
    'browser/exception.rst',
    'browser/ajax.rst',
    'browser/actions.rst',
    'browser/authoring.rst',
    'browser/contextmenu.rst',
    'browser/batch.rst',
    'browser/table.rst',
    'browser/contents.rst',
    'browser/form.rst',
    'browser/resources.rst',
    'browser/layout.rst',
    'browser/login.rst',
    'browser/workflow.rst',
    'browser/referencebrowser.rst',
    'browser/settings.rst',
    'browser/sharing.rst',
    'browser/copysupport.rst',
    'browser/utils.rst',
]


def test_suite():
    XMLConfig('testing/dummy_workflow.zcml', cone.app.tests)()
    suite = unittest.TestSuite()
    suite.addTests([
        layered(
            doctest.DocFileSuite(
                testfile,
                globs={'interact': interlude.interact,
                       'pprint': pprint.pprint,
                       'pp': pprint.pprint,
                       },
                optionflags=optionflags,
                ),
            layer=layer,
            )
        for testfile in TESTFILES
        ])
    return suite

if __name__ == '__main__':
    unittest.main(defaultTest='test_suite')                 #pragma NO COVERAGE
