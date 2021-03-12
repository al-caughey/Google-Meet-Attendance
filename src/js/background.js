//console.log('background js')
chrome.runtime.onUpdateAvailable.addListener(function(details) {
  //console.log("updating to version " + details.version);
  chrome.runtime.reload();
});

chrome.runtime.onInstalled.addListener(function(details){
	//console.log("onInstalled: " + details.reason)
	chrome.storage.sync.set({'__GMA_status':details.reason}, function(result) {
        var thisVersion = chrome.runtime.getManifest().version;
		//console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!")
	})
    if(details.reason == "install"){
        //console.log("This is a first install!");
    }
	else if(details.reason == "update"){
        var thisVersion = chrome.runtime.getManifest().version;
		//console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!")
    }
});


/*chrome.runtime.connect().onDisconnect.addListener(function() {
    console.log('Uh-oh!  Extension was disconnected')
})*/