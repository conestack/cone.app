Cone Development
================

Bootstrap
=========

Currently included bootstrap:

- https://github.com/twbs/bootstrap/releases/tag/v5.0.2
- https://github.com/twbs/icons/archive/v1.5.0.zip

Javascript Tests
================

Install npm::

    sudo apt install npm

Install testrunner::

    npm install qunit karma karma-qunit karma-coverage karma-chrome-launcher karma-viewport

Start karma server (immediately run tests)::

    node_modules/karma/bin/karma start karma.conf.js

Re-run tests (needs karma server to be started)::

    node_modules/karma/bin/karma run karma.conf.js

To view coverage report, open::

    karma/coverage/[browser name]/index.html

in browser.
