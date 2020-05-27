// ==UserScript==
// @name         Google Meet Grid View & Attendance
// @namespace    https://openuserjs.org/users/Al_Caughey
// @version      0.3.2
// @description  registers whether or not invitees actually joined a Meet
// @author       Al Caughey
// @include      https://meet.google.com/*
// @grant        none
// @license      https://github.com/al-caughey/Google-Meet-Attendance/blob/master/LICENSE.md
// @run-at       document-idle
// ==/UserScript==

//History:
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

;(function() {
	
	//NB - this is still a very early prototype of this extension...  
	//Please send feedback to allan.caughey@ocdsb.ca

	//TO-DO - internationalization?!? (or is that a little optimistic)
	//br-->presenting: apresentando | presentation: Apresentação 
	//fr-->presenting: présentez | presentation: Présentation  
	const translations={
		en:{ presenting:"presenting", presentation:"presentation", you:"you", joined:"joined", more:"and \d* more"},
		fr:{ presenting:"présentez", presentation:"présentation", you:"vous", joined:"participe à l'appel.", more:"and \d* more"},
		de:{ presenting:"präsentation", presentation:"bildschirm", you:"ich", joined:"nimmt teil", more:"and \d* more"},
		nl:{ presenting:"presentatie", presentation:"presenteert", you:"jij", joined:"neemt nu deel", more:"and \d* more"},
		pt:{ presenting:"apresentando", presentation:"apresentação", you:"você", joined:"participando", more:"está participando"},
		it:{ presenting:"presentando", presentation:"presentazione", you:"tu", joined:"sta partecipando", more:"and \d* more"},
	}
	
	// return strings based on language
	function getStrings(){
		//console.log('getString', lang, str, translations[lang][str])
		let lang=document.documentElement.lang.split('-')[0]||'en'  
		if(!translations[lang]) lang='en'
		return translations[lang]
	}

	let strings=getStrings()
	let old_np=0 
	
	// simple function that waits until a specific element exists in the DOM...
	// (adapted from Stack Overflow
	function waitForElement(elementPath, callBack){
		window.setTimeout(function(){
			if($(elementPath).length){
				callBack(elementPath, $(elementPath));
			}
			else{
				waitForElement(elementPath, callBack);
			}
		},100)
	}
	// update the class info
	function classInfoChanged(){
		let cn=document.getElementById('class-name').value.trim()
		let cc=cn.replace(/ /g,'-')
		//console.log('classInfoChanged', cc, cn)
		if (cc==='' || cn===''){
			document.getElementById('class-save').style.visibility='hidden'
			return
		}
		document.getElementById('class-save').style.visibility='visible'
	}
	
	// build the select/options for the list of classes
	function setClassList(){
		let cldd=$("<select />").attr('id','cl-hdr').append($("<option />").text('Class List').val('null'))
		let classInfo=JSON.parse(localStorage.getItem('__Class-Info'))||{}
		
		for (let [code, name] of Object.entries(classInfo)) {
			cldd.append($("<option />").text(name).val(code))
		}
	
		cldd.append($("<option />").text('──────────').val('').attr('disabled','disabled'))
		.append($("<option />").text('Add').val('+').attr('title','Add `named` class... NB - only use if LocalStorage variables are permitted'))
		return cldd
	}
	// save the class info to the text file
	function saveTextFile(){
		
		function twod(v){
			return ('0'+Number(v)).slice(-2)
		}
		let today = new Date(), d=today.getDate(),m=today.getMonth()+1,y=today.getFullYear()
		let cdate=y+'-'+twod(m)+'-'+twod(d), ctime=today.getHours()+':'+twod(today.getMinutes())
		let cdd = document.getElementById("cl-hdr"), cn= cdd.options[cdd.selectedIndex].text;
		let header='Attendance for: '+cn+' on '+cdate+'\n\n'+'Names\t'+ctime+'\n'
		let joined = /^\s*([✔\?])\s*(.*)$/gm
		let txt=document.getElementById('Invited-List').value.replace(joined, "$2"+'\t'+"$1")
		let blob = new Blob([header+txt], {type: 'text/plain;charset=utf-8'})
		let temp_a = document.createElement("a")
    	temp_a.download = cn+' ('+cdate+').csv'
		temp_a.href = window.webkitURL.createObjectURL(blob)
		temp_a.click()
		//window.URL.revokeObjectURL(url)

		document.getElementById('save-text').style.visibility='hidden'
	}
	function saveClass(){
		//console.log('saveClass')
		let cn=document.getElementById('class-name').value.trim()
		let cc=cn.replace(/ /g,'-')

		document.getElementById('class-save').style.visibility='hidden'
		let num=document.getElementById("cl-hdr").options.length-2
		let no = document.createElement("option");
		no.text = cn;
		no.value = cc;
		document.getElementById("cl-hdr").options.add(no, num);
		document.getElementById("cl-hdr").value=cc;
		localStorage.setItem('Current-Class-Code', cc)
		let classInfo=JSON.parse(localStorage.getItem('__Class-Info'))||{}
		classInfo[cc]=cn
		localStorage.setItem('__Class-Info', JSON.stringify(classInfo))
		document.getElementById('class-delete').style.visibility='visible'
		saveHide()
	}
	//delete a class from the drop-down & LS variables
	function deleteClass(){
		//console.log('deleteClass')
		let cn=document.getElementById('class-name').value.trim()
		if (cn==='') return
		if(!confirm('Are you sure you want to delete this class: `'+cn+'`?  There is no undo')) return
		let cc=cn.replace(/ /g,'-')
		let classInfo=JSON.parse(localStorage.getItem('__Class-Info'))||{}
		delete classInfo[cc] 
		localStorage.setItem('__Class-Info', JSON.stringify(classInfo))
		localStorage.setItem('Current-Class-Code', 'null')
		localStorage.removeItem('__Class-'+cc)
		let csl = document.getElementById("cl-hdr");
		csl.remove(csl.selectedIndex);
		document.getElementById('class-name').value=''
		document.getElementById('class-code').value=''
		document.getElementById('cl-hdr').value='null'
		document.getElementById('Invited-List').value=''
		document.getElementById('class-delete').style.visibility='hidden'
		changeClass()
		saveHide()
		document.getElementById('class-save').style.visibility='hidden'
		old_np=0 
	}
	// pick new class from drop-down
	function changeClass(){
		let currentClassCode=document.getElementById('cl-hdr').value
		//console.log('changeClass-->currentClassCode',currentClassCode)
		
		if(currentClassCode==='+'){
			addClassInfo()
			return
		}
		let classInfo=JSON.parse(localStorage.getItem('__Class-Info'))||{}
		let currentClassName=classInfo[currentClassCode]
		document.getElementById('class-code').value=currentClassCode
		document.getElementById('class-name').value=currentClassName

		localStorage.setItem('Current-Class-Code', currentClassCode)
		let classNames=localStorage.getItem('__Class-'+currentClassCode)||''
		document.getElementById('Invited-List').value=classNames
		document.getElementById('class-delete').style.visibility='visible'
		if(classNames=='') 
			document.getElementById('Attendance-div').classList.add('empty')
		else
			document.getElementById('Attendance-div').classList.remove('empty')
		document.getElementById('save-text').style.visibility='hidden'
		old_np=0 
	}
	// called when add is selected from the drop-down
	function addClassInfo(){
		//console.log('addClassInfo')
		document.getElementById('class-code').value=''
		document.getElementById('class-name').value=''
		document.getElementById('Invited-List').value=''
		document.getElementById('class-edit').style.display='block'
		document.getElementById('class-delete').style.visibility='hidden'
		localStorage.setItem('Current-Class-Code', 'null')
		document.getElementById('Attendance-div').classList.add('empty')
	}
	//hide the edit row
	function saveHide(){
		document.getElementById('class-edit').style.display='none'
		document.getElementById('class-show').style.display='inline'
		document.getElementById('class-hide').style.display='none'
	}
	//show the edit row
	function saveShow(){
		document.getElementById('class-edit').style.display='block'
		document.getElementById('class-show').style.display='none'
		document.getElementById('class-hide').style.display='inline'
		if(document.getElementById('class-code').value==='null') 
			document.getElementById('class-delete').style.visibility='hidden'
		else
			document.getElementById('class-delete').style.visibility='visible'
	}
	//load the names associated with a class from the LS variables
	function loadClassNames(){
		let currentClassCode=localStorage.getItem('Current-Class-Code')||document.getElementById('cl-hdr').value||'null'
		//console.log('loadClassNames-->currentClassCode',currentClassCode, document.getElementById('cl-hdr').value, localStorage.getItem('Current-Class-Code'))
		
		if(currentClassCode==='+'){
			addClassInfo()
			return
		}
		if (!currentClassCode || currentClassCode==='') return
		
		let classNames=localStorage.getItem('__Class-'+currentClassCode)||''
		//console.log('loadClassNames-->classNames', classNames)
		document.getElementById('Invited-List').value=classNames
		document.getElementById('cl-hdr').value=currentClassCode
		document.getElementById('class-code').value=currentClassCode
		let classInfo=JSON.parse(localStorage.getItem('__Class-Info'))||{}
		document.getElementById('class-name').value=classInfo[currentClassCode]||''
		localStorage.setItem('Current-Class-Code', currentClassCode)
		if(classNames=='') 
			document.getElementById('Attendance-div').classList.add('empty')
		else
			document.getElementById('Attendance-div').classList.remove('empty')
	}
	// update the LocalStorage variable when the list has changed
	function listChanged(){
		//console.log('listChanged')
		if (!$("#Invited-List")[0]) return
		
		let currentClassCode=localStorage.getItem('Current-Class-Code')
		if (currentClassCode==='') currentClassCode='null'
		//let ct=($("#Invited-List")[0].value).trim()
		let ct=document.getElementById('Invited-List').value.trim().replace(duplicatedLines, "$1")
		if(ct===''){
			document.getElementById('Attendance-div').classList.add('empty')
			document.getElementById('save-text').style.visibility='hidden'
		}
		else{
			document.getElementById('Invited-List').value=ct
			document.getElementById('Attendance-div').classList.remove('empty')
			document.getElementById('save-text').style.visibility='visible'
		}
		localStorage.setItem('__Class-'+currentClassCode,ct)
		old_np=0 
	}

	// remove all preceding ✔|? from the list of names in the textarea
	function clearPresent(){
		//console.log('clearPresent')
		let currentClassCode=localStorage.getItem('Current-Class-Code')

		var invitees = document.getElementById("Invited-List");
		let ct=invitees.value.replace(/[✔\?] /g,'')
		invitees.value=ct
		localStorage.setItem('__Class-'+currentClassCode,ct)
		old_np=0 
	}

	// clear the textarea
	function clearList(){
		//console.log('clearList')
		let currentClassCode=localStorage.getItem('Current-Class-Code')

		document.getElementById("Invited-List").value='';
		localStorage.setItem('__Class-'+currentClassCode,'')
		document.getElementById("Attendance-div").classList.add('empty')
		old_np=0 
		document.getElementById('save-text').style.visibility='hidden'
  	}

	// update the attendance status of the invitees
	function checkParticipants(){
		let participants=document.querySelectorAll('[data-requested-participant-id],[data-participant-id]')
		//to-do might want to look at [role="presentation"] && [data-sender-name] too
		if(!participants) return
		
		// look for a change in the number of participants
		let np=participants.length
		if (old_np===np) {
			//console.log('checkParticipants -  no change')
			return
		}
		old_np=np
		
		//console.log('checkParticipants', np)
		var tta = $("#Invited-List")[0];
		let tal=tta.value
		let tallc=tal.toLowerCase()
		let changed=false
		for (let aa of participants){
			let pn=aa.innerHTML.replace(/<[^>]*?>/ig,'\n').replace(/\n\n*/gm,'\n')
			.replace(re_replace,'')
			.replace(/\(.*\)/ig,'')
			.replace(duplicatedLines, "$1")
			.trim() 
			//let pn=aa.innerHTML.replace(/<[^>]*?>/ig,'\n').replace(/\n\n*/gm,'\n')
			//.replace(re_you,'')
			//.replace(re_joined,'')
			//.replace(re_more,'')
			//.replace(/\(.*\)/ig,'')
			//.replace(duplicatedLines, "$1")
			//.trim()
			
			if(pn==='')	continue
			let lc=pn.toLowerCase()
			if( lc.indexOf(strings.presenting)>=0 || lc.indexOf(strings.presentation)>=0) continue
			
					
			if(tallc.indexOf(lc)==-1){
				console.log(pn + ' joined (unexpectedly)')
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
		//if the list changed, a littlehousekeeping and save the changes
		if (changed) {
			tta.value=tal.trim().replace('✔ ✔ ','✔ ').replace(duplicatedLines, "$1")
			listChanged()
		}
	}
	  
	//setup - the attendance div and `buttons`
	const atd = $("<div />").attr('id','Attendance-div').addClass('empty');
	const atp =  $("<p />")
	.append(setClassList())
	.append($("<span />").attr('id','cl-ccl').attr('title','Clear attendance checks').text('[-]'))
	.append($("<span />").attr('id','cl-clr').attr('title','Clear list').text('[x]'))
	.append($("<span />").attr('id','cl-chk').attr('title','Check attendance').text('[✔]'))
	.append($("<a />").attr('id','save-text').attr('title','Save Attendance as text file').text('[txt]'))
	.append($("<span />").attr('id','class-show').attr('title','Show the class information').text('[▼]'))
	.append($("<span />").attr('id','class-hide').attr('title','Hide this info').text('[▲]'))
	
	const atpe =  $("<p />").attr('id','class-edit')
	.append($("<input />").attr('id','class-name').attr('title','Enter the class name').attr('placeholder','Class name'))
	.append($("<input />").attr('id','class-code').attr('disabled','disabled').attr('placeholder','Class code'))
	.append($("<span />").attr('id','class-save').attr('title','Save the Class').text('[+]'))
	.append($("<span />").attr('id','class-delete').attr('title','Delete this Class').text('[*]'))

	const atta =  $("<textarea />").attr('id','Invited-List').attr('placeholder','Paste your list here...').attr('title','Paste or type your class list or list of invitees into this field')
	atd.append(atp)
	.append(atpe)
	.append(atta)
	atd.appendTo($('body'))
	if (document.getElementById('cl-hdr').value==''||document.getElementById('cl-hdr').value=='null') document.getElementById('class-edit').style.display='none'
	document.getElementById('class-hide').style.display='none'
	document.getElementById('class-save').style.visibility='hidden'
	document.getElementById('cl-chk').style.visibility='hidden'
	document.getElementById('class-delete').style.visibility='hidden'
	document.getElementById('save-text').style.visibility='hidden'
	loadClassNames()

	//set the behaviours
	// warn about unsave changes
	window.addEventListener("beforeunload", function (e) {
		if(document.getElementById("save-text").style.visibility==='hidden') return undefined
		let alrt = 'It looks like you have unsaved Attendance changes!'
								+ 'If you leave before clicking `[txt]`, your attendance may be lost.';
		(e || window.event).returnValue = alrt; 
		return alrt; 
	});
	
	$('#Attendance-div').draggable() // so it can be moved about on the screen
	$('#Invited-List').change(listChanged) // if the user edits the field
	$('#class-name').change(classInfoChanged) // when a named class name is changed
	$('#cl-ccl').click(clearPresent) // clear all of the attendance markings
	$('#cl-clr').click(clearList)	// clear the class list field
	$('#cl-chk').click(checkParticipants)	// manually fire the function to check attendance
	$('#cl-hdr').change(changeClass)	// a change in the drop down field
	$('#class-save').click(saveClass)	// save the new named class
	$('#class-delete').click(deleteClass)	// delete a named class
	$('#class-show').click(saveShow)	// show the row with the class name field
	$('#class-hide').click(saveHide)	// hide the row 
	$('#save-text').click(saveTextFile)	// save the class list field to a textfile
	
	//create regexes before going into the observer
	let re_replace = new RegExp('\\b'+strings.you+'|'+strings.joined+'|'+strings.more+'\\b', "gi");
	let duplicatedLines = /^(.*)(\r?\n\1)+$/gm

	// Create an observer instance to look for changes on the page (detect new participants)
	var observer = new MutationObserver(function( mutations ) {
		
		checkParticipants()
		
		
	});

	waitForElement("[data-allocation-index]",function(){
		document.getElementById('cl-chk').style.visibility='visible'
		document.getElementById("Attendance-div").classList.add('in-meeting')

		let ct=document.getElementById('Invited-List').value.trim()
		if(ct!==''){
			document.getElementById("Attendance-div").classList.remove('empty')
		}
		checkParticipants()
		
		// watch for changes (adding new participants to the Meet)
		observer.observe(document.body, {childList:true, attributes:false, subtree:true, characterData:false});
	});
	//wait until the meeting is done
	waitForElement('[data-call-ended="true"]',function(){
		let a_div=document.getElementById("Attendance-div")
		a_div.style=''
		a_div.classList.remove('in-meeting')
		a_div.classList.add('meeting-over')
		document.getElementById('cl-chk').style.visibility='hidden'
		document.getElementById('save-text').style.visibility='visible'
	});

})()
