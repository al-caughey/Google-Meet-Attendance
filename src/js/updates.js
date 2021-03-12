/*updateType
   --> 2:major... dialogs stay on the screen until dismissed
   --> 1:significant... dialogs stay on the screen for 15s (TBD)
	--> 0|null: minor... dialogs adhere to prefer on Settings tab
*/
let updateSummary=[
	{
		version: '1.0.1', 
		title: 'Changes in v', 
		updateType: 0,
		intro: "Lots of exciting changes:", 
		body: `<li>Far too many updates to list here... watch the video about <a class='gma-video-link' href='https://www.youtube.com/watch?v=pQG1IBiv83Q' target='_blank'>what's been changed</a> and/or check the <a href='https://facebook.com/GoogleMeetAttendance' target='_blank'>Facebook page</a>.  OK? 
		<li>Thanks to every who helped with the Beta and also a heartfelt thank you to Eric Findlay who's answering so many inquiries on the Facebook page!
		<p class='warning'>FYI - This update to the Google Meet Attendance extension makes some internal changes to its internal data structures. As a precaution, a '<i>just-in-case</i>' back-up of your current class names and student lists was saved to your downloads directory.</p>
		<p><a class='gma-video-link' href='https://youtube.com/c/AllanCaughey/' target='_blank'>The full YouTube video library</a>.</p>`,
		footer:"Click the next <img id='nav-btn'> button above to see changes in earlier versions."
	},
	{
		version: '0.9.0/0.9.1', 
		title: 'Changes in v', 
		updateType: 1,
		intro: "Added class notes and 'alternate' names", 
		body: `<li>v0.9.1 - fixed a couple of CSS errors that hid the names in the reports... oops!
		<li>There is a new field in the attendance dialog so that you can add little notes to remind you of significant moments after the fact.  This field will be displayed during and after the Meet. The notes will appear above the table in the HTML reports.
		<li>You can now 'alias' the student sign-in names to something else... just start the row in the attendance field with the preferred display name and the add the sign-in name in brackets<br/>Al C (Allan Caughey)... the HTML report will show just the 'display' names
		<li>Related to the one above, text wrapped in square brackets is ignored (at least one school system appends [student] to the students' names and this causes incorrect results when the names are sort)
		<li>fixed the issue that showed the students as absent while the teacher was presenting
		<li>fixed an issue if the names were listed as 'last, first' --> the comma in the name messed up the HTML reports
		<li>fixed an issue that possibly resulted in a negative meeting length (oops!)
		<p><a class='gma-video-link' href='https://youtube.com/c/AllanCaughey/' target='_blank'>See a video about these and other changes</a>.</p>`,
		footer:"Click the next <img id='nav-btn'> button above to see changes in earlier versions."
	},
	{
		version: '0.8.1/0.8.2', 
		title: 'Changes in v', 
		updateType: 0,
		intro: "CSS changes and a small regular expression change; fixed default values for Settings", 
		body: `<li>v0.8.2 - fixed a small logic flaw that resulted in two copies of the files being autosaved (and a few other minor changes to when save reminders get posted)
		<li>Bit the bullet and updated my CSS code so that 'offending' libraries in other extensions do not break the way that this one displays (e.g., Meet Attendance and Google Meet Plus)
		<li>Fixed a logic flaw for default values in the Settings (which may have resulted in missing HTML/CSV files if the Meet tab was closed rather than properly ending the Meet).
		<p><a class='gma-video-link' href='https://youtube.com/c/AllanCaughey/' target='_blank'>See a video about these and other changes</a>.</p>`,
		footer:"Click the next <img id='nav-btn'> button above to see changes in earlier versions."
	},
	{
		version: '0.8.0', 
		title: 'Changes in v', 
		updateType: 1,
		intro: "Monitoring is now the default behaviour (and cannot be turned off) & other changes on the Settings tab.", 
		body: `<li>Removed the monitor attendance option from the Settings tab meaning that attendance will be monitored once per minute all of the time now.
		<li>Added an option on the Settings tab to sort names by first, last or none... <br/>The sort is performed automatically whenever there is a change in the field.  To force a sort, add a space after a name or a blank line to the field.
		<li>Added a button on the Settings tab to back-up your class lists to a text file (just in case!)<br/>The file will be written to your downloads directory.
		<li>Fixed a small bug with multiple spaces and/or tabs between names.
		<li>Fixed a bug where names were not being assigned properly after adding a new class.
		<p><a class='gma-video-link' href='https://youtube.com/c/AllanCaughey/' target='_blank'>See a video about these and other changes</a>.</p>`,
		footer:"Click the next <img id='nav-btn'> button above to see changes in earlier versions."
	},
	{
		version: '0.7.11', 
		title: 'Changes in v', 
		updateType: 1,
		intro: "Fixed 'keep_off' issue and a few more updates", 
		body: `<li>Fixed the way that names are automatically added to the class list<br/>Also added an arbitrary upper limit of 256 names but that can be changed on the Settings tab (it is just there to prevent an unanticipated error condition from adding names to the class ad infinitum)
		<li>You can now change settings after the Meet has started
		<li>Added an option to disable the extension for just the current Meet
		<li>Added a timeout to the meet start dialog
		<p><a class='gma-video-link' href='https://youtube.com/c/AllanCaughey/' target='_blank'>See a video about these and other changes</a></p>`,
		footer:"Click the next <img id='nav-btn'> button above to see changes in earlier versions."
	},
	{
		version: '0.7.10', 
		title: 'Changes in v', 
		intro: 'Attendance Summaries the HTML reports:', 
		body: `<li>HTML reports: You can now summarize the results from multiple Meets into a single report and the export that results as a static HTML file - for entire classes or just a specific student
		<p><a class='gma-video-link' href='https://youtu.be/91016x4w-i8' target='_blank'>See a video about these changes</a></p>`,
		footer: "Click the next <img id='nav-btn'> button above to see changes in earlier versions."
	},
	{
		version:'0.7.9', 
		title:'Changes in v', 
		intro:'More bug fixes in the HTML reports:', 
		body:`<li>HTML reports: There was a logic issue that affected the display of the results if your meeting started before and ended after 10AM... that has been fixed.
		<li>HTML reports: There was another minor display issue if your meeting started before and ended after midnight... oddly, no-one has reported that!
		<li>HTML reports: If there is something odd in the data, it is now noted below the table - e.g., duplicated, missing or mismatched names, etc.
		<li>HTML reports: At the bottom of the reports page, I've added a button that allows you to update older report files to the newest format... see the video for details
		<p><a class='gma-video-link' href='https://youtu.be/jgRoR2hOmDw' target='_blank'>See a video about these changes</a></p>`,
		footer:"Click the next <img id='nav-btn'> button above to see changes in earlier versions."
	},
	{
		version:'0.7.7 & 0.7.8', 
		title:'Changes in v', 
		intro:'Added logging and some bug fixes in the HTML reports:', 
		body:`<li>The biggest change is that you can optionally collect logging information (to assist with support issues)... by default this setting should probably be turned off
		<li>A new user who requests to join your Meet will only be added to the class list if you click the 'Admit' button 
		<li>HTML report: fixed a logic error when calculating the earliest arrival times
		<li>HTML report: fixed a bug if the Meet start time rounded down to the top of the hour
		<li>HTML report: the columns in the table now include the earliest arrivals (presuming that they joined before the Meet actually started)
		<li>HTML report: Added a 'Questions/Feedback' button
		<li>HTML report: Added a field for the logs (if the setting is enabled)
		<li>A minor under-the-cover data structure change to better handle the situation where you have multiple Meets running on the same devices and google supplied identifiers for meeting participants
		<p><a class='gma-video-link' href='https://youtu.be/lzOZ0bpxTic' target='_blank'>See a video about these changes</a></p>`,
		footer:"Click the next <img id='nav-btn'> button above to see changes in earlier versions."
	},
	{
		version:'0.7.4, 0.7.5 & 0.7.6', 
		title:'Changes in v', 
		intro:'Primarily bug fixes in the HTML reports:', 
		body:`<li>fixed the initial arrival time being 1min earlier that what is shown in the reports
		<li>HTML report: fixed a bug were the 'stayed' value could be longer than the meet
		<li>HTML report: added send time and duration to header 
		<li>HTML report: fixed a discrepancy between the pop-up summary and the expanded summary columns
		<li>Found and fixed an oops mistake in the CSS (v0.7.5)
		<li>Fixed a (gross) translation error in Spanish
		<p><a class='gma-video-link' href='https://youtu.be/AxDIYkhtODU' target='_blank'>See a video about these changes</a></p>`,
		footer:"Click the next <img id='nav-btn'> button above to see changes in earlier versions."
	},
	{
		version:'0.7.3', 
		title:'Changes in v', 
		intro:'Very minor changes in this update:', 
		body:`<li class='important-msg'>the Privacy Policy was updated to indicate it <i>might be updated from time to time</i>
		<li>A small translation change for the Brazilian UI
		<li>Added a small visual clue as to whether monitoring is enabled`,
		footer:"Click the next <img id='nav-btn'> button above to see changes in earlier versions."
	},
	{
		version:'0.7.2', 
		title:'Changes in v', 
		intro:'Minor changes in this update:', 
		body:`<li>you can now view (but *not* change) the Settings tab while in a Meet 
		<li>a minor change to getting participant ids (for internal purposes)
		<li>fixed a bug in the hover text in the HTML report that showed incorrect values if a student exited & rejoined the Meet
		<li>changed the HTML file to better highlight students who leave & re-enter a Meet & added the number of re-entries to the hover text
		<li> .1 --> small translation change for Brazilian UI`,
		footer:"Click the next <img id='nav-btn'> button above to see changes in earlier versions."
	},
	{
		version:'0.7.1', 
		title:'Changes in v', 
		intro:'Lots of under-the-cover changes in this update:', 
		body:`<li>fixed hiding dialog in meet issue
		<li>Added options on the Settings tab to<ul>
		<li>auto clear the checkmarks from a previous meet<br/>(if not set, you'll get a confirm dialog)<br/>
		<li>auto save the HTML and/or CSV files<br/>
		<li>auto close the updates dialog after a set number of seconds<br/>(enter 0 to hide the updates completely)
		</ul>`,
		footer:"Click the next <img id='nav-btn'> button above to see changes in earlier versions."
	},
	{
		version:'0.7.0', 
		title:'Changes in v', 
		intro:'Lots of under-the-cover changes in this update:', 
		body:`<li>New internal data structure to track attendance
		<li>Added the Settings tab (see the gear icon in the footer)
		<li>Moved the monitor attendance checkbox from the toolbar to the settings tab
		<li>Minor tweaks to the add classes UI<li>The help and update pages were completely restructured and the text updated
		<li>More targeted information on the Start-Meeting dialog

		<li>Added charset delaration to HTML reports so that chars appear properly and a legend at the bottom of the page
		`,
		footer:"Click the next <img id='nav-btn'> button above to see changes in earlier versions."
	},
	{
		version:'0.6.4', 
		title:'Changes in v', 
		intro:'There are a couple of minor changes in this update:', 
		body:`<li>fixed a CSS conflict (caused by another attendance extension) that blocks normal checkbox functionality
		<li>added arrival, etc. columns to the HTML report`,
		footer:''
	},
	{
		version:'0.6.3', 
		title:'Changes in v', 
		intro:'There are a couple of minor changes in this update:', 
		 
		body:`<li>This dialog will auto-hide in 10 seconds.<br/>Click the version info below to see it again.
			<li>Added Chinese translation
			<li>Prompts to clear checks from previous Meet
			<li>HTML report: added hover text to html template for name; widened name column; fixed bug in report if it was generated before the meeting ended
			<li>fixed startup race condition (if you clicked join too quickly)`, 
		footer:''
	},
	{
		version:'0.6.2', 
		title:'Changes in v', 
		intro:'There are several noticable changes in this update::', 
		 
		body:`<li>Rolled back some changes in the code that checks for participants (hoping that that will resolve the problem that keeps adding names to the list )
			<li>Added a dropdown under the date in the HTML reports so that you can quickly navigate to past attendance checks... this is pretty new.  It presumes that all of the HTML files are saved in the same folder)
			<li>Significantly shortened the placeholder text if the class list field is empty`, 
		footer:''
	},
	{
		version:'0.6.1', 
		title:'Changes in v', 
		intro:'There are several noticable changes in this update::', 
		body:`<li>Fixed a bug that prevented Named Classes from being added properly in languages other than English (Sorry about that)
				<li>Now show the number of participants in the top right corner of the class list field`, 
		footer:''
	},
	{
		version:'0.6.0', 
		title:'Changes in v', 
		intro:'There are several noticable changes in this update::', 	 
		body:`<li>You can now save the attendance report in HTML format... see the new HTML icon in the toolbar (it'll be come visible at the end of your meet)
			<li>The attendance monitoring data is now saved to a session variable which means that it is not lost if you have to restart your Meet (or if you accidentally leave the Meet without saving the changes!)
			<li>Once you start your Meet, clicking the red 'x' obscures (but not immediately hide) the Class List and toolbar.  Click the green check at the bottom of the page to show/hide the field
			<li>If you drag the attendance fields to a new location on the screen, it is positioned there again the next time you enter a Meet.  And, you cannot drag it off the screen anymore
			<li>I fixed a(nother) CSS conflict that hid the monitor checkbox 
			<li>Names in a class list can be &lt;first&gt; &lt;last&gt; or email <br/>addresses &lt;first&gt;.&lt;last&gt;@domain.com... so Al Caughey will now also match al.caughey@email.com`,
		footer:''
	},
	{
		version:'0.5.4', 
		title:'Changes in v', 
		intro:'There are several noticable changes in this update::', 	 
		body:`<li>The Attendance field & toolbar do not appear until the Meet URL includes a meeting code.
			<li>The Class List drop down is now localized to French, German, Dutch, Spanish & Portuguese.<br/>Please let me know if the text needs to be tweaked (if it's wrong, I'm blaming Google Translate).  If you'd like to have more of the interface translated, send me the text and I will add it into the extension. Sadly, I'm not a polyglot... 
			<li>When you start your meet, the Attendance field is no longer automatically hidden... this is intended to allow you to confirm that everything is set properly before you get going (esp. the Start time of the meet).<br/>Click the blue stop watch in the toolbar to reset the start time.
			<li>The button to check attendance has been removed (it really was not necessary and I think confused new users)
			<li>I've extended the localization strings to catch 'Hide/Show Participant' messages from Grid View
			<li>LBNL, this update info is now split over several pages... click '>' above to go to the next page`, 
		footer:''
	},
]
let installSummary=[
	{
		version:'', 
		title:'Getting Started...', 
		intro:"Contragulations!  If you are seeing this dialog, it means that you've completed the first step to tracking attendance during your Google Meet classes.", 
		body:`<li>If you have fewer 49 students in your classes (and have the expanded built-in Tiled layout), you should be good to good to go.., just make sure that you select the 'Tiled' layout when you start your Google Meet.
		<li class='warning'>If you have more than 49 students in your classes, you <b>*<u>must</u>*</b> also install the <a href='' target='_blank'>Grid View (fix)</a> extension and must make sure that the <i>'Only show participants with video'</i> option in the Grid View menu is <b>deselected</b>.
		<li>Click the next <img id='nav-btn'> and previous <span class='nav-btn'><</span> buttons to see additional help topics in this dialog
		<li>For a more detailed description, checkout the videos at my <a href='https://www.youtube.com/c/AllanCaughey/' target='_blank'>YouTube channel</a>** or visit the <a href='https://www.facebook.com/GoogleMeetAttendance' target='_blank'>Facebook page</a>.
		<li>I post updates to the Facebook page on a regular basis.
		<li>If you'd like, you can show your support via <a href='https://paypal.me/AlCaughey/'>PayPal</a>.`, 
		footer:''
	},
	{
		version:'', 
		title:'Setting-up your Classes', 
		intro:'Taking attendance is about recording who is there as well as who is not.  To make that possible, you have to start with the names of the people who you expect to attend your Meets..', 
		body:`<li>Using the 'Class List' dropdown, you can 'Add' your classes and then read the names from a text file by clicking the folder icon (or you can type or paste them into the field).</p>
			<p><b>NB</b> - You should only have to set up your classes once (presuming that Google sync and localStorage are working as intended).  With Google sync, your class lists will be available on any laptop/PC/Chromebook when you log-in with the same credentials.</p>
			<li>To delete a named class, click the trash can icon.  Currently there is no way to change a class name once you've entered it... instead, copy the names, click 'Add' from the drop down and then paste them into the field.  Then change back to the misnamed class, and click the trash can to delete it.
			<li>Choose 'Reset' under the drop downto delete all of the named classes
`, 
		footer:'You should normally only have to enter your classes once.  If they are not being saved from one session to the next, make sure that Sync enabled and/or that your IT department allows LocalStorage variables.'
	},
	{
		version:'', 
		title:'Starting the Meet', 
		intro:"After entering your class lists, you're ready to start a Meet. ",
		body:`<li>Select the appropriate class from the drop down list
			<li>Click 'Join Now'
			<li>Confirm that the Meet start time is correct
			<li>Ensure that Grid View (fix) is enabled or that you are in the Tiled layout
			<li>Close the Meeting start dialog (or let it close on it's own)
			<li>Run your Meet
			<li>You can show/hide the attendance fields by clicking the checkmark (✔) in the toolbar at the bottom of the screen (beside the video icon).  You can also drag the field anywhere that you want on the screen. 
			
`, 
		footer:'Normally, attendance will be taken completely automatically without any intervention on your behalf.'
	},
	{
		version:'', 
		title:'Taking Attendance', 
		intro:"You really do not have to do anything!",
		body:`<li>A checkmark (✔) will be prepended to the students' names as they join. 	
			<li>If someone shows up unexpectedly (i.e., their name was not in the class list), their name will be appended to the bottom of the list prefaced with a question mark (?).
			<li>You can click the pink eraser icon to clear all of the checks (although they'll get filled in quite quickly)
			<p class='warning'>The HTML and CSV files will only contain valid information if all students are visible on your Meet screen for entire the duration of your Meet.  If you need to present something from your computer, share it from a separate browser window.</p>
			
`, 
		footer:''
	},
	{
		version:'', 
		title:"Monitoring Who's There", 
		intro:"Once again, you really do not have to do anything!",
		body:`<li>Simply make sure that the 'Monitor Attendance' checkbox is selected on the (NEW) 'Settings' tab
			<p class='warning'>For this feature to work properly, all students must be visible on your Meet screen for entire the duration of your Meet.  If you need to present something from your computer, share it from a separate browser window.</p>
			
`, 
		footer:""
	},
	{
		version:'', 
		title:"Saving the Attendance", 
		intro:"When your Meet is over, click the red phone icon to end the session",
		body:`<li>Click the disk icon to save the results in CSV format
			<li>Click the html page to save the files in HTML format
			<li>The files will be saved to your Downloads folder (according to your browser preferences)
`, 
		footer:'Please send me both files if you notice any discrepancies in the reports.'
	},
	{
		version:'', 
		title:"Working in different languages", 
		intro:"The extension already works in a number of languages - including English, French, German, Dutch, Spanish, Portuguese and Chinese.",
		body:`<li>It is setup to support additional languages... all that is needed are the translations of a few key phrases.
		<li>The hardest part of adding new languages (other than the fact that I do not know them) is testing that my code correctly eliminates the various system messages generated in a Google Meet.
		<li>It often will take a couple of iterations to catch all of the subtle variations but it can be done and usually quite quickly!
`, 
		footer:"Please contact me if you'd like the extension to support your language."
	},
	{
		version:'', 
		title:"Getting help", 
		intro:"I wish it was not true but I'm wise enough to know that my extension won't work perfectly in all circumstances.  I test things as much as I can but have to do so around my teaching & family schedule (often, I'm working on this code until 1-2AM). I cannot anticipate or test every possible scenario from my home office so when things don't go right:",
		body:`<li>Please be patient
			<li>Share as much information as possible - including screenshots and your HTML & CSV files... 
			<li>Enable the (new) 'Generate logs' option on the Settings tab to send more info!
			<li>Click the 'Questions/Feedback' in the HTML reports
			<li>Post questions to the <a href='https://www.facebook.com/GoogleMeetAttendance/' target='_blank'>Facebook page</a> first (because everyone can learn from the problem)
			<p class='warning'>If you do share a screenshot to the Facebook page, please blur your students' names and any other PII...
			<br/><a href='https://getgreenshot.org/' target='_blank'>Greenshot</a> is an open-source screen capture utility which includes a nice obfuscate tool (and a lot of other good features)
`, 
		footer:"As a last resort (please), send an email to <a id='questions' target='_blank' href='mailto:al@caughey.ca?subject=Questions/Feedback about the Attendance extension&body=Please provide as much information in this email as possible - for example: a description of the problem, screenshots that highlight the issue.  It would be *really* helpful if you also attached the HTML file in question.%0D%0A%0D%0AThanks for your assistance%0D%0A%0D%0AAl'>my personal address </a>"
	},
	{
		version:'', 
		title:"Privacy Policy", 
		intro:"In short, this extension does not transfer, track or share any student, user or usage information.",
		body:`<li>I am first and foremost a school teacher so I fully understand and respect the need for privacy of student information.  As such, I do not transmit or track any student information. 
		<li>Here is a link to the <a href='https://github.com/al-caughey/Google-Meet-Attendance/blob/master/PRIVACY.md' target='_blank'>privacy policy</a><br/>
		I reserve the right to make changes to this policy.  If that occurs, I will post an update when you launch the updated version.
`, 
		footer: `<b>Full disclosure</b>: This extension leverages the <a href='https://developer.chrome.com/extensions/storage' target='_blank'>Chrome 'sync' Service</a> which means that your class lists will be available on all PCs/laptops/Chromebook on which you are signed in with the same credentials. Click your user image in the top right corner of the screen to see whether or not sync is enabled for your profile.<br/> <br/> 
		All of the 'sync'ing between your devices is actually completed by Google using their standard API calls.`
	},
	{
		version:'', 
		title:"Last thoughts...", 
		intro:"Thank you so much for installing my extension! I'm overwhelmed by the fact that it's has more than 650,000 weekly users!!!",
		body:`<p>I am exceptionally fortunate to live in an area where we've not been badly affected by Covid-19.  I've had conversations with teachers from around the globe who are working under very difficult circumstances. I hope/trust that you are doing what you can to keep yourself, your family and your students safe and sane.</p>
		<p>I'm keen to hear your feedback... please share your constructive criticism and opinions at my <a href='https://www.facebook.com/GoogleMeetAttendance/' target="_blank">Facebook page</a>.  Or in a pinch, at <a id='questions' target='_blank' href='mailto:al@caughey.ca?subject=Questions/Feedback about the Attendance extension&body=Please provide as much information in this email as possible - for example: a description of the problem, screenshots that highlight the issue.  It would be *really* helpful if you also attached the HTML file in question.%0D%0A%0D%0AThanks for your assistance%0D%0A%0D%0AAl'>my personal address </a>.</p>
`, 
		footer: ``
	},
]

