// Tests for detecting valid miniLock IDs.
QUnit.test('validateID', function(assert) {
	'use strict';
	var IDs = [
		'ejSSnXzCP806SWiDgeueYlMwf2U8utLSkNhwU1VoiAE=',
		'7m+Saj2zhy0mGNKEJPDI8V1kyFfZZfcxbWxCcYlwPF0=',
		'4153+icvEiQuiBpttMHjUsMuy2vDCylzpnTSMQFY2SQ=',
		'u1F4OzpS9PO3ZQitXFDDwTWdLsZmLlA3rCNwCYsnBjY=',
		nacl.util.encodeBase64((nacl.box.keyPair()).publicKey),
		nacl.util.encodeBase64((nacl.box.keyPair()).publicKey)
	]
	var notIDs = [
		'clearly not an ID',
		'ejSSnXzCP806SWiDgeueYlwf2U8utLSkNhwU1VoiAE=',
		'7m+Saj2zhy0mGNKEJPI8V1kyFfZZfcxbWxCcYlwPF0=',
		'4153+icvEiQuiBpttMfHjUsMuy2vDCylzpnTSMQFY2SQ=',
		'u1F4OzpS9PO3ZQitXFDDwTdLsZmLlA3rCNwCYsnBjY=',
		'YWFhYWFhYWFhYWJiYmJiYmJiYmJjY2NjY2NjY2Nj'
	]
	for (var i = 0; i < IDs.length; i++) {
		assert.ok(miniLock.util.validateID(IDs[i]), 'Valid ID ' + i)
	}
	for (var o = 0; o < notIDs.length; o++) {
		assert.ok(!miniLock.util.validateID(notIDs[o]), 'Invalid ID ' + o)
	}
})