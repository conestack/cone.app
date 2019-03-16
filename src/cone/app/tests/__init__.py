import unittest


def test_suite():
    from cone.app.tests import test_app
    from cone.app.tests import test_model
    from cone.app.tests import test_security
    from cone.app.tests import test_utils

    suite = unittest.TestSuite()

    suite.addTest(unittest.findTestCases(test_app))
    suite.addTest(unittest.findTestCases(test_model))
    suite.addTest(unittest.findTestCases(test_security))
    suite.addTest(unittest.findTestCases(test_utils))

    return suite


if __name__ == '__main__':
    runner = unittest.TextTestRunner(failfast=True)
    runner.run(test_suite())
