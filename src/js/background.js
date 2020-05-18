console.log('background js')
chrome.runtime.onUpdateAvailable.addListener(function(details) {
  console.log("updating to version " + details.version);
  chrome.runtime.reload();
});

chrome.runtime.onInstalled.addListener(function(details){
	console.log("onInstalled: " + details.reason)
	chrome.storage.sync.set({'__GMA_status':details.reason}, function(result) {
        var thisVersion = chrome.runtime.getManifest().version;
		console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!")
	})
    if(details.reason == "install"){
        console.log("This is a first install!");
    }
	else if(details.reason == "update"){
        var thisVersion = chrome.runtime.getManifest().version;
		console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!")
    }
});

chrome.runtime.onMessageExternal.addListener(function(request, sender, sendResponse) {
  if (request.reload) {
    chrome.runtime.requestUpdateCheck(function(status) {
      if (status == "update_available") {
        console.log("update pending...");
        sendResponse({ updateAvailable: true, throttled: false });
      } else if (status == "no_update") {
        console.log("no update found");
        sendResponse({ updateAvailable: false, throttled: false });
      } else if (status == "throttled") {
        console.log("Oops, I'm asking too frequently - I need to back off.");
        sendResponse({ updateAvailable: false, throttled: true });
      }
    });
  }
  if (request.type === "notification") {
    chrome.permissions.request(
      {
        permissions: ["notifications"],
        origins: ["*://meet.google.com/**-**-**"],
      },
      function(granted) {
        if (granted) {
          sendResponse({ permissions: true });
        } else {
          sendResponse({ permissions: false });
        }
      }
    );
  }

  if (request.type === "displayNotification") {
    console.log(request.options);
    chrome.notifications.create("", request.options);
  }
});
