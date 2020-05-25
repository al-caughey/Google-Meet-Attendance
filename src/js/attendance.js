// @author       Al Caughey
// @include      https://meet.google.com/*
// @license      https://github.com/al-caughey/Google-Meet-Attendance/blob/master/LICENSE.md
// @run-at       document-idle

// History:
// v0.2.1 - first post publish Chrome store; improvements to styleSheets
// v0.2.2 - updates to permissions in manifest and in popup.html
// v0.2.3 - LS storage is now keyed to the class name... so you can have multiple class lists
// v0.2.4 - expanded the select query for participants; tweaks to observe
// v0.2.5 - minor wording change in the manifest
// v0.2.6 - tweaks to regex to gather names; initial localization: en, fr, de & nl
// v0.2.7 - added link to uninstall questionaire
// v0.3.0 - downloads the attendance as a text file; added help page
// v0.3.1 - added warning for unsaved changes; added Italian; fixed double name issue; change file export to csv (tab delimited)
// v0.3.2 - cleaning up spurious entries; updated regexs to clean up innerText; tweaks to CSS; removed tabs from permissions
// v0.4.0 - removed jQuery dependencies and added readfile; fixed translations; added PT & ES; added images; lots of structural changes and house keeping
// v0.4.1 - minor CSS cleanup; regex tweaks & a couple of logic errors fixed
// v0.4.2 - minor CSS tweaks to support Firefox extension
// v0.4.3 - fixed an issue with space in named class and then other issues with bad/missing LS keys
// v0.4.4 - for firefox
// v0.4.5 - trim leading space on name in CSV import/export; re-implemented dragging; had to add `hide` to translation strings to account for `hide participant` (which is injected by the Grid View extension)
// v0.4.6 - minor tweaks in CheckParticipants
// v0.4.7 - added start-time button
// v0.5.0 - changed to chrome.storeage.sync rather than localStorage; change btn class to gma-btn to avoid name/css collision;added attendance monitoring
// v0.5.1 - LS classes do not get clobbered... if any remain
// v0.5.2 - fixed error in French translation
// v0.5.3 - do not add/show the Attendance fields until the video tag has been added; do not call wait4element until it makes sense (and lengthened delay between calls for end of meeting); refactored translations (pulled out hide and more because they were not language specific); added to `es` for joined
// v0.5.4 - added translations.js; moved strings there; renamed translations meetUIStrings; added dropDownStrings
// v0.5.5 - minor manifest change for Firefox
// v0.5.6 - minor manifest change for Firefox

