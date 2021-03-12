
//Whether or not to create a log...
let _generateLogs=false, _generateFiles='both', _autoSaveHTML=true, _autoSaveCSV=true, _checkPage4Changes=false
let settingsArray=[ 
	{ name: 'auto-clear-checks', type: 'checkbox', title: 'Automatically remove checks from previous Meets', text: 'Remove previous checks:', default_value:true},
	{ name: 'check-frequency', type: 'radio', title: 'Set time interval between attendance checks', text: 'Check attendance every:|10s|20s|30s|1m', default_value: '10s'},
	{ name: 'generate-files', type: 'radio', title: 'Select which reports to generate', text: 'Generate reports:|both|html|csv', default_value: 'both'},
	{ name: 'auto-save-files', type: 'radio', title: 'Automatically save the files at the end of the Meet', text: 'Auto-save:|yes|no', default_value: 'yes'},
	{ name: 'auto-hide-updates', type: 'number', title: 'Automatically close the updates window', text: 'Hide update msg after:', default_value: 10},
	{ name: 'max-num-names', type: 'number', title: 'This is an arbitrary upper limit', text: 'Max names/class:', default_value:256},
	{ name: 'sort-names', type: 'radio', title: 'Set the sort order for the names', text: 'Sort names by:|first|last', default_value:'last'},
	{ name: 'backup-class-lists', type: 'button', title: 'Save a copy of your class names and class lists', text: 'Back-up classes & lists:'},
	{ name: 'generate-log', type: 'checkbox', title: 'Generate a log of key events during your Meet for debugging purposes', text: 'Generate logs:'},
	{ name: 'check-for-page-changes', type: 'checkbox', title: 'Monitor the page to see if anything changed', text: 'Check for DOM changes:'},
	{ name: 'participant-attributes', type: 'input', title: 'Do not change unless recommended by Al', text: 'Attributes to check:', default_value:'data-self-name,data-participant-id,data-requested-participant-id'},
	{ name: 'send-log-to-console', type: 'checkbox', title: 'Also send log messages to console', text: 'Debug messages:'}
]

chrome.storage.sync.get( null, function( r ){
	_generateLogs=r[ 'generate-log' ]
	for(let n in settingsArray){
		let nm =settingsArray[n].name, dv=settingsArray[n].default_value
		if( ( typeof( r[nm] ) === 'undefined' || r[nm] === '' ) && !!dv){
			let ccc={}
			ccc[ nm ] = dv
			r[nm]=dv
			chrome.storage.sync.set(ccc, null )
		}
	}
	//console.log('after: ',r)
	_generateFiles = r[ 'generate-files' ]
	_autoSaveHTML = ( _generateFiles == 'both' || _generateFiles == 'html' ) && ( r[ 'auto-save-files' ] == 'yes' )
	_autoSaveCSV = ( _generateFiles == 'both' || _generateFiles == 'csv' ) && ( r[ 'auto-save-files' ] == 'yes' )
	_checkPage4Changes = r[ 'check-page-for-changes' ]
	if( _generateLogs ){
		write2log( '**** Settings ****')
		write2log( ' - version: ' + chrome.runtime.getManifest().version )
		write2log( ' - generate-log: true (obviously)')
		write2log( ' - auto-clear-checks: ' + r[ 'auto-clear-checks' ] )
		write2log( ' - check-frequency: ' + r[ 'check-frequency' ] )
		write2log( ' - generate-files: ' + r[ 'generate-files' ] )
		write2log( ' - auto-save-files: ' + r[ 'auto-save-files' ] )
		write2log( ' - auto-save-html: ' + _autoSaveHTML )
		write2log( ' - auto-save-csv: ' + _autoSaveCSV )
		write2log( ' - auto-hide-updates: ' + r[ 'auto-hide-updates' ] )	
		write2log( ' - check-for-page-changes: ' + r[ 'check-for-page-changes' ] )	
		write2log( ' - participant-attributes: ' + r[ 'participant-attributes' ] )	
		write2log( ' - send-log-to-console: ' + r[ 'send-log-to-console' ] )	
	}
})

// Functions used in multiple locations so they have to be loaded first


