#!/bin/sh
rm -r ./lib ./include ./local ./bin
virtualenv --clear --no-site-packages .
./bin/pip install --upgrade wheels pip setuptools zc.buildout
./bin/buildout -N
