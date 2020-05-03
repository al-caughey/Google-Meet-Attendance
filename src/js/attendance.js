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

;(function() {
	
	// NB - this is still a very early prototype of this extension...  
	// Please send feedback to allan.caughey@ocdsb.ca

	let currentClassCode=localStorage.getItem('Current-Class-Code')
	if (!currentClassCode||currentClassCode===''||currentClassCode==='null') {
		localStorage.setItem('Current-Class-Code','Class-List')
		currentClassCode='Class-List'
	}
	// remove any spaces from the class code
	currentClassCode=currentClassCode.replace(/ /g,'-')
	localStorage.setItem('Current-Class-Code',currentClassCode.replace(/ /g,'-'))
	// remove any spaces from the LS key names
	for (var key in localStorage){
		let kns=key.replace(/ /g,'-')
		if(kns===key) continue
		// old key name had spaces
		localStorage.setItem(kns,localStorage.getItem(key))
		localStorage.removeItem(key);
	}
	let classInfo=localStorage.getItem('__Class-Info')
	if (!classInfo) {
		let ci={}
		ci['Class-List']='Class List'
		if (currentClassCode!=='Class-List'){
			ci[currentClassCode]=currentClassCode
		}
		localStorage.setItem('__Class-Info',JSON.stringify(ci))
	}
	else{
		let ci=JSON.parse(classInfo)
		if(!ci[currentClassCode]){
			ci[currentClassCode]=currentClassCode
			localStorage.setItem('__Class-Info',JSON.stringify(ci))
		}
	}

	// not a full localization... just the messages from Meet; not the extension UI
	const translations={
		en:{ presenting:"presenting", presentation:"presentation", hide:"(show|hide) participant", you:"you", joined:"(has |)joined", more:"and \\d*.*"},
		fr:{ presenting:"présentez", presentation:"présentation", hide:"(show|hide) participant", you:"vous", joined:"(participe|à l'appel[.])", more:"et \\d* ont rejoint l'appel"},
		de:{ presenting:"präsentation", presentation:"blidschirm", hide:"(show|hide) participant", you:"ich", joined:"nimmt teil", more:"and \\d* more"},
		nl:{ presenting:"presentatie", presentation:"presenteert", hide:"(show|hide) participant", you:"jij", joined:"neemt( nu | )deel", more:"and \\d* more"},
		br:{ presenting:"apresentando", presentation:"apresentação", hide:"(show|hide) participant", you:"you", joined:"joined", more:"and \\d* more"},
		es:{ presenting:"presenting", presentation:"presentación", hide:"(show|hide) participant", you:"tú", joined:"se ha unido", more:"y \\d* personas más se han unido"},
		pt:{ presenting:"apresentando", presentation:"apresentação", hide:"(show|hide) participant", you:"eu", joined:"aderiu( à chamada|)", more:"and \\d* more"},
		it:{ presenting:"presentando", presentation:"presentazione", hide:"(show|hide) participant", you:"tu", joined:"(sta partecipando|partecipa)", more:"e altri \\d* stanno partecipando"},
	}	

	// return strings based on language
	function getStrings(){
		let lang=document.documentElement.lang.split('-')[0]||'en'  
		if(!translations[lang]) lang='en'
		return translations[lang]
	}

	// cursory localization
	let strings=getStrings()
	let old_np=0 
	// create regexes
	//let re_replace = new RegExp('\\b'+strings.you+'\n|\\b'+strings.joined+'\\b|\\b'+strings.more+'\\b', "gi");
	let re_replace = new RegExp('\\b'+strings.you+'\n|\\b'+strings.joined+'\\b|\\b'+strings.more+'\\b|'+strings.hide, "gi");
	let duplicatedLines = /^(.*)(\r?\n\1)+$/gm

	
	// simple function that waits until a specific element exists in the DOM...
	// (adapted from Stack Overflow
	function waitForElement(elementPath, callBack){
		window.setTimeout(function(){
			let itExists=document.querySelector(elementPath)
			if(!itExists ||itExists.length===0){
				waitForElement(elementPath, callBack);
			}
			else{
				callBack(elementPath, itExists);
			}
		},100)
	}
	// build the select/options for the list of classes
	function setClassList(p){
		function addOption(t,v){
			let o=document.createElement('option')
			o.innerText=t
			o.value=v.replace(/ /g,'-')
			if (v==='') o.disabled='disabled'
			pe.appendChild(o)
		}
		let pe=document.getElementById(p)
		addOption('Class List','Class List')
		let cls=localStorage.getItem('__Class-Info')
		let classInfo=(!cls||cls==='')?{}:JSON.parse(cls)
		for (let [code, name] of Object.entries(classInfo)) {
			if(name=='Class List') continue
			addOption(name, code)
		}
		addOption('──────────','')
		addOption('Add','+')
		addOption('Reset','-')
	}

	// read a class list from a text file
	function readFile(e) {
		let fn = e.target.files[0];
		if (!fn) return;
		let reader = new FileReader();
		reader.onload = function(e) {
			let fc = e.target.result.replace(/^\s*([✔\?])*\s*/gm,'')
			document.getElementById('invited-list').value=fc
			document.getElementById('attendance-div').classList.remove('empty')
			localStorage.setItem('__Class-'+currentClassCode, fc)
		};
		reader.readAsText(fn);
		document.getElementById('read-file').value='' // so that it changes next click 
		
		let currentClassCode=localStorage.getItem('Current-Class-Code')

	}
	// pad with a leading zero (for dates & time)
	function twod(v){
		return ('0'+Number(v)).slice(-2)
	}

	// save the class info to the CSV file
	function saveCSVFile(){
		
		let today = new Date(), d=today.getDate(),m=today.getMonth()+1,y=today.getFullYear()
		let cdate=y+'-'+twod(m)+'-'+twod(d)
		let cdd = document.getElementById("select-class"), cn= cdd.options[cdd.selectedIndex].text;
		// prepend file outputs with UTF-8 BOM
		let header='\ufeff'+'Attendance for: '+cn+' on '+cdate+'\n\n'+'Names'+'\t'+cdate+' '+sessionStorage.getItem('Meeting-start-time')+'\t'+'Arrival time'+'\n'
		let joined = /^\s*([✔\?])(\s*)(.*)$/gm
		let txt=document.getElementById('invited-list').value.replace(joined, "$3"+'\t'+"$1")
		for (let nn in _arrivalTimes){
			let re_name= new RegExp('('+nn+'.*)', 'i')
			txt=txt.replace(re_name, '$1'+'\t'+_arrivalTimes[nn])
		}
		let blob = new Blob([header+txt], {type: 'text/plain;charset=utf-8'})
		let temp_a = document.createElement("a")
    	temp_a.download = cn+' ('+cdate+').csv'
		temp_a.href = window.webkitURL.createObjectURL(blob)
		temp_a.click()

		document.getElementById('save-attendance-file').style.visibility='hidden'
	}
	
	// save a class name to the drop down list
	function addClass(){
		let cn=document.getElementById('class-name').value.trim()
		let cc=cn.replace(/ /g,'-')

		let hdr=document.getElementById("select-class")
		let num=hdr.options.length-3
		let no = document.createElement("option");
		no.text = cn;
		no.value = cc;
		hdr.options.add(no, num);
		hdr.value=cc;
		localStorage.setItem('Current-Class-Code', cc)
		let cls=localStorage.getItem('__Class-Info')
		let classInfo=(!cls||cls==='')?{'Class-List':'Class List'}:JSON.parse(cls)||{}
		classInfo[cc]=cn
		localStorage.setItem('__Class-Info', JSON.stringify(classInfo))
		document.getElementById('class-name').classList.remove('add-class')
		document.getElementById('class-delete').style.visibility='visible'
		document.getElementById('attendance-div').classList.add('empty')
		document.getElementById('select-class').style.display='inline-block'
		document.getElementById('read-file-label').style.visibility='visible'
		document.getElementById('class-name').style.display='none'
	}
	// delete a class from the drop-down & LS variables
	function deleteClass(){
		let cn=document.getElementById('class-name')
		let ct=cn.value.trim()
		if (ct==='') return
		if(!confirm('Are you sure you want to delete this class: `'+ct+'`?  There is no undo!')) return
		let cc=ct.replace(/ /g,'-')
		let classInfo=JSON.parse(localStorage.getItem('__Class-Info'))||{}
		delete classInfo[cc] 
		localStorage.setItem('__Class-Info', JSON.stringify(classInfo))
		localStorage.setItem('Current-Class-Code', 'Class-List')
		localStorage.removeItem('__Class-'+cc)
		let csl = document.getElementById("select-class");
		csl.remove(csl.selectedIndex);
		cn.value='Class List'
		document.getElementById('select-class').value='Class-List'
		document.getElementById('invited-list').value=''
		document.getElementById('class-delete').style.visibility='hidden'
		
		changeClass()
		old_np=0 
	}
	// pick new class from drop-down
	function changeClass(){
		
		let currentClassCode=document.getElementById('select-class').value	
		if(currentClassCode==='+'){
			addClassInfo()
			return
		}
		else if(currentClassCode==='-'){
			resetClassInfo()
			return
		}
		let classInfo=JSON.parse(localStorage.getItem('__Class-Info'))||{}
		let currentClassName=classInfo[currentClassCode]
		document.getElementById('class-name').value=currentClassName

		localStorage.setItem('Current-Class-Code', currentClassCode)
		let classNames=localStorage.getItem('__Class-'+currentClassCode)||''
		document.getElementById('invited-list').value=classNames.replace(/\n\s+/g,'\n')
		document.getElementById('class-delete').style.visibility='visible'
		if(classNames=='') 
			document.getElementById('attendance-div').classList.add('empty')
		else
			document.getElementById('attendance-div').classList.remove('empty')
		document.getElementById('save-attendance-file').style.visibility='hidden'
		old_np=0 
		if(currentClassCode=='Class-List') document.getElementById('class-delete').style.visibility='hidden'
	}
	// called when add is selected from the drop-down
	function addClassInfo(){
		document.getElementById('select-class').style.display='none'
		document.getElementById('class-name').style.display='inline-block'
		document.getElementById('class-name').value=''
		document.getElementById('class-name').classList.add('add-class')
		document.getElementById('invited-list').value=''
		document.getElementById('class-delete').style.visibility='hidden'
		document.getElementById('read-file-label').style.visibility='hidden'
		document.getElementById('class-name').select()
	}
	// called when reset is selected from the drop-down
	function resetClassInfo(){
		if(!confirm('Are you sure you want to delete *all* of your class info?  There is no undo!')){
			document.getElementById('select-class').value=localStorage.getItem('Current-Class-Code')
			return
		} 
		localStorage.setItem('Current-Class-Code', 'Class-List')
		localStorage.setItem('__Class-Info','')
		document.getElementById('select-class').innerHTML=''
		setClassList('select-class')
		
		let ccn=localStorage.getItem('Current-Class-Code').replace(/ /g,'-')
		document.getElementById('select-class').value=ccn	

		document.getElementById('invited-list').value=''
		document.getElementById('class-delete').style.visibility='hidden'
		document.getElementById('attendance-div').classList.add('empty')
		for (var key in localStorage){
			if(key.indexOf('__Class')===0){
			   localStorage.removeItem(key);
			}
		}
	}
	// load the names associated with a class from the LS variables
	function loadClassNames(){
		let currentClassCode=localStorage.getItem('Current-Class-Code')
		
		let classNames=localStorage.getItem('__Class-'+currentClassCode)||''
		document.getElementById('invited-list').value=classNames.replace(/\n\s+/g,'\n')
		let cls=localStorage.getItem('__Class-Info')
		let classInfo=(cls==='')?{'Class-List':'Class List'}:JSON.parse(cls)||{}
		let className=(!classInfo||!classInfo[currentClassCode])?'Class List':classInfo[currentClassCode]
		document.getElementById('class-name').value=className
		if(classNames=='') 
			document.getElementById('attendance-div').classList.add('empty')
		else
			document.getElementById('attendance-div').classList.remove('empty')
		document.getElementById('select-class').value=className.replace(/ /g,'-')
	}
	// update the LocalStorage variable when the list has changed
	function listChanged(){
		if (!document.getElementById('invited-list')) return
		
		let currentClassCode=localStorage.getItem('Current-Class-Code')

		let il=document.getElementById('invited-list'), ad=document.getElementById('attendance-div'), st=document.getElementById('save-attendance-file')
		let ct=il.value.trim().replace(duplicatedLines, "$1").replace(/\n\s+/g,'\n')
		if(ct===''){
			ad.classList.add('empty')
			st.style.visibility='hidden'
			il.title='Pick a class or enter some names'
		}
		else{
			il.value=ct
			ad.classList.remove('empty')
			st.style.visibility='visible'
			let marked_present=(!!ct.match(/[✔\?]/g))?ct.match(/[✔\?]/g).length:0
			let total_invited=(!!ct.replace(/\n\n/gm,'\n').match(/[\n]/g))?ct.replace(/\n\n/gm,'\n').match(/[\n]/g).length:0
			il.title="Present "+marked_present+' of ' +(total_invited+1)+ ' participants'	
			
		}
		localStorage.setItem('__Class-'+currentClassCode,ct)
		old_np=0 
	}

	// remove all preceding ✔|? from the list of names in the textarea
	function clearPresent(){
		let currentClassCode=localStorage.getItem('Current-Class-Code')

		let invitees = document.getElementById("invited-list");
		let ct=invitees.value.replace(/( )*[✔\?]\s*/g,'').replace(/\t/g,'')
		invitees.value=ct
		localStorage.setItem('__Class-'+currentClassCode,ct)
		old_np=0 
	}

	// stop propagation of clicks in attendance-div-header
	function stopProp(e){
		e = e || window.event;
		e.stopPropagation()
	}

	// reset the meeting start time
	function setStartTime(){
		let now = new Date(), meetingStart=now.getHours()+':'+twod(now.getMinutes())
		sessionStorage.setItem('Meeting-start-time', meetingStart)
		document.getElementById('start-time').title='Current start time is: '+meetingStart
	}

	// clear the textarea
	function clearList(){
		let currentClassCode=localStorage.getItem('Current-Class-Code')

		document.getElementById("invited-list").value='';
		localStorage.setItem('__Class-'+currentClassCode,'')
		document.getElementById("attendance-div").classList.add('empty')
		old_np=0 
		document.getElementById('save-attendance-file').style.visibility='hidden'
		old_np=0 
		_arrivalTimes={} // clear the time of arrival array
  	}

	let _arrivalTimes={} // array to store initial arrival time of each attendee
	
	// update the attendance status of the invitees
	function checkParticipants(isManual){
		let participants=document.querySelectorAll('[data-requested-participant-id],[data-participant-id]')
		// to-do might want to look at [role="presentation"] && [data-sender-name] too
		if(!participants) return
		console.log('checkParticipants', isManual)
		// look for a change in the number of participants
		let np=participants.length
		if (!isManual && old_np===np) {
			return
		}
		old_np=np
		
		let now = new Date(), ctime=now.getHours()+':'+twod(now.getMinutes())

		var tta = document.getElementById('invited-list')
		let tal=tta.value
		let tallc=tal.toLowerCase()
		let changed=false
		for (let aa of participants){
			// parse the innerHTML; remove tagged content, duplicated lines, etc.
			let pn=aa.innerHTML.replace(/<[^>]*?>/ig,'\n')
			.replace(re_replace,'')
			.replace(/\n\s*\n*/gm,'\n')
			.replace(/\(.*\)/ig,'')
			.replace(duplicatedLines, "$1")
			.trim()
			
			// no text --> get the next line
			if(pn==='')	continue
			
			// set their initial arrival time
			if(!_arrivalTimes[pn]) _arrivalTimes[pn]=ctime
			
			// update the field
			let lc=pn.toLowerCase()
			if( lc.indexOf(strings.presenting)>=0 || lc.indexOf(strings.presentation)>=0) continue
					
			if(tallc.indexOf(lc)==-1){
				console.log(pn + ' joined (unexpectedly)', aa)
				tal+='\n? '+pn
				changed=true
			}
			else if(tallc.indexOf('? '+ lc)>=0){
				continue // already uninvited
			}
			else if(tallc.indexOf('✔ '+ lc)>=0){
				continue // already marked present
			}
			 else if(tallc.indexOf('✔ '+ lc)==-1){
				const pattern=new RegExp(pn, 'i')
				console.log(pn + ' joined (as expected)')
				tal=tal.replace(pattern,'✔ '+pn)
				changed=true
			}
			else{
				console.log('WTF - ' + pn)
			}
		}
		// if the list changed, a littlehousekeeping and save the changes
		if (changed) {
			tta.value=tal.trim().replace('✔ ✔ ','✔ ').replace(duplicatedLines, "$1")
			listChanged()
		}
	}
	
	// Add the show/hide button for the attendance field once the meeting has started
	function insertAttendanceSwitch(){
		let ln=document.querySelectorAll('[data-show-automatic-dialog]').length
		let btn = document.createElement('span');
		btn.textContent = '✔';
		btn.id = 'show-attendance-div'
		btn.title = 'Show/hide the Attendance field'
		document.querySelectorAll('[data-show-automatic-dialog]')[ln-1].parentElement.parentElement.appendChild(btn)
		document.getElementById("attendance-div").style.display='none'
		document.getElementById("show-attendance-div").addEventListener("click", showAttendance, false);
	}

	// show/hide button for the attendance field when the show-attendance-div button is clicked
	function showAttendance( e ){
		let vis=document.getElementById("attendance-div").style.display
		if(vis==='none'){
			document.getElementById("attendance-div").style.display='initial'
			document.getElementById("show-attendance-div").classList.add('showing')
		}
		else{
			document.getElementById("attendance-div").style.display='none'
			document.getElementById("show-attendance-div").classList.remove('showing')
		}
		e = e || window.event;
		e.preventDefault();
		e.stopPropagation()
	}
	
	// add a child element to the parent element
	function addElement(p, e, i, ti, cl){
		let de=document.createElement(e)
		de.id=i
		de.title=ti
		if(!!cl) de.classList.add(cl)
		if(e==='img') de.src = chrome.runtime.getURL("images/"+i+".png");
		p.appendChild(de)
	}
	
	// setup - the attendance div and `buttons`
	let atd=document.createElement('div')
	atd.id='attendance-div'	
	atd.classList.add('empty')
	document.body.appendChild(atd)
	
	const atp=document.createElement('p')
	atp.id='attendance-div-header'	
	addElement(atp,'select','select-class','Pick a class; use Add only use if LocalStorage variables are permitted')
	addElement(atp,'input','class-name','Enter the class name')
	addElement(atp,'label','read-file-label','Load a previously saved file','btn')
	addElement(atp,'input','read-file','','')
	addElement(atp,'img','class-delete','Delete this class','btn' )
	addElement(atp,'img','clear-attendance-marks','Clear attendance checks','btn')
	addElement(atp,'img','clear-attendance-field','Clear the class list field','btn')
	addElement(atp,'img','check-attendance','Manually trigger an attendance check','btn')
	addElement(atp,'img','start-time','Manually reset the class start time','btn')
	addElement(atp,'img','save-attendance-file','Save Attendance as CSV file','btn')
	addElement(atp,'input','class-code','','')

	document.getElementById('attendance-div').appendChild(atp)
	document.getElementById('class-name').type='text'
	document.getElementById('read-file-label').style.backgroundImage = "url('"+chrome.runtime.getURL("images/read-file.png")+"')"; 
	document.getElementById("read-file-label").htmlFor = "read-file";
	document.getElementById('read-file').type='hidden'
	document.getElementById('class-code').type='hidden'
	document.getElementById('read-file').type='file'
	
	addElement(atd,'textarea','invited-list','Pick, paste or type your class list into this field','')

	document.getElementById('check-attendance').style.visibility='hidden'
	document.getElementById('class-delete').style.visibility='hidden'
	document.getElementById('start-time').style.visibility='hidden'
	document.getElementById('save-attendance-file').style.visibility='hidden'

	// set the behaviours
	document.getElementById('select-class').addEventListener('change', changeClass, false)				// a change in the drop down field
	document.getElementById('read-file').addEventListener("change", readFile, false)					// save the class list field to a textfile
	document.getElementById('clear-attendance-marks').addEventListener('click', clearPresent, false)	// clear all of the attendance markings
	document.getElementById('clear-attendance-field').addEventListener('click', clearList, false)		// clear the class list field
	document.getElementById('check-attendance').addEventListener('click', function(){
		checkParticipants(true);
	} , false)		// manually fire the function to check attendance
	document.getElementById('class-delete').addEventListener('click', deleteClass, false)				// delete a named class
	document.getElementById('start-time').addEventListener('click', setStartTime, false)					// manually reset the class start time
	document.getElementById('save-attendance-file').addEventListener('click', saveCSVFile, false)		// save the class list field to a textfile
	document.getElementById('class-name').addEventListener('change', addClass, false)					// save the new named class
	document.getElementById('invited-list').addEventListener('change', listChanged, false);				// if the user edits the field

	document.getElementById('select-class').onmousedown = stopProp;
	document.getElementById('read-file-label').onmousedown = stopProp;
	document.getElementById('clear-attendance-marks').onmousedown = stopProp;
	document.getElementById('clear-attendance-field').onmousedown = stopProp;
	document.getElementById('check-attendance').onmousedown = stopProp;
	document.getElementById('class-delete').onmousedown = stopProp;
	document.getElementById('start-time').onmousedown = stopProp;
	document.getElementById('save-attendance-file').onmousedown = stopProp;
	
	setClassList('select-class')
	let ccn=localStorage.getItem('Current-Class-Code').replace(/ /g,'-')
	document.getElementById('select-class').value=ccn	
	dragElement(document.getElementById("attendance-div"));

	loadClassNames()

	// warn about unsave changes
	window.addEventListener("beforeunload", function (e) {
		if(document.getElementById("save-attendance-file").style.visibility==='hidden') return undefined
		let alrt = 'It looks like you have unsaved Attendance changes!'
								+ 'If you leave before clicking `[txt]`, your attendance may be lost.';
		(e || window.event).returnValue = alrt; 
		return alrt; 
	});

	// Create an observer instance to look for changes on the page (detect new participants)
	var observer = new MutationObserver(function( mutations ) {
		
		checkParticipants()  // Check when ever there is an update to the screen
		
	});

	if (!!sessionStorage.getItem('Meeting-start-time')){
		document.getElementById('start-time').style.visibility='visible'
		document.getElementById('start-time').title='Current start time is: '+sessionStorage.getItem('Meeting-start-time') 
	}
	// wait until the meeting has started
	waitForElement("[data-allocation-index]",function(){
		document.getElementById('check-attendance').style.visibility='visible'
		document.getElementById("attendance-div").classList.add('in-meeting')
		document.getElementById('start-time').style.visibility='visible'
		if(!sessionStorage.getItem('Meeting-start-time') || sessionStorage.getItem('Meeting-start-time')==''){
			setStartTime()
		}
		insertAttendanceSwitch()
		
		let ct=document.getElementById('invited-list').value.trim()
		if(ct!==''){
			document.getElementById("attendance-div").classList.remove('empty')
		}
		checkParticipants()  // Check as soon as you join the Meet
		
		// watch for changes (adding new participants to the Meet)
		observer.observe(document.body, {childList:true, attributes:false, subtree:true, characterData:false});

	})

	// wait until the meeting is done
	waitForElement('[data-call-ended="true"]',function(){
		let a_div=document.getElementById("attendance-div")
		a_div.style=''
		a_div.classList.remove('in-meeting')
		a_div.classList.add('meeting-over')
		document.getElementById('check-attendance').style.visibility='hidden'
	});

})()