// stop propagation of clicks
function stopProp(e){
	e = e || window.event;
	e.stopPropagation()
}

// add a child element to the parent element
function addElement(p, e, i, ti, cl, tt){
	let de = document.createElement( e )
	if( !!i ) de.id = i
	if( !!ti ) de.title = ti
	if( !!cl ) de.classList.add( cl )
	if( e === 'img' ) de.src = chrome.runtime.getURL( "images/"+i+".png" );
	p.appendChild( de )
	de.innerHTML = tt||''
	return de
}

// show/hide button for the attendance field when the show-gma-attendance-fields button is clicked
function showAttendance( e ){
	let vis = document.getElementById( "gma-attendance-fields").style.display
	if(vis === 'none'){
		document.getElementById( "gma-attendance-fields" ).style.display = 'initial'
		document.getElementById( "show-gma-attendance-fields" ).classList.add( 'showing' )
	}
	else{
		document.getElementById( "gma-attendance-fields" ).style.display = 'none'
		document.getElementById( "show-gma-attendance-fields" ).classList.remove( 'showing' )
	}
	
	e = e || window.event;
	e.preventDefault();
	e.stopPropagation()
}

// pad with a leading zero (for dates & time)
function twod(v){
	return ('0'+Number(v)).slice(-2)
}

// reset the meeting start time
function setStartTime(){
	let now = new Date(), meetingStart = now.getHours()+':'+twod(now.getMinutes())
	sessionStorage.setItem( 'Meeting-start-time', meetingStart )
	document.getElementById( 'start-time' ).title = 'Current start time is: ' + meetingStart
	document.getElementById( 'sp-start-time' ).innerText = meetingStart
	document.getElementById( 'sp-duration' ).innerText=0
	if( !!document.getElementById( 'current-start-time' ) ) document.getElementById( 'current-start-time' ).innerText = meetingStart
	write2log( 'Set Meet start time ' + meetingStart )

}

// update the attendance summary tab
function updateAttendanceSummary(){
	//console.log( 'updateAttendanceSummary' )
	let marked_present = document.querySelectorAll( '[ data-status="✔" ], [ data-status="?" ]' ).length||0
	let new_present = document.querySelectorAll( '[ data-status="?" ]' ).length||0
	let total_invited = document.querySelectorAll( '.student-button' ).length||0
	document.getElementById( 'attendance-present' ).innerHTML = marked_present
	document.getElementById( 'attendance-absent' ).innerHTML = total_invited - marked_present
	document.getElementById( 'attendance-new' ).innerHTML = new_present
	if(!!document.getElementById( 'show-gma-attendance-fields' )) document.getElementById( 'show-gma-attendance-fields' ).title = "Present "+marked_present+' of ' + total_invited + ' participants (' + new_present + ' new)'
}

