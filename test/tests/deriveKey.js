// Key derivation test.
QUnit.asyncTest('deriveKey', function(assert) {
	'use strict';
	var passphrase = 'This passphrase is supposed to be good enough for miniLock. :-)'
	miniLock.crypto.getKeyPair(passphrase)
	assert.deepEqual(miniLock.session.keyPairReady, false, 'keyPairReady starts as false')
	assert.deepEqual(Object.keys(miniLock.session.keys).length, 0, 'sessionKeys is empty')
	var keyInterval = setInterval(function() {
		if (miniLock.session.keyPairReady) {
			clearInterval(keyInterval)
			assert.deepEqual(Object.keys(miniLock.session.keys).length, 2, 'sessionKeys is filled')
			assert.deepEqual(miniLock.session.keyPairReady, true, 'keyPairReady set to true')
			assert.deepEqual(typeof(miniLock.session.keys), 'object', 'Type check')
			assert.deepEqual(typeof(miniLock.session.keys.publicKey), 'object', 'Public key type check')
			assert.deepEqual(typeof(miniLock.session.keys.secretKey), 'object', 'Secret key type check')
			assert.deepEqual(miniLock.session.keys.publicKey.length, 32, 'Public key length')
			assert.deepEqual(miniLock.session.keys.secretKey.length, 32, 'Secret key length')
			assert.deepEqual(
				nacl.util.encodeBase64(miniLock.session.keys.publicKey),
				'0ijGM1ZQrOuA/zwIVEWuVgm2tXpn1K0GFocrRfMSxW4=',
				'Public key Base64 representation'
			)
			assert.deepEqual(
				nacl.util.encodeBase64(miniLock.session.keys.secretKey),
				'llu8PDzh8JFJbVmwlS90MpubvLogFbuNXqy9fHk3lYw=',
				'Secret key Base64 representation'
			)
			assert.deepEqual(
				miniLock.crypto.getMiniLockID(miniLock.session.keys.publicKey),
				'0ijGM1ZQrOuA/zwIVEWuVgm2tXpn1K0GFocrRfMSxW4=',
				'miniLock ID from public key'
			)
			QUnit.start()
		}
	}, 500)
})
