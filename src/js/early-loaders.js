
//Whether or not to create a log...
let _generateLogs=false, _autoSaveHTML=true, _autoSaveCSV=true
let settingsArray=[ 
	{name:'auto-clear-checks',type:'checkbox',title:'Automatically remove checks from previous Meet', text:'Automatically remove previous Meet checks (recommended):', default_value:true},
	{name:'auto-save-html',type:'checkbox',title:'Automatically save HTML file', text:'Auto-save the HTML file:', default_value:true},
	{name:'auto-save-csv',type:'checkbox',title:'Automatically save CSV file', text:'Auto-save the CSV file:', default_value:true},
	{name:'auto-hide-updates',type:'number',title:'Automatically close the updates window', text:'Auto-hide the updates window after:', default_value:10},
	{name:'max-num-names',type:'number',title:'This is an arbitrary upper limit', text:'Maximum number of names in a class:', default_value:256},
	{name:'sort-names',type:'radio',title:'Set the sort order for the names', text:'Sort names by:|first|last|none', default_value:'none'},
	{name:'backup-class-lists',type:'button',title:'Save a copy of your class names and class lists', text:'Back-up class names and lists:'},
	{name:'generate-log',type:'checkbox',title:'Generate a log of key events during your Meet for debugging purposes', text:'Generate logs (only if requested by Al):'},
]

chrome.storage.sync.get(null, function(r){
	_generateLogs=r['generate-log']
	for(let n in settingsArray){
		let nm=settingsArray[n].name, dv=settingsArray[n].default_value
		if( ( typeof(r[nm]) === 'undefined' || r[nm] === '' ) && !!dv){
			let ccc={}
			ccc[ nm ] = dv
			r[nm]=dv
			chrome.storage.sync.set(ccc, null )
		}
	}
	//console.log('after: ',r)
	if( _generateLogs ){
		write2log('**** Settings ****')
		write2log(' - version: ' + chrome.runtime.getManifest().version )
		write2log(' - generate-log: true (obviously)')
		write2log(' - auto-clear-checks: ' + r['auto-clear-checks'] )
		write2log(' - auto-save-html: ' + r['auto-save-html'] )
		write2log(' - auto-save-csv: ' + r['auto-save-csv'] )
		write2log(' - auto-hide-updates: ' + r['auto-hide-updates'] )		
	}
	_autoSaveHTML=r['auto-save-html']
	_autoSaveCSV=r['auto-save-csv']
})

// Functions used in multiple locations so they have to be loaded first


// stop propagation of clicks
function stopProp(e){
	e = e || window.event;
	e.stopPropagation()
}

// add a child element to the parent element
function addElement(p, e, i, ti, cl, tt){
	let de = document.createElement(e)
	de.id = i
	if(!!ti) de.title = ti
	if(!!cl) de.classList.add(cl)
	if(e === 'img') de.src = chrome.runtime.getURL("images/"+i+".png");
	p.appendChild(de)
	de.innerHTML=tt||''
}