// contents of the invited-list field have changed
function listChanged(){
	//console.log( 'listChanged' )
	if (!document.getElementById( 'invited-list')) return
	let currentClassCode = sessionStorage.getItem('_Class4ThisMeet')
	let il = document.getElementById( 'invited-list'), ad = document.getElementById( 'gma-attendance-fields')
	let sb=document.querySelectorAll( '.student-button' )||{}
	for ( let wb of sb ){
		wb.classList.add( 'mnbn' ) //might not be needed
	}
	
	let ct = il.value.replace(/[✔\?]*/g,'' ).replace(/(\w)\s*\t\s*|[ ]{2,}(\w)/g,"$1 $2").replace(/^[\t ]*|[\t ]*$/gm,'' ).replace(duplicatedLines, "$1").replace(/\n\s+/g,'\n' ).trim()
	
	let lon = ct.split('\n')
	let ccl = JSON.parse( sessionStorage.getItem( '_studentsAtThisMeet' ) ) || {}
	let ncl = {}, dn, em, matches
	for ( let lot of lon ){
		dn=lot.replace( /\([^\)]*\)/g, '' ).replace( /<[^>]*>/g, '' ).trim()
		matches = lot.match( /<([^>]*?)>/ )
		em=!!matches?matches[1].trim():''
		matches = lot.match( /\(([^\)]*?)\)/ )
		ln=!!matches?matches[1].trim():dn

		let st = !!ccl[ln]?ccl[ln].s:''
		ncl[ln]={s:st}
		if( !document.querySelector( '[data-login-name="'+ln+'"]' ) ){
			addClassButton( ln, dn, em, '' )
			updateAttendanceSummary()
		}
		else{
			document.querySelector('[data-login-name="'+ln+'"]' ).setAttribute( 'data-status', st )
			document.querySelector( '[data-login-name="'+ln+'"]' ).classList.remove('mnbn')
		}
	}
	sessionStorage.setItem( '_studentsAtThisMeet', JSON.stringify(ncl) )
	
	if( document.querySelectorAll( '.student-button' ).length === 0){
		document.getElementById( 'gma-attendance-fields' ).setAttribute('data-save-needed-html', _autoSaveHTML )
		document.getElementById( 'gma-attendance-fields' ).setAttribute('data-save-needed-csv ', _autoSaveCSV )
		
		il.title = 'Pick a class or enter some names'
	}
	else{
		il.value = ct
		ad.classList.remove('empty')
		document.getElementById( 'gma-attendance-fields' ).setAttribute('data-save-needed-html', ( _generateFiles == 'both' || _generateFiles == 'html') )
		document.getElementById( 'gma-attendance-fields' ).setAttribute('data-save-needed-csv', ( _generateFiles == 'both' || _generateFiles == 'csv') )
	}
	nn=document.querySelectorAll( '.mnbn' )||{}
	for ( let wb of nn ){
		//console.log( 'need to delete:', wb )
		document.getElementById( 'student-buttons' ).removeChild(wb)
	}
	updateClassList()
	sortButtons()
	checkNumStudents()
}

// save settings values
function saveSettings(e){
	//console.log( 'saveSettings' )

	let ccc={}
	let tgt=e.target.id
	if(e.target.type==='checkbox'){
		tgv=e.target.checked
	}
	else if(e.target.type==='radio'){
		tgt=e.target.name
		tgv=document.querySelector('[name="'+tgt+'"]:checked' ).value;
	}
	else{
		tgv=e.target.value
		
	}
	ccc[ tgt ] = tgv
	chrome.storage.sync.set( ccc, null )
	write2log( 'Changed settings: ' + tgt + ' = ' + tgv)
	//console.log( 'Changed settings: ' + tgt + ' = ' + tgv)
	if( tgt === 'max-num-names' ) checkNumStudents()
	else if( tgt === 'generate-files' ) {
		document.getElementById( 'gma-attendance-fields' ).setAttribute('data-generate-files', tgv )
		_generateFiles = tgv
	}
	else if( tgt === 'generate-log' ) _generateLogs = tgv
	else if( tgt === 'generate-files' ) _generateFiles = tgv
	else if( tgt === 'auto-save-files' ) {
		_autoSaveHTML = ( _generateFiles == 'both' || _generateFiles == 'html' ) && ( tgv == 'yes' )
		_autoSaveCSV = ( _generateFiles == 'both' || _generateFiles == 'csv' ) && ( tgv == 'yes' )
		data-generate-files
	}
	else if( tgt === 'sort-names' ) listChanged()
}

// start the process that checks every minute to see who is still in the Meet
function startMonitoring(){
	
	//console.log( 'startMonitoring' )

	chrome.storage.sync.get( ['check-frequency' ], function(r){
		let cia = {'10s' : { interval: 10000 }, '20s' : { interval: 20000 }, '30s' : {interval : 30000}, '1m' : { interval : 60000 } }
		let ci = cia[ r[ 'check-frequency' ] ].interval||60000
		//console.log('check-frequency', ci)

		document.getElementById( 'p-attendance-summary' ).classList.add('monitoring-active' )
		document.getElementById( 'p-attendance-summary' ).setAttribute('title', 'Monitoring Attendance' )
		write2log( 'Monitoring started' )
		//monitorWhosThere()
		checkParticipants()
		monitoring = setInterval( checkParticipants, ci*1 )
	})
}

