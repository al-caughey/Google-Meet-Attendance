
//Whether or not to create a log...
let _generateLogs=false
chrome.storage.sync.get(null, function(r){
	_generateLogs=r['generate-log']
	console.log(r)
	if( _generateLogs ){
		
		write2log('**** Settings ****')
		write2log(' - version: ' + chrome.runtime.getManifest().version )
		write2log(' - generate-log: true (obviously)')
		write2log(' - auto-clear-checks: ' + r['auto-clear-checks'] )
		write2log(' - auto-save-html: ' + r['auto-save-html'] )
		write2log(' - auto-save-csv: ' + r['auto-save-csv'] )
		write2log(' - auto-hide-updates: ' + r['auto-hide-updates'] )		
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

// save settings vallues
function saveSettings(e){
	let ccc={}
	let tgt=e.target.id, tgv=e.target.type==='checkbox'?e.target.checked:e.target.value
	ccc[ tgt ] = tgv
	chrome.storage.sync.set( ccc, null )
	write2log( 'Changed settings: ' + tgt + ' = ' + tgv)

}

// update the attendance status of the invitees
function startMonitoring(){
	document.getElementById('p-attendance-summary').classList.add('monitoring-active')
	document.getElementById('p-attendance-summary').setAttribute('title', 'Monitoring Attendance')
	write2log( 'Monitoring started' )
	monitorWhosThere()
	monitoring = setInterval(monitorWhosThere, 60000)	
}


let _arrivalTimes=JSON.parse(sessionStorage.getItem('_arrivalTimes'))||{}
let monitoring

let uiStrings = getMeetUIStrings()
// create regexes
let re_replace = new RegExp('(\\b)*'+uiStrings.you+'\n|(\\b)*'+uiStrings.joined+'(\\b)*|(\\b)*'+uiStrings.more+'(\\b)*|'+uiStrings.hide, "gi");
//console.log(re_replace)
let duplicatedLines = /^(.*)(\r?\n\1)+$/gm

function cleanseInnerHTML(tih){
	return tih.innerHTML.replace(/<[^>]*?>/ig,'\n')
		.replace(re_replace,'')
		.replace(/\n\s*\n*/gm,'\n')
		.replace(/(\(|（).*(\)|）)/ig,'')
		.replace(duplicatedLines, "$1")
		.trim()
}

function getListOfParticipants(){
	let loid=[]
	let participants = document.querySelectorAll('[data-participant-id],[data-requested-participant-id]')
	let now = new Date(), ctime = now.getHours()+':'+twod(now.getMinutes())
	for (let aa of participants){
		// parse the innerHTML; remove tagged content, duplicated lines, etc.
		//console.log(aa)
		let pn = cleanseInnerHTML(aa)

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
			console.log(aa)
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
	
	let lop=getListOfParticipants()
	let now = new Date(), hr=now.getHours(), min=now.getMinutes(), ctime = hr+':'+twod(min)
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