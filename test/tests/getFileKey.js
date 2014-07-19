// Test for generating file keys.
QUnit.test('getFileKey', function(assert) {
	'use strict';
	var key = miniLock.crypto.getFileKey()
	assert.deepEqual(key.length, 32, 'Key length')
	assert.deepEqual(typeof(key), 'object', 'Key type')
	for (var i = 0; i < key.length; i++) {
		assert.deepEqual(
			typeof(key[i]),
			'number',
			'Key byte ' + i + ' type'
		)
		assert.deepEqual(
			((key[i] >= 0) && (key[i] <= 255)),
			true,
			'Key byte ' + i + ' value'
		)
	}
})