let settingsTab=[
	{
		version:'', 
		title:'Tweak your settings', 
		intro:"Adjust the settings below as per your needs:", 
		body:``, 
		footer:"<p>You can now alter the settings while in a Meet!!!</p>"
	},
]

let meetStart=[
	{
		version:'', 
		title:'Your Meet has started', 
		intro:'Please confirm that the following settings are correct before you get going:', 
		body:``, 
		footer:"Click the checkmark ✔ beside the video icon below to hide/show the Attendance dialog."
	},
]

function hideUpdateText(){
	cancelEditStudent()
	document.getElementById('gma-class-list-div').style.display='block'
	document.getElementById('gma-messages-div').style.display='none'
	let showing=document.getElementById('gma-messages-div').getAttribute("showing"); 
	if (showing==='start-meeting' && document.getElementById("gma-attendance-fields").classList.value.indexOf('meeting-over')==-1){
		document.getElementById("gma-attendance-fields").classList.add('in-meeting')
	}
}

function clearOtherTimers(){
	if(typeof(updateDialogTimeout)!='undefined'){
		clearTimeout(updateDialogTimeout)
		document.getElementById('messages-div-footer').setAttribute('auto-hide-count-down',0)
	}
}
function hideUpdateTimeOut(d){
	updateDialogTimeout=window.setTimeout(function(){
		document.getElementById('auto-hide-count-down').innerText=d
		document.getElementById('messages-div-footer').setAttribute('auto-hide-count-down', d)
		if( d === 0 ){
			hideUpdateText();
		}
		else{
			hideUpdateTimeOut( d*1-1 )
		}
	},1000)
}			   

