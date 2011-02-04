from setuptools import setup, find_packages
import sys, os

version = '1.0'
shortdesc = 'Application framework for repoze.bfg.'
longdesc = open(os.path.join(os.path.dirname(__file__), 'README.rst')).read()
longdesc += open(os.path.join(os.path.dirname(__file__), 'LICENSE.rst')).read()

setup(name='cone.app',
      version=version,
      description=shortdesc,
      long_description=longdesc,
      classifiers=[
            'Development Status :: 3 - Alpha',
            'Environment :: Web Environment',
            'Operating System :: OS Independent',
            'Programming Language :: Python', 
            'Topic :: Internet :: WWW/HTTP :: Dynamic Content',        
      ],
      keywords='',
      author='BlueDynamics Alliance',
      author_email='dev@bluedynamics.com',
      url=u'https://svn.bluedynamics.net/svn/internal/mdb',
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
          'repoze.what',
          'repoze.what.plugins.ini',
          'repoze.what.plugins.config',          
          'bdajax',
          'cone.tile',
          'yafowil',
          'yafowil.webob',
          'yafowil.widget.datetime',
          'yafowil.widget.richtext',
          'yafowil.widget.dict',
      ],
      # XXX: why should this be set here?
      #dependency_links = [
      #    "http://dist.repoze.org/bfg/1.3/",
      #],
      extras_require = dict(
          test=[
                'interlude',
          ]
      ),
      tests_require=[
          'interlude',
      ],
      test_suite = "cone.app.tests.test_app.test_suite",
      entry_points = """
      """
      )
