miniLock.UI = {}

$(window).load(function() {
'use strict';

// -----------------------
// UI Startup
// -----------------------

$('[data-utip]').utip()
$('input.miniLockKey').focus()
$('span.dragFileInfo').text(
	$('span.dragFileInfo').data('select')
)

// -----------------------
// Unlock UI Bindings
// -----------------------

$('form.unlockForm').submit(function() {
	var key = $('input.miniLockKey').val()
	if (!key.length) {
		return false
	}
	if (miniLock.crypto.checkKeyStrength(key)) {
		$('div.keyStrength').animate({height: 20})
		$('div.keyStrength').text($('div.keyStrength').data('keyok'))
		$('input.miniLockKey').attr('readonly', 'readonly')
		miniLock.user.unlock(key)
		// Keep polling until we have a key pair
		var keyReadyInterval = setInterval(function() {
			if (miniLock.session.keyPairReady) {
				clearInterval(keyReadyInterval)
				$('div.myMiniLockID input').val(
					miniLock.crypto.getMiniLockID(
						miniLock.session.keys.publicKey
					)
				)
				$('div.unlock').delay(200).fadeOut(200, function() {
					$('div.selectFile').fadeIn(200)
					$('div.squareFront').animate({
						backgroundColor: '#49698D'
					})
				})
			}
		}, 100)
	}
	else {
		$('div.keyStrength').html(
			Mustache.render(
				miniLock.templates.keyStrengthMoreInfo,
				{
					phrase: miniLock.phrase.get(7)
				}
			)
		)
		$('span.keyStrengthMoreInfo').unbind().click(function() {
			$('div.keyStrength').animate({height: 180})
		})
		$('div.keyStrength input[type=text]').click(function() {
			$(this).select()
		})
		$('div.keyStrength input[type=button]').click(function() {
			$('div.keyStrength input[type=text]').val(
				miniLock.phrase.get(7)
			)
		})
	}
	return false
})

// -----------------------
// File Select UI Bindings
// -----------------------

$('div.fileSelector').on('dragover', function() {
	$('span.dragFileInfo').text(
		$('span.dragFileInfo').data('drop')
	)
	return false
})

$('div.fileSelector').on('dragleave', function() {
	$('span.dragFileInfo').text(
		$('span.dragFileInfo').data('select')
	)
	return false
})


$('div.fileSelector').on('drop', function(e) {
	$('span.dragFileInfo').text(
		$('span.dragFileInfo').data('read')
	)
	e.preventDefault()
	var file = e.originalEvent.dataTransfer.files[0]
	miniLock.UI.handleFileSelection(file)
	return false
})

$('div.fileSelector').click(function() {
	$('input.fileSelectDialog').click()
})

$('input.fileSelectDialog').change(function(e) {
	e.preventDefault()
	if (!this.files) {
		return false
	}
	$('span.dragFileInfo').text(
		$('span.dragFileInfo').data('read')
	)
	miniLock.UI.handleFileSelection(this.files[0])
	return false
})

$('div.myMiniLockID').click(function() {
	$(this).find('input').select()
})

// Handle file selection via drag/drop or browsing.
miniLock.UI.handleFileSelection = function(file) {
	miniLock.file.get(file, function(result) {
		miniLock.UI.readFile = result
		var miniLockFileYes = [
			0x6d, 0x69, 0x6e, 0x69,
			0x4c, 0x6f, 0x63, 0x6b,
			0x46, 0x69, 0x6c, 0x65,
			0x59, 0x65, 0x73, 0x2e
		]
		var operation = 'encrypt'
		var first16Bytes = (new Uint8Array(result.data)).subarray(0, 16)
		if (first16Bytes.indexOfMulti(miniLockFileYes) === 0) {
			operation = 'decrypt'
		}
		setTimeout(function() {
			$('div.squareContainer').toggleClass('flip')
			$('div.saveLink').hide()
			$('div.filenameSuspicious').hide()
		}, 500)
		setTimeout(function() {
			$('span.dragFileInfo').text(
				$('span.dragFileInfo').data('select')
			)
		}, 1000)
		if (operation === 'encrypt') {
			$('div.recipientSelect').show()
			$('div.fileSave').hide()
		}
		if (operation === 'decrypt') {
			$('div.recipientSelect').hide()
			$('div.fileSave').show()
			miniLock.crypto.decryptFile(
				result,
				miniLock.session.keys.publicKey,
				miniLock.session.keys.secretKey,
				'miniLock.crypto.workerDecryptionCallback'
			)
			miniLock.UI.animateProgressBar(file.size, 'decrypt')
		}
	})
}

// -----------------------
// Recipient Select UI Bindings
// -----------------------

$('input.flipBack').click(function() {
	$('form.fileSelectForm input[type=reset]').click()
	$('div.squareContainer').toggleClass('flip')
})

$('input.contacts').click(function() {
	// TODO: Address book
	console.log('TODO')
})

$('input.addAnotherRecipient').click(function() {
	var recipient = Mustache.render(
		miniLock.templates.recipient
	)
	$(recipient).insertAfter(
		$('form.recipientForm input[type=text]:last')
	)
	$('div.recipientScroller').stop().animate({
		scrollTop: $('div.recipientScroller').prop('scrollHeight')
	}, 500)
})

$('input.encryptFile').click(function() {
	var miniLockIDs = []
	var encryptToSelf = $('.encryptToSelf').is(':checked')
	var randomizeFilename = $('.randomizeFilename').is(':checked')
	var saveName = miniLock.UI.readFile.name
	var invalidID = false
	$('form.recipientForm input[type=text]').each(function() {
		$(this).val($.trim($(this).val()))
		var value = $(this).val()
		if (
			value.length &&
			!miniLock.util.validateID(value)
		) {
			invalidID = true
			$(this).animate({
				borderColor: '#F00'
			})
		}
		else {
			$(this).animate({
				borderColor: 'transparent'
			})
			if (value.length) {
				miniLockIDs.push(value)
			}
		}
	})
	if (encryptToSelf) {
		miniLockIDs.push(
			miniLock.crypto.getMiniLockID(
				miniLock.session.keys.publicKey
			)
		)
	}
	if (randomizeFilename) {
		saveName = miniLock.util.getRandomFilename()
	}
	if (miniLockIDs.length && !invalidID) {
		$('div.recipientSelect').fadeOut(200, function() {
			$('div.fileSave').fadeIn(200)
		})
		miniLock.UI.animateProgressBar(miniLock.UI.readFile.size, 'encrypt')
		miniLock.crypto.encryptFile(
			miniLock.UI.readFile,
			saveName,
			miniLockIDs,
			miniLock.session.keys.publicKey,
			miniLock.session.keys.secretKey,
			'miniLock.crypto.workerEncryptionCallback'
		)
		$('form.fileSelectForm input[type=reset]').click()
		delete miniLock.UI.readFile
	}
	return false
})

// -----------------------
// File Save UI Bindings
// -----------------------

// Input: Object:
//	{
//		name: File name,
//		size: File size (bytes),
//		data: File data (Blob),
//		type: File MIME type
//	}
//	operation: 'encrypt' or 'decrypt'
//	senderID: Sender's miniLock ID (Base64)
// Result: Anchor HTML element which can be used to save file
miniLock.UI.save = function(file, operation, senderID) {
	var endText = 'encryptioncomplete'
	if (operation === 'decrypt') {
		endText = 'decryptioncomplete'
	}
	window.URL = window.webkitURL || window.URL
	$('a.fileSaveLink').attr('download', file.name)
	$('a.fileSaveLink').attr('href', window.URL.createObjectURL(file.data))
	$('a.fileSaveLink').data('downloadurl', [
		file.type,
		$('a.fileSaveLink').attr('download'),
		$('a.fileSaveLink').attr('href')
	].join(':'))
	$('h2.fileName').text(file.name)
	$('span.fileSize').text(miniLock.UI.readableFileSize(file.size))
	$('span.fileSender').text('Sent by ' + senderID)
	$('span.progressBarPercentage').text(
		$('span.progressBarPercentage').data(endText)
	)
	$('div.progressBarFill').stop().animate({
		width: '100%'
	}, {
		duration: 300,
		easing: 'linear'
	})
	setTimeout(function() {
		$('div.progressBar').fadeOut(200, function() {
			$('div.saveLink').fadeIn(200)
			if (miniLock.util.isFilenameSuspicious(file.name)) {
				$('div.filenameSuspicious').fadeIn(200)
			}
		})
	}, 500)
}

// Convert an integer from bytes into a readable file size.
// For example, 7493 becomes '7.5KB'.
miniLock.UI.readableFileSize = function(bytes) {
	var KB = bytes / 1024
	var MB = KB    / 1024
	var GB = MB    / 1024
	if (KB < 1024) {
		return (Math.round(KB * 10) / 10) + 'KB'
	}
	else if (MB < 1024) {
		return (Math.round(MB * 10) / 10) + 'MB'
	}
	else {
		return (Math.round(GB * 10) / 10) + 'GB'
	}
}

// Animate progress bar based on file size.
miniLock.UI.animateProgressBar = function(fileSize) {
	$('div.progressBarFill').css({width: '0%'})
	$('div.progressBarFill').animate({
		width: '99%'
	}, {
		duration: miniLock.user.progressBarEstimate(fileSize) * 1000,
		easing: 'linear',
		progress: function(animation, progress) {
			var percentage = Math.round(progress * 100)
			if (percentage >= 99) {
				percentage = 99
			}
			$('span.progressBarPercentage').text(percentage)
		}
	})
}

// Animate progress bar to show error.
miniLock.UI.animateProgressBarToShowError = function(operation) {
	var errorText = 'encryptionerror'
	if (operation === 'decrypt') {
		errorText = 'decryptionerror'
	}
	$('div.progressBarFill').stop().css({
		width: '100%',
		backgroundColor: '#F00'
	})
	$('span.progressBarPercentage').text(
		$('span.progressBarPercentage').data(errorText)
	)
	setTimeout(function() {
		$('div.squareContainer').toggleClass('flip')
	}, 4000)
	setTimeout(function() {
		$('div.progressBarFill').css({
			backgroundColor: '#FFF'
		})
	}, 4500)
}

$('a.fileSaveLink').click(function() {
	setTimeout(function() {
		$('div.squareContainer').toggleClass('flip')
	}, 1000)
	setTimeout(function() {
		window.URL = window.webkitURL || window.URL
		window.URL.revokeObjectURL($('a.fileSaveLink')[0].href)
		$('a.fileSaveLink').attr('download', '')
		$('a.fileSaveLink').attr('href', '')
		$('a.fileSaveLink').data('downloadurl', '')
		$('h2.fileName').text('')
		$('span.fileSize').text('')
		$('span.fileSender').text('')
		$('div.progressBar').show()
	}, 2000)
})

})
