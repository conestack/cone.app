#!/bin/sh
clear
if [ -x "$(which python)" ]; then
    export TESTRUN_MARKER=True && ./py2/bin/python -m cone.app.tests.__init__
fi
if [ -x "$(which python3)" ]; then
    export TESTRUN_MARKER=True && ./py3/bin/python -m cone.app.tests.__init__
fi
