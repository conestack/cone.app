from setuptools import find_packages
from setuptools import setup


version = '0.1'
shortdesc = 'Example cone plugin'


setup(
    name='cone.example',
    version=version,
    description=shortdesc,
    packages=find_packages('src'),
    package_dir={'': 'src'},
    namespace_packages=['cone'],
    include_package_data=True,
    zip_safe=False,
    install_requires=[
        'cone.app',
        'waitress'
    ]
)
