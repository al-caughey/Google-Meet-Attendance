// ==UserScript==
// @name         Google Meet Grid View & Attendance
// @namespace    https://openuserjs.org/users/Al_Caughey
// @version      0.2.7
// @description  registers whether or not invitees actually joined a Meet
// @author       Al Caughey
// @include      https://meet.google.com/*
// @grant        none
// @license      MIT
// @run-at       document-idle
// ==/UserScript==

//History:
// v0.2.1 - first post publish Chrome store; improvements to styleSheets
// v0.2.2 - updates to permissions in manifest and in popup.html
// v0.2.3 - LS storage is now keyed to the class name... so you can have multiple class lists
// v0.2.4 - expanded the select query for participants; tweaks to observe
// v0.2.5 - minor wording change in the manifest
// v0.2.6 - tweaks to regex to gather names; initial localization: en, fr, de & nl

;(function() {
	
	//NB - this is still a very early prototype of this extension...  
	//Please send feedback to allan.caughey@ocdsb.ca

	//TO-DO - internationalization?!? (or is that a little optimistic)
	//br-->presenting: apresentando | presentation: Apresentação 
	//fr-->presenting: présentez | presentation: Présentation  
	const translations={
		en:{ presenting:"presenting", presentation:"presentation", you:"you", joined:"joined"},
		fr:{ presenting:"présentez", presentation:"présentation", you:"vous", joined:"participe à l'appel."},
		de:{ presenting:"präsentation", presentation:"bildschirm", you:"ich", joined:"nimmt teil"},
		nl:{ presenting:"presentatie", presentation:"presenteert", you:"jij", joined:"neemt nu deel"},
		br:{ presenting:"apresentando", presentation:"apresentação", you:"you", joined:"joined"},
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
	// save the class info to the LS variables
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
		localStorage.setItem('Current-Class-Code', cc)
		let classInfo=JSON.parse(localStorage.getItem('__Class-Info'))||{}
		classInfo[cc]=cn
		localStorage.setItem('__Class-Info', JSON.stringify(classInfo))
		document.getElementById('class-delete').style.visibility='visible'
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
		document.getElementById('cl-hdr').value=''
		document.getElementById('Invited-List').value=''
		document.getElementById('class-delete').style.visibility='hidden'
		document.getElementById('class-save').style.visibility='hidden'
		//to-do: delete the select/option entry too
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
		
	}
	// called when add is selected from the drop-down
	function addClassInfo(){
		//console.log('addClassInfo')
		document.getElementById('class-code').value=''
		document.getElementById('class-name').value=''
		document.getElementById('Invited-List').value=''
		document.getElementById('class-edit').style.display='block'
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
		if(document.getElementById('class-name').value==='') 
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
		let ct=document.getElementById('Invited-List').value.trim()
		if(ct===''){
			document.getElementById('Attendance-div').classList.add('empty')
		}
		else{
			document.getElementById('Attendance-div').classList.remove('empty')
		}
		localStorage.setItem('__Class-'+currentClassCode,ct)
	}

	// remove all preceding ✔|? from the list of names in the textarea
	function clearPresent(){
		//console.log('clearPresent')
		let currentClassCode=localStorage.getItem('Current-Class-Code')

		var textarea = document.getElementById("Invited-List");
		let ct=textarea.value.replace(/[✔\?] /g,'')
		textarea.value=ct
		localStorage.setItem('__Class-'+currentClassCode,ct)
	}

	// clear the textarea
	function clearList(){
		//console.log('clearList')
		let currentClassCode=localStorage.getItem('Current-Class-Code')

		document.getElementById("Invited-List").value='';
		localStorage.setItem('__Class-'+currentClassCode,'')
		document.getElementById("Attendance-div").classList.add('empty')
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
			let pn=aa.innerText
			.replace(re_you,'')
			.replace(re_joined,'')
			.replace(/\(.*\)/ig,'')
			.replace(duplicatedLines, "$1")
			.trim()
			
			if(pn==='')	continue
			let lc=pn.toLowerCase()
			if( lc.indexOf(strings.presenting)>=0 || lc.indexOf(strings.presentation)>=0) continue
			
					
			if(tallc.indexOf(lc)==-1){
				console.log(pn + ' joined (unexpectedly)')
				tal+='\n? '+pn + ' (not invited?!?)'
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
			tta.value=tal.trim().replace('✔ ✔ ','✔ ')
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
	document.getElementById('class-save').style.visibility='hidden'
	document.getElementById('class-hide').style.display='none'
	document.getElementById('class-delete').style.visibility='hidden'

	loadClassNames()

	//set the behaviours
	$('#Attendance-div').draggable() // so it can be moved about on the screen
	$('#Invited-List').change(listChanged)
	$('#class-name').change(classInfoChanged)
	$('#cl-ccl').click(clearPresent)
	$('#cl-clr').click(clearList)
	$('#cl-chk').click(checkParticipants)
	$('#cl-hdr').change(changeClass)
	$('#class-save').click(saveClass)
	$('#class-delete').click(deleteClass)
	$('#class-hide').click(saveHide)
	$('#class-show').click(saveShow)
	
	//create regexes before going into the observer
	let re_you = new RegExp('\\b'+strings.you+'\\b', "gi");
	let re_joined = new RegExp('\\b'+strings.joined, "gi");
	let duplicatedLines = /^(.*)(\r?\n\1)+$/gm

	// Create an observer instance to look for changes on the page (detect new participants)
	var observer = new MutationObserver(function( mutations ) {
		
		checkParticipants()
		
		/* for experimentation...
		for(let mutation of mutations) {
			for(let node of mutation.addedNodes) {
				if(!node.innerText||node.innerText==='') continue
				console.log(mutation.type, node.innerText, node )
				}
			}
		}*/
	});
	
	//wait until the DOM element holding the participant info is available
	waitForElement("[data-allocation-index]",function(){
		let ct=document.getElementById('Invited-List').value.trim()
		if(ct!==''){
			document.getElementById("Attendance-div").classList.remove('empty')
		}
		checkParticipants()
		
		// watch for changes (adding new participants to the Meet)
		observer.observe(document.body, {childList:true, attributes:false, subtree:true, characterData:false});
	});

})()

	/* possible replacement to draggable
	
	let spos=[],mpos=[];
	document.getElementById('Attendance-div').addEventListener('mousedown', function(e) {
	spos.x = this.offsetLeft;
	spos.y = this.offsetTop;
	mpos.x = e.clientX;
	mpos.y = e.clientY;

	this.addEventListener('mousemove', newPosition, false);

	window.addEventListener('mouseup', function() {
	  document.getElementById('Attendance-div').removeEventListener('mousemove', newPosition, false);
	}, false);

	}, false);

	function newPosition(e) {
		this.style.left = spos.x + e.clientX - mpos.x + 'px';
		this.style.top = spos.y + e.clientY - mpos.y + 'px';
	}*/
