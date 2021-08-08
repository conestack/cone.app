#!/bin/bash
#
# install sass:
#     sudo apt install npm
#     sudo npm install sass

SASS_BIN="../node_modules/sass/sass.js"
TARGET="../src/cone/app/browser/static/"

pushd scss

$SASS_BIN style.scss $TARGET/style.css
$SASS_BIN light.scss $TARGET/light.css
$SASS_BIN dark.scss $TARGET/dark.css

popd
