chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
	let curl=tabs[0].url
	if(curl.indexOf('meet.google.com')==-1){
		document.body.classList = 'no-meeting'
		return
	}
	document.body.classList = ''
})
chrome.runtime.setUninstallURL('https://docs.google.com/forms/d/e/1FAIpQLSfqLmJmJIGuygXjLbJw66ffFg3es2NgmXSFmtGwCtrCq_3hMw/viewform')