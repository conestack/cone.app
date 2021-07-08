#!/bin/bash
set -e 

for file in .installed.cfg .mr.developer.cfg .coverage lib64; do
    if [ -e "$file" ]; then
        rm "$file"
    fi
done

for dir in lib include local bin share parts develop-eggs htmlcov; do
    if [ -d "$dir" ]; then
        rm -r "$dir"
    fi
done

python3 -m venv .
./bin/pip install setuptools zc.buildout
./bin/buildout -c $1
