// Test for generating nonces.
QUnit.test('getNonce', function(assert) {
	'use strict';
	var nonce = miniLock.crypto.getNonce()
	assert.deepEqual(nonce.length, 24, 'Nonce length')
	assert.deepEqual(typeof(nonce), 'object', 'Nonce type')
	for (var i = 0; i < nonce.length; i++) {
		assert.deepEqual(
			typeof(nonce[i]),
			'number',
			'Nonce byte ' + i + ' type'
		)
		assert
		assert.deepEqual(
			((nonce[i] >= 0) && (nonce[i] <= 255)),
			true,
			'Nonce byte ' + i + ' value'
		)
	}
})