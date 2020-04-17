chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
	console.log('run', tabs[0].url)
	let curl=tabs[0].url
	console.log(curl, curl.indexOf('meet.google.com'))
	if(curl.indexOf('meet.google.com')==-1){
		document.body.classList = 'no-meeting'
		//console.log('not at Meet',chrome , response)
		return
	}
	
	document.body.classList = ''
})
