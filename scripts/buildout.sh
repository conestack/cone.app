#!/bin/bash

set -e

if [ $1 == "" ]; then
    echo "Missing argument [waitress.cfg|twisted.cfg]"
    exit 1
fi

python3 -m venv .
./bin/pip install setuptools zc.buildout

ln -sf ./buildout/$1 .
./bin/buildout -c $1