// 'disable' slider was changed
function enableDisableGMA(){
	//console.log( 'enableDisableGMA' )

	gmaEnabled=!gmaEnabled
	document.getElementById( 'enable-gma' ).setAttribute('data-enabled', gmaEnabled)
	write2log( 'enable-gma set to: ' + gmaEnabled )
}


let _arrivalTimes = JSON.parse( sessionStorage.getItem( '_arrivalTimes' ) ) || {}
let monitoring
let gmaEnabled=true

let uiStrings = getMeetUIStrings()
// create regexes
let re_you = new RegExp('^' + uiStrings.you + '$' , "gi" );
let re_replace = new RegExp('^' + uiStrings.you + '$|\\b' + uiStrings.joined + '(\\b)*|(\\b)*' + uiStrings.more + '(\\b)*|(\\b)*' + uiStrings.keep_off + '(\\b)*|' + uiStrings.hide, "gi" );
let duplicatedLines = /^(.*)(\r?\n\1)+$/gim
 
function cleanseInnerHTML(tih){
	if (!tih.querySelector('[data-self-name]')){
		//console.log( 'no data-self name\n', tih.innerHTML )
		return ''
	}
	let nm = tih.querySelector( '[data-self-name]' ).innerHTML 
	if ( !nm ){
		//console.log( 'data-self name is empty\n', tih.innerHTML )
		return ''
	}
	nm=tih.innerHTML
	
	/* 	to remove accented characters... from StackOverFlow
	const str = "Crème Brulée"
	str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
	*/

	let alltext=nm.replace( /<[^>]*?>/ig,'\n' )
		.replace( re_you, '' )
		.replace( re_replace, '' )
		.replace( /\n\s*\n*/gm, '\n' )
		.replace( /(\(|（).*(\)|）)/ig, '' )
		.replace( duplicatedLines, "$1" )
		.trim()
		.split( '\n' )
		
	if( !alltext == alltext[0] ){
		write2log('huh --> ' + nm)
		//console.log('huh --> ' + nm)
	}
	return alltext[0]
}

function getListOfParticipants(){
	//console.log( 'getListOfParticipants' )
	let loid = []
	
	let participants = document.querySelectorAll( '[data-participant-id], [data-requested-participant-id]' )
	//let participants = document.querySelectorAll('[data-self-name],[data-participant-id],[data-requested-participant-id]')
	let now = new Date(), ctime = now.getHours() + ':' + twod( now.getMinutes() )
	let changed = false
	for ( let aa of participants ){
		// parse the innerHTML; remove tagged content, duplicated lines, etc.
		let pn = cleanseInnerHTML( aa )
		// no text --> get the next line
		if( pn === '' )	continue
		let lc = pn.toLowerCase().trim()
		if ( lc.replace( re_you , '' ) == '' ) {
			continue
		}
		if( lc.indexOf( uiStrings.presenting ) >= 0 || lc.indexOf( uiStrings.presentation ) >= 0 ) continue
		let pidr = aa.dataset.participantId||aa.dataset.requestedParticipantId||aa.dataset.initialParticipantId
		if ( !pidr ){
			continue
		}
		pid = pidr.split( '/' )[3]
		// if necessary, add to list of id's
		if ( !loid.includes(pid) ){
			loid.push(pid)
		}
		// if there's no matching entry, add it with arrival time
		let ccl = JSON.parse( sessionStorage.getItem( '_studentsAtThisMeet') ) || {}
		let st=''
		let dln=document.querySelector( '[data-login-name="' + lc + '"]' )
		//console.log( 'lc', lc,  dln )
		if( !dln ){
			//console.log( '_arrivalTimes: new user button', lc )
			addClassButton( '? ' + lc, '', '', '' )
			updateAttendanceSummary()
			document.querySelector( '[data-login-name="' + lc + '"]' ).setAttribute( 'data-arrived', ctime )
			st='?'
			changed = true
		}
		else if ( dln.getAttribute( 'data-status' ) == '' ){
			dln.setAttribute( 'data-status', '✔' )
			st='✔'
			updateAttendanceSummary()
		}
		if( !ccl[ lc ] || !ccl[ lc ].s  ){
			ccl[ lc ] = { s : st }
		}
		sessionStorage.setItem( '_studentsAtThisMeet', JSON.stringify(ccl) )
		
		if(!_arrivalTimes[pid] ){
			let trimmed=aa.outerHTML.replace(/(class|style|jsaction|jsname|jscontroller|jsshadow|jsmodel)="[^"]*"/gm,'' ).replace(/<path.*?<\/path>/g,'_path_' ).replace(/<span.*?<svg.*?<\/svg><\/span>/g,'_svg_' ).replace(/<img[^>]*?>/g,'_img_' ).replace(/\s{2,}/g,' ' ).replace(/\s*>/g,'>')
			write2log( '_arrivalTimes: added new entry: ' + pn + '\tid: ' + pid + '\n' + trimmed )
			_arrivalTimes[pid] = {'name':pn, 'arrived':ctime, 'last_seen':ctime,'stayed':0,'checks':[]}
			_arrivalTimes[pid].checks.push(ctime)
		}
		
		if(aa.outerHTML.indexOf('data-is-anonymous')>-1){
			write2log( '_arrivalTimes: request to join by : ' + pn + '\t data-is-anonymous: ' + aa.dataset.isAnonymous  )
			document.querySelector('[data-login-name="'+lc+'"]' ).classList.add('is-anonymous')
		}
	}
	if( changed ){
		updateClassList()
	}
	return loid
}

