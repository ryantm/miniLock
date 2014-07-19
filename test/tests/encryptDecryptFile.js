// Test for file encryption.
QUnit.asyncTest('encryptDecryptFile', function(assert) {
	'use strict';
	var xhr = new XMLHttpRequest()
	xhr.open('GET', 'files/test.jpg', true)
	xhr.responseType = 'blob'
	xhr.onload = function() {
		var blob = this.response
		miniLock.file.get(blob, function(result) {
			result.name = 'test.jpg'
			assert.deepEqual(result.size, 348291, 'Original file size')
			miniLock.crypto.encryptFile(
				result,
				result.name,
				[
					'ejSSnXzCP806SWiDgeueYlMwf2U8utLSkNhwU1VoiAE=',
					'Sv/SmemydDPmJHXnBuAxivZ98tRwYZ9swBkpzbFbLSE='
				],
				nacl.util.decodeBase64('ejSSnXzCP806SWiDgeueYlMwf2U8utLSkNhwU1VoiAE='),
				nacl.util.decodeBase64('X5GlsT2y8/H+nQQwgd8bDoDybtWIFq1o/AK6Rc8qKX0='),
				'miniLock.test.encryptFileCallback'
			)
		})
	}
	xhr.send()
	miniLock.test.encryptFileCallback = function(message) {
		assert.deepEqual(message.name, 'test.jpg', 'Original file name')
		assert.deepEqual(message.saveName, 'test.jpg.minilock', 'Encrypted file name')
		assert.deepEqual(message.blob.size, 352839, 'Encrypted file size')
		miniLock.file.get(message.blob, function(result) {
			result.name = 'userHasChangedTheName.minilock'
			miniLock.crypto.decryptFile(
				result,
				nacl.util.decodeBase64('Sv/SmemydDPmJHXnBuAxivZ98tRwYZ9swBkpzbFbLSE='),
				nacl.util.decodeBase64('lWCrI2ExjZAw8nsgHJvq5OiT6SFwmUuSc279K+ijbIU='),
				'miniLock.test.decryptFileCallback'
			)
		})
	}
	miniLock.test.decryptFileCallback = function(message) {
		var reader = new FileReader()
		assert.deepEqual(message.name, 'test.jpg', 'Decrypted file name')
		assert.deepEqual(message.blob.size, 348291, 'Decrypted file size')
		reader.onload = function() {
			var hash = nacl.hash(new Uint8Array(this.result))
			assert.deepEqual(
				nacl.util.encodeBase64(hash),
				'NT2406X+QT6rIvmK9lsDGWuiljvWAd5S+IoEh7suxiVE+S//lmCU/Q3mDFWFeqNRdWjqvTSVEqRg3oZB++wYzg==',
				'Decrypted file integrity'
			)
			QUnit.start()
		}
		reader.readAsArrayBuffer(message.blob)
	}
})
