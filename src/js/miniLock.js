var miniLock

(function() {
'use strict';

miniLock = {}

// -----------------------
// Settings
// -----------------------

miniLock.settings = {}

// Minimum entropy for user key
miniLock.settings.minKeyEntropy = 100

// This is where session variables are stored
miniLock.session = {
	keys: {},
	keyPairReady: false
}

// -----------------------
// Utility Functions
// -----------------------

miniLock.util = {}

// Input: String
// Output: Boolean
// Notes: Validates if string is a proper miniLock ID.
miniLock.util.validateID = function(id) {
	var base64Match = new RegExp(
		'^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$'
	)
	if (
		(id.length > 50) ||
		(id.length < 40)
	) {
		return false
	}
	if (base64Match.test(id)) {
		var bytes = nacl.util.decodeBase64(id)
		return bytes.length === 32
	}
	return false
}

// Input: none
// Output: Random string suitable for use as filename.
miniLock.util.getRandomFilename = function() {
	var randomBytes = nacl.randomBytes(18)
	var filename = ''
	randomBytes = nacl.util.encodeBase64(randomBytes)
	for (var i = 0; i < randomBytes.length; i++) {
		if (randomBytes[i].match(/\w/)) {
			filename += randomBytes[i]
		}
	}
	return filename
}

// Input: Filename (String)
// Output: Whether filename extension looks suspicious (Boolean)
miniLock.util.isFilenameSuspicious = function(filename) {
	var suspicious = [
		'exe', 'scr', 'url', 'com', 'pif', 'bat',
		'xht', 'htm', 'html', 'xml', 'xhtml', 'js',
		'sh', 'svg', 'gadget', 'msi', 'msp', 'hta',
		'cpl', 'msc', 'jar', 'cmd', 'vb', 'vbs',
		'jse', 'ws', 'wsf', 'wsc', 'wsh', 'ps1',
		'ps2', 'ps1xml', 'ps2xml', 'psc1', 'scf', 'lnk',
		'inf', 'reg', 'doc', 'xls', 'ppt', 'pdf',
		'swf', 'fla', 'docm', 'dotm', 'xlsm', 'xltm',
		'xlam', 'pptm', 'potm', 'ppam', 'ppsm', 'sldm',
		'dll', 'dllx', 'rar', 'zip', '7z', 'gzip',
		'gzip2', 'tar', 'fon', 'svgz', 'jnlp'
	]
	var extension = filename.toLowerCase().match(/\.\w+$/)
	if (!extension) {
		return true
	}
	extension = extension[0].substring(1)
	return (suspicious.indexOf(extension) >= 0)
}

// -----------------------
// Cryptographic Functions
// -----------------------

miniLock.crypto = {}

// The crypto worker is a Web Worker
// used in order to perform encryption
// operations in the background.
// Check `workers/crypto.js` for more
// information and comments.
miniLock.crypto.worker = new Worker('js/workers/crypto.js')

// Process messages from the crypto worker.
miniLock.crypto.worker.onmessage = function(message) {
	message = message.data
	if (message.error) {
		if (message.operation === 'encrypt') {
			console.log('Encryption error')
			miniLock.UI.animateProgressBarToShowError(message.operation)
		}
		if (message.operation === 'decrypt') {
			console.log('Decryption error')
			miniLock.UI.animateProgressBarToShowError(message.operation)
		}
		return false
	}
	else {
		if (message.operation === 'encrypt') {
			message.blob = new Blob([
				'miniLockFileYes.',
				JSON.stringify(message.info),
				'miniLockEndInfo.',
				new Uint8Array(message.data)
			], {type: 'application/minilock'})
		}
		if (message.operation === 'decrypt') {
			message.blob = new Blob([
				new Uint8Array(message.data)
			])
		}
		// Execute callback function from function name
		var context = window
		var namespaces = message.callback.split('.')
		var func = namespaces.pop()
		for (var i = 0; i < namespaces.length; i++) {
			context = context[namespaces[i]]
		}
		return context[func].apply(context, [message])
	}
}

// Generic callback for use with the above function.
miniLock.crypto.workerEncryptionCallback = function(message) {
	miniLock.UI.save({
		name: message.saveName,
		size: message.blob.size,
		data: message.blob,
		type: 'application/minilock'
	}, message.operation, message.senderID)
}

// Generic callback for use with the above function.
miniLock.crypto.workerDecryptionCallback = function(message) {
	miniLock.UI.save({
		name: message.saveName,
		size: message.blob.size,
		data: message.blob,
		type: message.blob.type
	}, message.operation, message.senderID)
}

// Input: User key (String), callback function
// Result: Calls the scrypt Web Worker which returns
//	32 bytes of key material in a Uint8Array,
//	which then passed to the callback.
miniLock.crypto.getScryptKey = function(key, callback) {
	var scryptWorker = new Worker('js/workers/scrypt.js')
	scryptWorker.postMessage({
		key: key
	})
	scryptWorker.onmessage = function(message) {
		return callback(message.data.keyBytes)
	}
}

// Input: User key
// Output: Whether key is strong enough
miniLock.crypto.checkKeyStrength = function(key) {
	var minEntropy = miniLock.settings.minKeyEntropy
	if (key.length < 32) { return false }
	return (zxcvbn(key).entropy > minEntropy)
}

// Input: User key
// Result: Object: {
//	publicKey: Public encryption key (Uint8Array),
//	secretKey: Secret encryption key (Uint8Array)
// }
miniLock.crypto.getKeyPair = function(key) {
	key = nacl.hash(nacl.util.decodeUTF8(key))
	miniLock.crypto.getScryptKey(key, function(keyBytes) {
		miniLock.session.keys = nacl.box.keyPair.fromSecretKey(keyBytes)
		miniLock.session.keyPairReady = true
	})
}

// Input: none
// Output: nonce for usage in encryption operations
miniLock.crypto.getNonce = function() {
	return nacl.randomBytes(24)
}

// Input: none
// Output: File key for usage in nacl.secretbox() encryption operations
miniLock.crypto.getFileKey = function() {
	return nacl.randomBytes(32)
}

// Input: Public encryption key (Uint8Array)
// Output: miniLock ID (Base64)
miniLock.crypto.getMiniLockID = function(publicKey) {
	return nacl.util.encodeBase64(publicKey)
}

// Input: Object:
//	{
//		name: File name,
//		size: File size,
//		data: File (ArrayBuffer),
//	}
// saveName: Name to use when saving resulting file. '.minilock' extension will be added.
// publicKeys: Array of (Base64) public keys to encrypt for
// myPublicKey: My public key (Uint8Array)
// mySecretKey: My secret key (Uint8Array)
// callback: Name of the callback function to which encrypted result is passed.
// Result: Sends file to be encrypted, with the result picked up
//	by miniLock.crypto.worker.onmessage() and sent to the specified callback.
miniLock.crypto.encryptFile = function(
	file,
	saveName,
	publicKeys,
	myPublicKey,
	mySecretKey,
	callback
) {
	saveName += '.minilock'
	var nonces = []
	for (var i = 0; i < publicKeys.length; i++) {
		nonces.push(
			nacl.util.encodeBase64(
				miniLock.crypto.getNonce()
			)
		)
	}
	miniLock.crypto.worker.postMessage({
		operation: 'encrypt',
		data: new Uint8Array(file.data),
		name: file.name,
		saveName: saveName,
		fileKey: miniLock.crypto.getFileKey(),
		fileNonce: miniLock.crypto.getNonce(),
		nonces: nonces,
		publicKeys: publicKeys,
		myPublicKey: myPublicKey,
		mySecretKey: mySecretKey,
		callback: callback
	})
}

// Input: Object:
//	{
//		name: File name,
//		size: File size,
//		data: Encrypted file (ArrayBuffer),
//	}
// myPublicKey: My public key (Uint8Array)
// mySecretKey: My secret key (Uint8Array)
// callback: Name of the callback function to which decrypted result is passed.
// Result: Sends file to be decrypted, with the result picked up
//	by miniLock.crypto.worker.onmessage() and sent to the specified callback.
miniLock.crypto.decryptFile = function(
	file,
	myPublicKey,
	mySecretKey,
	callback
) {
	miniLock.crypto.worker.postMessage({
		operation: 'decrypt',
		data: new Uint8Array(file.data),
		myPublicKey: myPublicKey,
		mySecretKey: mySecretKey,
		callback: callback
	})
}

// -----------------------
// File Processing
// -----------------------

miniLock.file = {}

// Input: File object and callback
// Output: Callback function executed with object:
//	{
//		name: File name,
//		size: File size (bytes),
//		data: File data (ArrayBuffer)
//	}
miniLock.file.get = function(file, callback) {
	var reader = new FileReader()
	reader.onload = function(readerEvent) {
		if (
			callback &&
			(typeof(callback) === 'function')
		) {
			return callback({
				name: file.name,
				size: file.size,
				data: readerEvent.target.result
			})
		}
		else {
			throw new Error('miniLock.file.get: Invalid callback')
		}
	}
	reader.readAsArrayBuffer(file)
}

// -----------------------
// User Functions
// -----------------------

miniLock.user = {}

// Input: User key
// Result: Unlock
miniLock.user.unlock = function(key) {
	miniLock.crypto.getKeyPair(key)
}

// Input: File size
// Output: Estimate of how long encryption/decryption
//	will take (in seconds), based on file size
miniLock.user.progressBarEstimate = function(fileSize) {
	var MBps = 18.3
	return Math.ceil(fileSize / 1000000 / MBps)
}

})()