function showHelpPage( pn, d ){
	let ht=document.getElementById('gma-messages-div').getAttribute("showing")
	let whichArr
	if(ht==='install'){
		whichArr=installSummary
	}
	else if(ht==='updates'){
		whichArr=updateSummary
	}
	else if(ht==='settings'){
		whichArr=settingsTab
	}
	else if(ht==='start-meeting'){
		whichArr=meetStart
	}
	let hp=whichArr[pn]
	let ul=hp.updateType||0
	document.getElementById('gma-messages-div').setAttribute("page", pn); 
	document.getElementById('messages-page-title').innerHTML=hp.title+hp.version
	document.getElementById('help-page-intro').innerHTML=hp.intro
	document.getElementById('help-page-body').innerHTML=hp.body
	document.getElementById('help-page-footer').innerHTML=hp.footer||''
	if(!!document.getElementById('nav-btn'))document.getElementById('nav-btn').src=chrome.runtime.getURL("images/next-page.png")

	if(pn==0){
		if( ul == 2 || !d ){
			document.getElementById('gma-class-list-div').style.display='none'
			document.getElementById('gma-messages-div').style.display='block'
			return
		}
		if( ul == 1  ){
		document.getElementById('gma-class-list-div').style.display='none'
			document.getElementById('gma-messages-div').style.display='block'
			hideUpdateTimeOut(15)
			return			
		}
		if ( ul == 0 && d == 0 ){
			document.getElementById('gma-class-list-div').style.display='block'
			document.getElementById('gma-messages-div').style.display='none'
			return
		}
		document.getElementById('gma-class-list-div').style.display='none'
		document.getElementById('gma-messages-div').style.display='block'
		hideUpdateTimeOut(d)
	}
}

