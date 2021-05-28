Javascript Tests
================

Install npm::

    sudo apt install npm

Install testrunner::

    npm install qunit karma karma-qunit karma-coverage karma-chrome-launcher

Start karma server (immediately run tests)::

    node_modules/karma/bin/karma start karma.conf.js

Re-run tests (needs karma server to be started)::

    node_modules/karma/bin/karma run karma.conf.js

To view coverage report, open::

    karma/coverage/[browser name]/index.html

in browser.
