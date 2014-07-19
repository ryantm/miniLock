// Test for detecting suspicious filenames.
QUnit.test('isFilenameSuspcious', function(assert) {
	'use strict';
	var suspicious = [
		'innocent.exe',
		'happy.jpg.bat',
		'totallySafe.jpg.exe.png.html',
		'noExtension'
	]
	var clean = [
		'photos.jpg',
		'my.files.js.jpeg'
	]
	for (var s = 0; s < suspicious.length; s++) {
		assert.deepEqual(
			miniLock.util.isFilenameSuspicious(suspicious[s]),
			true,
			'Suspicious filename ' + s
		)
	}
	for (var c = 0; c < clean.length; c++) {
		assert.deepEqual(
			miniLock.util.isFilenameSuspicious(clean[c]),
			false,
			'Clean filename ' + c
		)
	}
})