// pad with a leading zero (for dates & time)
function twod(v){
	return ('0'+Number(v)).slice(-2)
}

function hideUpdateText(){
	document.getElementById('invited-list').style.display='block'
	document.getElementById('update-text').style.display='none'
	document.getElementById('help-buttons').style.display='none'
}
function showPrevHelp(){
	document.getElementById('prev-page').style.visibility='visible'
	document.getElementById('next-page').style.visibility='visible'
	let chp=document.querySelector('.active-help-page')
	let php=chp.previousElementSibling 
	chp.classList.remove('active-help-page')
	php.classList.add('active-help-page')
	if(document.querySelector('.active-help-page')===document.querySelector('.help-page:first-of-type'))
		document.getElementById('prev-page').style.visibility='hidden'
}
function showNextHelp(){
	document.getElementById('prev-page').style.visibility='visible'
	document.getElementById('next-page').style.visibility='visible'
	let chp=document.querySelector('.active-help-page')
	let nhp=chp.nextElementSibling 
	chp.classList.remove('active-help-page')
	nhp.classList.add('active-help-page')
	if(document.querySelector('.active-help-page')===document.querySelector('.help-page:last-of-type'))
		document.getElementById('next-page').style.visibility='hidden'
}
function showInstall(){
	var thisVersion = chrome.runtime.getManifest().version;
	chrome.storage.sync.get(['__GMA_status'], function(r){
		//console.log('showUpdate:: Updated to ' + thisVersion)

		//console.log('showInstall:: __GMA_status ' + r['__GMA_status'])
		document.getElementById('invited-list').style.display='none'
		document.getElementById('update-text').style.display='block'
		document.getElementById('help-buttons').style.display='block'
		document.getElementById('prev-page').style.visibility='hidden'
		document.getElementById('next-page').style.visibility='visible'

		let updateHTML=`<div class='help-page active-help-page'>
			<h1>Getting Started</h1>
			<p>For a more detailed overview, checkout the videos at<a href='https://www.youtube.com/channel/UCcD48u9-OBB8HefX4P3KGgQ' target='_blank'>YouTube Channel</a> or visit the <a href='https://www.facebook.com/GoogleMeetAttendance' target='_blank'>Facebook page</a></p>
			<p>Click the next button (">") above to see additional help topics.</p>
		</div>
		<div class='help-page'>
			<h1>Setting-up your Classes</h1>
			<p>Taking attendance is about recording who is there as well as who is not.  To make that possible, you have to start with the names of the people who you expect to attend your Meets.</p><p>Using the 'Class List' dropdown, you can 'Add' your classes and then read the names from a text file by clicking the folder icon (or you can type or paste them into the field).</p>
			<p><b>NB</b> - You should only have to set up your classes once (presuming that Google sync and localStorage are working as intended).  Wtih Google sync, your class lists will be available on any laptop/PC/Chromebook when you log-in with the same credentials.</p>
			<p>To delete a named class, click the trash can.  Currently there is no way to change a class name once you've entered it... instead, copy the names, click 'Add' from the drop down and then paste them into the field.  Then change back to the misnamed class, and click the trash can to delete it.</p>
			<p>Choose 'Reset' under the drop downto delete all of the named classes</p>
		</div>
		<div class='help-page'>
			<h1>Starting the Meet</h1>
			<p>When you start the Meet and have confirmed the settings, the Attendence field gets hidden (so that it does not distract from the more important information on your screen).  You can show the field again by clicking the checkmark (✔) in the toolbar at the bottom of the screen (beside the video icon).  Click the checkmark hide the field again.</p>
		</div>
		<div class='help-page'>
			<h1>Taking Attendance</h1>
			<p>You really do not have to do anything!</p>
			<p>If you join the Meet before the students and/or have all of the students showing on the screen (using the tiled layout or the Grid View extension), the extension does everything for you...  a checkmark (✔) will be automatically prepended to the students' names as they join. If someone shows up unexpectedly (i.e., their name is not in the class list), their name will be appended to the bottom of the list.</p>
			<p>If you are not using one of the grid layouts and/or join the Meet after some of the students have entered, you can click the People tab (in the top right corner) and then scroll down to catch any missing names.</p>
			<p>In the background, the extension records the time at which the students entered.</p>
		</div>
		<div class='help-page'>
			<h1>Monitoring Who's There</h1>
			<p>When you click the 'Monitor' checkbox in the toolbar, that will trigger a check once per minute to see if everyone is still on the call.</p>
			<p>NB - for this feaure to work properly, all of the students <b>must be</b> visible on the screen - for calls with fewer than 16 students, use the built-in tiled layout; for larger groups, use the Grid View extension.</p>
			<p>The monitor checkbox does not appear until you have started the Meet (but is remembered once set).</p>
			<p>This is new functionality... it has worked well during my Meets by you could find some issues>  Please let me know if something doesn't work for you - send screenshots and as much information as possible.</p>
		</div>
		<div class='help-page'><h1>Saving the Attendance</h1>
			<p>When your Meet has ended, click the disk icon in the top right corner of the toolbar to save your attendance</p>
			<p>The CSV file (which'll get saved to your Downloads directory) will show who was present and who was not; when the students arrived and how long they stayed on the call (assuming monitoring was turned on)
		</div>
		<div class='help-page'><h1>Privacy Policy</h1>
			<p>A minor change to the <a href='https://github.com/al-caughey/Google-Meet-Attendance/blob/master/PRIVACY.md' target='_blank'>privacy policy</a> was needed in the v0.5.0 and greater version.</p>
			<p>I have changed the inner workings of the extension to leverage the <a href='https://developer.chrome.com/extensions/storage' target='_blank'>Chrome 'sync'</a> Service.  In short, this means that if 'sync' is enabled, your class lists will be available on all of your laptops/PCs/Chromebooks (as long as you are signed in with the same credentials).  All of the 'sync'ing between devices is completed using Google's standard API calls.  I do <u>not</u> send your class lists through any external servers (at all).</p>
			<p>If 'sync' is not enabled, your class lists be saved with the LocalStorage functionality as in v0.4.x and earlier.  
			</p>
		</div>
		
		<div class='help-page'><h1>Last thoughts...</h1>
			<p>Thank you so much for installing my extension! I'm overwhelmed by the number of people who are using it!!</p>
			<p>I'm keen to hear your feedback and would prefer that that happens through the <a href='https://www.facebook.com/GoogleMeetAttendance/' target="_blank">Facebook page</a>.  In a pinch, you can get me at my school email address allan.caughey@ocdsb.ca or my personal address al@caughey.ca.</p>
		</div>
		<p class='help-footer'>Click the red 'x' above to close this help page.  Click the version info in the footer below to show this text again or click the question mark icon for help.</p>
		</div>`
		
		document.getElementById('update-text').innerHTML=updateHTML
		
	})
}
function showUpdate(){
	var thisVersion = chrome.runtime.getManifest().version;
	chrome.storage.sync.get(['__GMA_status'], function(r){
		//console.log('showUpdate:: Updated to ' + thisVersion)

		document.getElementById('invited-list').style.display='none'
		document.getElementById('update-text').style.display='block'
		document.getElementById('help-buttons').style.display='block'
		document.getElementById('prev-page').style.visibility='hidden'
		document.getElementById('next-page').style.visibility='visible'

		let updateHTML=`
		<div class='help-page active-help-page'>
			<h1>You have been updated to v`+chrome.runtime.getManifest().version+`</h1>
			<p><b><u>There are several noticable changes in this update:</u></b></p>
			<ol>
				<li>The Attendance field & toolbar do not appear until the Meet URL includes a meeting code.
				<li>The Class List drop down is now localized to French, German, Dutch, Spanish & Portuguese.<br/>Please let me know if the text needs to be tweaked (if it's wrong, I'm blaming Google Translate).  If you'd like to have more of the interface translated, send me the text and I will add it into the extension. Sadly, I'm not a polyglot... 
				<li>When you start your meet, the Attendance field is no longer automatically hidden... this is intended to allow you to confirm that everything is set properly before you get going (esp. the Start time of the meet).<br/>Click the blue stop watch in the toolbar to reset the start time.
				<li>The button to check attendance has been removed (it really was not necessary and I think confused new users)
				<li>I've extended the localization strings to catch 'Hide/Show Participant' messages from Grid View
				<li>LBNL, this update info is now split over several pages... click '>' above to go to the next page
			</ol>
		</div>
		<div class='help-page'>
			<h1>Prior Notable Updates:</h1>
			<ul>
				<li>A minor change to the <a href='https://github.com/al-caughey/Google-Meet-Attendance/blob/master/PRIVACY.md' target='_blank'>privacy policy</a> is needed for the v0.5.x version.<br/>I have changed the inner workings of the extension to leverage the <a href='https://developer.chrome.com/extensions/storage' target='_blank'>Chrome 'sync'</a> Service.  In short, this means that if you have enabled 'sync' , your class lists will be available on all devices on which you are signed in.  If not, your class lists be saved with the LocalStorage functionality as before.  All of the 'sync'ing between devices is completed using Google's standard API calls.  I do <u>not</u> send your class lists to any external servers (at all).
				<li>The 'Class List' dropdown has been re-organized.  Among other things, your named classes will be sorted alphabetically.
				<li>You can now monitor attendance by clicking the checkbox in the title bar (which'll become visible once you've started the Meet).  It'll trigger a check once per minute to see who's still present.<br/>
				<b>NB</b> - to monitor attendance, you <u>must</u> change to the built-in tiled layout (if there are few than 16 participants) or use the Grid View extension for bigger classes.
			</ul>
		</div>
		<div class='help-page'>
			<h1>Bug Fixes:</h1>
			<p>A number of bugs have been fixed... most notably:</p>
				<ul>
					<li>0.5.2 - fixed a bug in French Translation
					<li>0.5.1 - fixed importing class lists from LocalStorage & into sync
					<li>0.5.0 - fixed the disappearing buttons problem.
				</ul>
		</div>
		<p class='help-footer'>Click the red 'x' above to close this help page.  Click the version info in the footer below to show this text again or click the question mark icon for help.</p>
		</div>`
		
		document.getElementById('update-text').innerHTML=updateHTML
	})
}

