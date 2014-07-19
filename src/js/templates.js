miniLock.templates = {}

miniLock.templates.keyStrengthMoreInfo = 'Key is too weak. '
	+ '<span class="keyStrengthMoreInfo">Help me pick a key!</span>'
	+ '<p>Having a long, unique key is very important for using miniLock. '
	+ 'Try using a <strong>phrase</strong> that makes sense only to you.</p>'
	+ '<p>miniLock can generate a	 phrase for you to use as a key:<br />'
	+ '<input type="text" value="{{phrase}}" spellcheck="false" readonly="readonly" />'
	+ '<input type="button" value="Get another phrase" /></p>'

miniLock.templates.recipient = '<input type="text" val="" placeholder="Recipient\'s miniLock ID" />'