let oldtime=''
function checkParticipants(){
	//console.log('checkParticipants')
	let now = new Date(), hr=now.getHours(), min=now.getMinutes(), sec=now.getSeconds(), ctime = hr+':'+twod(min), cts = ctime+':'+twod(sec)
	if(!!document.getElementById( 'show-gma-attendance-fields')){
		document.getElementById( 'show-gma-attendance-fields' ).classList.remove('checking')
		setTimeout(function () {
			document.getElementById( 'show-gma-attendance-fields' ).classList.add('checking')
		}, 100)
	} 

	let changed = false
	document.getElementById( 'p-attendance-summary' ).setAttribute('title', 'Monitoring - last check: '+cts)

	let lop=getListOfParticipants()
	for (let pid of lop){
		let name=_arrivalTimes[pid].name
		let lc=name.toLowerCase()

		_arrivalTimes[pid].last_seen=ctime
		if(!_arrivalTimes[pid].checks.includes(ctime)){
			_arrivalTimes[pid].checks.push(ctime)
		} 
		_arrivalTimes[pid].stayed=_arrivalTimes[pid].checks.length
		let cp=document.querySelector( '[data-login-name="'+lc+'"]' )
		if( cp.getAttribute( 'data-arrived' ) == '' ) cp.setAttribute( 'data-arrived', ctime )
		cp.setAttribute( 'data-last-seen', ctime )
		changed=true
	}
		
	if ( oldtime != ctime ) {
		updateDuration()
		oldtime = ctime
	}
	sessionStorage.setItem( '_arrivalTimes', JSON.stringify( _arrivalTimes ) )
	// if the list changed, a littlehousekeeping and save the changes
	if (changed) {
		document.getElementById( 'gma-attendance-fields' ).setAttribute('data-save-needed-html', ( _generateFiles == 'both' || _generateFiles == 'html') )
		document.getElementById( 'gma-attendance-fields' ).setAttribute('data-save-needed-csv', ( _generateFiles == 'both' || _generateFiles == 'csv') )

		write2log('checkParticipants - list changed')
		updateClassList()
	}
}
	
// update the duration field
function updateDuration(){
	//console.log( 'updateDuration' )
	let now = new Date(), hr=now.getHours(), min=now.getMinutes(), ctime=hr+':'+twod(min)
	stime=(sessionStorage.getItem('Meeting-start-time')||ctime).split(':')
	let duration = hr*60 + min*1 -(stime[0]*60+stime[1]*1)
	document.getElementById( 'sp-duration' ).innerText=duration
}

function write2log(txt){
	if(!_generateLogs) return
	let now = new Date(), hr=now.getHours(), min=now.getMinutes(), ctime=hr+':'+twod(min)
	let plt=sessionStorage.getItem( 'GMA-Log' )||''
	
	// skip duplicate messages
	if( plt.indexOf(ctime + ' - ' + txt ) > -1 ) return
	//otherwise save the log
	sessionStorage.setItem( 'GMA-Log', plt + '\n' + ctime + ' - ' + txt )
	chrome.storage.sync.get( [ 'send-log-to-console' ], function (r) {
		if( r['send-log-to-console' ] ){
			//console.log( 'w2l --> ', txt )
		}
	})
}

