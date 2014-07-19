// -----------------------
// Initialization
// -----------------------

/*jshint -W079 */
var window = {}
/*jshint +W079 */
importScripts(
	'../lib/crypto/nacl.js',
	'../lib/indexOfMulti.js'
)
var nacl = window.nacl

// -----------------------
// Utility functions
// -----------------------

var base64Match = new RegExp(
	'^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$'
)

// Input: String
// Output: Boolean
// Notes: Validates if string is a proper miniLock ID.
var validateID = function(id) {
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

// Input: String
// Output: Boolean
// Notes: Validates if string is a proper nonce.
var validateNonce = function(nonce) {
	if (
		(nonce.length > 40) ||
		(nonce.length < 10)
	) {
		return false
	}
	if (base64Match.test(nonce)) {
		var bytes = nacl.util.decodeBase64(nonce)
		return bytes.length === 24
	}
	return false
}

var validateKey = validateID

// -----------------------
// Cryptographic functions
// -----------------------

// Receive a message to perform a certain operation.
// Input: Object:
//	{
//		operation: Type of operation ('encrypt' or 'decrypt'),
//		data: Data to encrypt/decrypt (Uint8Array),
//		name: File name (String),
//		saveName: Name to use for saving resulting file (String),
//		fileKey: 32-byte key used for file encryption (Uint8Array),
//		fileNonce: 24-byte nonce used for file encryption/decryption (Uint8Array),
//		publicKeys: Array of (Base64) public keys to encrypt to (not used for 'decrypt' operation),
//		myPublicKey: My public key (Uint8Array),
//		mySecretKey: My secret key (Uint8Array)
//	}
// Result: When finished, the worker will return the result
// 	which is supposed to be caught and processed by
//	the miniLock.crypto.worker.onmessage() function
//	in miniLock.js.
// Notes: A miniLock-encrypted file's first 16 bytes are always the following:
//	0x6d, 0x69, 0x6e, 0x69,
//	0x4c, 0x6f, 0x63, 0x6b,
//	0x46, 0x69, 0x6c, 0x65,
//	0x59, 0x65, 0x73, 0x2e
//	Those 16 bytes are then followed by the following JSON object (binary-encoded):
//	{
//		senderID: Sender's miniLock ID,
//		fileInfo: {
//			(One copy of the below object for every recipient)
//			Unique nonce for decrypting this object (Base64): {
//				fileKey: Key for file decryption (Base64),
//				fileName: The file's original filename (String),
//				fileNonce: Nonce for file decryption (Base64),
//			}
//			(Encrypted with recipient's public key and stored as Base64 string)
//		}
//	}
// Note that the file name is padded with 0x00 bytes until it reaches 256 bytes in length.
//	The JSON object's end is then signaled by the following 16-byte delimiter:
//		0x6d, 0x69, 0x6e, 0x69,
//		0x4c, 0x6f, 0x63, 0x6b,
//		0x45, 0x6e, 0x64, 0x49,
//		0x6e, 0x66, 0x6f, 0x2e
//	...after which we have the ciphertext in binary format.
//	Note that we cannot ensure the integrity of senderID unless it can be used to carry out a
//	successful, authenticated decryption of both fileInfo and consequently the ciphertext.
onmessage = function(message) {
message = message.data

// We have received a request to encrypt
if (message.operation === 'encrypt') {
	(function() {
		var info = {
			senderID: nacl.util.encodeBase64(message.myPublicKey),
			fileInfo: {}
		}
		var fileInfo = {
			fileKey: nacl.util.encodeBase64(message.fileKey),
			fileName: message.name,
			fileNonce: nacl.util.encodeBase64(message.fileNonce)
		}
		while (fileInfo.fileName.length < 256) {
			fileInfo.fileName += String.fromCharCode(0x00)
		}
		fileInfo = JSON.stringify(fileInfo)
		for (var i = 0; i < message.publicKeys.length; i++) {
			var encryptedFileInfo = nacl.box(
				nacl.util.decodeUTF8(fileInfo),
				nacl.util.decodeBase64(message.nonces[i]),
				nacl.util.decodeBase64(message.publicKeys[i]),
				message.mySecretKey
			)
			info.fileInfo[message.nonces[i]] = nacl.util.encodeBase64(encryptedFileInfo)
		}
		var encrypted = nacl.secretbox(
			message.data,
			message.fileNonce,
			message.fileKey
		)
		if (!encrypted) {
			postMessage({
				operation: 'encrypt',
				error: true
			})
			throw new Error('miniLock: Encryption failed - general encryption error')
			return false
		}
		postMessage({
			operation: 'encrypt',
			data: encrypted,
			name: message.name,
			saveName: message.saveName,
			info: info,
			senderID: nacl.util.encodeBase64(message.myPublicKey),
			error: false,
			callback: message.callback
		})
	})()
}


// We have received a request to decrypt
if (message.operation === 'decrypt') {
	(function() {
		var miniLockInfoEnd = [
			0x6d, 0x69, 0x6e, 0x69,
			0x4c, 0x6f, 0x63, 0x6b,
			0x45, 0x6e, 0x64, 0x49,
			0x6e, 0x66, 0x6f, 0x2e
		]
		var miniLockInfoEndIndex, info
		try {
			miniLockInfoEndIndex = message.data.indexOfMulti(miniLockInfoEnd)
			info = nacl.util.encodeUTF8(message.data.subarray(16, miniLockInfoEndIndex))
			info = JSON.parse(info)
			message.data = message.data.subarray(
				miniLockInfoEndIndex + miniLockInfoEnd.length,
				message.data.length
			)
		}
		catch(error) {
			postMessage({
				operation: 'decrypt',
				error: true
			})
			throw new Error('miniLock: Decryption failed - could not parse file header')
			return false
		}
		if (
			!info.hasOwnProperty('senderID')
			|| !validateID(info.senderID)
		) {
			postMessage({
				operation: 'decrypt',
				error: true
			})
			throw new Error('miniLock: Decryption failed - could not validate sender ID')
			return false
		}
		// Attempt fileInfo decryptions until one succeeds
		var actualFileInfo = false
		for (var i in info.fileInfo) {
			if (
				({}).hasOwnProperty.call(info.fileInfo, i)
				&& validateNonce(i)
			) {
				try {
					nacl.util.decodeBase64(info.fileInfo[i])
				}
				catch(err) {
					postMessage({
						operation: 'decrypt',
						error: true
					})
					throw new Error('miniLock: Decryption failed - could not parse file header')
					return false
				}
				actualFileInfo = nacl.box.open(
					nacl.util.decodeBase64(info.fileInfo[i]),
					nacl.util.decodeBase64(i),
					nacl.util.decodeBase64(info.senderID),
					message.mySecretKey
				)
				if (actualFileInfo) {
					try {
						actualFileInfo = JSON.parse(
							nacl.util.encodeUTF8(actualFileInfo)
						)
					}
					catch(err) {
						postMessage({
							operation: 'decrypt',
							error: true
						})
						throw new Error('miniLock: Decryption failed - could not parse file header')
						return false
					}
					break
				}
			}
		}
		if (
			!actualFileInfo
			|| !({}).hasOwnProperty.call(actualFileInfo, 'fileName')
			|| !actualFileInfo.fileName.length
			|| !({}).hasOwnProperty.call(actualFileInfo, 'fileNonce')
			|| !validateNonce(actualFileInfo.fileNonce)
			|| !({}).hasOwnProperty.call(actualFileInfo, 'fileKey')
			|| !validateKey(actualFileInfo.fileKey)
		) {
			postMessage({
				operation: 'decrypt',
				error: true
			})
			throw new Error('miniLock: Decryption failed - could not parse file header')
			return false
		}
		while (
			actualFileInfo.fileName[
				actualFileInfo.fileName.length - 1
			] === String.fromCharCode(0x00)
		) {
			actualFileInfo.fileName = actualFileInfo.fileName.slice(0, -1)
		}
		var decrypted = nacl.secretbox.open(
			message.data,
			nacl.util.decodeBase64(actualFileInfo.fileNonce),
			nacl.util.decodeBase64(actualFileInfo.fileKey)
		)
		if (!decrypted) {
			postMessage({
				operation: 'decrypt',
				error: true
			})
			throw new Error('miniLock: Decryption failed - general decryption error')
			return false
		}
		postMessage({
			operation: 'decrypt',
			data: decrypted,
			name: actualFileInfo.fileName,
			saveName: actualFileInfo.fileName,
			senderID: info.senderID,
			error: false,
			callback: message.callback
		})
	})()
}

}