// show/hide button for the attendance field when the show-gma-attendance-fields button is clicked
function showAttendance( e ){
	let vis = document.getElementById("gma-attendance-fields").style.display
	if(vis === 'none'){
		document.getElementById("gma-attendance-fields").style.display = 'initial'
		document.getElementById("show-gma-attendance-fields").classList.add('showing')
	}
	else{
		document.getElementById("gma-attendance-fields").style.display = 'none'
		document.getElementById("show-gma-attendance-fields").classList.remove('showing')
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
	sessionStorage.setItem('Meeting-start-time', meetingStart)
	document.getElementById('start-time').title = 'Current start time is: ' + meetingStart
	document.getElementById('sp-start-time').innerText = meetingStart
	document.getElementById('sp-duration').innerText=0
	if(!!document.getElementById('current-start-time')) document.getElementById('current-start-time').innerText = meetingStart
	write2log( 'Set Meet start time ' + meetingStart )

}

// update the attendance summary tab
function updateAttendanceSummary(){
	let cl=document.getElementById('invited-list').value
	let marked_present = (!!cl.match(/[✔\?]/g))?cl.match(/[✔\?]/g).length:0
	let total_invited = (!!cl.replace(/\n\n/gm,'\n').match(/[\n]/g))?cl.replace(/\n\n/gm,'\n').match(/[\n]/g).length:0
	document.getElementById('attendance-summary').innerHTML = marked_present+' of ' +(total_invited+1)+ ' participants'
	if(!!document.getElementById('show-gma-attendance-fields')) document.getElementById('show-gma-attendance-fields').title = "Present "+marked_present+' of ' +(total_invited+1)+ ' participants'
}

// contents of the invited-list field have changed
function listChanged(){
	if (!document.getElementById('invited-list')) return

	let currentClassCode = sessionStorage.getItem('_Class4ThisMeet')
	let il = document.getElementById('invited-list'), ad = document.getElementById('gma-attendance-fields'), st = document.getElementById('save-csv-file'), ht = document.getElementById('save-html-file')
	chrome.storage.sync.get(['sort-names'], function(r){
		
		let sno=r['sort-names']||'none'
		let sortOrder='sortNamesBy'+sno
		let ct = il.value.replace(/✔[ ]{2,}/g,'✔ ').replace(/(\w)\s*\t\s*|[ ]{2,}(\w)/g,"$1 $2").replace(/\?[ ]{2,}/g,'\? ').replace(/^[\t ]*|[\t ]*$/gm,'').replace(duplicatedLines, "$1").replace(/\n\s+/g,'\n').trim()
		if(sno==='first'){
			ct=ct.split('\n').sort(sortNamesByFirst).join('\n')
		}
		else if(sno==='last'){
			ct=ct.split('\n').sort(sortNamesByLast).join('\n')
		}
		
		if(ct === ''){
			ad.classList.add('empty')
			st.style.visibility = 'hidden'
			ht.style.visibility = 'hidden'
			il.title = 'Pick a class or enter some names'
		}
		else{
			il.value = ct
			ad.classList.remove('empty')
			let gaf=document.getElementById('gma-attendance-fields').classList				
			st.style.visibility = gaf.contains('meeting-over') || gaf.contains('in-meeting') ? 'visible' : 'hidden'
			ht.style.visibility = gaf.contains('meeting-over') || gaf.contains('in-meeting') ? 'visible' : 'hidden'
			updateAttendanceSummary()
		}
		let ccc={}
		ccc['__Class-'+currentClassCode]=ct
		chrome.storage.sync.set(ccc, null )
		
		checkNumStudents()
	})
}

// save settings vallues
function saveSettings(e){
	let ccc={}
	let tgt=e.target.id
	if(e.target.type==='checkbox'){
		tgv=e.target.checked
	}
	else if(e.target.type==='radio'){
		tgt=e.target.name
		tgv=document.querySelector('[name="'+tgt+'"]:checked').value;
	}
	else{
		tgv=e.target.value
		
	}
	ccc[ tgt ] = tgv
	chrome.storage.sync.set( ccc, null )
	write2log( 'Changed settings: ' + tgt + ' = ' + tgv)
	console.log( 'Changed settings: ' + tgt + ' = ' + tgv)
	if( tgt === 'max-num-names' ) checkNumStudents()
	else if( tgt === 'generate-log' ) _generateLogs=tgv
	else if( tgt === 'auto-save-html' ) _autoSaveHTML=tgv
	else if( tgt === 'auto-save-csv' ) _autoSaveCSV=tgv
	else if( tgt === 'sort-names' ) listChanged()
}

// start the process that checks every minute to see who is still in the Meet
function startMonitoring(){
	document.getElementById('p-attendance-summary').classList.add('monitoring-active')
	document.getElementById('p-attendance-summary').setAttribute('title', 'Monitoring Attendance')
	write2log( 'Monitoring started' )
	monitorWhosThere()
	monitoring = setInterval(monitorWhosThere, 60000)	
}

// 'disable' slider was changed
function enableDisableGMA(){
	gmaEnabled=!gmaEnabled
	document.getElementById('enable-gma').setAttribute('data-enabled', gmaEnabled)
	write2log( 'enable-gma set to: ' + gmaEnabled )
}


let _arrivalTimes=JSON.parse(sessionStorage.getItem('_arrivalTimes'))||{}
let monitoring
let gmaEnabled=true

let uiStrings = getMeetUIStrings()
// create regexes
//let re_replace = new RegExp('(\\b)*'+uiStrings.you+'\n|(\\b)*'+uiStrings.joined+'(\\b)*|(\\b)*'+uiStrings.more+'(\\b)*|'+uiStrings.hide, "gi");
let re_replace = new RegExp('^'+uiStrings.you+'$|\\b'+uiStrings.joined+'(\\b)*|(\\b)*'+uiStrings.more+'(\\b)*|(\\b)*'+uiStrings.keep_off+'(\\b)*|'+uiStrings.hide, "gi");
//console.log(re_replace)
let duplicatedLines = /^(.*)(\r?\n\1)+$/gm

function cleanseInnerHTML(tih){
	if (!tih.querySelector('[data-self-name]')){
		console.log('no data-self name\n'+tih)
		return ''
	}
	let nm=tih.querySelector('[data-self-name]').innerHTML
	if (!nm){
		return ''
	}
	/*
	to remove accented characters... from StackOverFlow
	const str = "Crème Brulée"
	str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
	*/

	return nm.replace(/<[^>]*?>/ig,'\n')
		.replace(re_replace,'')
		.replace(/\n\s*\n*/gm,'\n')
		.replace(/(\(|（).*(\)|）)/ig,'')
		.replace(duplicatedLines, "$1")
		.trim()
		.split('\n')[0]
}

function getListOfParticipants(){
	let loid=[]
	let participants = document.querySelectorAll('[data-participant-id],[data-requested-participant-id]')
	//let participants = document.querySelectorAll('[data-self-name]')
	let now = new Date(), ctime = now.getHours()+':'+twod(now.getMinutes())
	for (let aa of participants){
		// parse the innerHTML; remove tagged content, duplicated lines, etc.
		let pn= cleanseInnerHTML(aa)
		// no text --> get the next line
		if(pn === '')	continue
		let lc = pn.toLowerCase().trim()
		if( lc.indexOf(uiStrings.presenting) >= 0 || lc.indexOf(uiStrings.presentation) >= 0) continue
		let pidr=aa.dataset.participantId||aa.dataset.requestedParticipantId||aa.dataset.initialParticipantId, pid=pidr.split('/')[3]
		if(aa.outerHTML.indexOf('data-is-anonymous')>-1){
			write2log( '_arrivalTimes: request to join by : ' + pn + '\t data-is-anonymous: ' + aa.dataset.isAnonymous  )
			continue
		}
		// if necessary, add to list of id's
		if ( !loid.includes(pid) ){
			loid.push(pid)
		}
		// if there's no matching entry, add it with arrival time
		if(!_arrivalTimes[pid]){
			let trimmed=aa.outerHTML.replace(/(class|style|jsaction|jsname|jscontroller|jsshadow|jsmodel)="[^"]*"/gm,'').replace(/<path.*?<\/path>/g,'_path_').replace(/<span.*?<svg.*?<\/svg><\/span>/g,'_svg_').replace(/<img[^>]*?>/g,'_img_').replace(/\s{2,}/g,' ').replace(/\s*>/g,'>')
			write2log( '_arrivalTimes: added new entry: ' + pn + '\tid: ' + pid + '\n' + trimmed )
			_arrivalTimes[pid] = {'name':pn, 'arrived':ctime, 'last_seen':ctime,'stayed':0,'checks':[]}
			_arrivalTimes[pid].checks.push(ctime)
		}
	}
	return loid
}

// update the duration field
function updateDuration(){
	let now = new Date(), hr=now.getHours(), min=now.getMinutes(), ctime=hr+':'+twod(min)
	stime=(sessionStorage.getItem('Meeting-start-time')||ctime).split(':')
	let duration = hr*60 + min*1 -(stime[0]*60+stime[1]*1)
	document.getElementById('sp-duration').innerText=duration
}

function monitorWhosThere(){
	//console.log('monitorWhosThere')
	//first get the names
	
	if(!!document.getElementById('show-gma-attendance-fields')){
		document.getElementById('show-gma-attendance-fields').classList.remove('checking')
		setTimeout(function () {
			document.getElementById('show-gma-attendance-fields').classList.add('checking')
		}, 100)
	} 
	let lop=getListOfParticipants()
	let now = new Date(), hr=now.getHours(), min=now.getMinutes(), sec=now.getSeconds(), ctime = hr+':'+twod(min), cts = ctime+':'+twod(sec)
	document.getElementById('p-attendance-summary').setAttribute('title', 'Monitoring - last check: '+cts)

	write2log( 'monitor ' + lop.length + ' current names' )
	for (let pid of lop){
		_arrivalTimes[pid].stayed++
		_arrivalTimes[pid].last_seen=ctime
		if(!_arrivalTimes[pid].checks.includes(ctime)) _arrivalTimes[pid].checks.push(ctime)
	}
	let ats=JSON.stringify(_arrivalTimes)
	sessionStorage.setItem('_arrivalTimes', ats)
	updateDuration()
}

function write2log(txt){
	if(!_generateLogs) return
	let now = new Date(), hr=now.getHours(), min=now.getMinutes(), ctime=hr+':'+twod(min)
	let plt=sessionStorage.getItem('GMA-Log')||''
	
	// skip duplicate messages
	if( plt.indexOf(ctime + ' - ' + txt)>-1 ) return
	//otherwise save the log
	sessionStorage.setItem('GMA-Log', plt + '\n' + ctime + ' - ' + txt )
}

// auto hide the class message field
function autoHideAddClassMessage(nn){
	let delay=nn||1500
	document.getElementById('add-class-message').style.display='block'
	window.setTimeout(function(){
		document.getElementById('add-class-message').style.display='none'
		document.getElementById('gma-class-list-header').style.display='block'
		document.getElementById('gma-add-class').style.display='none'
		document.getElementById('invited-list').style.display='block'
		document.getElementById('add-class-message').classList.remove('bold')
	}, delay)
}

function checkNumStudents(){
	chrome.storage.sync.get(['max-num-names'], function(r){
		if( !r['max-num-names']) r['max-num-names']=256
		let nn=document.getElementById('invited-list').value.split('\n').length
		if ( nn >= r['max-num-names']*1 ) {
			document.getElementById('gma-attendance-fields').setAttribute('data-at-max-students', true)
			document.getElementById('invited-list').setAttribute('title','No more students should be added... \nSee the Settings tab')
			document.getElementById('add-class-message').innerHTML="Based on the Settings tab,<br/>no more students can/should be added!"
			autoHideAddClassMessage(15000)
		}
		else{
			document.getElementById('gma-attendance-fields').setAttribute('data-at-max-students', false)
			document.getElementById('invited-list').setAttribute('title','Pick, paste or type your class list into this field')
		}
	})
}
		
function backupClassLists(){

	let now = new Date(), d = now.getDate(), m = now.getMonth()+1, y = now.getFullYear()
	let ctime = now.getHours()+':'+twod(now.getMinutes())
	let cdate = y+'-'+twod(m)+'-'+twod(d)
	
	chrome.storage.sync.get(null, function(r){
		
		let txt=''
		let cls = r['__Class-Info']
		let classInfo = (!cls||cls === '')?{}:JSON.parse(cls)
		for (let [code, name] of Object.entries(classInfo).sort()) {
			txt+=name+':\n'
			txt+= r[ '__Class-'+code ]+'\n\n'
		}
		let filename='Class Lists BU ('+cdate+').txt'
		let blob = new Blob( [txt] , {type: 'text/plain;charset=utf-8'})
		let temp_a = document.createElement("a")
		temp_a.download = filename
		temp_a.href = window.webkitURL.createObjectURL(blob)
		temp_a.click()

		write2log('Class names and lists backed up to ' + filename )

	})
}
function sortNamesByFirst(a, b){
	let aa = a.toLowerCase().replace(/[?✔] /,''), bb = b.toLowerCase().replace(/[?✔] /,'')

	let af = ( aa.indexOf(',') > -1 ) ? aa.split(',')[1].trim() : aa
	let al = ( aa.indexOf(',') > -1 ) ? aa.split(',')[0].trim() : ''
	let bf = ( bb.indexOf(',') > -1 ) ? bb.split(',')[1].trim() : bb
	let bl = ( bb.indexOf(',') > -1 ) ? bb.split(',')[0].trim() : ''
	return af < bf ? -1 : af > bf ? 1 : ( al < bl ? -1 : al > bl ? 1 : 0 )
}
function sortNamesByLast(a, b){
	let aa=a.toLowerCase().replace(/[?✔]+ /g,'').replace(/\[[^\]]*?\]/g,'').replace(/\([^\)]*?\)/g,'').trim(), bb=b.toLowerCase().replace(/[?✔]+ /g,'').replace(/\[[^\]]*?\]/g,'').replace(/\([^\)]*?\)/g,'').trim()

	let al = ( aa.indexOf(',') > -1 ) ? aa.split(',')[0].trim() : [...aa.split(' ')].pop().trim()
	let af = ( aa.indexOf(',') > -1 ) ? aa.split(',')[1].trim() : aa
	let bl = ( bb.indexOf(',') > -1 ) ? bb.split(',')[0].trim() : [...bb.split(' ')].pop().trim()
	let bf = ( bb.indexOf(',') > -1 ) ? bb.split(',')[1].trim() : bb
	return al < bl ? -1 : al > bl ? 1 : (af < bf ? -1 : af > bf ? 1 : 0)
}