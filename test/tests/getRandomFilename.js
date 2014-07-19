// Test for generating random filenames.
QUnit.test('getRandomFilename', function(assert) {
	'use strict';
	var validFilename = /^\w{16,32}$/
	var filename = miniLock.util.getRandomFilename()
	assert.ok(
		validFilename.test(filename),
		'Filename formatting'
	)
})