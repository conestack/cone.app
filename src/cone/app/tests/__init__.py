import unittest


def test_suite():
    from cone.app.tests import test_testing

    from cone.app.tests import test_app
    from cone.app.tests import test_model
    from cone.app.tests import test_security
    from cone.app.tests import test_utils
    from cone.app.tests import test_workflow

    from cone.app.tests import test_browser
    from cone.app.tests import test_browser_actions
    from cone.app.tests import test_browser_ajax

    suite = unittest.TestSuite()

    suite.addTest(unittest.findTestCases(test_testing))

    suite.addTest(unittest.findTestCases(test_app))
    suite.addTest(unittest.findTestCases(test_model))
    suite.addTest(unittest.findTestCases(test_security))
    suite.addTest(unittest.findTestCases(test_utils))
    suite.addTest(unittest.findTestCases(test_workflow))

    suite.addTest(unittest.findTestCases(test_browser))
    suite.addTest(unittest.findTestCases(test_browser_actions))
    suite.addTest(unittest.findTestCases(test_browser_ajax))

    return suite


if __name__ == '__main__':
    runner = unittest.TextTestRunner(failfast=True)
    runner.run(test_suite())
