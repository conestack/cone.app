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

.PHONY: example-install
example-install: install
	@$(PYTHON_PACKAGE_COMMAND) install -e examples/cone.example

.PHONY: example-run
example-run:
	@cd examples/cone.example
	@../../venv/bin/pserve example.ini

EXAMPLE_GETTEXT_LOCALES_PATH=examples/cone.example/src/cone/example/locale
EXAMPLE_GETTEXT_DOMAIN=cone.example
EXAMPLE_GETTEXT_LANGUAGES=en de
EXAMPLE_LINGUA_SEARCH_PATH=examples/cone.example/src/cone/example
EXAMPLE_LINGUA_OPTIONS="-c examples/cone.example/lingua.cfg"
OS:=$(OS)

PHONY: example-lingua
example-lingua:
	make OS=$(OS) \
		GETTEXT_LOCALES_PATH=$(EXAMPLE_GETTEXT_LOCALES_PATH) \
		GETTEXT_DOMAIN=$(EXAMPLE_GETTEXT_DOMAIN) \
		GETTEXT_LANGUAGES="$(EXAMPLE_GETTEXT_LANGUAGES)" \
		LINGUA_SEARCH_PATH=$(EXAMPLE_LINGUA_SEARCH_PATH) \
		LINGUA_OPTIONS=$(EXAMPLE_LINGUA_OPTIONS) \
		lingua
