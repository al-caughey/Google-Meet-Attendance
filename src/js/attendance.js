// ==UserScript==
// @name         Google Meet Grid View & Attendance
// @namespace    https://openuserjs.org/users/Al_Caughey
// @version      0.1.2
// @description  registers whether or not invitees actually joined a Meet
// @author       Al Caughey
// @include      https://meet.google.com/*
// @grant        none
// @license      MIT
// @run-at       document-idle
// ==/UserScript==

;(function() {
	
	//NB - this is still a very early prototype of this extension...  
	//Please send feedback to allan.caughey@ocdsb.ca

	//TO-DO - internationalization?!? (or is that a little optimistic)
	//br-->presenting: apresentando | presentation: Apresentação 
	//fr-->presenting: présentez | presentation: Présentation  
	const translations={
		en:{ presenting:'presenting', presentation:'presentation'},
		br:{ presenting:'apresentando', presentation:'apresentação'},
		fr:{ presenting:'présentez', presentation:'présentation'},
	}
	
	// return one of the translated strings based on language
	function getString(lang, str){
		console.log('getString', lang, str, translations[lang][str])
		if(!translations[lang]) lang='en'
		return translations[lang][str]
	}
	
	// TO-DO - detect the language
	const lang='en'
	let presenting=getString(lang, 'presenting')
	let presentation=getString(lang, 'presentation')
	
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
	
	// update the LocalStorage variable when the list has changed
	function listChanged(){
		console.log('listChanged')
		if (!$("#Invited-List")[0]) return
		//let ct=($("#Invited-List")[0].value).trim()
		let ct=document.getElementById('Invited-List').value.trim()
		if(ct===''){
			document.getElementById('cl-chk').classList.add('hidden')
			document.getElementById('Attendance-div').classList.add('empty')
		}
		else{
			document.getElementById('cl-chk').classList.remove('hidden')
			document.getElementById('Attendance-div').classList.remove('empty')
		}
		localStorage.setItem('Meet-Invited-List',ct)
	}

	// remove all preceding ✔|? from the list of names in the textarea
	function clearPresent(){
		console.log('clearPresent')
		var textarea = document.getElementById("Invited-List");
		let ct=textarea.value
		textarea.value=ct.replace(/[✔\?] /g,'')
		localStorage.setItem('Meet-Invited-List',ct)
	}

	// clear the textarea
	function clearList(){
		console.log('clearList')
		document.getElementById("Invited-List").value='';
		localStorage.setItem('Meet-Invited-List','')
		document.getElementById("Invited-List").classList.add('empty')
		document.getElementById('cl-chk').classList.add('hidden')
	}

	// update the attendance status of the invitees
	function checkParticipants(){
		console.log('checkParticipants')
		let participants=document.querySelectorAll('[data-requested-participant-id]')
		if(!participants) return
		
		var tta = $("#Invited-List")[0];
		let tal=tta.value
		let tallc=tal.toLowerCase()
		let changed=false
		for (let aa of participants){
			let pn=aa.innerText
			let lc=pn.toLowerCase()
			
			// TO-DO: I'm 99% certain the line below *will* require updates for non-English renderings
			if(lc=='you' || lc.indexOf(presenting)>=0 || lc.indexOf(presentation)>=0) continue
			
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
	const s1 = $("<span />").attr('id','cl-hdr').text('Class List')
	const s2 = $("<span />").attr('id','cl-ccl').attr('title','Clear attendance checklist').text('[-]')
	const s3= $("<span />").attr('id','cl-clr').attr('title','Clear list').text('[x]')
	const s4= $("<span />").attr('id','cl-chk').attr('title','Check Attendance list').text('[✔]').addClass('hidden')
	const atta =  $("<textarea />").attr('id','Invited-List').attr('placeholder','Paste your class list or list of invitees here...')
	
	// set the value of the textarea to the value of the LocalStorage variable 
	// BTW - admin policies for some schoolboards may clear LS variables on exit
	if(!!localStorage.getItem('Meet-Invited-List')){
		atta.val(localStorage.getItem('Meet-Invited-List'))
		atd.removeClass('empty')
	}
	
	//append the elements
	atp.append(s1).append(s2).append(s3).append(s4)
	atd.append(atp).append(atta)
	atd.appendTo($('body'))
	
	//set the behaviours
	$('#Attendance-div').draggable() // so it can be moved about on the screen
	$('#Invited-List').change(listChanged)
	$('#cl-ccl').click(clearPresent)
	$('#cl-clr').click(clearList)
	$('#cl-chk').click(checkParticipants)
	
	// Create an observer instance to look for changes on the page (detect new participants)
	var observer = new MutationObserver(function( mutations ) {
		checkParticipants()
	});
	
	//wait until the DOM element holding the participant info is available
	waitForElement("[data-allocation-index]",function(){
		let ct=document.getElementById('Invited-List').value.trim()
		if(ct!==''){
			document.getElementById('cl-chk').classList.remove('hidden')
		}
		checkParticipants()
		
		// watch for changes (adding new participants to the Meet)
		observer.observe(document.body, {childList:true, attributes:false, subtree:true, characterData:true});
	});

})()
