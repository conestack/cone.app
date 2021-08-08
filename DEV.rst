Cone Development
================

Install
=======

Install virtualenv and run buildout::

    python3 -m venv .
    ./bin/pip install -U pip
    ./bin/pip install zc.buildout
    ./bin/buildout -c waitress.cfg

Install npm::

    sudo apt install npm

Install test requirements::

    npm --save-dev install \
        qunit \
        karma \
        karma-qunit \
        karma-coverage \
        karma-chrome-launcher \
        karma-viewport \
        karma-module-resolver-preprocessor

Install jquery from git as jquery 4 is not released yet but required to run
tests as modules and import from jquery sources works::

    npm --save-dev install https://github.com/jquery/jquery#main

Install deployment requirements::

    npm --save-dev install \
        rollup \
        rollup-plugin-cleanup \
        rollup-plugin-terser

Install sass::

    npm --save-dev install sass

Install treibstoff. When developing with a local buildout, install from
development sources::

    npm install devsrc/treibstoff

Else install from git::

    npm install https://github.com/conestack/treibstoff#master


Javascript Tests
================

Cone uses karma testrunner for JS testing:

- Karma: https://karma-runner.github.io/6.3/intro/installation.html
- Istanbul: https://istanbul.js.org/
- Puppeteer: https://pptr.dev/

Following plugins are used:

- karma-qunit
- karma-chrome
- karma-viewport

Start karma server (immediately run tests)::

    ./karma.sh

To view coverage report, open::

    karma/coverage/[browser name]/index.html


Bundle Javascript
=================

Create JS bundle with rollup::

    ./rollup.sh


Compile CSS
===========

Cone uses sass as CSS preprocessor.

To compile CSS files, run::

    ./compile_styles.sh


Build documentation
===================

Cone uses sphinx for generating it's documentation.

To generate sphinx, run::

    ./build_docs.sh


Browser Resources
=================

Included resources:

- https://github.com/twbs/bootstrap/releases/tag/v5.0.2
- https://github.com/twbs/icons/archive/v1.5.0.zip
- https://github.com/corejavascript/typeahead.js/releases/tag/v1.3.1

