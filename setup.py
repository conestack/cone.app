from setuptools import find_packages
from setuptools import setup
import os


version = '1.0a2'
shortdesc = 'Web application stub'
longdesc = open(os.path.join(os.path.dirname(__file__), 'README.rst')).read()
longdesc += open(os.path.join(os.path.dirname(__file__), 'LICENSE.rst')).read()


setup(name='cone.app',
      version=version,
      description=shortdesc,
      long_description=longdesc,
      classifiers=[
          'Environment :: Web Environment',
          'Programming Language :: Python',
          'Topic :: Internet :: WWW/HTTP :: Dynamic Content',
      ],
      keywords='node pyramid cone web',
      author='BlueDynamics Alliance',
      author_email='dev@bluedynamics.com',
      url=u'https://github.com/bluedynamics/cone.app',
      license='Simplified BSD',
      packages=find_packages('src'),
      package_dir={'': 'src'},
      namespace_packages=['cone'],
      include_package_data=True,
      zip_safe=False,
      install_requires=[
          'setuptools',
          'Chameleon',
          'node',
          'node.ext.ugm',
          'pyramid',
          'pyramid_zcml',
          'bdajax',
          'cone.tile',
          'yafowil',
          'yafowil.webob',
          'yafowil.bootstrap',
          'repoze.workflow',
      ],
      extras_require=dict(
          lxml=[
              'lxml',
          ],
          test=[
              'lxml',
              'interlude',
              'plone.testing',
              'unittest2',
              'yafowil.yaml',
          ],
          docs=[
              'Sphinx',
              'sphinx_bootstrap_theme',
              'repoze.sphinx.autointerface',
          ],
      ),
      tests_require=[
          'interlude',
          'plone.testing',
          'unittest2',
      ],
      test_suite = "cone.app.tests.test_app.test_suite",
      entry_points="""\
      [paste.app_factory]
      main = cone.app:main
      [paste.filter_app_factory]
      remote_addr = cone.app:make_remote_addr_middleware
      """
      )