function showPrevHelp(){
	clearOtherTimers()
	document.getElementById('prev-page').style.visibility='visible'
	document.getElementById('next-page').style.visibility='visible'
	let pn=document.getElementById('gma-messages-div').getAttribute("page")
	let npn=pn*1-1
	if(npn<=0) document.getElementById('prev-page').style.visibility='hidden'
	//console.log('showPrevHelp',npn)
	showHelpPage( npn )
}
function showNextHelp(){
	clearOtherTimers()
	document.getElementById('prev-page').style.visibility='visible'
	document.getElementById('next-page').style.visibility='visible'
	let ht=document.getElementById('gma-messages-div').getAttribute("showing")
	let pn=document.getElementById('gma-messages-div').getAttribute("page")
	let npn=pn*1+1
	//console.log('showNextHelp',npn)
	let arrLen=(ht==='updates')?updateSummary.length:installSummary.length
	if(npn>=arrLen-1) document.getElementById('next-page').style.visibility='hidden'
	showHelpPage( npn )
}

function showInstall( e ){
	var thisVersion = chrome.runtime.getManifest().version;

	clearOtherTimers()

	chrome.storage.sync.get( ['__GMA_status', 'auto-hide-updates' ], function(r){
		document.getElementById('gma-messages-div').setAttribute("showing", "install")

		document.getElementById('prev-page').style.visibility='hidden'
		document.getElementById('next-page').style.visibility='visible'
		document.getElementById('messages-title').innerText='New Installation'
		let duration=null
		if(typeof(e)!='object'){
			duration=45
		}
		showHelpPage( 0, duration )
	})
}

