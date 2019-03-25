#!/bin/sh
clear
export TESTRUN_MARKER=True
if [ -x "$(which python)" ]; then
    ./py2/bin/python -m cone.app.tests.__init__
fi
if [ -x "$(which python3)" ]; then
    ./py3/bin/python -m cone.app.tests.__init__
fi
