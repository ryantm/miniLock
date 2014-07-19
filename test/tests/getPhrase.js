// Test for generating passphrases
QUnit.test('getPhrase', function(assert) {
	'use strict';
	assert.deepEqual(
		miniLock.phrase.words.length,
		58110,
		'Wordlist length'
	)
	var phrases = {
		6: miniLock.phrase.get(6),
		7: miniLock.phrase.get(7),
		8: miniLock.phrase.get(8)
	}
	for (var i in phrases) {
		if (phrases.hasOwnProperty(i)) {
			assert.deepEqual(
				phrases[i].match(/\s/g).length, i - 1,
				'Phrase with ' + i + ' words'
			)
		}
	}
})