function showUpdate(e){
	var thisVersion = chrome.runtime.getManifest().version;
	
	clearOtherTimers()
	
	chrome.storage.sync.get( ['__GMA_status', 'auto-hide-updates' ], function(r){
		document.getElementById('gma-messages-div').setAttribute("showing", "updates")
		document.getElementById('prev-page').style.visibility='hidden'
		document.getElementById('next-page').style.visibility='visible'
		document.getElementById('messages-title').innerText='Update: v'+chrome.runtime.getManifest().version
		let duration=null
		if(typeof(e)!='object'){
			duration=r['auto-hide-updates' ]||10
		}
		showHelpPage( 0, duration )
	})
}

function showSettings(){
	// create settings options
	function addSettingsOption(n){
		let nm = settingsArray[n].name, ty = settingsArray[n].type, ti = settingsArray[n].title, te = settingsArray[n].text, dv = settingsArray[n].default_value
		//console.log('addSettingsOption', nm)
		let hpb = document.getElementById( 'help-page-body' )
		if( ty === 'button' ){
			let tmp = addElement( hpb, 'span', nm + '-label', ti, 'settings-label', '' )
			addElement( tmp, 'span', '', ti, 'input-label', te )
			let nb = addElement( tmp, 'button', nm, '' )
			nb.innerText = te.split(' ')[0]
			if( nm === 'backup-class-lists' ){
				nb.addEventListener( 'click', backupClassLists, false )
			}
		}
		else{
			
			if( ty ==='radio' ){
				te=te.split('|')
				let tmp = addElement( hpb, 'span', nm+'-label', ti, 'settings-label', '' )
				addElement( tmp, 'span', '', ti, 'input-label', te[0] )
				for( let n = 1; n < te.length; n++ ){
					let rbn = nm + '-' + te[n]
					let rbne = addElement( document.getElementById( nm + '-label' ), 'label' , rbn,'' )
					let nb = addElement( rbne,'input','radio-'+rbn,'','',te[n] )
					addElement( document.getElementById(rbn), 'span' ,'' , '', '', te[n] )
					nb.type = ty
					nb.name = nm
					nb.value = te[n]
					nb.addEventListener('change', saveSettings, false)
					if ( te[n] == dv ) {
						rbne.classList.add( 'default' )
					}
				}
			}
			else{
				let tmp = addElement( hpb, 'label', nm+'-label', ti,'settings-label', '' )
				addElement( tmp, 'span', '', ti, 'input-label', te )
				let ni = addElement( tmp, 'input', nm, '' )
				ni.type = ty
				ni.addEventListener( 'change', saveSettings, false )
				ni.onmousedown = stopProp;
				ni.setAttribute('placeholder', dv )
			}
			let son=[]
			son.push(nm)
			chrome.storage.sync.get(son, function(r){
				//let tv=r[nm]==='undefined'||(!settingsArray[n].default_value?'':settingsArray[n].default_value)
				let tv = typeof( r[ nm ] ) === 'undefined' ? ( !dv ? '' : dv ) : r[ nm ]
				if ( ty === 'checkbox'){
					document.getElementById( nm ).checked = tv
				}
				else if ( ty === 'radio'){
					document.getElementById( 'radio-' + nm + '-' + tv ).checked = true
				}
				else{
					document.getElementById( nm ).value = tv			
				}
			})
		}
	}
	
	clearOtherTimers()

	document.getElementById('gma-messages-div').setAttribute("showing", "settings")
	document.getElementById('prev-page').style.visibility='hidden'
	document.getElementById('next-page').style.visibility='hidden'
	document.getElementById('messages-title').innerText='Settings'

	showHelpPage(0)
	for(let n in settingsArray){
		addSettingsOption(n)
	}
	
	document.getElementById('auto-hide-updates').setAttribute('placeholder', 10)

}


