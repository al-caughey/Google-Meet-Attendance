// @author       Al Caughey
// @include      https://meet.google.com/*
// @license      https://github.com/al-caughey/Google-Meet-Attendance/blob/master/LICENSE.md
// @run-at       document-idle
// 				 Please send feedback to allan.caughey@ocdsb.ca


// *** for the list of changes, see updateSummary in updates.js

;(function() {	
	// Show storage contents

	let __GMA_ClassLists
	chrome.storage.sync.get( null, function(r) {
		console.log(r)
		if(!!r[ '__GMA_ClassLists' ] ) return
		backupOldClassLists()
		__GMA_ClassLists = {}
		console.log( 'resetting __GMA_ClassLists' )
		let cls = r[ '__Class-Info' ]
		let classInfo = ( !cls||cls === '' )?{}:JSON.parse(cls)
		for (let [ code, name ] of Object.entries( classInfo )) {
			let cc=code.replace( / /g, '-' ).trim()
			let nm=name.trim()
			if ( !__GMA_ClassLists[cc] ) __GMA_ClassLists[cc]={ n:nm, s:{} }
			if( !r[ '__Class-'+cc] ) continue
			let cl=r[ '__Class-'+cc].replace( /[\?✔]*/g, '' ).split( '\n' )
			for ( let sn of cl ) {
				__GMA_ClassLists[ cc ].s[ sn ]={ d: '', e: ''}
			}
			chrome.storage.sync.remove( '__Class-Info' )
			if ( !!r[ '__Class-'+cc ] ) chrome.storage.sync.remove( '__Class-' + cc )
		}
		let generateFiles = r[ 'auto-save-html' ] == true && r[ 'auto-save-csv' ] == true ? 'both' : ( r[ 'auto-save-html' ] == true ? 'html' : ( r[ 'auto-save-csv' ] == true ? 'csv' : 'neither' ) ) 
		let saveFiles = r[ 'auto-save-html' ] == true && r[ 'auto-save-csv' ] == true ? 'both' : ( r[ 'auto-save-html' ] == true ? 'html' : ( r[ 'auto-save-csv' ] == true ? 'csv' : 'neither' ) ) 
		chrome.storage.sync.set( { 'generate-files' : _generateFiles }, null)
		chrome.storage.sync.set( { 'auto-save-files' : saveFiles }, null)
		chrome.storage.sync.remove( 'auto-save-html', null )
		chrome.storage.sync.remove( 'auto-save-csv', null )
		chrome.storage.sync.set( { '__GMA_ClassLists' : __GMA_ClassLists }, null)
		for (var key in r){
			//console.log( key, r[key] )
		}
		console.log(__GMA_ClassLists)
	} )
	
	// globals
	let updateDialogTimeout=null
	let ddStrings = getDropDownStrings()
	let _activeMeetID
	
	// simple function that waits until a specific element exists in the DOM...
	// (adapted from Stack Overflow)
	function waitForElement(elementPath, callBack){
		console.log( 'Waiting for: ' + elementPath )
		
		let waitfor=elementPath==='[data-call-ended = "true"]'?10000:2500
		
		window.setTimeout(function(){
			//console.log( 'numChecks: '+numChecks)
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
		console.log( 'setClassList' )
		function addOption( pe, t, v, tt ){
			let o = document.createElement( 'option' )
			o.innerText = t
			o.value = v.replace(/ /g, '-' )
			if ( v === '' ) o.disabled = 'disabled'
			if ( !!tt ) o.title = tt
			pe.appendChild( o )
		}
		//console.log( 'setClassList' )
		
		let mpe = document.getElementById(p)
		addOption(mpe, ddStrings.classList, 'Class-List', 'A generic class list' )
		let mog = document.createElement( 'optgroup' )
		mog.setAttribute( 'label', ddStrings.myClasses)
		mog.setAttribute( 'id', 'named-classes' )
		chrome.storage.sync.get( [ '__GMA_ClassLists' ], function (r) {
			let gcls = r[ '__GMA_ClassLists' ]
			for (let [cc, nn] of Object.entries(gcls).sort()) {
				if(cc === 'Class-List' ) continue
				addOption(mog, nn.n, cc)
			}
			mpe.appendChild(mog)
			let og = document.createElement( 'optgroup' )
			og.setAttribute( 'label' , ddStrings.otherOptions)
			
			addOption(og, ddStrings.add, '+', 'Add a named class' )
			addOption(og, ddStrings.reset, '-', 'Remove all of your named classes' )
			mpe.appendChild(og)
		} )
	}

	// save the class info to the CSV file
	function saveCSVFile(){

		chrome.storage.sync.get( null, function(r) {
			let today = new Date(), d = today.getDate(), m = today.getMonth() + 1, y = today.getFullYear()
			let cdate = y + '-' + twod( m ) + '-' + twod( d )
			let currentClassCode = sessionStorage.getItem( '_Class4ThisMeet' )||r[ 'Current-Class-Code' ]||'Class-List'
			let cdd = document.getElementById( 'select-class' ), ccn = cdd.options[cdd.selectedIndex].text;
			let fileName=currentClassCode + ' ( '+cdate+' ).csv'
			
			// prepend file outputs with UTF-8 BOM
			let header = '\ufeff' + 'Attendance for: ' + ccn + ' on ' + cdate + '\n'
			let cno=sessionStorage.getItem( 'class-notes' )||''
			header = header + ( cno == '' ? '' : 'Class notes:, "' + cno.trim() + '"') + '\n'
			header = header + 'Names' + '\t' + cdate + ' ' + sessionStorage.getItem( 'Meeting-start-time' ) + '\t' + 'Arrival time' + '\n'
			
			let joined = /^\s*( [✔\?] )(\s*)(.*)$/gm
			let txt = document.getElementById( 'invited-list' ).value.replace(joined, "$3" + '\t' + "$1" )
			for (let pid in _arrivalTimes){
				let re_name = new RegExp( '(' + _arrivalTimes[pid].name + '.*)', 'i' )
				txt = txt.replace( re_name, '$1' + ',' + _arrivalTimes[pid].arrived + ' (' + ( _arrivalTimes[pid].checks.length||0 ) + 'min) [ '+_arrivalTimes[pid].last_seen + ' ]' )
			}
			let blob = new Blob( [header+txt], {type: 'text/plain;charset=UTF-8'} )
			
			let temp_a = document.createElement( 'a' )
			temp_a.download = fileName
			temp_a.href = window.webkitURL.createObjectURL(blob)
			temp_a.click()
			
			write2log( 'Saved CSV file ' +  ccn + ' ( '+cdate+' ).csv' )

			document.getElementById( 'save-csv-file' ).style.visibility = 'hidden'
		})
	}
	
	// tidy up if the user chooses not to add a class
	function doNotAddClass(){
		//console.log( 'doNotAddClass',ddStrings.not_added)
		document.getElementById( 'add-class-message' ).innerText=ddStrings.not_added
		document.getElementById( 'class-delete' ).style.visibility = 'visible'
		document.getElementById( 'gma-attendance-fields' ).classList.add( 'empty' )
		document.getElementById( 'select-class' ).style.display = 'inline-block'
		document.getElementById( 'class-name' ).style.display = 'none'
		document.getElementById( 'add-class' ).style.display = 'none'
		document.getElementById( 'cancel-add' ).style.display = 'none'
		chrome.storage.sync.get( [ 'Current-Class-Code' ], function (r) {
			let currentClassCode = r[ 'Current-Class-Code' ]
			document.getElementById( 'select-class' ).value=currentClassCode
			changeClass()
		} )
		autoHideAddClassMessage()
	}
	// add a new class to the drop down list
	function addClass(){
		console.log( 'addClass' )
		let cn = document.getElementById( 'class-name' ).value.trim()
		let cc = cn.replace(/ /g, '-' )
		if(cc=='' ){
			doNotAddClass()
			return
		}
		let hdr = document.getElementById( 'named-classes' )
		let no = document.createElement( 'option' );
		no.text = cn;
		no.value = cc;
		hdr.appendChild(no)
		
		document.getElementById( 'select-class' ).value = cc;
		chrome.storage.sync.set( {'Current-Class-Code': cc}, null )
		sessionStorage.setItem( '_Class4ThisMeet', cc)
		
		chrome.storage.sync.get( [ '__GMA_ClassLists' ], function (r) {
			let gcls = r[ '__GMA_ClassLists' ]
			gcls[cc] = { n:cn, s:{} }
			chrome.storage.sync.set( {'__GMA_ClassLists': gcls }, null)
			
			document.getElementById( 'class-name' ).classList.remove( 'add-class' )
			document.getElementById( 'class-delete' ).style.visibility = 'visible'
			document.getElementById( 'gma-attendance-fields' ).classList.add( 'empty' )
			document.getElementById( 'select-class' ).style.display = 'inline-block'
			document.getElementById( 'class-name' ).style.display = 'none'
			document.getElementById( 'add-class' ).style.display = 'none'
			document.getElementById( 'cancel-add' ).style.display = 'none'
			document.getElementById( 'add-class-message' ).innerText=ddStrings.added
						
			document.getElementById( 'invited-list' ).value=''
			document.getElementById( 'student-buttons' ).innerHTML=''
			
			autoHideAddClassMessage()
			write2log( 'Added class: ' +  cn )

		} )
	}
	
	// bulk edit the class list
	function editClassList(){
		console.log( 'editClassList' )
		
		if(document.getElementById( 'invited-list' ).classList.contains( 'being-editted' )){
			blurClassList()
		}
		else{
			getStudentNames()
			document.getElementById( 'invited-list' ).classList.add( 'being-editted' )
			document.getElementById( 'gma-class-list-buttons' ).classList.add( 'do-not-show' )
		}
	}
	function blurClassList(){
		document.getElementById( 'invited-list' ).classList.remove( 'being-editted' )
		document.getElementById( 'gma-class-list-buttons' ).classList.remove( 'do-not-show' )
	}
	
	// delete a class from the drop-down & LS variables
	function deleteClass(){
		cancelEditStudent()
		chrome.storage.sync.get( [ '__GMA_ClassLists', 'Current-Class-Code' ], function (r) {
			let currentClassCode = sessionStorage.getItem( '_Class4ThisMeet' ) || r[ 'Current-Class-Code' ]||'Class-List'
			let gcls = r[ '__GMA_ClassLists' ]
			
			if(!confirm( 'Are you sure you want to delete this class: `' + currentClassCode + '`?  There is no undo!' )) return
			
			
			chrome.storage.sync.remove( currentClassCode , null)

			document.getElementById( 'gma-attendance-fields' ).classList.add( 'empty' )
			document.getElementById( 'save-csv-file' ).style.visibility = 'hidden'
			document.getElementById( 'save-html-file' ).style.visibility = 'hidden'
			_arrivalTimes = {} // clear the time of arrival array
			sessionStorage.setItem( '_Class4ThisMeet', 'Class-List' )
			document.getElementById( 'select-class' ).value = 'Class-List'
			document.getElementById( 'invited-list' ).value = ''
			document.getElementById( 'student-buttons' ).innerHTML = ''
			document.getElementById( 'class-delete' ).style.visibility = 'hidden'
			write2log( 'Deleted class: ' +  currentClassCode )
			changeClass()
		} )
	}
	// pick new class from drop-down
	function changeClass(){
		console.log( 'changeClass' )
		blurClassList()
		cancelEditStudent()

		hideUpdateText()
		if( document.getElementById( 'gma-attendance-fields' ).classList.contains( 'meeting-over' ) && ( document.getElementById( 'save-csv-file' ).style.visibility==="visible" ||  document.getElementById( 'save-html-file' ).style.visibility==="visible" ) ){
			document.getElementById( 'gma-attendance-fields' ).classList.remove( 'meeting-over' )
			if( !confirm( 'There may be unsaved information for the current class.  Changing to a new class will result in the loss that info. \n\nAre you sure you want to change?  There is no undo!' )){
				chrome.storage.sync.get( [ 'Current-Class-Code' ], function (r) {
					document.getElementById( 'select-class' ).value=r[ 'Current-Class-Code' ]
				} )
				return
			}
		}
		
		let currentSelectOption = document.getElementById( 'select-class' ).value.replace(/ /g, '-' )

		document.getElementById( 'class-notes' ).value=''
		sessionStorage.setItem( 'class-notes', '' )
		if(currentSelectOption === '+' ){
			addClassInfo()
		}
		else if( currentSelectOption === '-' ){
			resetClassInfo()
		}
		else{

			chrome.storage.sync.get( [ '__GMA_ClassLists' ], function (r) {
				let gcls = r[ '__GMA_ClassLists' ]||{}
				let currentClassName = gcls[ currentSelectOption ].n
				document.getElementById( 'class-name' ).value = currentClassName
				write2log( 'Changed class to: ' +  currentClassName )

				addClassButtons()
				chrome.storage.sync.set( { 'Current-Class-Code' : currentSelectOption }, null )
				sessionStorage.setItem( '_Class4ThisMeet', currentSelectOption )
				
				document.getElementById( 'class-delete' ).style.visibility = 'visible'
				_arrivalTimes = {} // clear the time of arrival array
				sessionStorage.removeItem( 'Meeting-start-time' )
				sessionStorage.removeItem( '_arrivalTimes' )
				if( document.querySelectorAll( '.student-button' ).length === 0 ){
					document.getElementById( 'gma-attendance-fields' ).classList.add( 'empty' )
				}
				else{
					document.getElementById( 'gma-attendance-fields' ).classList.remove( 'empty' )
					updateAttendanceSummary()
					checkClearAttendance()
				}

				document.getElementById( 'save-csv-file' ).style.visibility = 'hidden'
				document.getElementById( 'save-html-file' ).style.visibility = 'hidden'
				if( currentSelectOption === 'Class-List' ) document.getElementById( 'class-delete' ).style.visibility = 'hidden'
				
				if ( document.getElementById( 'gma-attendance-fields' ).classList.contains( 'in-meeting' )) {
					setStartTime()
				}
			} )
		}
	}
	// called when add is selected from the drop-down
	function addClassInfo(){
		console.log( 'addClassInfo' )
		document.getElementById( 'gma-class-list-header' ).style.display='none'
		document.getElementById( 'invited-list' ).style.display='none'
		document.getElementById( 'invited-list' ).value = ''
		document.getElementById( 'student-buttons' ).innerHTML = ''
		document.getElementById( 'gma-add-class' ).style.display='block'
		document.getElementById( 'add-class-message' ).innerText=ddStrings.adding
		document.getElementById( 'add-class-message' ).style.display='block'
		document.getElementById( 'select-class' ).style.display = 'none'
		document.getElementById( 'class-name' ).style.display = 'inline-block'
		document.getElementById( 'class-name' ).value = ''
		document.getElementById( 'class-name' ).classList.add( 'add-class' )
		document.getElementById( 'class-name' ).select()
		document.getElementById( 'add-class' ).style.display = 'inline-block'
		document.getElementById( 'cancel-add' ).style.display = 'inline-block'
		document.getElementById( 'class-delete' ).style.visibility = 'hidden'
	}
	// called when reset is selected from the drop-down
	function resetClassInfo(){
		console.log( 'resetClassInfo' )
		if(!confirm( 'Are you sure you want to delete *all* of your class info?  There is no undo!' )){
			document.getElementById( 'select-class' ).value = sessionStorage.getItem( '_Class4ThisMeet' )
			return
		}
		write2log( 'Reset' )
		
		let tmp={}
		tmp[ 'Class-List' ] = { n: "Class List", s: {} }

		chrome.storage.sync.set( { '__GMA_ClassLists': tmp } , null )
		chrome.storage.sync.set( {'Current-Class-Code':'Class-List' }, null )
		sessionStorage.setItem( '_Class4ThisMeet', 'Class-List' )
		sessionStorage.removeItem( '_studentsAtThisMeet' )
		sessionStorage.removeItem( 'Meeting-end-time' )
		sessionStorage.removeItem( 'GMA-Log' )
		sessionStorage.removeItem( '_arrivalTimes' )
		sessionStorage.removeItem( 'class-notes' )
		document.getElementById( 'select-class' ).innerHTML = ''
		setClassList( 'select-class' )

		document.getElementById( 'invited-list' ).value = ''
		document.getElementById( 'student-buttons' ).innerHTML = ''
		document.getElementById( 'class-delete' ).style.visibility = 'hidden'
		document.getElementById( 'gma-attendance-fields' ).classList.add( 'empty' )
		chrome.storage.sync.get( null, function(r) {
			for (var key in r){
				if(key.indexOf( '__Class' ) === 0){
				   chrome.storage.sync.remove(key);
				}
			}
		   chrome.storage.sync.remove( 'saved-attendance' );
		} )
	}
	
	function checkClearAttendance(){
		console.log( 'checkClearAttendance()' )
		if( document.querySelectorAll('[data-status="✔"],[data-status="?"]').length===0 )	return 
		
		if( !sessionStorage.getItem( 'Meeting-start-time' ) ) {
				chrome.storage.sync.get( [ 'auto-clear-checks' ], function(r){
					if ( r[ 'auto-clear-checks' ] ){
						clearPresent()
					}
					else{
						if( confirm( 'Do you want to clear the attendance checks (`✔`) from your previous meet? (Recommended Yes)' ) ) clearPresent()
					}
				} )
		}
	}
	
	// load the names associated with a class
	function loadClassNames(){
		console.log( 'loadClassNames' )
		chrome.storage.sync.get( [ '__GMA_ClassLists', 'Current-Class-Code' ], function (r) {
			let currentClassCode = sessionStorage.getItem( '_Class4ThisMeet' )||r[ 'Current-Class-Code' ]||'Class-List'
			console.log('loadClassNames --> currentClassCode', currentClassCode, !!r[ '__GMA_ClassLists' ][currentClassCode] )
			let className = !r[ '__GMA_ClassLists' ][ currentClassCode ]?'Class List':r[ '__GMA_ClassLists' ][ currentClassCode ].n
			addClassButtons()
			
			console.log( 'loadClassNames --> className', className )
			if( document.querySelectorAll( '.student-button' ).length.length === 0 ){
				document.getElementById( 'gma-attendance-fields' ).classList.add( 'empty' )
			}
			else{
				document.getElementById( 'gma-attendance-fields' ).classList.remove( 'empty' )
				updateAttendanceSummary()
				checkClearAttendance()
			}
			
			write2log( 'Loaded names for ' + className )

			document.getElementById( 'class-name' ).value = className
			document.getElementById( 'select-class' ).value = currentClassCode
		} )
	}
	// class notes have changed
	function notesChanged(){
		let st = document.getElementById( 'save-csv-file' ), ht = document.getElementById( 'save-html-file' )
		document.getElementById( 'class-notes' ).value=document.getElementById( 'class-notes' ).value.trim()
		sessionStorage.setItem( 'class-notes', document.getElementById( 'class-notes' ).value )
		st.style.visibility = ( _generateFiles == 'both' || _generateFiles == 'csv') ? 'visible' : 'hidden'
		ht.style.visibility = ( _generateFiles == 'both' || _generateFiles == 'html') ? 'visible' : 'hidden'
	}

	// remove all preceding ✔|? from the list of names in the textarea
	function clearPresent(){
		console.log( 'clearPresent' )
		hideUpdateText()
		let currentClassCode = sessionStorage.getItem( '_Class4ThisMeet' )||'Class-List'
		let invitees = document.getElementById( 'invited-list' );
		let ct = invitees.value.replace(/( )*[✔\?]\s*/g, '' ).replace(/\t/g, '' )
		invitees.value = ct
		let pl = document.querySelectorAll( '[ data-status="✔" ], [ data-status="?" ]' )
		for (let cs of pl){
			cs.setAttribute('data-status','')
		}
		checkParticipants()
		updateAttendanceSummary()
		updateClassList()
		
		write2log( 'Cleared present checks ' + currentClassCode )
	}

	// clear all of the names for the current class
	function clearList(){
		console.log( 'clearList' )
		hideUpdateText()
		if(!confirm( 'Are you sure you want to delete *all* the names in this class?  There is no undo!' )){
			return
		}
		document.getElementById( 'invited-list' ).value = ''
		document.getElementById( 'student-buttons' ).innerHTML = ''
		
		chrome.storage.sync.get( [ '__GMA_ClassLists', 'Current-Class-Code' ], function (r) {
			let currentClassCode = sessionStorage.getItem( '_Class4ThisMeet' )||r[ 'Current-Class-Code' ]||'Class-List'
			let gcls=r[ '__GMA_ClassLists' ]
			gcls[currentClassCode].s={}
			chrome.storage.sync.set( {'__GMA_ClassLists': gcls },null)

			document.getElementById( 'gma-attendance-fields' ).classList.add( 'empty' )
			document.getElementById( 'save-csv-file' ).style.visibility = 'hidden'
			document.getElementById( 'save-html-file' ).style.visibility = 'hidden'
			_arrivalTimes = {} // clear the time of arrival array
			write2log( 'Clear all names for ' + currentClassCode )
		} )
 	}

	// Add the show/hide button for the attendance field once the meeting has started
	function insertAttendanceSwitch(){
		let ln = document.querySelectorAll( '[data-show-automatic-dialog]' ).length
		let btn = document.createElement( 'span' );
		btn.textContent = '✔';
		btn.id = 'show-gma-attendance-fields'
		btn.title = 'Show/hide the Attendance field'
		document.querySelectorAll( '[data-show-automatic-dialog]' )[ln-1].parentElement.parentElement.appendChild(btn)
		document.getElementById( 'show-gma-attendance-fields' ).addEventListener( 'click' , showAttendance, false);
		document.getElementById( 'show-gma-attendance-fields' ).classList.add( 'showing' )
	}

	function check4ExtensionUpdates(){
		chrome.storage.sync.get( [ '__GMA_status' ], function(r) {
			let status=r[ '__GMA_status' ]

			if (status==='install' ){
				showInstall()

			}
			else if(status==='update' ){
				alert('FYI - This update to the Google Meet Attendance extension makes some internal changes to its internal data structures.\n\nAs a precaution, `just-in-case`, a back-up of your current class names and student lists has been saved to your downloads directory.\n\nIf you have any questions, check the Facebook page:\n https://facebook.com/GoogleMeetAttendance.')
				showUpdate()

				document.getElementById( 'gma-attendance-fields' ).classList.add( 'updated' )
				document.getElementById( 'gma-version' ).title="Click to see what's new in this version"
			}
			else if(status==='up-to-date' ){
				//console.log(status, document.getElementById( 'gma-attendance-fields-footer' ))
				document.getElementById( 'gma-version' ).title='Your extension is up-to-date... click to see changes'
			}
			else{
				//console.log( 'huh?!? status = "+status)
			}
			write2log( '__GMA_status: '+ status )
			chrome.storage.sync.set( {'__GMA_status':'up-to-date'}, null)
		} )
	}
	function wait4Meet2End(){
		// wait until the meeting is done
		waitForElement( '[data-call-ended="true"]',function(){
			write2log( '**** Meet ended ****' )
			hideUpdateText()
			let a_div = document.getElementById( 'gma-attendance-fields' )
			a_div.style = ''
			a_div.classList.remove( 'in-meeting' )
			a_div.classList.add( 'meeting-over' )
			document.getElementById( 'gma-attendance-fields' ).classList.remove( 'in-meeting' )

			window.clearInterval(monitoring)
			let now = new Date(), ctime = now.getHours()+':'+twod(now.getMinutes())
			sessionStorage.setItem( 'Meeting-end-time', ctime )
			chrome.storage.sync.get( null, function(r) {
				let asf='', svn=0, asfh=5000
				if( _autoSaveHTML && gmaEnabled){
					saveHTMLFile()
					svn+=1
				}
				if( _autoSaveCSV && gmaEnabled){
					saveCSVFile()
					svn+=2
				}
				
				if(!gmaEnabled){
					asf="Nothing to save... Attendance was disabled!"
				}
				else if (svn==0){
					asf="Don't forget to save your files!"
					asfh=30000
					document.getElementById( 'save-html-file' ).classList.add( 'save-needed' )
					document.getElementById( 'save-csv-file' ).classList.add( 'save-needed' )
				}
				else if(svn==1){
					asf="Auto-saved your HTML file"
					document.getElementById( 'save-csv-file' ).classList.add( 'save-needed' )
				}
				else if(svn==2){
					asf="Auto-saved your CSV file"
					document.getElementById( 'save-html-file' ).classList.add( 'save-needed' )
				}
				else if(svn==3){
					asf="Auto-saved your HTML & CSV files"
				}
				document.getElementById( 'add-class-message' ).innerText=asf
				document.getElementById( 'add-class-message' ).classList.add( 'bold' )
				write2log( 'Auto-save: '+ svn )
				autoHideAddClassMessage(asfh)
			} )
		} );
	}
	function wait4Meet2Start(){
		// wait until the meeting has started
		
		write2log( 'Waiting for the Meet to start' )
		waitForElement( '[data-allocation-index]' ,function(){
			write2log( '**** Meet started ****' )
			
			if(!gmaEnabled){
				
				document.getElementById( 'gma-attendance-fields' ).style.display='none'
				wait4Meet2End()
				return false
			}
			//document.getElementById( 'check-attendance' ).style.visibility = 'visible'
			document.getElementById( 'start-time' ).style.visibility = 'visible'
			document.getElementById( 'gma-attendance-fields' ).classList.add( 'in-meeting' )

			if(!sessionStorage.getItem( 'Meeting-start-time' ) || sessionStorage.getItem( 'Meeting-start-time' ) === '' ){
				setStartTime()
			}
			else {
				let meetingStart=sessionStorage.getItem( 'Meeting-start-time' )
				document.getElementById( 'start-time' ).style.visibility = 'visible'
				document.getElementById( 'start-time' ).title = 'Current start time is: ' + meetingStart
				document.getElementById( 'sp-start-time' ).innerText = meetingStart
				updateDuration()
			}
			write2log( 'Video portion of Meet started at : ' + sessionStorage.getItem( 'Meeting-start-time' ) )
			
			chrome.storage.sync.get( [ 'draggable-top', 'draggable-left' ], function(r) {
				if(!!r[ 'draggable-top' ] ){
					//console.log( 'top',r[ 'draggable-top' ] )
					document.getElementById( 'gma-attendance-fields' ).style.top=r[ 'draggable-top' ]
				}
				if(!!r[ 'draggable-left' ] ){
					//console.log( 'left',r[ 'draggable-left' ] )
					document.getElementById( 'gma-attendance-fields' ).style.left=r[ 'draggable-left' ]
				}
			} )
			
			startMonitoring()
			
			insertAttendanceSwitch()

			if( document.querySelectorAll( '.student-button' ).length.length > 0 ){
				document.getElementById( 'gma-attendance-fields' ).classList.remove( 'empty' )
			}
			checkParticipants()  // Check as soon as you join the Meet

			//  If using Grid View and/or expanded Tiled layout, monitoring for changes *should* no longer be necessary
			if (_checkPage4Changes){	// Create an observer instance to look for changes within the Meet page (detect new participants)
					console.log( '_checkPage4Changes',_checkPage4Changes)
					var observer = new MutationObserver(function( mutations ) {
					checkParticipants()  // Check when ever there is an update to the screen

				} );
				// watch for changes (adding new participants to the Meet)
				observer.observe(document.body, {childList:true, attributes:true, attributeFilter: [ 'data-self-name', 'data-participant-id', 'data-requested-participant-id' ], subtree:true, characterData:false} );
			}
			
			showMeetingStarted() // --> updates.js
			
			wait4Meet2End()
			
		} )
	}
	function createAttendanceFields(){
		// setup - the attendance div and `buttons`

		let gaf=addElement(document.body, 'div', 'gma-attendance-fields', '', '' )
		gaf.setAttribute( 'data-generate-files', _generateFiles )
		
		//add top level child elements
		let gcld=addElement(gaf, 'div', 'gma-class-list-div', '', '' )
		let gmd=addElement(gaf, 'div', 'gma-messages-div', '', '' )
		addElement(gaf, 'div', 'gma-settings-div', '', '' )
		addElement(gaf, 'div', 'gma-user-edit-div', '', '' )
		addElement(gaf, 'p', 'gma-footer', '', '' )
		
		//add class list child elements
		let cldh = addElement(gcld, 'p', 'gma-class-list-header', '', 'gma-header' )
		let gac = addElement(gcld, 'p', 'gma-add-class', '', 'gma-header' )
		addElement(gcld, 'p', 'add-class-message', '', '' )
		let cnf = addElement(gcld, 'textarea', 'class-notes', 'If you want to add any notes related to this class...', '' )
		let il = addElement(gcld, 'textarea', 'invited-list', 'Pick, paste or type your class list into this field', '' )
		let gclb = addElement(gcld, 'div', 'gma-class-list-buttons', '', '' )
		let pas=addElement(gcld, 'p', 'p-attendance-summary', 'Not Monitoring Attendance!', '' )
		
		//add class list header elements
		let sc = addElement(cldh, 'select', 'select-class', 'Pick a class; pick Add to add your own classes' )
		let cle = addElement(cldh, 'img', 'class-list-edit', 'Edit the class list', 'gma-btn' )
		let cd = addElement(cldh, 'img', 'class-delete', 'Delete this class', 'gma-btn' )
		let caf = addElement(cldh, 'img', 'clear-attendance-field', 'Clear the class list field', 'gma-btn' )
		let cam = addElement(cldh, 'img', 'clear-attendance-marks', 'Clear attendance checks', 'gma-btn' )
		let st = addElement(cldh, 'img', 'start-time', 'Manually reset the class start time', 'gma-btn' )
		let scf = addElement(cldh, 'img', 'save-csv-file', 'Save Attendance as CSV file', 'gma-btn' )
		let shf = addElement(cldh, 'img', 'save-html-file', 'Save Attendance to an HTML file', 'gma-btn' )
		let egma=addElement(cldh, 'span', 'enable-gma', 'Enable or disable attendance for this Meet', 'gma-toggle' )
		let cc = addElement(cldh, 'input', 'class-code', '', '' )
		cc.type = 'hidden'
		
		addElement(egma, 'span', '', '', 'gma-toggle-bar' )
		addElement(egma, 'span', '', '', 'gma-toggle-ball' )

		cnf.setAttribute( 'placeholder', 'Enter any notes specific to this class.' )
		il.setAttribute( 'placeholder', 'Your class list goes here.\nClick the blue question mark below for help.' )
				
		addElement(gac, 'input', 'class-name', 'Enter the class name' )
		let ac = addElement(gac, 'img', 'add-class', 'Add this class!', 'gma-btn' )
		let ca = addElement(gac, 'img', 'cancel-add', 'Do *not* add this class!', 'gma-btn' )
		document.getElementById( 'class-name' ).type = 'text'

		addElement(pas, 'span', 'attendance-summary', '', '' )
		addElement(pas, 'span', 'sp-start-time', '', '' )
		addElement(pas, 'span', 'sp-duration', '', '' )
		
		gclbd = addElement(gclb, 'div', 'student-buttons', '', '' )
		gclbd = addElement(gclb, 'div', 'student-edit-div', '', '' )
		let sp = addElement(gclbd, 'label', '', 'Enter the login name', '', 'Login: ' )
		let gln = addElement(sp, 'input', 'gma-login-name', 'Enter the login name' )
		sp = addElement(gclbd, 'label', '', 'Enter the display name (if different from the login)', '', 'Display: ' )
		let gdn = addElement(sp, 'input', 'gma-display-name', 'Enter the display name' )
		sp = addElement(gclbd, 'label', '', 'Enter the email address', '', 'Email: ' )
		let ge = addElement(sp, 'input', 'gma-email', 'Enter the email address ✉' )
		gclbds=addElement(gclbd, 'span', 'gma-edit-buttons', '' )
		let sse = addElement(gclbds, 'img', 'save-student-edits', 'Save these changes', 'gma-btn' )
		let ce= addElement(gclbds, 'img', 'cancel-student-edits', 'Cancel, do not save', 'gma-btn' )
		let ds = addElement(gclbds, 'img', 'delete-student', 'Delete this Student', 'gma-btn' )
		ge.type='email'
		
		sse.addEventListener( 'click', saveEditStudent, false)		
		ce.addEventListener( 'click', cancelEditStudent, false)		
		ds.addEventListener( 'click', deleteStudent, false)		
		gln.addEventListener( 'change', editStudentChanged, false)
		gdn.addEventListener( 'change', editStudentChanged, false)
		ge.addEventListener( 'change', editStudentChanged, false)
		gclbd.onmousedown = stopProp;

		//add messages div child elements
		addElement(gmd, 'p', 'messages-div-header', '', 'gma-header' )
		let hbp = addElement(gmd, 'div', 'messages-div-title', '', '' )
		let mdb = addElement(gmd, 'div', 'messages-div-body', '', 'help-page' )
		let mdf = addElement(gmd, 'div', 'messages-div-footer', '', 'help-footer', 'Click the red \'x\' above to close this help page.  <span id=\'auto-hide-text\'>This dialog will auto-hide in <span id=\'auto-hide-count-down\'></span> seconds.</span><br/>Click the version info in the footer below to show recent updates or click the question mark icon for help.' )
		mdf.setAttribute( 'auto-hide-count-down',0)
		addElement(document.getElementById( 'messages-div-header' ), 'span', 'messages-title', '', '' )
		let ch = addElement(document.getElementById( 'messages-div-header' ), 'img', 'close-help', 'Close this dialog', 'gma-btn' )
		ch.addEventListener( 'click', hideUpdateText, false)

		let pp = addElement(hbp, 'img', 'prev-page', 'Go to previous help page', 'gma-btn' )
		pp.addEventListener( 'click', showPrevHelp, false)
		
		addElement(hbp, 'h2', 'messages-page-title', '', '' )
		let np = addElement(hbp, 'img', 'next-page', 'Go to next help page', 'gma-btn' )
		np.addEventListener( 'click', showNextHelp, false)

		addElement(mdb, 'p', 'help-page-intro', '', '' )
		addElement(mdb, 'ol', 'help-page-body', '', '' )
		addElement(mdb, 'p', 'help-page-footer', '', '' ) 
		//set button actions
		
		egma.addEventListener( 'click', enableDisableGMA, false)
		egma.setAttribute( 'data-enabled', gmaEnabled)

		//append the footer
		let gf = document.getElementById( 'gma-footer' )
		let gv = addElement(gf, 'span', 'gma-version', '', '' )
		let gs = addElement(gf, 'img', 'gma-settings', 'Tweak your settings', 'gma-btn' )
		let gh = addElement(gf, 'img', 'gma-help', 'Help?!?', 'gma-btn' )

		cd.style.visibility = 'hidden'
		st.style.visibility = 'hidden'
		scf.style.visibility = 'hidden'
		shf.style.visibility = 'hidden'
		gv.innerText = 'Google Meet Attendance - v'+chrome.runtime.getManifest().version

		// set the behaviours
		sc.addEventListener( 'change', changeClass, false)				// a change in the drop down field
		cam.addEventListener( 'click', clearPresent, false)	// clear all of the attendance markings
		caf.addEventListener( 'click', clearList, false)		// clear the class list field
		cle.addEventListener( 'click', editClassList, false)				// bulk edit the names in the classlist
		cd.addEventListener( 'click', deleteClass, false)				// delete a named class
		st.addEventListener( 'click', setStartTime, false)					// manually reset the class start time
		scf.addEventListener( 'click', saveCSVFile, false)		// save the class list field to a textfile
		shf.addEventListener( 'click', saveHTMLFile, false)		    // save the class list field to an HTML file
		//document.getElementById( 'class-name' ).addEventListener( 'change', addClass, false)					// save the new named class
		//document.getElementById( 'class-name' ).addEventListener( 'blur', addClass, false)				     	// save the new named class
		ac.addEventListener( 'click', addClass, false)				// clear all of the attendance markings
		ca.addEventListener( 'click', doNotAddClass, false)				// clear all of the attendance markings
		cnf.addEventListener( 'change', notesChanged, false);				// if the user edits the field
		il.addEventListener( 'change', listChanged, false);				// if the user edits the field
		il.addEventListener( 'blur', blurClassList, false)				// bulk edit the names in the classlist
		gv.addEventListener( 'click', showUpdate, false)					// manually reset the class start time
		gs.addEventListener( 'click', showSettings, false)					// open help
		gh.addEventListener( 'click', showInstall, false)					// open help

		gaf.onmousedown = stopProp;
		sc.onmousedown = stopProp;
		cnf.onmousedown = stopProp;
		il.onmousedown = stopProp;
		mdb.onmousedown = stopProp;
		cam.onmousedown = stopProp;
		caf.onmousedown = stopProp;
		cd.onmousedown = stopProp;
		st.onmousedown = stopProp;
		scf.onmousedown = stopProp;
		shf.onmousedown = stopProp;
		dragElement( gaf );
		
		write2log( 'Added Attendance dialog' )
	}

	// add unload event to warn about unsave changes
	window.addEventListener( 'beforeunload' , function (e) {
		write2log( 'Reloaded the page' )
		if ( !gmaEnabled ) return undefined
		let gaf=document.getElementById( 'gma-attendance-fields' ).classList
		if( !gaf.contains( 'meeting-over' ) && !gaf.contains( 'in-meeting' ) ) return undefined
		
		let shf=document.getElementById( 'save-html-file' ), scf=document.getElementById( 'save-csv-file' )
		let shf_is=shf.style.visibility === 'visible'
		let scf_is=scf.style.visibility === 'visible'
		
		shf.classList.remove( 'save-needed' )
		scf.classList.remove( 'save-needed' )
		
		if( _autoSaveHTML && shf_is ){
			shf.style.visibility = 'hidden'
			shf_is=false
			saveHTMLFile()
		}
		else if( shf_is ) {
			shf.classList.add( 'save-needed' )
		}
		
		if( _autoSaveCSV && scf_is ){
			scf.style.visibility = 'hidden'
			scf_is=false
			saveCSVFile()
		}
		else if( scf_is ) {
			scf.classList.add( 'save-needed' )
		}
		if( !shf_is && !scf_is  ) return undefined
		console.log( 'shf: ', shf_is, 'scf: ', scf_is)

		let alrt = 'null message... no longer supported.';

		(e || window.event).returnValue = alrt;
		return alrt;
	} );

	//wait until there is a video DOM element (so that meet code has been selected)
	waitForElement( '[data-in-call]' ,function(){
		createAttendanceFields()
		setClassList( 'select-class' )
		
		let _activeMeetID=document.querySelector( '[data-unresolved-meeting-id]' ).getAttribute( 'data-unresolved-meeting-id' )
		let smids=sessionStorage.getItem( '_activeMeetIDs' )
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
			sessionStorage.setItem( '_arrivalTimes', {} )
		}
		
		chrome.storage.sync.get( [ 'Current-Class-Code' ], function (r) {
			let ccc=sessionStorage.getItem( '_Class4ThisMeet' )||r[ 'Current-Class-Code' ]||'Class-List'
			if(!sessionStorage.getItem( '_Class4ThisMeet' )) sessionStorage.setItem( '_Class4ThisMeet', ccc)
			document.getElementById( 'select-class' ).value = ccc.replace(/ /g, '-' )
			document.getElementById( 'class-delete' ).style.visibility = (ccc==='Class-List' )?'hidden':'visible'
		} )
		document.getElementById( 'class-notes' ).value=sessionStorage.getItem( 'class-notes' )
		//Has the extension been updated?
		check4ExtensionUpdates()

		loadClassNames()
		
		//now wait until they've entered the Meet
		wait4Meet2Start()

	} )
} )()
