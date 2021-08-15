#!/bin/bash

set -e

if [ "$1" == "" ]; then
    echo "Missing argument [waitress.cfg|twisted.cfg]"
    exit 1
fi

if [ ! -e "buildout/$1" ]; then
    echo "Given buildout config not exists: $1"
    exit 1
fi

python3 -m venv .
./bin/pip install setuptools zc.buildout

ln -sf ./buildout/$1 buildout.cfg
./bin/buildout -N
