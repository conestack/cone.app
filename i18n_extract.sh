#!/bin/bash

python setup.py extract_messages

cat src/cone/app/locale/manual.pot >> src/cone/app/locale/cone.app.pot

python setup.py update_catalog
