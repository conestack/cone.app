#!/bin/sh

export TESTRUN_MARKER=True

TEST="bin/python -m cone.app.tests.__init__"

clear

if [ -x "$(which python2)" ]; then
    ./py2/$TEST
fi

echo ""

if [ -x "$(which python3)" ]; then
    ./py3/$TEST
fi
