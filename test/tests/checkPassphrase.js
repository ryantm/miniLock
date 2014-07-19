// Test for checking passphrase entropy sufficiency.
QUnit.test('checkPassphrase', function(assert) {
	'use strict';
	var bad = [
		'I love you',
		'Not bad but not good either',
		'What is the meaning of love?',
		'Estoy usando el Internet!',
		miniLock.phrase.get(2),
		miniLock.phrase.get(3)
	]
	var good = [
		'This passphrase is supposed to be good enough for miniLock. :-)',
		'Here is another passphrase that is supposed to be long enough and so on.',
		miniLock.phrase.get(7),
		miniLock.phrase.get(7),
		miniLock.phrase.get(8)
	]
	for (var b = 0; b < bad.length; b++) {
		assert.ok(!miniLock.crypto.checkKeyStrength(bad[b]), 'Bad passphrase ' + b)
	}
	for (var g = 0; g < good.length; g++) {
		assert.ok(miniLock.crypto.checkKeyStrength(good[g]), 'Good passphrase ' + g)
	}
})