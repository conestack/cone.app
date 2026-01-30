/**
 * Pygments theme switcher for cone.example.
 *
 * Switches between light (colorful) and dark (monokai) Pygments themes
 * based on the Bootstrap 5 data-bs-theme attribute.
 */
(function() {
    'use strict';

    var LINK_ID = 'pygments-theme-css';
    var LIGHT_THEME = 'pygments-light.css';
    var DARK_THEME = 'pygments-dark.css';

    /**
     * Get the base URL for example static resources.
     * Looks for an existing link with href containing 'example/' to determine the path.
     */
    function getBaseUrl() {
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        for (var i = 0; i < links.length; i++) {
            var href = links[i].getAttribute('href');
            if (href && href.indexOf('/example/') !== -1) {
                // Extract base path up to and including 'example/'
                var idx = href.indexOf('/example/');
                return href.substring(0, idx + '/example/'.length);
            }
        }
        // Fallback: try to construct from current location
        return '/resources/example/';
    }

    /**
     * Get the current theme from the document.
     */
    function getCurrentTheme() {
        return document.documentElement.getAttribute('data-bs-theme') || 'light';
    }

    /**
     * Get the appropriate Pygments CSS filename for the given theme.
     */
    function getPygmentsCss(theme) {
        return theme === 'dark' ? DARK_THEME : LIGHT_THEME;
    }

    /**
     * Create or update the Pygments stylesheet link.
     */
    function updatePygmentsStylesheet() {
        var theme = getCurrentTheme();
        var cssFile = getPygmentsCss(theme);
        var baseUrl = getBaseUrl();
        var href = baseUrl + cssFile;

        var link = document.getElementById(LINK_ID);
        if (!link) {
            // Create new link element
            link = document.createElement('link');
            link.id = LINK_ID;
            link.rel = 'stylesheet';
            link.type = 'text/css';
            document.head.appendChild(link);
        }

        // Update href if different
        if (link.getAttribute('href') !== href) {
            link.setAttribute('href', href);
        }
    }

    /**
     * Initialize the Pygments theme switcher.
     */
    function init() {
        // Set initial stylesheet
        updatePygmentsStylesheet();

        // Watch for theme changes using MutationObserver
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' &&
                    mutation.attributeName === 'data-bs-theme') {
                    updatePygmentsStylesheet();
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-bs-theme']
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
