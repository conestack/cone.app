from setuptools import find_packages
from setuptools import setup
from setuptools.command.test import test
import os


def read_file(name):
    with open(os.path.join(os.path.dirname(__file__), name)) as f:
        return f.read()


version = '1.0.8.dev0'
shortdesc = 'Web application stub'
longdesc = '\n\n'.join([read_file(name) for name in [
    'README.rst',
    'CHANGES.rst',
    'LICENSE.rst'
]])


class Test(test):

    def run_tests(self):
        from cone.app import tests
        tests.run_tests()


setup(
    name='cone.app',
    version=version,
    description=shortdesc,
    long_description=longdesc,
    classifiers=[
        'Environment :: Web Environment',
        'Programming Language :: Python',
        'Topic :: Internet :: WWW/HTTP :: Dynamic Content',
    ],
    keywords='node pyramid cone web',
    author='Cone Contributors',
    author_email='dev@conestack.org',
    url='http://github.com/conestack/cone.app',
    license='Simplified BSD',
    packages=find_packages('src'),
    package_dir={'': 'src'},
    namespace_packages=['cone'],
    include_package_data=True,
    zip_safe=False,
    install_requires=[
        'setuptools',
        'Chameleon',
        'node>=0.9.28,<2.0.0',
        'node.ext.ugm>=0.9.13,<2.0.0',
        'pyramid_zcml',
        'bdajax>=1.11',
        'cone.tile>=1.0,<2.0.0',
        'yafowil>=2.3.4,<4.0.0',
        'yafowil.webob<2.0.0',
        'yafowil.bootstrap<2.0.0',
        'repoze.workflow==1.1',
    ],
    extras_require=dict(
        lxml=[
            'lxml'
        ],
        yaml=[
            'yafowil.yaml'
        ],
        test=[
            'lxml',
            'yafowil.yaml',
            'zope.testrunner'
        ],
        docs=[
            'Sphinx',
            'sphinx_bootstrap_theme',
            'repoze.sphinx.autointerface'
        ],
    ),
    tests_require=[
        'lxml',
        'yafowil.yaml',
        'zope.testrunner'
    ],
    cmdclass=dict(test=Test),
    entry_points="""\
    [paste.app_factory]
    main = cone.app:main
    [paste.filter_app_factory]
    remote_addr = cone.app:make_remote_addr_middleware
    """
)
