#!/bin/bash
#
# install sass:
#     sudo apt install npm
#     sudo npm install -g sass

pushd src/cone/app/browser/static/scss

sass style.scss ../style.css
sass light.scss ../light.css
sass dark.scss ../dark.css

popd