;(function() {	
	// Please send feedback to allan.caughey@ocdsb.ca

	// placeholder callback function for get.storage.sync.set... does nothing
	function callBackSet(){
		//console.log('data was saved', chrome.storage.sync)
		//message('Settings saved');
	}
	chrome.storage.sync.get(['Current-Class-Code'], function (r) {
        let currentClassCode = r['Current-Class-Code']

		if (!currentClassCode||currentClassCode === ''||currentClassCode === 'null') {
			chrome.storage.sync.set({'Current-Class-Code':'Class-List'}, callBackSet )
			currentClassCode = 'Class-List'
		}
		// remove any spaces from the class codes
		currentClassCode = currentClassCode.replace(/ /g,'-')
		chrome.storage.sync.set({'Current-Class-Code':currentClassCode}, callBackSet )
		function saveLS2Sync(oc, ocn) {
			//console.log('saveLS2Sync')
			chrome.storage.sync.get(['__Class-'+oc], function (r){
				if(!r['__Class-'+oc]){
					let ccc={}
					ccc['__Class-'+oc]=ocn
					//console.log('__Class-'+oc, ocn)
					chrome.storage.sync.set(ccc, callBackSet )
				}
				localStorage.removeItem('__Class-'+oc)
			})
		}
		// remove any spaces from the LS key names
		for (var key in localStorage){
			if(key.indexOf('__Class') == -1 ) continue
			let kns = key.replace(/ /g,'-')
			if(kns === key) continue
			// old key name had spaces
			chrome.storage.sync.get([key], function (r) {
				let kv = r[key]
				chrome.storage.sync.set({kns:kv}, callBackSet )
				chrome.storage.sync.remove(key);
			})
		}
		chrome.storage.sync.get(['__Class-Info'], function (r) {
			let classInfo = r['__Class-Info']
			let ci = {}
			if (!classInfo) {
				ci['Class-List'] = 'Class List'
				if (currentClassCode !== 'Class-List'){
					ci[currentClassCode] = currentClassCode
				}
				chrome.storage.sync.set({'__Class-Info':JSON.stringify(ci)}, callBackSet )
			}
			
			if(!localStorage.getItem('__Class-Info')) return
			let oldClassInfo=JSON.parse(localStorage.getItem('__Class-Info'))
			//console.log('oldClassInfo', oldClassInfo)
			for (var oc in oldClassInfo){
				if (oc==='Class-List') continue
				if( !ci[oc] ){
					ci[oc] = oc
				}
				let ocn=localStorage.getItem('__Class-'+oc)
				saveLS2Sync(oc, ocn)
				
			}
			localStorage.removeItem('__Class-Info')
			chrome.storage.sync.set({'__Class-Info':JSON.stringify(ci)}, callBackSet )
			document.getElementById('select-class').innerHTML = ''
			setClassList('select-class')
		})
	})

	// cursory localization
	let uiStrings = getMeetUIStrings()
	let old_np = 0
	// create regexes
	//let re_replace = new RegExp('\\b'+uiStrings.you+'\n|\\b'+uiStrings.joined+'\\b|\\b'+uiStrings.more+'\\b', "gi");
	let re_replace = new RegExp('\\b'+uiStrings.you+'\n|\\b'+uiStrings.joined+'\\b|\\b'+uiStrings.more+'\\b|'+uiStrings.hide, "gi");
	//console.log(re_replace)
	let duplicatedLines = /^(.*)(\r?\n\1)+$/gm


	// simple function that waits until a specific element exists in the DOM...
	// (adapted from Stack Overflow
	function waitForElement(elementPath, callBack){
		//console.log("Waiting for: " + elementPath)
		
		let waitfor=elementPath==='[data-call-ended = "true"]'?10000:1000
		
		window.setTimeout(function(){
			let itExists = document.querySelector(elementPath)
			if(!itExists ||itExists.length === 0){
				waitForElement(elementPath, callBack);
			}
			else{
				callBack(elementPath, itExists);
			}
		},waitfor)
	}
	// build the select/options for the list of classes
	function setClassList(p){
		function addOption(pe,t,v){
			let o = document.createElement('option')
			o.innerText = t
			o.value = v.replace(/ /g,'-')
			if (v === '') o.disabled = 'disabled'
			pe.appendChild(o)
		}
		//console.log('setClassList')
		let ddStrings = getDropDownStrings()

		let mpe = document.getElementById(p)
		addOption(mpe, ddStrings.classList, 'Class-List')
		let mog = document.createElement('optgroup')
		mog.setAttribute("label", ddStrings.myClasses)
		chrome.storage.sync.get(['__Class-Info'], function (r) {
			let cls = r['__Class-Info']
			//console.log('__Class-Info',cls)
			let classInfo = (!cls||cls === '')?{}:JSON.parse(cls)
			for (let [code, name] of Object.entries(classInfo).sort()) {
				if(code === 'Class-List') continue
				addOption(mog, name, code)
			}
			mpe.appendChild(mog)
			let og = document.createElement('optgroup')
			og.setAttribute("label", ddStrings.otherOptions)
			addOption(og, ddStrings.add,'+')
			addOption(og, ddStrings.reset,'-')
			mpe.appendChild(og)
		})
	}

	// read a class list from a text file
	function readFile(e) {
		hideUpdateText()
		let fn = e.target.files[0];
		if (!fn) return;
		let reader = new FileReader();
		reader.onload = function(e) {
			chrome.storage.sync.get(['Current-Class-Code'], function (r) {
				let currentClassCode = r['Current-Class-Code']
				let fc = e.target.result.replace( /^\s*([✔\?] )*\s*/gm,'')
				document.getElementById('invited-list').value = fc
				document.getElementById('attendance-div').classList.remove('empty')
				let ccn={}
				ccn['__Class-'+currentClassCode]=fc
				chrome.storage.sync.set(ccn, callBackSet )
			})
		};
		reader.readAsText(fn);
		document.getElementById('read-file').value = '' // so that it changes next click
	}

	// save the class info to the CSV file
	function saveCSVFile(){

		let today = new Date(), d = today.getDate(),m = today.getMonth()+1,y = today.getFullYear()
		let cdate = y+'-'+twod(m)+'-'+twod(d)
		let cdd = document.getElementById("select-class"), cn = cdd.options[cdd.selectedIndex].text;
		// prepend file outputs with UTF-8 BOM
		let header = '\ufeff'+'Attendance for: '+cn+' on '+cdate+'\n\n'+'Names'+'\t'+cdate+' '+sessionStorage.getItem('Meeting-start-time')+'\t'+'Arrival time'+'\n'
		let joined = /^\s*([✔\?])(\s*)(.*)$/gm
		let txt = document.getElementById('invited-list').value.replace(joined, "$3"+'\t'+"$1")
		let checked = document.getElementById("monitor-attendance").checked

		for (let nn in _arrivalTimes){
			let re_name = new RegExp('('+nn+'.*)', 'i')
			if (checked)
				txt = txt.replace(re_name, '$1'+'\t'+_arrivalTimes[nn].arrived +' ('+_arrivalTimes[nn].stayed+')')
			else
				txt = txt.replace(re_name, '$1'+'\t'+_arrivalTimes[nn].arrived)
		}
		let blob = new Blob([header+txt], {type: 'text/plain;charset = utf-8'})
		let temp_a = document.createElement("a")
    	temp_a.download = cn+' ('+cdate+').csv'
		temp_a.href = window.webkitURL.createObjectURL(blob)
		temp_a.click()

		document.getElementById('save-attendance-file').style.visibility = 'hidden'
	}

	// save a class name to the drop down list
	function addClass(){
		let cn = document.getElementById('class-name').value.trim()
		let cc = cn.replace(/ /g,'-')
		if(cc==''){
			document.getElementById('class-name').classList.remove('add-class')
			document.getElementById('class-delete').style.visibility = 'visible'
			document.getElementById('attendance-div').classList.add('empty')
			document.getElementById('select-class').style.display = 'inline-block'
			document.getElementById('read-file-label').style.visibility = 'visible'
			document.getElementById('class-name').style.display = 'none'
			chrome.storage.sync.get(['Current-Class-Code'], function (r) {
				let currentClassCode = r['Current-Class-Code']
				document.getElementById('select-class').value=currentClassCode
				changeClass()
			})
			return
		}
		let hdr = document.querySelector("[label='My Classes']")
		let no = document.createElement("option");
		no.text = cn;
		no.value = cc;
		hdr.appendChild(no)
		document.getElementById('select-class').value = cc;
		chrome.storage.sync.set({'Current-Class-Code': cc}, callBackSet )
		chrome.storage.sync.get(['__Class-Info'], function (r) {
			let cls = r['__Class-Info']
			let classInfo = (!cls||cls === '')?{'Class-List':'Class List'}:JSON.parse(cls)||{}
			classInfo[cc] = cn
			chrome.storage.sync.set({'__Class-Info':JSON.stringify(classInfo)}, callBackSet )
			document.getElementById('class-name').classList.remove('add-class')
			document.getElementById('class-delete').style.visibility = 'visible'
			document.getElementById('attendance-div').classList.add('empty')
			document.getElementById('select-class').style.display = 'inline-block'
			document.getElementById('read-file-label').style.visibility = 'visible'
			document.getElementById('class-name').style.display = 'none'
		})
	}
	// delete a class from the drop-down & LS variables
	function deleteClass(){
		let cn = document.getElementById('class-name')
		let ct = cn.value.trim()
		if (ct === '') return
		if(!confirm('Are you sure you want to delete this class: `'+ct+'`?  There is no undo!')) return
		let cc = ct.replace(/ /g,'-')
		chrome.storage.sync.get(['__Class-Info'], function (r) {
			let classInfo = JSON.parse(r['__Class-Info']||{})
			delete classInfo[cc]
			chrome.storage.sync.set({'__Class-Info':JSON.stringify(classInfo)}, callBackSet )
			chrome.storage.sync.set({'Current-Class-Code': 'Class-List'}, callBackSet )
			chrome.storage.sync.remove('__Class-'+cc)
			let csl = document.getElementById("select-class");
			csl.remove(csl.selectedIndex);
			cn.value = 'Class List'
			document.getElementById('select-class').value = 'Class-List'
			document.getElementById('invited-list').value = ''
			document.getElementById('class-delete').style.visibility = 'hidden'

			changeClass()
			old_np = 0
		})
	}
	// pick new class from drop-down
	function changeClass(){
		hideUpdateText()
		let currentClassCode = document.getElementById('select-class').value
		if(currentClassCode === '+'){
			addClassInfo()
		}
		else if(currentClassCode === '-'){
			resetClassInfo()
		}
		else{

			chrome.storage.sync.get(['__Class-Info'], function (r) {
				let classInfo = JSON.parse( r['__Class-Info'] )||{}
				let currentClassName = classInfo[currentClassCode]
				document.getElementById('class-name').value = currentClassName

				chrome.storage.sync.set({'Current-Class-Code':currentClassCode}, callBackSet )
				chrome.storage.sync.get(['__Class-'+currentClassCode], function (r) {
					let classNames = r['__Class-'+currentClassCode]||''
					document.getElementById('invited-list').value = classNames.replace(/\n\s+/g,'\n')
					document.getElementById('class-delete').style.visibility = 'visible'
					if(classNames === ''){
						document.getElementById('attendance-div').classList.add('empty')
						document.getElementById('invited-list').setAttribute('placeholder',"Enter the names of the expected attendees for your Meet here.\n\nMy recommendation is to click the `Class List` drop down and choose `Add`.  Next, enter the name of your class and then click the folder icon to read the names from a text file.  Hopefully, once you've added your classes, you will not have to do it again.\n\nAnother option is to copy & paste the names from another source. You can also just type the names.\n\nIf all else fails, leave this field empty and start your Meet... the attendees' names will be added automatically.\n\nIn my experience, the names should be entered `<first> <last>` - e.g.,\nAl Caughey\n(Upper, lower or mixed case does not matter)")
					}
					else{
						document.getElementById('attendance-div').classList.remove('empty')
					}
					document.getElementById('save-attendance-file').style.visibility = 'hidden'
					old_np = 0
					if(currentClassCode === 'Class-List') document.getElementById('class-delete').style.visibility = 'hidden'
				})
			})
		}
	}
	// called when add is selected from the drop-down
	function addClassInfo(){
		document.getElementById('select-class').style.display = 'none'
		document.getElementById('class-name').style.display = 'inline-block'
		document.getElementById('class-name').value = ''
		document.getElementById('class-name').classList.add('add-class')
		document.getElementById('invited-list').value = ''
		document.getElementById('class-delete').style.visibility = 'hidden'
		document.getElementById('read-file-label').style.visibility = 'hidden'
		document.getElementById('class-name').select()
	}
	// called when reset is selected from the drop-down
	function resetClassInfo(){
		if(!confirm('Are you sure you want to delete *all* of your class info?  There is no undo!')){
			chrome.storage.sync.get(['Current-Class-Code'], function(r){
				document.getElementById('select-class').value = r['Current-Class-Code']
			})
			return
		}
		chrome.storage.sync.set({'Current-Class-Code':'Class-List'}, callBackSet )
		chrome.storage.sync.set({'__Class-Info':''}, callBackSet )
		document.getElementById('select-class').innerHTML = ''
		setClassList('select-class')

		chrome.storage.sync.get(['Current-Class-Code'], function (r) {
			document.getElementById('select-class').value = r['Current-Class-Code'].replace(/ /g,'-')
			document.getElementById('invited-list').value = ''
			document.getElementById('class-delete').style.visibility = 'hidden'
			document.getElementById('attendance-div').classList.add('empty')
			for (var key in localStorage){
				if(key.indexOf('__Class') === 0){
				   chrome.storage.sync.remove(key);
				}
			}
		})
	}
	// load the names associated with a class from the LS variables
	function loadClassNames(){
		chrome.storage.sync.get(['Current-Class-Code'], function (r) {
			let currentClassCode = r['Current-Class-Code']
			//console.log('Current-Class-Code',currentClassCode)
			let cc = '__Class-'+currentClassCode
			chrome.storage.sync.get( [cc], function (r) {
				let classNames = r[cc]||''

				document.getElementById('invited-list').value = classNames.replace(/\n\s+/g,'\n')
				chrome.storage.sync.get(['__Class-Info'], function (r) {
					let cls = r['__Class-Info']

					let classInfo = (cls === '')?{'Class-List':'Class List'}:JSON.parse(cls)||{}
					let className = (!classInfo||!classInfo[currentClassCode])?'Class List':classInfo[currentClassCode]
					document.getElementById('class-name').value = className
					if(classNames === ''){
						document.getElementById('attendance-div').classList.add('empty')
						document.getElementById('invited-list').setAttribute('placeholder',"Enter the names of the expected attendees for your Meet here.\n\nMy recommendation is to click the `Class List` drop down and choose `Add`.  Next, enter the name of your class and then click the folder icon to read the names from a text file.  Hopefully, once you've added your classes, you will not have to do it again.\n\nAnother option is to copy & paste the names from another source. You can also just type the names.\n\nIf all else fails, leave this field empty and start your Meet... the attendees' names will be added automatically.\n\nIn my experience, the names should be entered `<first> <last>` - e.g.,\nAl Caughey\n(Upper, lower or mixed case does not matter)")
					}
					else{
						document.getElementById('attendance-div').classList.remove('empty')
					}
					document.getElementById('select-class').value = className.replace(/ /g,'-')
				})
			})
		})
	}
	// update the LocalStorage variable when the list has changed
	function listChanged(){
		if (!document.getElementById('invited-list')) return

		chrome.storage.sync.get(['Current-Class-Code'], function (r) {
			let currentClassCode = r['Current-Class-Code']
			let il = document.getElementById('invited-list'), ad = document.getElementById('attendance-div'), st = document.getElementById('save-attendance-file')
			let ct = il.value.trim().replace(duplicatedLines, "$1").replace(/\n\s+/g,'\n')
			if(ct === ''){
				ad.classList.add('empty')
				st.style.visibility = 'hidden'
				il.title = 'Pick a class or enter some names'
			}
			else{
				il.value = ct
				ad.classList.remove('empty')
				st.style.visibility = 'visible'
				let marked_present = (!!ct.match(/[✔\?]/g))?ct.match(/[✔\?]/g).length:0
				let total_invited = (!!ct.replace(/\n\n/gm,'\n').match(/[\n]/g))?ct.replace(/\n\n/gm,'\n').match(/[\n]/g).length:0
				il.title = "Present "+marked_present+' of ' +(total_invited+1)+ ' participants'
				if(document.getElementById('show-attendance-div')) document.getElementById('show-attendance-div').title = "Present "+marked_present+' of ' +(total_invited+1)+ ' participants'
			}
			let ccc={}
			ccc['__Class-'+currentClassCode]=ct
			chrome.storage.sync.set(ccc, callBackSet )
			old_np = 0
		})
	}

	// remove all preceding ✔|? from the list of names in the textarea
	function clearPresent(){
		hideUpdateText()
		chrome.storage.sync.get(['Current-Class-Code'], function (r) {
			let currentClassCode = r['Current-Class-Code']
			let invitees = document.getElementById("invited-list");
			let ct = invitees.value.replace(/( )*[✔\?]\s*/g,'').replace(/\t/g,'')
			invitees.value = ct
			let ccc={}
			ccc['__Class-'+currentClassCode]=ct
			chrome.storage.sync.set(ccc, callBackSet )
			old_np = 0
		})
	}

	// stop propagation of clicks in attendance-div-header
	function stopProp(e){
		e = e || window.event;
		e.stopPropagation()
	}

	// reset the meeting start time
	function setStartTime(){
		let now = new Date(), meetingStart = now.getHours()+':'+twod(now.getMinutes())
		sessionStorage.setItem('Meeting-start-time', meetingStart)
		document.getElementById('start-time').title = 'Current start time is: '+meetingStart
		if(!!document.getElementsByClassName('current-start-time')[0]) document.getElementsByClassName('current-start-time')[0].innerText = meetingStart
	}

	// clear the textarea
	function clearList(){
		hideUpdateText()
		chrome.storage.sync.get(['Current-Class-Code'], function (r) {
			let currentClassCode = r['Current-Class-Code']
			document.getElementById("invited-list").value = '';
			let ccc={}
			ccc['__Class-'+currentClassCode]=''
			chrome.storage.sync.set(ccc, callBackSet )
			document.getElementById("attendance-div").classList.add('empty')
			old_np = 0
			document.getElementById('save-attendance-file').style.visibility = 'hidden'
			old_np = 0
			_arrivalTimes = {} // clear the time of arrival array
		})
  	}

	let _arrivalTimes = {} // array to store initial arrival time of each attendee
	let monitoring

	// update the attendance status of the invitees
	function startStopMonitor(){
		let checked = document.getElementById("monitor-attendance").checked
		//console.log('startStopMonitor',checked)
		if (checked){
			monitorWhosThere()
			monitoring = setInterval(monitorWhosThere, 60000)
			chrome.storage.sync.set({'monitor-attendance':true}, callBackSet )
		}
		else{
			window.clearInterval(monitoring)
			chrome.storage.sync.set({'monitor-attendance':false}, callBackSet )
		}
	}
	function monitorWhosThere(){
		//console.log('monitorWhosThere')
		let participants = document.querySelectorAll('[data-requested-participant-id]')
		for (let aa of participants){
			// parse the innerHTML; remove tagged content, duplicated lines, etc.
			let pn = aa.innerHTML.replace(/<[^>]*?>/ig,'\n')
			.replace(re_replace,'')
			.replace(/\n\s*\n*/gm,'\n')
			.replace(/\(.*\)/ig,'')
			.replace(duplicatedLines, "$1")
			.trim()
			//console.log(pn, aa)
			// no text --> get the next line
			if(pn === '')	continue

			// set their initial arrival time
			if(!_arrivalTimes[pn]){
				let now = new Date(), ctime = now.getHours()+':'+twod(now.getMinutes())
				_arrivalTimes[pn] = {'arrived':ctime,'stayed':1}
			}
			_arrivalTimes[pn].stayed++
			//console.log('monitorWhosThere',pn,_arrivalTimes[pn].stayed)
		}
	}
	function checkParticipants(isManual){
		let participants = document.querySelectorAll('[data-requested-participant-id],[data-participant-id]')
		// to-do might want to look at [role = "presentation"] && [data-sender-name] too
		if(!participants) return
		//console.log('checkParticipants', isManual)
		// look for a change in the number of participants
		let np = participants.length
		if (!isManual && old_np === np) {
			return
		}
		old_np = np

		let now = new Date(), ctime = now.getHours()+':'+twod(now.getMinutes())

		var tta = document.getElementById('invited-list')
		let tal = tta.value
		let tallc = tal.toLowerCase()
		let changed = false
		for (let aa of participants){
			// parse the innerHTML; remove tagged content, duplicated lines, etc.
			let pn = aa.innerHTML.replace(/<[^>]*?>/ig,'\n')
			.replace(re_replace,'')
			.replace(/\n\s*\n*/gm,'\n')
			.replace(/\(.*\)/ig,'')
			.replace(duplicatedLines, "$1")
			.trim()

			// no text --> get the next line
			if(pn === '')	continue

			// set their initial arrival time
			if(!_arrivalTimes[pn]) _arrivalTimes[pn] = {'arrived':ctime,'stayed':0}

			// update the field
			let lc = pn.toLowerCase()
			if( lc.indexOf(uiStrings.presenting) >= 0 || lc.indexOf(uiStrings.presentation) >= 0) continue

			if(tallc.indexOf(lc) === -1){
				//console.log(pn + ' joined (unexpectedly)', aa)
				tal += '\n? '+pn
				changed = true
			}
			else if(tallc.indexOf('? '+ lc) >= 0){
				continue // already uninvited
			}
			else if(tallc.indexOf('✔ '+ lc) >= 0){
				continue // already marked present
			}
			 else if(tallc.indexOf('✔ '+ lc) === -1){
				const pattern = new RegExp(pn, 'i')
				//console.log(pn + ' joined (as expected) at' + _arrivalTimes[pn].arrived)
				tal = tal.replace(pattern,'✔ '+pn)
				changed = true
			}
			else{
				//console.log('WTF - ' + pn)
			}
		}
		// if the list changed, a littlehousekeeping and save the changes
		if (changed) {
			tta.value = tal.trim().replace(/✔\s*✔\s*/g,'✔ ').replace(duplicatedLines, "$1")
			listChanged()
		}
	}

	// Add the show/hide button for the attendance field once the meeting has started
	function insertAttendanceSwitch(){
		let ln = document.querySelectorAll('[data-show-automatic-dialog]').length
		let btn = document.createElement('span');
		btn.textContent = '✔';
		btn.id = 'show-attendance-div'
		btn.title = 'Show/hide the Attendance field'
		document.querySelectorAll('[data-show-automatic-dialog]')[ln-1].parentElement.parentElement.appendChild(btn)
		document.getElementById("show-attendance-div").addEventListener("click", showAttendance, false);
		document.getElementById("show-attendance-div").classList.add('showing')
	}

	// show/hide button for the attendance field when the show-attendance-div button is clicked
	function showAttendance( e ){
		let vis = document.getElementById("attendance-div").style.display
		document.getElementById("update-text").style.display='none'
		document.getElementById('help-buttons').style.display='none'
		document.getElementById("invited-list").style.display='block'
		document.getElementById("attendance-div").classList.add('in-meeting')			

		if(vis === 'none'){
			document.getElementById("attendance-div").style.display = 'initial'
			document.getElementById("show-attendance-div").classList.add('showing')
		}
		else{
			document.getElementById("attendance-div").style.display = 'none'
			document.getElementById("show-attendance-div").classList.remove('showing')
		}
		e = e || window.event;
		e.preventDefault();
		e.stopPropagation()
	}
	
	// add a child element to the parent element
	function addElement(p, e, i, ti, cl){
		let de = document.createElement(e)
		de.id = i
		if(!!ti) de.title = ti
		if(!!cl) de.classList.add(cl)
		if(e === 'img') de.src = chrome.runtime.getURL("images/"+i+".png");
		p.appendChild(de)
	}
	function check4Changes(){
		chrome.storage.sync.get(['__GMA_status'], function(r) {
			let status=r['__GMA_status']

			if (status==='install'){
				showInstall()
			}
			else if(status==='update'){
				showUpdate()
			}
			else if(status==='up-to-date'){
				//console.log(status, document.getElementById("attendance-div-footer"))
				document.getElementById("attendance-div-footer").title='Your extension is up-to-date'
			}
			else{
				//console.log("huh?!? status = "+status)
			}
			chrome.storage.sync.set({'__GMA_status':'up-to-date'}, callBackSet)
		})
	}
	function wait4Meet2End(){
		// wait until the meeting is done
		waitForElement('[data-call-ended = "true"]',function(){
			let a_div = document.getElementById("attendance-div")
			a_div.style = ''
			a_div.classList.remove('in-meeting')
			a_div.classList.add('meeting-over')
			//document.getElementById('check-attendance').style.isibility = 'hidden'
			document.getElementById('monitor-attendance').style.visibility = 'hidden'
			window.clearInterval(monitoring)
		});
	}
	function wait4Meet2Start(){
		// wait until the meeting has started
		waitForElement("[data-allocation-index]",function(){
			//document.getElementById('check-attendance').style.visibility = 'visible'
			document.getElementById('start-time').style.visibility = 'visible'
			document.getElementById('monitor-attendance').style.visibility = 'visible'
			if(!sessionStorage.getItem('Meeting-start-time') || sessionStorage.getItem('Meeting-start-time') === ''){
				setStartTime()
			}
			
			
			chrome.storage.sync.get(['monitor-attendance'], function(r){
				if(!r['monitor-attendance']) return
				document.getElementById("monitor-attendance").checked=true
				startStopMonitor()
			})
			
			insertAttendanceSwitch()

			let ct = document.getElementById('invited-list').value.trim()
			if(ct !== ''){
				document.getElementById("attendance-div").classList.remove('empty')
			}
			checkParticipants()  // Check as soon as you join the Meet


			// Create an observer instance to look for changes within the Meet page (detect new participants)
			var observer = new MutationObserver(function( mutations ) {

				checkParticipants()  // Check when ever there is an update to the screen

			});
			// watch for changes (adding new participants to the Meet)
			observer.observe(document.body, {childList:true, attributes:false, subtree:true, characterData:false});
			
			showMeetingStarted()
			
			wait4Meet2End()
			
		})
	}
	
	function createAttendanceFields(){
		// setup - the attendance div and `buttons`
		let atd = document.createElement('div')
		atd.id = 'attendance-div'
		atd.classList.add('empty')
		document.body.appendChild(atd)

		const atp = document.createElement('p')
		atp.id = 'attendance-div-header'
		addElement(atp,'select','select-class','Pick a class; use Add only use if LocalStorage variables are permitted')
		addElement(atp,'input','class-name','Enter the class name')
		addElement(atp,'label','read-file-label','Load a previously saved file','gma-btn')
		addElement(atp,'input','read-file','','')
		addElement(atp,'img','class-delete','Delete this class','gma-btn' )
		addElement(atp,'img','clear-attendance-marks','Clear attendance checks','gma-btn')
		addElement(atp,'img','clear-attendance-field','Clear the class list field','gma-btn')
		//addElement(atp,'img','check-attendance','Manually trigger an attendance check','gma-btn')
		addElement(atp,'img','start-time','Manually reset the class start time','gma-btn')
		addElement(atp,'input','monitor-attendance','Monitor who is present on the call','')
		addElement(atp,'img','save-attendance-file','Save Attendance as CSV file','gma-btn')
		addElement(atp,'input','class-code','','')
		document.getElementById('attendance-div').appendChild(atp)

		document.getElementById('class-name').type = 'text'
		document.getElementById('read-file-label').style.backgroundImage = "url('"+chrome.runtime.getURL("images/read-file.png")+"')";
		document.getElementById("read-file-label").htmlFor = "read-file";
		document.getElementById('read-file').type = 'hidden'
		document.getElementById('class-code').type = 'hidden'
		document.getElementById('read-file').type = 'file'
		document.getElementById('monitor-attendance').type = 'checkbox'

		addElement(atd,'textarea','invited-list','Pick, paste or type your class list into this field','')
		addElement(atd,'p','help-buttons','','')
		let hbp = document.getElementById('help-buttons')
		addElement(hbp,'span','help-buttons-span','','' )
		let hbsp = document.getElementById('help-buttons-span')
		addElement(hbsp,'img','prev-page','Go to previous help page','gma-btn' )
		addElement(hbsp,'img','close-help','Close this help page','gma-btn' )
		addElement(hbsp,'img','next-page','Go to next help page','gma-btn' )
		document.getElementById('attendance-div').appendChild(hbp)
		addElement(atd,'div','update-text','','')
		document.getElementById('close-help').addEventListener('click', hideUpdateText, false)
		document.getElementById('prev-page').addEventListener('click', showPrevHelp, false)
		document.getElementById('next-page').addEventListener('click', showNextHelp, false)

		const ftp = document.createElement('p')
		ftp.id = 'attendance-div-footer'
		addElement(ftp,'span','gma-version','','' )
		addElement(ftp,'img','gma-help','Help?!?','gma-btn' )
		document.getElementById('attendance-div').appendChild(ftp)

		//document.getElementById('check-attendance').style.visibility = 'hidden'
		document.getElementById('class-delete').style.visibility = 'hidden'
		document.getElementById('start-time').style.visibility = 'hidden'
		document.getElementById('save-attendance-file').style.visibility = 'hidden'
		document.getElementById('monitor-attendance').style.visibility = 'hidden'
		document.getElementById('gma-version').innerText = 'Google Meet Attendance - v'+chrome.runtime.getManifest().version

		// set the behaviours
		document.getElementById('select-class').addEventListener('change', changeClass, false)				// a change in the drop down field
		document.getElementById('read-file').addEventListener("change", readFile, false)					// save the class list field to a textfile
		document.getElementById('clear-attendance-marks').addEventListener('click', clearPresent, false)	// clear all of the attendance markings
		document.getElementById('clear-attendance-field').addEventListener('click', clearList, false)		// clear the class list field
		/*document.getElementById('check-attendance').addEventListener('click', function(){
			checkParticipants(true);
		} , false)		// manually fire the function to check attendance*/
		document.getElementById('class-delete').addEventListener('click', deleteClass, false)				// delete a named class
		document.getElementById('start-time').addEventListener('click', setStartTime, false)					// manually reset the class start time
		document.getElementById('save-attendance-file').addEventListener('click', saveCSVFile, false)		// save the class list field to a textfile
		//document.getElementById('class-name').addEventListener('change', addClass, false)					// save the new named class
		document.getElementById('class-name').addEventListener('blur', addClass, false)				     	// save the new named class
		document.getElementById('invited-list').addEventListener('change', listChanged, false);				// if the user edits the field
		document.getElementById('monitor-attendance').addEventListener('change', startStopMonitor, false);				// if the user edits the field
		document.getElementById('gma-help').addEventListener('click', showInstall, false)					// open help
		document.getElementById('gma-version').addEventListener('click', showUpdate, false)					// manually reset the class start time

		document.getElementById('select-class').onmousedown = stopProp;
		document.getElementById('read-file-label').onmousedown = stopProp;
		document.getElementById('clear-attendance-marks').onmousedown = stopProp;
		document.getElementById('clear-attendance-field').onmousedown = stopProp;
		//document.getElementById('check-attendance').onmousedown = stopProp;
		document.getElementById('class-delete').onmousedown = stopProp;
		document.getElementById('start-time').onmousedown = stopProp;
		document.getElementById('save-attendance-file').onmousedown = stopProp;
		document.getElementById('monitor-attendance').onmousedown = stopProp;

		dragElement(document.getElementById("attendance-div"));

		loadClassNames()
		if (!!sessionStorage.getItem('Meeting-start-time')){
			document.getElementById('start-time').style.visibility = 'visible'
			document.getElementById('start-time').title = 'Current start time is: '+sessionStorage.getItem('Meeting-start-time')
		}
	
	}
	// warn about unsave changes
	window.addEventListener("beforeunload", function (e) {
		if(!document.getElementById("save-attendance-file") || document.getElementById("save-attendance-file").style.visibility === 'hidden') return undefined
		let alrt = 'It looks like you have unsaved Attendance changes!'
								+ 'If you leave before clicking `[txt]`, your attendance may be lost.';
		(e || window.event).returnValue = alrt;
		return alrt;
	});

	//wait until there is a video DOM element (so that meet code has been selected)
	waitForElement("video",function(){
		
		createAttendanceFields()
		setClassList('select-class')

		chrome.storage.sync.get(['Current-Class-Code'], function (result) {
			let ccc=result['Current-Class-Code']||'Class-List'
			//console.log( 'ccc', ccc )
			document.getElementById('select-class').value = ccc.replace(/ /g,'-')
		})

		loadClassNames()
		
		//Has the extension been updated?
		check4Changes()

		//now wait until they've entered the Meet
		wait4Meet2Start()

	})
	

})()
