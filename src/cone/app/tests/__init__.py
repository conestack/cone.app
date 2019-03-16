import unittest


def test_suite():
    from cone.app.tests import test_model

    suite = unittest.TestSuite()

    suite.addTest(unittest.findTestCases(test_model))

    return suite


if __name__ == '__main__':
    runner = unittest.TextTestRunner(failfast=True)
    runner.run(test_suite())
