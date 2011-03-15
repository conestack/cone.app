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
    '../testing.txt',
    '../utils.txt',
    '../model.txt',
    '../security.txt',
    '../browser/__init__.txt',
    '../browser/ajax.txt',
    '../browser/authoring.txt',
    '../browser/batch.txt',
    '../browser/contents.txt',
    '../browser/form.txt',
    '../browser/layout.txt',
    '../browser/login.txt',
    '../browser/referencebrowser.txt',
    '../browser/settings.txt',
    '../browser/utils.txt',
]

def test_suite():
    suite = unittest.TestSuite()
    suite.addTests([
        doctest.DocFileSuite(
            '../__init__.txt', 
            globs={'interact': interlude.interact,
                   'pprint': pprint.pprint,
                   'pp': pprint.pprint,
                   },
            optionflags=optionflags,
        )
    ])
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
