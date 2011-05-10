import os
import doctest
import interlude
import pprint
import unittest2 as unittest
from zope.configuration.xmlconfig import XMLConfig
from plone.testing import layered
from cone.app import testing
import cone.app.tests

optionflags = doctest.NORMALIZE_WHITESPACE | \
              doctest.ELLIPSIS | \
              doctest.REPORT_ONLY_FIRST_FAILURE

layer = testing.security

TESTFILES = [
    '../__init__.txt',
    '../utils.txt',
    '../security.txt',
    '../model.txt',
    '../workflow.txt',
    '../browser/__init__.txt',
    '../browser/ajax.txt',
    '../browser/authoring.txt',
    '../browser/batch.txt',
    '../browser/table.txt',
    '../browser/contents.txt',
    '../browser/form.txt',
    '../browser/layout.txt',
    '../browser/login.txt',
    '../browser/workflow.txt',
    '../browser/referencebrowser.txt',
    '../browser/settings.txt',
    '../browser/utils.txt',
]

DATADIR = os.path.join(os.path.dirname(__file__), 'data', 'ugm')

def test_suite():
    XMLConfig('dummy_workflow.zcml', cone.app.tests)()
    suite = unittest.TestSuite()
    suite.addTests([
        layered(
            doctest.DocFileSuite(
                testfile,
                globs={'interact': interlude.interact,
                       'pprint': pprint.pprint,
                       'pp': pprint.pprint,
                       'datadir': DATADIR,
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
