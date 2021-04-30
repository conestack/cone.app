QUnit.test('test publi js', assert => {
    let stuff = $('<div id="test" class="scroll-container"/>')
    let scrollbar = new cone.ScrollBar(stuff);
    assert.deepEqual(scrollbar.container, stuff, 'Container is Stuff')
})