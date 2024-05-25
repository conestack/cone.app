##############################################################################
# custom bootstrap
##############################################################################

# The bootstrap SCSS root source file.
# Default: scss/styles.scss
SCSS_BOOTSTRAP_SOURCE?=scss/bootstrap/bootstrap.scss

# The target file for the compiled bootstrap Stylesheet.
# Default: scss/styles.css
SCSS_BOOTSTRAP_TARGET?=src/cone/app/browser/static/bootstrap/css/bootstrap.css

# The target file for the compressed bootstrap Stylesheet.
# Default: scss/styles.min.css
SCSS_BOOTSTRAP_MIN_TARGET?=src/cone/app/browser/static/bootstrap/css/bootstrap.min.css

.PHONY: bootstrap
bootstrap: $(NPM_TARGET)
	@sass $(SCSS_OPTIONS) $(SCSS_BOOTSTRAP_SOURCE) $(SCSS_BOOTSTRAP_TARGET)
	@sass $(SCSS_OPTIONS) --style compressed $(SCSS_BOOTSTRAP_SOURCE) $(SCSS_BOOTSTRAP_MIN_TARGET)

##############################################################################
# example
##############################################################################

.PHONY: install-example
install-example: install
	@$(PYTHON_PACKAGE_COMMAND) install -e examples/cone.example

.PHONY: run-example
run-example:
	@cd examples/cone.example
	@../../venv/bin/pserve example.ini
