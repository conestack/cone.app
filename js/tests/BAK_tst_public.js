
QUnit.begin(details => {
    console.log(`Test amount: ${details.totalTests}`);
});

QUnit.done(function(details) {
    console.log(
      "Total: " + details.total + " Failed: " + details.failed
      + " Passed: " + details.passed + " Runtime: " + details.runtime
    );
});

///////////////////////////////////////////////////////////////////////////////
// namespace tests
///////////////////////////////////////////////////////////////////////////////

QUnit.test('cone namespace', assert => {
    console.log('Run cone namespace tests');

    // viewport
    assert.ok(cone.viewport instanceof cone.ViewPort);

    // viewport states are correct
    assert.strictEqual(cone.VP_MOBILE, 0);
    assert.strictEqual(cone.VP_SMALL, 1);
    assert.strictEqual(cone.VP_MEDIUM, 2);
    assert.strictEqual(cone.VP_LARGE, 3);

    // theme_switcher and css themes
    assert.strictEqual(cone.theme_switcher, null);
    assert.deepEqual(cone.default_themes, [
        '/static/light.css',
        '/static/dark.css'
    ]);

    // layout components
    assert.strictEqual(cone.sidebar_menu, null);
    assert.strictEqual(cone.main_menu_top, null);
    assert.strictEqual(cone.main_menu_sidebar, null);
    assert.strictEqual(cone.navtree, null);
    assert.strictEqual(cone.topnav, null);

    // searchbar
    assert.strictEqual(cone.searchbar, null);
    assert.strictEqual(cone.searchbar_handler, null);

    // content
    assert.strictEqual(cone.content, null);
});