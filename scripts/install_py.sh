#!/bin/bash

set -e

if [ -x "$(which python2)" ]; then
    virtualenv --clear -p python2 py2

    ./py2/bin/pip install wheel
    ./py2/bin/pip install coverage
    ./py2/bin/pip install waitress
    ./py2/bin/pip install pyramid==1.9.4
    ./py2/bin/pip install repoze.zcml==0.4
    ./py2/bin/pip install repoze.workflow==0.6.1
    ./py2/bin/pip install https://github.com/conestack/node/archive/master.zip
    ./py2/bin/pip install https://github.com/conestack/node.ext.ugm/archive/master.zip
    ./py2/bin/pip install https://github.com/conestack/yafowil/archive/master.zip
    ./py2/bin/pip install https://github.com/conestack/yafowil.bootstrap/archive/2.0.zip
    ./py2/bin/pip install https://github.com/conestack/cone.tile/archive/master.zip
    ./py2/bin/pip install https://github.com/conestack/treibstoff/archive/master.zip
    ./py2/bin/pip install https://github.com/conestack/webresource/archive/master.zip
    ./py2/bin/pip install -e .[test]
fi
if [ -x "$(which python3)" ]; then
    virtualenv --clear -p python3 py3

    ./py3/bin/pip install wheel
    ./py3/bin/pip install coverage
    ./py3/bin/pip install waitress
    ./py3/bin/pip install pyramid==1.9.4
    ./py3/bin/pip install repoze.zcml==1.1
    ./py3/bin/pip install repoze.workflow==1.1
    ./py3/bin/pip install https://github.com/conestack/node/archive/master.zip
    ./py3/bin/pip install https://github.com/conestack/node.ext.ugm/archive/master.zip
    ./py3/bin/pip install https://github.com/conestack/yafowil/archive/master.zip
    ./py3/bin/pip install https://github.com/conestack/yafowil.bootstrap/archive/2.0.zip
    ./py3/bin/pip install https://github.com/conestack/cone.tile/archive/master.zip
    ./py3/bin/pip install https://github.com/conestack/treibstoff/archive/master.zip
    ./py3/bin/pip install https://github.com/conestack/webresource/archive/master.zip
    ./py3/bin/pip install -e .[test,docs]
fi
