const API_KEY = 'AIzaSyBWyd6RkvmVV4ZthvKSMX-HP0FlKf5vAEo';
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const CLIENT_ID = '868086281002-534i6pqhguppmhubvb67tskbgrk233os.apps.googleusercontent.com'
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets'

// Listen for messages from inject.js
chrome.extension.onMessage.addListener(
    function (request, sender, sendResponse) {
        // Get the token

        if (request.type === 'showPageAction') {
            chrome.pageAction.show(sender.tab.id);
        } else if (request.type == 'popup' || request.type == 'people') {
            chrome.identity.getAuthToken({ interactive: true }, function (token) {
                chrome.storage.sync.get(['spreadsheetId'], function (result) {
                    if (!result.spreadsheetId) {
                        //no sheet create one
                        createSpreadSheet(token).then((res) => {
                            var data = {
                                type: 'sheet',
                                id: res.spreadsheetId,
                                token: token
                            }
                            //console.log(data)
                            getSheet(res.id, res.token).then(function (response) {
                                addSheet(response.id, response.token)
                            })
                        })
                    } else {
                        getSpreadsheet(result.spreadsheetId, token).then((res) => {

                            getSheet(res.spreadsheetId, token).then(function (response) {

                                if (!response.title) {
                                    addSheet(response.id, response.token)
                                }
                            })

                            var data = {
                                type: 'sheet',
                                id: res.spreadsheetId,
                                token: token
                            }
                            //console.log(data)
                            chrome.tabs.query({ active: true }, function (tabs) {
                                chrome.tabs.sendMessage(tabs[0].id, data);
                            })
                            chrome.runtime.sendMessage(data);

                        })
                    }

                })
            })
        } else if (request.type == 'attendance') {

            chrome.storage.sync.get(['spreadsheetId'], function (result) {
                id = result.spreadsheetId

                chrome.identity.getAuthToken({ interactive: true }, function (token) {

                    addData(id, token, request.values)
                })
            })
        } else if (request.type == 'create') {
            var id;
            chrome.storage.sync.get(['spreadsheetId'], function (result) {
                id = result.spreadsheetId
                chrome.identity.getAuthToken({ interactive: true }, function (token) {
                    createSpreadSheet(token).then((res) => {
                        getSheet(res.id, res.token).then(function (response) {
                            addSheet(response.id, response.token)
                        })
                    })
                })
                console.error('error: ' + reason);
            })
            return true;
        } else if (request.type == 'addsheet') {
            chrome.identity.getAuthToken({ interactive: true }, function (token) {
                //console.log('id=', request.id, request.sheetname)
                getSheet(request.id, token, request.sheetname).then(function (response) {
                    if (!response.title) {
                        addSheet(response.id, response.token, request.sheetname)
                    }
                })
            })
        }
    }
);

async function getSpreadsheet(id, token) {

    var ss = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}`, {
        method: 'GET',
        headers: {
            Authorization: 'Bearer ' + token,
            'content-type': 'application/json',
        }
    }).then(res => {
        return res.json();
    }).then(res => {

        return res
    })
    return ss

}

async function getSheet(id, token, title) {
    var sheet = {};

    var ss = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}`, {
        method: 'GET',
        headers: {
            Authorization: 'Bearer ' + token,
            'content-type': 'application/json',
        }
    }).then(response => {
        return response.json()
    }).then(response => {

        var sheets = response.sheets

        if (sheets) {
            for (var i = 0; i < sheets.length; i++) {
                if (sheets[i].properties.title == title) {
                    sheet = sheets[i].properties
                    break
                }
            }
        }
        sheet.token = token
        sheet.id = id
        return sheet;
    })

    return ss
}

async function addSheet(id, token, title) {
    var sheet = {};
    var sheetname = title ? title : 'Attendance'
    //console.log(id, token, title)
    var sh = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate`, {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + token,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            requests: [
                {
                    addSheet: {
                        properties: {
                            title: sheetname,
                            index: 0
                        }
                    },
                }
            ],
            includeSpreadsheetInResponse: false,

        })
    }).then((response) => {
        return response.json()
    }).then(response => {

        // On success
        //sendResponse({ success: true });
    });

    sheet.token = token
    sheet.id = id
    return sheet;
}


async function getFirstSheet(id, token) {
    var sheet = {};

    var ss = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}`, {
        method: 'GET',
        headers: {
            Authorization: 'Bearer ' + token,
            'content-type': 'application/json',
        }
    }).then(response => {
        return response.json()
    }).then(response => {

        var sheets = response.sheets

        if (sheets) {
            sheet = sheets[0].properties
        }
        sheet.token = token
        sheet.id = id
        return sheet;
    })

    return ss
}


async function addData(id, token, data) {

    var sheet = await getFirstSheet(id, token)
   // console.log(sheet.title)
    var ss = await fetch(encodeURI(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/'${sheet.title}'`), {
        method: 'GET',
        headers: {
            Authorization: 'Bearer ' + token,
            'content-type': 'application/json',
        }
    }).then(res => {
        return res.json()
    })
        .then(async function (res) {
            //console.log(res)
            var col = columnToLetter(res.values ? res.values[0].length + 1 : 1)
            const body = {
                values: data
            };
            //console.log(data)
            var ss = await fetch(encodeURI(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/'${sheet.title}'!${col}1:${col}${data.length}:append?valueInputOption=USER_ENTERED`), {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + token,
                    'content-type': 'application/json',
                },
                body: JSON.stringify(body)
            }).then((response) => {
                // On success
                //console.log(`${response.result.updates.updatedCells} cells appended.`)
            });
        })
}


async function createSpreadSheet(token) {

    var spreadsheetBody = {
        properties: {
            title: `Meet Attendance ${dateString()}`
        }
    };

    var ss = fetch(`https://sheets.googleapis.com/v4/spreadsheets?fields=spreadsheetId`, {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + token,
            'content-type': 'application/json',
        },
        body: JSON.stringify(spreadsheetBody)
    })
    var data = await ss.then(async function (response) {
        return response.json();
    }).then(response => {

        //console.log('id', response)
        chrome.storage.sync.set({ spreadsheetId: response.spreadsheetId }, function (response) {
            //console.log('Sheet is set to ' + response);
        });
        var data = {
            type: 'sheet',
            id: response.spreadsheetId,
            token: token
        }

        chrome.tabs.query({currentWindow: true, active: true }, function (tabs) {
            //console.log(data)
            chrome.tabs.sendMessage(tabs[0].id, data, function(response) {
               //console.log(response)
              });
        })
        chrome.runtime.sendMessage(data, function (response) {
            //console.log(`sent ${response}`);
        });
        return data


    }, function (reason) {
        console.error('error: ' + reason.result.error.message);
    })
    return data
}

function columnToLetter(column) {
    var temp, letter = '';
    while (column > 0) {
        temp = (column - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        column = (column - temp - 1) / 26;
    }
    return letter;
}


function dateString() {
    var currentDate = new Date();

    var date = currentDate.getDate();
    var month = currentDate.getMonth(); //Be careful! January is 0 not 1
    var year = currentDate.getFullYear();
    var hour = currentDate.getHours();
    var minutes = currentDate.getMinutes();
    if (hour < 10) {
        hour = '0' + hour
    }
    if (minutes < 10) {
        minutes = '0' + minutes
    }
    var dateString = year + "-" + (month + 1) + "-" + date + " " + hour + ":" + minutes;
    return dateString
}