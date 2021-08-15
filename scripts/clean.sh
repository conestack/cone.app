#!/bin/bash
#
# Clean development environment.

set -e

to_remove=(
    .coverage .installed.cfg .mr.developer.cfg bin buildout.cfg develop-eggs
    dist docs/html htmlcov include karma lib lib64 lib64 node_modules
    package-lock.json parts py2 py3 pyvenv.cfg share
)

for item in "${to_remove[@]}"; do
    if [ -e "$item" ]; then
        rm -r "$item"
    fi
done
