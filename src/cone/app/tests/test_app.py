import doctest
import interlude
import pprint
import unittest2 as unittest
from plone.testing import layered
from cone.app import testing

optionflags = doctest.NORMALIZE_WHITESPACE | \
              doctest.ELLIPSIS | \
              doctest.REPORT_ONLY_FIRST_FAILURE

layer = testing.Security()

TESTFILES = [
    '../utils.txt',
    '../model.txt',
    '../security.txt',
    '../browser/layout.txt',
    '../browser/utils.txt',
    '../browser/form.txt',
    '../browser/authoring.txt',
    '../browser/batch.txt',
    '../browser/referencebrowser.txt',
]

def test_suite():
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

if __name__ == '__main__':                                  #pragma NO COVERAGE
    unittest.main(defaultTest='test_suite')                 #pragma NO COVERAGE
