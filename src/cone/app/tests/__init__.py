import sys
import unittest


def test_suite():
    from cone.app.tests import test_testing

    from cone.app.tests import test_app
    from cone.app.tests import test_model
    from cone.app.tests import test_security
    from cone.app.tests import test_ugm
    from cone.app.tests import test_utils
    from cone.app.tests import test_workflow

    from cone.app.tests import test_browser
    from cone.app.tests import test_browser_actions
    from cone.app.tests import test_browser_ajax
    from cone.app.tests import test_browser_authoring
    from cone.app.tests import test_browser_batch
    from cone.app.tests import test_browser_content
    from cone.app.tests import test_browser_contents
    from cone.app.tests import test_browser_contextmenu
    from cone.app.tests import test_browser_copysupport
    from cone.app.tests import test_browser_exception
    from cone.app.tests import test_browser_form
    from cone.app.tests import test_browser_layout
    from cone.app.tests import test_browser_login
    from cone.app.tests import test_browser_order
    from cone.app.tests import test_browser_referencebrowser
    from cone.app.tests import test_browser_resources
    from cone.app.tests import test_browser_settings
    from cone.app.tests import test_browser_sharing
    from cone.app.tests import test_browser_table
    from cone.app.tests import test_browser_translation
    from cone.app.tests import test_browser_utils
    from cone.app.tests import test_browser_workflow

    suite = unittest.TestSuite()

    suite.addTest(unittest.findTestCases(test_testing))

    suite.addTest(unittest.findTestCases(test_app))
    suite.addTest(unittest.findTestCases(test_model))
    suite.addTest(unittest.findTestCases(test_security))
    suite.addTest(unittest.findTestCases(test_ugm))
    suite.addTest(unittest.findTestCases(test_utils))
    suite.addTest(unittest.findTestCases(test_workflow))

    suite.addTest(unittest.findTestCases(test_browser))
    suite.addTest(unittest.findTestCases(test_browser_actions))
    suite.addTest(unittest.findTestCases(test_browser_ajax))
    suite.addTest(unittest.findTestCases(test_browser_authoring))
    suite.addTest(unittest.findTestCases(test_browser_batch))
    suite.addTest(unittest.findTestCases(test_browser_content))
    suite.addTest(unittest.findTestCases(test_browser_contents))
    suite.addTest(unittest.findTestCases(test_browser_contextmenu))
    suite.addTest(unittest.findTestCases(test_browser_copysupport))
    suite.addTest(unittest.findTestCases(test_browser_exception))
    suite.addTest(unittest.findTestCases(test_browser_form))
    suite.addTest(unittest.findTestCases(test_browser_layout))
    suite.addTest(unittest.findTestCases(test_browser_login))
    suite.addTest(unittest.findTestCases(test_browser_order))
    suite.addTest(unittest.findTestCases(test_browser_referencebrowser))
    suite.addTest(unittest.findTestCases(test_browser_resources))
    suite.addTest(unittest.findTestCases(test_browser_settings))
    suite.addTest(unittest.findTestCases(test_browser_sharing))
    suite.addTest(unittest.findTestCases(test_browser_table))
    suite.addTest(unittest.findTestCases(test_browser_translation))
    suite.addTest(unittest.findTestCases(test_browser_utils))
    suite.addTest(unittest.findTestCases(test_browser_workflow))

    return suite


def run_tests():
    from zope.testrunner.runner import Runner

    runner = Runner(found_suites=[test_suite()])
    runner.run()
    sys.exit(int(runner.failed))


if __name__ == '__main__':
    run_tests()
