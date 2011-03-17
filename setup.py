from setuptools import setup, find_packages
import sys, os

version = '0.9b16'
shortdesc = 'Application framework for pyramid.'
longdesc = open(os.path.join(os.path.dirname(__file__), 'README.rst')).read()
longdesc += open(os.path.join(os.path.dirname(__file__), 'LICENSE.rst')).read()

setup(name='cone.app',
      version=version,
      description=shortdesc,
      long_description=longdesc,
      classifiers=[
            'Development Status :: 4 - Beta',
            'Environment :: Web Environment',
            'Operating System :: OS Independent',
            'Programming Language :: Python',
            'Topic :: Internet :: WWW/HTTP :: Dynamic Content',
      ],
      keywords='',
      author='BlueDynamics Alliance',
      author_email='dev@bluedynamics.com',
      url=u'https://github.com/bluedynamics/cone.app',
      license='GNU General Public Licence',
      packages=find_packages('src'),
      package_dir = {'': 'src'},
      namespace_packages=['cone'],
      include_package_data=True,
      zip_safe=False,
      install_requires=[
          'setuptools',
          'lxml',
          'node',
          'pyramid',
          'pyramid_zcml',
          'bdajax',
          'cone.tile',
          'yafowil',
          'yafowil.webob',
          'yafowil.widget.datetime',
          'yafowil.widget.richtext',
          'yafowil.widget.dict',
          'yafowil.widget.autocomplete',
          'yafowil.widget.dynatree',
      ],
      extras_require = dict(
          test=[
                'interlude',
                'plone.testing',
                'unittest2',
          ]
      ),
      tests_require=[
          'interlude',
          'plone.testing',
          'unittest2',
      ],
      test_suite = "cone.app.tests.test_app.test_suite",
      entry_points = """\
      [paste.app_factory]
      main = cone.app:main
      """
      )
