from setuptools import find_packages
from setuptools import setup
import os


def read_file(name):
    with open(os.path.join(os.path.dirname(__file__), name)) as f:
        return f.read()


version = '2.0a1.dev0'
shortdesc = 'Web application stub'
longdesc = '\n\n'.join([read_file(name) for name in [
    'README.rst',
    'CHANGES.rst',
    'LICENSE.rst'
]])


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
        'Chameleon',
        'cone.tile>=1.0',
        'node.ext.ugm>=0.9.13',
        'node>=0.9.28',
        'pyramid>=1.5',
        'pyramid_chameleon',
        'pyramid_zcml',
        'repoze.workflow',
        'setuptools',
        'treibstoff',
        'webresource',
        'yafowil.bootstrap',
        'yafowil.webob',
        'yafowil>=3.1.1'
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
            'pytest',
            'zope.pytestlayer'
        ],
        docs=[
            'Sphinx',
            'sphinx_bootstrap_theme',
            'repoze.sphinx.autointerface'
        ],
    ),
    entry_points="""\
    [paste.app_factory]
    main = cone.app:main
    [paste.filter_app_factory]
    remote_addr = cone.app:make_remote_addr_middleware
    """
)
