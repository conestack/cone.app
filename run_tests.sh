#!/bin/sh
if [ -x "$(which python)" ]; then
    ./py2/bin/python -m cone.app.tests
fi
if [ -x "$(which python3)" ]; then
    ./py3/bin/python -m cone.app.tests
fi
