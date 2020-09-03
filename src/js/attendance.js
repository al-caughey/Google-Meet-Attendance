// @author       Al Caughey
// @include      https://meet.google.com/*
// @license      https://github.com/al-caughey/Google-Meet-Attendance/blob/master/LICENSE.md
// @run-at       document-idle
// 				 Please send feedback to allan.caughey@ocdsb.ca

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
// v0.6.0 - persisted attendance; fixed double counting in _arrivalTimes; HTML report;
// v0.6.1 - added # of participants
// v0.6.2 - reverted checking in checkparticipants; added a dropdown under the date in the HTML reports (so that you can quickly navigate to past attendance checks)
// v0.6.3 - added hover text to html template for name; widened name column; added chinese localization; added timeout to update dialog; fixed startup race condition (if you clicked join before the attendance fields were showing); fixed bug if HTML reports were generated before the meeting was ended
// v0.6.4 - minor CSS change to fix CSS error caused by another attendance extension
// v0.6.5 - added Settings tab; added charset to HTML report template

// *** for the list of changes in v0.7+, see updateSummary in updates.js

;(function() {	
	// Show storage contents
	/*chrome.storage.sync.get( null, function(r) {
		for (var key in r){
			console.log( key, r[key] )
		}
	})*/
	
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

	// globals
	let updateDialogTimeout=null
	let ddStrings = getDropDownStrings()
	let _activeMeetID
	
	// simple function that waits until a specific element exists in the DOM...
	// (adapted from Stack Overflow)
	function waitForElement(elementPath, callBack){
		//console.log("Waiting for: " + elementPath)
		
		let waitfor=elementPath==='[data-call-ended = "true"]'?10000:1000
		//let maxWait=waitfor==1000?10:null
		
		window.setTimeout(function(){
			//console.log('numChecks: '+numChecks)
			let itExists = document.querySelector(elementPath)
			//if( numChecks < maxWait && (!itExists || itExists.length === 0)) {
			if( !itExists || itExists.length === 0 ) {
				//numChecks++
				waitForElement(elementPath, callBack);
			}
			else{
				//numChecks=null
				callBack(elementPath, itExists);
			}
		},waitfor)
	}
	// build the select/options for the list of classes
	function setClassList( p ){
		function addOption( pe, t, v, tt ){
			let o = document.createElement('option')
			o.innerText = t
			o.value = v.replace(/ /g,'-')
			if ( v === '' ) o.disabled = 'disabled'
			if ( !!tt ) o.title = tt
			pe.appendChild( o )
		}
		//console.log('setClassList')
		
		let mpe = document.getElementById(p)
		addOption(mpe, ddStrings.classList, 'Class-List', 'A generic class list')
		let mog = document.createElement('optgroup')
		mog.setAttribute("label", ddStrings.myClasses)
		mog.setAttribute("id", 'named-classes')
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
			
			addOption(og, ddStrings.add,'+', 'Add a named class')
			addOption(og, ddStrings.reset,'-', 'Remove all of your named classes')
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
				document.getElementById('gma-attendance-fields').classList.remove('empty')
				let ccn={}
				ccn['__Class-'+currentClassCode]=fc
				chrome.storage.sync.set(ccn, callBackSet )
				
				checkNumStudents()

			})
		};
		write2log('Read class list from  ' + fn )
		reader.readAsText(fn);
		document.getElementById('read-file').value = '' // so that it changes next click
	}

	// save the class info to the CSV file
	function saveCSVFile(){

		let today = new Date(), d = today.getDate(),m = today.getMonth()+1,y = today.getFullYear()
		let cdate = y+'-'+twod(m)+'-'+twod(d)
		let cdd = document.getElementById("select-class"), cn = cdd.options[cdd.selectedIndex].text;
		let fileName=cn + ' ('+cdate+').csv'
		
		// prepend file outputs with UTF-8 BOM
		let header = '\ufeff'+'Attendance for: '+cn+' on '+cdate+'\n\n'+'Names'+'\t'+cdate+' '+sessionStorage.getItem('Meeting-start-time')+'\t'+'Arrival time'+'\n'
		let joined = /^\s*([✔\?])(\s*)(.*)$/gm
		let txt = document.getElementById('invited-list').value.replace(joined, "$3"+'\t'+"$1")
		for (let pid in _arrivalTimes){
			let re_name = new RegExp('('+_arrivalTimes[pid].name+'.*)', 'i')
			txt = txt.replace(re_name, '$1'+'\t'+_arrivalTimes[pid].arrived +' ('+_arrivalTimes[pid].stayed+'min) ['+_arrivalTimes[pid].last_seen+']')
		}
		let blob = new Blob([header+txt], {type: 'text/plain;charset=UTF-8'})
		
		let temp_a = document.createElement("a")
		temp_a.download = fileName
		temp_a.href = window.webkitURL.createObjectURL(blob)
		temp_a.click()
		
		write2log('Saved CSV file ' +  cn + ' ('+cdate+').csv' )

		document.getElementById('save-csv-file').style.visibility = 'hidden'
		
		//need to have messaging for the downloads api
		/*chrome.downloads.download({
			url: window.URL.createObjectURL(blob),
			filename: fileName,
			saveAs: true
		})*/
	}
	
	// show the read file icon
	function showReadFile(){
		let isVis=document.getElementById('read-file-label').style.visibility
		if( isVis === 'visible' ) return
		document.getElementById('read-file-label').style.visibility='visible'
	}
	// tidy up if the user chooses not to add a class
	function doNotAddClass(){
		//console.log('doNotAddClass',ddStrings.not_added)
		document.getElementById('add-class-message').innerText=ddStrings.not_added
		document.getElementById('class-delete').style.visibility = 'visible'
		document.getElementById('gma-attendance-fields').classList.add('empty')
		document.getElementById('select-class').style.display = 'inline-block'
		document.getElementById('read-file-label').style.visibility = 'visible'
		document.getElementById('class-name').style.display = 'none'
		document.getElementById('add-class').style.display = 'none'
		document.getElementById('cancel-add').style.display = 'none'
		chrome.storage.sync.get(['Current-Class-Code'], function (r) {
			let currentClassCode = r['Current-Class-Code']
			document.getElementById('select-class').value=currentClassCode
			changeClass()
		})
		autoHideAddClassMessage()
	}
	// add a new class to the drop down list
	function addClass(){
		let cn = document.getElementById('class-name').value.trim()
		let cc = cn.replace(/ /g,'-')
		if(cc==''){
			doNotAddClass()
			return
		}
		let hdr = document.getElementById("named-classes")
		let no = document.createElement("option");
		no.text = cn;
		no.value = cc;
		hdr.appendChild(no)
		document.getElementById('select-class').value = cc;
		chrome.storage.sync.set({'Current-Class-Code': cc}, callBackSet )
		sessionStorage.setItem('_Class4ThisMeet', cc)
		chrome.storage.sync.get(['__Class-Info'], function (r) {
			let cls = r['__Class-Info']
			let classInfo = (!cls||cls === '')?{'Class-List':'Class List'}:JSON.parse(cls)||{}
			classInfo[cc] = cn
			chrome.storage.sync.set({'__Class-Info':JSON.stringify(classInfo)}, callBackSet )
			document.getElementById('class-name').classList.remove('add-class')
			document.getElementById('class-delete').style.visibility = 'visible'
			document.getElementById('gma-attendance-fields').classList.add('empty')
			document.getElementById('select-class').style.display = 'inline-block'
			document.getElementById('read-file-label').style.visibility = 'visible'
			document.getElementById('class-name').style.display = 'none'
			document.getElementById('add-class').style.display = 'none'
			document.getElementById('cancel-add').style.display = 'none'
			document.getElementById('add-class-message').innerText=ddStrings.added
			autoHideAddClassMessage()
			write2log('Added class: ' +  cn )

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
			sessionStorage.setItem('_Class4ThisMeet', 'Class-List')
			chrome.storage.sync.remove('__Class-'+cc)
			let csl = document.getElementById("select-class");
			csl.remove(csl.selectedIndex);
			cn.value = 'Class List'
			document.getElementById('select-class').value = 'Class-List'
			document.getElementById('invited-list').value = ''
			document.getElementById('class-delete').style.visibility = 'hidden'

			write2log('Deleted class: ' +  cn )
			changeClass()
		})
	}
	// pick new class from drop-down
	function changeClass(){
		hideUpdateText()
		if( document.getElementById("gma-attendance-fields").classList.contains('meeting-over') && ( document.getElementById('save-csv-file').style.visibility==="visible" ||  document.getElementById('save-html-file').style.visibility==="visible" ) ){
			document.getElementById("gma-attendance-fields").classList.remove('meeting-over')
			if( !confirm( 'There may be unsaved information for the current class.  Changing to a new class will result in the loss that info. \n\nAre you sure you want to change?  There is no undo!' )){
				chrome.storage.sync.get(['Current-Class-Code'], function (r) {
					document.getElementById('select-class').value=r['Current-Class-Code']
				})
				return
			}
		}
		
		let currentClassCode = document.getElementById('select-class').value
		document.getElementById('class-notes').value=''
		sessionStorage.setItem( 'class-notes', '' )
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
				write2log('Changed class to: ' +  currentClassName )

				chrome.storage.sync.set({'Current-Class-Code':currentClassCode}, callBackSet )
				sessionStorage.setItem('_Class4ThisMeet', currentClassCode)
				chrome.storage.sync.get(['__Class-'+currentClassCode], function (r) {
					let classNames = r['__Class-'+currentClassCode]||''
					document.getElementById('invited-list').value = classNames.replace(/\n\s+/g,'\n')
					document.getElementById('class-delete').style.visibility = 'visible'
					_arrivalTimes = {} // clear the time of arrival array
					sessionStorage.removeItem('Meeting-start-time')
					if(classNames === ''){
						document.getElementById('gma-attendance-fields').classList.add('empty')
					}
					else{
						document.getElementById('gma-attendance-fields').classList.remove('empty')
						updateAttendanceSummary()
						checkClearAttendance()
					}
					document.getElementById('save-csv-file').style.visibility = 'hidden'
					document.getElementById('save-html-file').style.visibility = 'hidden'
					if(currentClassCode === 'Class-List') document.getElementById('class-delete').style.visibility = 'hidden'
					
					if (document.getElementById('gma-attendance-fields').classList.contains('in-meeting')) {
						setStartTime()
					}
				})
			})
		}
	}
	// called when add is selected from the drop-down
	function addClassInfo(){
		document.getElementById('class-name').addEventListener('keyup', showReadFile, {once:true} )				     	// save the new named class
		//console.log('addClassInfo', ddStrings.adding)
		
		document.getElementById('gma-class-list-header').style.display='none'
		document.getElementById('invited-list').style.display='none'
		document.getElementById('gma-add-class').style.display='block'
		document.getElementById('add-class-message').style.display='block'
		document.getElementById('add-class-message').innerText=ddStrings.adding
		document.getElementById('select-class').style.display = 'none'
		document.getElementById('class-name').style.display = 'inline-block'
		document.getElementById('add-class').style.display = 'inline-block'
		document.getElementById('cancel-add').style.display = 'inline-block'
		document.getElementById('class-name').value = ''
		document.getElementById('class-name').classList.add('add-class')
		document.getElementById('invited-list').value = ''
		document.getElementById('class-delete').style.visibility = 'hidden'
		document.getElementById('read-file-label').style.visibility = 'hidden'
		document.getElementById('class-name').select()
	}
	// called when reset is selected from the drop-down
	function resetClassInfo(){
		if(!confirm( 'Are you sure you want to delete *all* of your class info?  There is no undo!' )){
			document.getElementById('select-class').value = sessionStorage.getItem('_Class4ThisMeet')
			return
		}
		write2log( 'Reset' )
		chrome.storage.sync.set({'Current-Class-Code':'Class-List'}, callBackSet )
		chrome.storage.sync.set({'__Class-Info':''}, callBackSet )
		sessionStorage.setItem('_Class4ThisMeet', 'Class-List')
		document.getElementById('select-class').innerHTML = ''
		setClassList('select-class')

		document.getElementById('invited-list').value = ''
		document.getElementById('class-delete').style.visibility = 'hidden'
		document.getElementById('gma-attendance-fields').classList.add('empty')
		chrome.storage.sync.get( null, function(r) {
			for (var key in r){
				if(key.indexOf('__Class') === 0){
				   chrome.storage.sync.remove(key);
				}
			}
		   chrome.storage.sync.remove('saved-attendance');
		})
	}
	
	function checkClearAttendance(){
		//console.log('checkClearAttendance()')
		if(document.getElementById('invited-list').value.indexOf('✔')===-1 && document.getElementById('invited-list').value.indexOf('?')===-1)	return 
		if(!sessionStorage.getItem('Meeting-start-time')) {
				chrome.storage.sync.get(['auto-clear-checks'], function(r){
					if (r['auto-clear-checks']){
						clearPresent()
					}
					else{
						if(confirm( 'Do you want to clear the attendance checks (`✔`) from your previous meet? (Recommended Yes)' )) clearPresent()
					}
				})
		}
	}
	
	// load the names associated with a class
	function loadClassNames(){
		chrome.storage.sync.get(['Current-Class-Code'], function (r) {
			let currentClassCode = sessionStorage.getItem('_Class4ThisMeet')||r['Current-Class-Code']
			//console.log('Current-Class-Code',currentClassCode)
			let cc = '__Class-'+currentClassCode
			chrome.storage.sync.get( [cc], function (r) {
				let classNames = r[cc]||''

				document.getElementById('invited-list').value = classNames.replace(/\n\s+/g,'\n')
				chrome.storage.sync.get(['__Class-Info'], function (r) {
					let cls = r['__Class-Info']

					let classInfo = (cls === '')?{'Class-List':'Class List'}:JSON.parse(cls)||{}
					let className = (!classInfo||!classInfo[currentClassCode])?'Class List':classInfo[currentClassCode]
					write2log( 'Loaded names for ' + className )

					document.getElementById('class-name').value = className
					if(classNames === ''){
						document.getElementById('gma-attendance-fields').classList.add('empty')
					}
					else{
						document.getElementById('gma-attendance-fields').classList.remove('empty')
						updateAttendanceSummary()
						checkClearAttendance()
					}
					document.getElementById('select-class').value = className.replace(/ /g,'-')
				})
			})
		})
	}
	// class notes have changed
	function notesChanged(){
		let st = document.getElementById('save-csv-file'), ht = document.getElementById('save-html-file')
		document.getElementById('class-notes').value=document.getElementById('class-notes').value.trim()
		sessionStorage.setItem( 'class-notes', document.getElementById('class-notes').value )
		st.style.visibility = 'visible'
		ht.style.visibility = 'visible'
	}

	// remove all preceding ✔|? from the list of names in the textarea
	function clearPresent(){
		hideUpdateText()
		let currentClassCode = sessionStorage.getItem('_Class4ThisMeet')
		let invitees = document.getElementById("invited-list");
		let ct = invitees.value.replace(/( )*[✔\?]\s*/g,'').replace(/\t/g,'')
		invitees.value = ct
		let ccc={}
		ccc['__Class-'+currentClassCode]=ct
		chrome.storage.sync.set(ccc, callBackSet )
		updateAttendanceSummary()
		write2log( 'Cleared present checks ' + currentClassCode )
	}

	// clear the textarea
	function clearList(){
		hideUpdateText()
		if(!confirm( 'Are you sure you want to delete *all* the names in this class?  There is no undo!' )){
			return
		}
		let currentClassCode = sessionStorage.getItem('_Class4ThisMeet')
		document.getElementById("invited-list").value = '';
		let ccc={}
		ccc['__Class-'+currentClassCode]=''
		chrome.storage.sync.set(ccc, callBackSet )
		document.getElementById("gma-attendance-fields").classList.add('empty')
		document.getElementById('save-csv-file').style.visibility = 'hidden'
		document.getElementById('save-html-file').style.visibility = 'hidden'
		_arrivalTimes = {} // clear the time of arrival array
 		write2log( 'Clear all names for ' + currentClassCode )
 	}

	let old_lop=''
	function checkParticipants(){

		let now = new Date(), ctime = now.getHours()+':'+twod(now.getMinutes())

		let tal = document.getElementById('invited-list').value
		let tallc = tal.toLowerCase().replace(/✔[ ]{2,}/g,'✔ ').replace(/\?[ ]{2,}/g,'\? ').replace(/^[\t ]*|[\t ]*$/gm,'').replace(/\t/gm,' ').split('\n')
		let changed = false

		let lop=getListOfParticipants()
		//if ( old_lop === lop ) return
		for (let pid of lop){
			let name=_arrivalTimes[pid].name
			let lc=name.toLowerCase()

			let fan=tallc.filter(element => element.includes(lc))
			console.log(fan.length)
			if (fan.length>1){
				let asf=name + ' has ' + fan.length + 'matches!'
				//write2log('checkParticipants - ' + name + ' has ' + fan.length + ' matches')
				//console.log(asf)
				//document.getElementById('add-class-message').innerText=asf
				//document.getElementById('add-class-message').classList.add('bold')
				//autoHideAddClassMessage(5000)
				continue
			}
			else if (fan.length==1){
				let nm=fan[0]
				if(nm.includes('✔ ')){
					continue // already marked present
				}
				else if(nm.includes('? ')){
					continue // already marked uninvited
				}
				else{
					let ap = tallc.indexOf(nm)
					tallc[ap]=( '✔ '+nm	) // mark the student present
					changed = true
					write2log('checkParticipants - ' + name + ' arrived')
				}
			}
			else if (fan.length==0){
				if(document.getElementById('gma-attendance-fields').getAttribute('data-at-max-students')==='true'){
					write2log('checkParticipants - at max students - ' + name + ' not added')
				}	
				else {  // update the field
					tallc.push( '? '+name)
					changed = true
					write2log('checkParticipants - ' + name + ' was added to the class list')
				}
			}
				
		}
			/*
			if(tallc.includes('✔ '+lc)){
				continue // already marked present
			}
			else if(tallc.includes('? '+lc)){
				continue // already marked uninvited
			}
			else if(tallc.includes(lc)){
				let ap = tallc.indexOf(lc);
				tallc[ap]=( '✔ '+name)
				changed = true
				write2log('checkParticipants - ' + name + ' arrived')
			}
			else{
				if(document.getElementById('gma-attendance-fields').getAttribute('data-at-max-students')==='true'){
					write2log('checkParticipants - at max students - ' + name + ' not added')
				}	
				else {  // update the field
					tallc.push( '? '+name)
					changed = true
					write2log('checkParticipants - ' + name + ' was added to the class list')
				}
			}*/
		// if the list changed, a littlehousekeeping and save the changes
		if (changed) {
			write2log('checkParticipants - list changed')
			document.getElementById('invited-list').value = tallc.join('\n')
			listChanged()
			sessionStorage.setItem('_arrivalTimes', JSON.stringify(_arrivalTimes))
			old_lop=lop
		}
	}

	// Add the show/hide button for the attendance field once the meeting has started
	function insertAttendanceSwitch(){
		let ln = document.querySelectorAll('[data-show-automatic-dialog]').length
		let btn = document.createElement('span');
		btn.textContent = '✔';
		btn.id = 'show-gma-attendance-fields'
		btn.title = 'Show/hide the Attendance field'
		document.querySelectorAll('[data-show-automatic-dialog]')[ln-1].parentElement.parentElement.appendChild(btn)
		document.getElementById("show-gma-attendance-fields").addEventListener("click", showAttendance, false);
		document.getElementById("show-gma-attendance-fields").classList.add('showing')
	}

	function check4Changes(){
		chrome.storage.sync.get(['__GMA_status'], function(r) {
			let status=r['__GMA_status']

			if (status==='install'){
				showInstall()

			}
			else if(status==='update'){
			
				showUpdate()

				document.getElementById("gma-attendance-fields").classList.add('updated')
				document.getElementById("gma-version").title="Click to see what's new in this version"
			}
			else if(status==='up-to-date'){
				//console.log(status, document.getElementById("gma-attendance-fields-footer"))
				document.getElementById("gma-version").title='Your extension is up-to-date... click to see changes'
			}
			else{
				//console.log("huh?!? status = "+status)
			}
			write2log( '__GMA_status: '+ status )
			chrome.storage.sync.set({'__GMA_status':'up-to-date'}, callBackSet)
		})
	}
	function wait4Meet2End(){
		// wait until the meeting is done
		waitForElement('[data-call-ended="true"]',function(){
			write2log( '**** Meet ended ****' )
			hideUpdateText()
			let a_div = document.getElementById("gma-attendance-fields")
			a_div.style = ''
			a_div.classList.remove('in-meeting')
			a_div.classList.add('meeting-over')
			document.getElementById('save-csv-file').style.visibility = 'visible'
			document.getElementById('save-html-file').style.visibility = 'visible'
			document.getElementById("gma-attendance-fields").classList.remove('in-meeting')

			window.clearInterval(monitoring)
			let now = new Date(), ctime = now.getHours()+':'+twod(now.getMinutes())
			sessionStorage.setItem( 'Meeting-end-time', ctime )
			chrome.storage.sync.get(['auto-save-html','auto-save-csv'], function(r) {
				let asf='', svn=0, asfh=5000
				if( !!r['auto-save-html'] && gmaEnabled){
					saveHTMLFile()
					svn+=1
				}
				if( !!r['auto-save-csv'] && gmaEnabled){
					saveCSVFile()
					svn+=2
				}
				if(!gmaEnabled){
					asf="Nothing to save... Attendance was disabled!"
				}
				else if (svn==0){
					asf="Don't forget to save your files!"
					asfh=30000
					document.getElementById('save-html-file').classList.add('save-needed')
					document.getElementById('save-csv-file').classList.add('save-needed')
				}
				else if(svn==1){
					asf="Auto-saved your HTML file"
					document.getElementById('save-csv-file').classList.add('save-needed')
				}
				else if(svn==2){
					asf="Auto-saved your CSV file"
					document.getElementById('save-html-file').classList.add('save-needed')
				}
				else if(svn==3){
					asf="Auto-saved your HTML & CSV files"
				}
				document.getElementById('add-class-message').innerText=asf
				document.getElementById('add-class-message').classList.add('bold')
				write2log( 'Auto-save: '+ svn )
				autoHideAddClassMessage(asfh)
			})
		});
	}
	function wait4Meet2Start(){
		// wait until the meeting has started
		
		write2log( 'Waiting for the Meet to start' )
		waitForElement("[data-allocation-index]",function(){
			write2log( '**** Meet started ****' )
			
			if(!gmaEnabled){
				
				document.getElementById('gma-attendance-fields').style.display='none'
				wait4Meet2End()
				return false
			}
			//document.getElementById('check-attendance').style.visibility = 'visible'
			document.getElementById('start-time').style.visibility = 'visible'
			document.getElementById("gma-attendance-fields").classList.add('in-meeting')

			if(!sessionStorage.getItem('Meeting-start-time') || sessionStorage.getItem('Meeting-start-time') === ''){
				setStartTime()
			}
			else {
				let meetingStart=sessionStorage.getItem('Meeting-start-time')
				document.getElementById('start-time').style.visibility = 'visible'
				document.getElementById('start-time').title = 'Current start time is: ' + meetingStart
				document.getElementById('sp-start-time').innerText = meetingStart
				updateDuration()
			}
			write2log( 'Video portion of Meet started at : ' + sessionStorage.getItem('Meeting-start-time') )
			
			chrome.storage.sync.get(['draggable-top','draggable-left'], function(r) {
				if(!!r['draggable-top']){
					//console.log('top',r['draggable-top'])
					document.getElementById("gma-attendance-fields").style.top=r['draggable-top']
				}
				if(!!r['draggable-left']){
					//console.log('left',r['draggable-left'])
					document.getElementById("gma-attendance-fields").style.left=r['draggable-left']
				}
			})
			
			startMonitoring()
			
			insertAttendanceSwitch()

			let ct = document.getElementById('invited-list').value.trim()
			if(ct !== ''){
				document.getElementById("gma-attendance-fields").classList.remove('empty')
			}
			checkParticipants()  // Check as soon as you join the Meet


			// Create an observer instance to look for changes within the Meet page (detect new participants)
			var observer = new MutationObserver(function( mutations ) {
				checkParticipants()  // Check when ever there is an update to the screen

			});
			// watch for changes (adding new participants to the Meet)
			observer.observe(document.body, {childList:true, attributes:true, attributeFilter: ['data-self-name','data-participant-id','data-requested-participant-id'], subtree:true, characterData:false});
			
			showMeetingStarted() // --> updates.js
			
			wait4Meet2End()
			
		})
	}
	function createAttendanceFields(){
		// setup - the attendance div and `buttons`
		addElement(document.body,'div','gma-attendance-fields','','')

		let gaf=document.getElementById('gma-attendance-fields')
		
		//add top level child elements
		addElement(gaf,'div','gma-class-list-div','','')
		addElement(gaf,'div','gma-messages-div','','')
		addElement(gaf,'div','gma-settings-div','','')
		addElement(gaf,'p','gma-footer','','')
		
		//add class list child elements
		let gcld=document.getElementById('gma-class-list-div')
		addElement(gcld,'p','gma-class-list-header','','gma-header')
		addElement(gcld,'p','gma-add-class','','gma-header')
		addElement(gcld,'p','add-class-message','','')
		addElement(gcld,'textarea','class-notes','If you want to add any notes related to this class...','')
		addElement(gcld,'textarea','invited-list','Pick, paste or type your class list into this field','')
		addElement(gcld,'p','p-attendance-summary','Not Monitoring Attendance!','')
		
		//add class list header elements
		let cldh=document.getElementById('gma-class-list-header')
		addElement(cldh,'select','select-class','Pick a class; pick Add to add your own classes')
		addElement(cldh,'label','read-file-label','Load a previously saved file','gma-btn' )
		addElement(cldh,'input','read-file','','')
		addElement(cldh,'img','class-delete','Delete this class','gma-btn' )
		addElement(cldh,'img','clear-attendance-field','Clear the class list field','gma-btn')
		addElement(cldh,'img','clear-attendance-marks','Clear attendance checks','gma-btn')
		addElement(cldh,'img','start-time','Manually reset the class start time','gma-btn')
		addElement(cldh,'img','save-csv-file','Save Attendance as CSV file','gma-btn')
		addElement(cldh,'img','save-html-file','Save Attendance to an HTML file','gma-btn')
		addElement(cldh,'span','enable-gma','Enable or disable attendance for this Meet','gma-toggle')
		addElement(cldh,'input','class-code','','')
		
		addElement(document.getElementById('enable-gma'),'span','','','gma-toggle-bar')
		addElement(document.getElementById('enable-gma'),'span','','','gma-toggle-ball')

		document.getElementById('class-notes').setAttribute('placeholder',"Enter any notes specific to this class.")
		document.getElementById('invited-list').setAttribute('placeholder',"Your class list goes here.\nClick the blue question mark below for help.")
		document.getElementById('read-file-label').style.backgroundImage = "url('"+chrome.runtime.getURL("images/read-file.png")+"')";
		document.getElementById("read-file-label").htmlFor = "read-file";
		document.getElementById('class-code').type = 'hidden'
		document.getElementById('read-file').type = 'file'
		
		document.getElementById('read-file-label').classList.add('nim')
		document.getElementById('class-delete').classList.add('nim')
		
		let gac=document.getElementById('gma-add-class')
		addElement(gac,'input','class-name','Enter the class name')
		addElement(gac,'img','add-class','Add this class!','gma-btn' )
		addElement(gac,'img','cancel-add','Do *not* add this class!','gma-btn' )
		document.getElementById('class-name').type = 'text'

		let pas=document.getElementById('p-attendance-summary')
		addElement(pas,'span','attendance-summary','','')
		addElement(pas,'span','sp-start-time','','')
		addElement(pas,'span','sp-duration','','')
		
		//add messages div child elements
		let gmd=document.getElementById('gma-messages-div')
		addElement(gmd,'p','messages-div-header','','gma-header')
		addElement(gmd,'div','messages-div-title','','')
		addElement(gmd,'div','messages-div-body','','help-page')
		addElement(gmd,'div','messages-div-footer','','help-footer','Click the red \'x\' above to close this help page.  <span id=\'auto-hide-text\'>This dialog will auto-hide in <span id=\'auto-hide-count-down\'></span> seconds.</span><br/>Click the version info in the footer below to show recent updates or click the question mark icon for help.')
		document.getElementById('messages-div-footer').setAttribute('auto-hide-count-down',0)
		addElement(document.getElementById('messages-div-header'),'span','messages-title','','' )
		addElement(document.getElementById('messages-div-header'),'img','close-help','Close this dialog','gma-btn' )
		let hbp = document.getElementById('messages-div-title')
		addElement(hbp,'img','prev-page','Go to previous help page','gma-btn' )
		addElement(hbp,'h2','messages-page-title','','' )
		addElement(hbp,'img','next-page','Go to next help page','gma-btn' )
		let mdb=document.getElementById('messages-div-body')
		addElement(mdb,'p','help-page-intro','','')
		addElement(mdb,'ol','help-page-body','','')
		addElement(mdb,'p','help-page-footer','','') 
		//set button actions
		document.getElementById('close-help').addEventListener('click', hideUpdateText, false)
		document.getElementById('prev-page').addEventListener('click', showPrevHelp, false)
		document.getElementById('next-page').addEventListener('click', showNextHelp, false)
		document.getElementById('enable-gma').addEventListener('click', enableDisableGMA, false)
		document.getElementById('enable-gma').setAttribute('data-enabled', gmaEnabled)

		//append the footer
		let gf=document.getElementById('gma-footer')
		addElement(gf,'span','gma-version','','' )
		addElement(gf,'img','gma-settings','Tweak your settings','gma-btn' )
		addElement(gf,'img','gma-help','Help?!?','gma-btn' )

		//document.getElementById('check-attendance').style.visibility = 'hidden'
		document.getElementById('class-delete').style.visibility = 'hidden'
		document.getElementById('start-time').style.visibility = 'hidden'
		document.getElementById('save-csv-file').style.visibility = 'hidden'
		document.getElementById('save-html-file').style.visibility = 'hidden'
		document.getElementById('gma-version').innerText = 'Google Meet Attendance - v'+chrome.runtime.getManifest().version

		// set the behaviours
		document.getElementById('select-class').addEventListener('change', changeClass, false)				// a change in the drop down field
		document.getElementById('read-file').addEventListener("change", readFile, false)					// save the class list field to a textfile
		document.getElementById('clear-attendance-marks').addEventListener('click', clearPresent, false)	// clear all of the attendance markings
		document.getElementById('clear-attendance-field').addEventListener('click', clearList, false)		// clear the class list field
		document.getElementById('class-delete').addEventListener('click', deleteClass, false)				// delete a named class
		document.getElementById('start-time').addEventListener('click', setStartTime, false)					// manually reset the class start time
		document.getElementById('save-csv-file').addEventListener('click', saveCSVFile, false)		// save the class list field to a textfile
		document.getElementById('save-html-file').addEventListener('click', saveHTMLFile, false)		    // save the class list field to an HTML file
		//document.getElementById('class-name').addEventListener('change', addClass, false)					// save the new named class
		//document.getElementById('class-name').addEventListener('blur', addClass, false)				     	// save the new named class
		document.getElementById('add-class').addEventListener('click', addClass, false)				// clear all of the attendance markings
		document.getElementById('cancel-add').addEventListener('click', doNotAddClass, false)				// clear all of the attendance markings
		document.getElementById('class-notes').addEventListener('change', notesChanged, false);				// if the user edits the field
		document.getElementById('invited-list').addEventListener('change', listChanged, false);				// if the user edits the field
		document.getElementById('gma-version').addEventListener('click', showUpdate, false)					// manually reset the class start time
		document.getElementById('gma-settings').addEventListener('click', showSettings, false)					// open help
		document.getElementById('gma-help').addEventListener('click', showInstall, false)					// open help

		document.getElementById('gma-attendance-fields').onmousedown = stopProp;
		document.getElementById('select-class').onmousedown = stopProp;
		document.getElementById('class-notes').onmousedown = stopProp;
		document.getElementById('invited-list').onmousedown = stopProp;
		document.getElementById('messages-div-body').onmousedown = stopProp;
		document.getElementById('messages-div-body').onmousedown = stopProp;
		document.getElementById('read-file-label').onmousedown = stopProp;
		document.getElementById('clear-attendance-marks').onmousedown = stopProp;
		document.getElementById('clear-attendance-field').onmousedown = stopProp;
		//document.getElementById('check-attendance').onmousedown = stopProp;
		document.getElementById('class-delete').onmousedown = stopProp;
		document.getElementById('start-time').onmousedown = stopProp;
		document.getElementById('save-csv-file').onmousedown = stopProp;
		document.getElementById('save-html-file').onmousedown = stopProp;
		dragElement(document.getElementById("gma-attendance-fields"));
		
		write2log( 'Added Attendance dialog' )

	}

	// add unload event to warn about unsave changes
	window.addEventListener("beforeunload", function (e) {
		write2log( 'Reloaded the page' )
		if ( !gmaEnabled ) return undefined
		let gaf=document.getElementById('gma-attendance-fields').classList
		if( !gaf.contains('meeting-over') && !gaf.contains('in-meeting') ) return undefined
		
		let shf=document.getElementById('save-html-file'), scf=document.getElementById('save-csv-file')
		let shf_is=shf.style.visibility === 'visible'
		let scf_is=scf.style.visibility === 'visible'
		
		shf.classList.remove('save-needed')
		scf.classList.remove('save-needed')
		
		if( _autoSaveHTML && shf_is ){
			shf.style.visibility = 'hidden'
			shf_is=false
			saveHTMLFile()
		}
		else if( shf_is ) {
			shf.classList.add('save-needed')
		}
		
		if( _autoSaveCSV && scf_is ){
			scf.style.visibility = 'hidden'
			scf_is=false
			saveCSVFile()
		}
		else if( scf_is ) {
			scf.classList.add('save-needed')
		}
		if( !shf_is && !scf_is  ) return undefined
		console.log('shf: ', shf_is, 'scf: ', scf_is)

		let alrt = 'null message... no longer supported.';

		(e || window.event).returnValue = alrt;
		return alrt;
	});

	//wait until there is a video DOM element (so that meet code has been selected)
	//let numChecks=0

	waitForElement("[data-in-call]",function(){
		createAttendanceFields()
		setClassList('select-class')
		
		let _activeMeetID=document.querySelector('[data-unresolved-meeting-id]').getAttribute('data-unresolved-meeting-id')
		let smids=sessionStorage.getItem('_activeMeetIDs')
		if( !smids || smids==='' ){
			//sessionStorage.removeItem( 'GMA-Log' )
			write2log( 'Opened a new Meet: '+_activeMeetID )
			sessionStorage.setItem( '_activeMeetIDs', _activeMeetID )
		}
		else if( smids===_activeMeetID ){
			write2log( 'Rejoined Meet: '+_activeMeetID )
		}
		else{
			write2log( 'Joined a different Meet --> previous: '+smids+' / current: '+_activeMeetID+'... resetting _arrivalTimes' )
			sessionStorage.setItem( '_activeMeetIDs', _activeMeetID )
			let _arrivalTimes = {}
			sessionStorage.setItem( '_arrivalTimes', null )
		}
		
		chrome.storage.sync.get(['Current-Class-Code'], function (r) {
			let ccc=sessionStorage.getItem('_Class4ThisMeet')||r['Current-Class-Code']||'Class-List'
			if(!sessionStorage.getItem('_Class4ThisMeet')) sessionStorage.setItem('_Class4ThisMeet', ccc)
			document.getElementById('select-class').value = ccc.replace(/ /g,'-')
			document.getElementById('class-delete').style.visibility = (ccc==='Class-List')?'hidden':'visible'
		})
		document.getElementById('class-notes').value=sessionStorage.getItem( 'class-notes' )
		//Has the extension been updated?
		check4Changes()

		loadClassNames()
		
		//now wait until they've entered the Meet
		wait4Meet2Start()

	})
})()