function showMeetingStarted(){
	//console.log('showMeetingStarted')

	document.getElementById('invited-list').style.display='none'
	document.getElementById('update-text').style.display='block'
	document.getElementById('help-buttons').style.display='block'
	document.getElementById('prev-page').style.visibility='hidden'
	document.getElementById('next-page').style.visibility='hidden'
	let now = new Date(), timeNow = now.getHours()+':'+twod(now.getMinutes())
	let updateHTML=`<p>Your Meet start-time is set to <span class='current-start-time'>`+ sessionStorage.getItem('Meeting-start-time') +`</span>... Is this correct? (The time now is `+timeNow+`).<br/>To reset the Meet start-time, click the blue stop watch icon in the toolbar above.</p>
	<p>If you are the first one to join this Meet, there is <b>nothing</b> that you have to do to take attendence!<br/>The students will be marked present as they arrive. If some of the students got in before you, you might have to click the 'People' icon in the top right corner and then scroll to the bottom of that list to mark the early arrivees present.  However that will not be necessary if you have the tiled layout or Grid View extension enabled.</p>
	
	<p>If you want to monitor who stays in the Meet, you <b>must</b><ol><li>select the 'Monitor Attendance' checkbox in the toolbar above, and <li>either change to the built-in 'Tiled' layout or enable the <a href='https://chrome.google.com/webstore/detail/google-meet-grid-view/kklailfgofogmmdlhgmjgenehkjoioip?authuser=0&hl=en' target='_blank'>Grid View</a> extension</ol>
	<p>To change to the tiled layout, click '<b>&vellip;</b>' in the lower right corner of the Meet screen and choose 'Change layout'</p>
	<p><b>NB</b> - the tiled layout will only work if you have fewer than 16 participants; for larger classes, use Grid View.
	</p>
	<p>Click the checkmark beside the video icon below to hide/show your class list.</p>
	<p class='help-footer'>Click the red 'x' above to close this help page.</p>
	</div>`
	
	document.getElementById('update-text').innerHTML=updateHTML
}