// auto hide the class message field
function autoHideAddClassMessage(nn){
	let delay=nn||1500
	document.getElementById( 'add-class-message' ).style.display='block'
	window.setTimeout(function(){
		document.getElementById( 'add-class-message' ).style.display='none'
		document.getElementById( 'gma-class-list-header' ).style.display='block'
		document.getElementById( 'gma-add-class' ).style.display='none'
		document.getElementById( 'student-buttons' ).style.display='flex'
		document.getElementById( 'add-class-message' ).classList.remove('bold')
	}, delay)
}

function checkNumStudents(){
	chrome.storage.sync.get( ['max-num-names' ], function(r){
		if( !r['max-num-names' ] ) r['max-num-names' ]=256
		let nn=document.querySelectorAll( '.student-button' ).length
		if ( nn >= r['max-num-names' ]*1 ) {
			document.getElementById( 'gma-attendance-fields' ).setAttribute('data-at-max-students', true)
			document.getElementById( 'invited-list' ).setAttribute('title','No more students should be added... \nSee the Settings tab')
			document.getElementById( 'add-class-message' ).innerHTML="Based on the Settings tab,<br/>no more students can/should be added!"
			autoHideAddClassMessage(15000)
		}
		else{
			document.getElementById( 'gma-attendance-fields' ).setAttribute('data-at-max-students', false)
			document.getElementById( 'invited-list' ).setAttribute('title','Pick, paste or type your class list into this field')
		}
	})
}
	
function backupClassLists(){
	//console.log( 'backupClassLists' )

	let now = new Date(), d = now.getDate(), m = now.getMonth()+1, y = now.getFullYear()
	let ctime = now.getHours()+':'+twod(now.getMinutes())
	let cdate = y+'-'+twod(m)+'-'+twod(d)
	
	chrome.storage.sync.get( null , function( r ){
		let cls = r[ '__GMA_ClassLists' ]
		let sa = r[ 'saved-attendance' ]
		let vts={}
		vts[ 'current class lists' ] = cls
		vts[ 'meet lists' ] = sa
		let filename = 'Class Lists BU (' + cdate + ' ).txt'
		let blob = new Blob( [ JSON.stringify( vts ) ], { type: 'text/plain;charset=utf-8' } )
		let temp_a = document.createElement( 'a' )
		temp_a.download = filename
		temp_a.href = window.webkitURL.createObjectURL( blob )
		temp_a.click()
		write2log('Class names and lists backed up to ' + filename )
	})
}
function backupOldClassLists(){
	//console.log( 'backupOldClassLists' )

	let now = new Date(), d = now.getDate(), m = now.getMonth()+1, y = now.getFullYear()
	let ctime = now.getHours()+':'+twod(now.getMinutes())
	let cdate = y+'-'+twod(m)+'-'+twod(d)
	
	chrome.storage.sync.get( null , function( r ){
		
		let vts={}
		let cls = r[ '__Class-Info' ]
		let classInfo = ( !cls||cls === '' )?{}:JSON.parse(cls)
		for (let [ code, name ] of Object.entries( classInfo )) {
			let cc=code.replace( / /g, '-' ).trim()
			if( !r[ '__Class-' + cc ] ) continue
			vts[ cc ] = r[ '__Class-' + cc ].split( '\n' ).join( ';' )
		}
		vts[ 'meet lists' ] = r[ 'saved-attendance' ]
		
		let filename = 'Old Class Lists BU (' + cdate + ' ).txt'
		let blob = new Blob( [ JSON.stringify( vts ) ], { type: 'text/plain;charset=utf-8' } )
		let temp_a = document.createElement( 'a' )
		temp_a.download = filename
		temp_a.href = window.webkitURL.createObjectURL( blob )
		temp_a.click()
		write2log('Old class names and lists backed up to ' + filename )
	})
}