function showMeetingStarted(){
	//console.log('showMeetingStarted')

	clearOtherTimers()
	
	document.getElementById('gma-messages-div').setAttribute("showing", "start-meeting"); 
	document.getElementById('gma-messages-div').style.display='block'
	document.getElementById('gma-class-list-div').style.display='none'
	document.getElementById('prev-page').style.visibility='hidden'
	document.getElementById('next-page').style.visibility='hidden'
	document.getElementById('messages-title').innerText='Meeting Start'

	showHelpPage(0, 20)

	let gmgv=document.querySelectorAll('.__gmgv-button'), gmgvNotCorrect=''
	let nstu=document.querySelectorAll( '.student-button' ).length
	let now = new Date(), timeNow = now.getHours()+':'+twod(now.getMinutes())
	
	let hpb=document.getElementById( 'help-page-body' )
	addElement(hpb,'li','','','',"Your Meet start-time is set to <span id='current-start-time'></span> and it is now <span id='current-time'></span>.<br/>If your  start-time is not correct, click <span id='resetStartTime'></span>.")

	addElement(hpb,'li','','','',"<b>Remember</b>: to correctly take and monitor attendance, all students <b><u>must</u></b> be visible in your Meet window for the entire duration of your class")			
	if(nstu<49){
		write2log( 'Class smaller than 49... use Tiled layout ' + nstu )
		addElement(hpb,'p','','','',"Your class is small enough to use the built-in Tiled layout.<br/>Please confirm that you are using this layout by clicking the vertical ellipsis \'&vellip;\' in the bottom right corner of the screen and choosing `Change layout` (or make sure the Grid View (fix) extension is installed & enabled).")
	}
	else{
		addElement(hpb,'p','','','',"Your class is larger than 16 students so you <b><u>must</u></b> use the Grid View (fix) extension.")
		if(gmgv.length===0){
			write2log( 'Class larger than 49... Grid View is not installed' )
			addElement(hpb,'p','','','warning',"It appears that you have not installed (or perhaps have disabled) the Grid View extension.")		
			addElement(hpb,'p','','','',"The Grid View extension can be downloaded <a href='https://chrome.google.com/webstore/detail/google-meet-grid-view/kklailfgofogmmdlhgmjgenehkjoioip?authuser=0&hl=en' target='_blank'>here</a></p>")	
		}
		else{
			if(gmgv[0].innerHTML.indexOf('M10,4V8H14V4H10M16')==-1){
				write2log( 'Class larger than 16... Grid View is not enabled' )
				addElement(hpb,'li','','','warning',"It appears that the Grid View extension is installed but might not be enabled.  Please check again to ensure that Grid View enabled.")		
			}
			if(document.querySelector('[data-gmgv-setting="show-only-video"]').checked){
				write2log( 'Class larger than 16... Grid View is not enabled' )
				addElement(hpb,'li','','','warning',"The Show only participants with video option <b><u>cannot</u></b> be checked as only those students will be marked present!")		
			}
		}
		document.querySelector('[data-gmgv-setting="show-only-video"]').checked

	}
			
		
	addElement(hpb,'li','','','',"If you must present content from your computer, I suggest that you share a separate window or a second screen.")		

	document.getElementById('current-start-time').innerText=sessionStorage.getItem('Meeting-start-time') 
	document.getElementById('current-time').innerText=timeNow
	let updateHTML=`<p></p>`+gmgvNotCorrect+`
	
	<p></p>
	`
	//document.getElementById('messages-div-body').innerHTML=updateHTML
	
	document.getElementById('resetStartTime').appendChild(document.getElementById('start-time').cloneNode(true))
	document.getElementById('resetStartTime').addEventListener('click', setStartTime, false)

}
