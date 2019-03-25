#!/bin/sh
rm -r ./lib ./include ./local ./bin ./share
python3 -m venv .
./bin/pip install pyramid==1.9.4
./bin/pip install repoze.zcml==1.0b1
./bin/pip install repoze.workflow==1.0b1
./bin/pip install -e .
