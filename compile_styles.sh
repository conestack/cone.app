#!/bin/bash
#
# install sass:
#     sudo apt install npm
#     sudo npm install -g sass

TARGET="../src/cone/app/browser/static/"

pushd scss

sass style.scss $TARGET/style.css
sass light.scss $TARGET/light.css
sass dark.scss $TARGET/dark.css

popd
