#!/bin/bash
#
# install sass:
#     sudo apt install npm
#     sudo npm install -g sass

pushd scss

sass style.scss ../src/cone/app/browser/static/style.css
sass light.scss ../src/cone/app/browser/static/light.css
sass dark.scss ../src/cone/app/browser/static/dark.css

popd
