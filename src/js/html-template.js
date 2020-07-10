
// save the attendance info to an html file
function saveHTMLFile(){

	let now = new Date(), d = now.getDate(), m = now.getMonth()+1, y = now.getFullYear()
	let ctime = now.getHours()+':'+twod(now.getMinutes())
	let cdate = y+'-'+twod(m)+'-'+twod(d)
	let cdd = document.getElementById("select-class"), className = cdd.options[cdd.selectedIndex].text;

	if(!sessionStorage.getItem( 'Meeting-end-time')) sessionStorage.setItem( 'Meeting-end-time', ctime )

	chrome.storage.sync.get(['saved-attendance', 'generate-log'], function (r) {
		let sal=r['saved-attendance']||{}

		let filename=className+' ('+cdate+').html'
		if( !sal[className] ) sal[className]=[]
		if( !sal[className].includes(cdate) ) sal[className].push(cdate)

		let html=htmlTemplate;

		html=html.replace( '[%%classDate%%]', cdate )
		html=html.replace( '[%%startTime%%]', sessionStorage.getItem( 'Meeting-start-time' ) )
		html=html.replace( '[%%endTime%%]', sessionStorage.getItem( 'Meeting-end-time' ) )
		html=html.replace( '[%%className%%]', className )
		html=html.replace( '[%%_activeMeetID%%]', sessionStorage.getItem( '_activeMeetIDs' ) )

		let classList = document.getElementById( 'invited-list' ).value.replace( /\n/gm,',').replace(/[✔\?] /g,'' )
		html=html.replace( '[%%dateList%%]', JSON.stringify( sal[className ] ) )
		html=html.replace( '[%%classList%%]', JSON.stringify( classList ) )
		html=html.replace( '[%%arrivalTimes%%]', JSON.stringify( sessionStorage.getItem( '_arrivalTimes' ) ) )
		html=html.replace( '[%%gmaLog%%]', !r['generate-log']?'':sessionStorage.getItem( 'GMA-Log' ) )

		let blob = new Blob( [html] , {type: 'text/HTML;charset=utf-8'})
		let temp_a = document.createElement("a")
		temp_a.download = filename
		temp_a.href = window.webkitURL.createObjectURL(blob)
		temp_a.click()

		document.getElementById('save-html-file').style.visibility = 'hidden'

		sal[className][cdate]=filename
		chrome.storage.sync.set({'saved-attendance': sal}, null )
		write2log('HTML file saved - ' + filename )
	})
}

let htmlTemplate=`
<html>
	<head>
	<meta charset="UTF-8">
	<script type="text/javascript">
		let className="[%%className%%]"
		let classDate="[%%classDate%%]"
		let dateList=[%%dateList%%]
		let startTime="[%%startTime%%]"
		let endTime="[%%endTime%%]"
		let _activeMeetID="[%%_activeMeetID%%]"
		let classList=[%%classList%%]
		let _arrivalTimes=[%%arrivalTimes%%]
	</script>
	<script type="text/javascript" src="https://code.jquery.com/jquery-1.11.2.min.js"></script>
	<script type="text/javascript" src="https://code.jquery.com/ui/1.11.3/jquery-ui.min.js"></script>
	<script type='text/javascript'>

		// pad with a leading zero (for dates & time)
		function twod(v,n){
			if (!n) n=2
			return ('00000'+Number(v)).slice(-n)
		}

		function showToolTip(e){
			let tgt=$(e.target)
			let tgt_p=tgt.parent('.student-row')
			$('#gmatt-tooltip').detach().appendTo(tgt).fadeIn('fast')
			$('#gmatt-arr').text(tgt_p.data('arrived'))
			$('#gmatt-lft').text(tgt_p.data('left'))
			$('#gmatt-sty').text(tgt_p.data('stayed'))
			$('#gmatt-ne').text(tgt_p.data('num-entries'))
		}

		function hideToolTip(e){
			$('#gmatt-tooltip').hide().detach().appendTo($('body'))
		}
		function addWonkyData(txt){
			if( $('#wonky-data').length==0 ){
				let dwd=$('<ul/>').attr('id', 'wonky-data')
				$('#main-table').after(dwd)
			}
			if( $('#wonky-data').is(':empty') ){
				$('<p/>').html("<span class='wonky'></span> There appears to be some odd data in this file:").appendTo('#wonky-data')
			}
			$('<li/>').html(txt).appendTo('#wonky-data')
		}
		$('document').ready(function(){
			$('#className').text(className)
			$('#classDate').empty()
			if(typeof(dateList)=='undefined'){
				dateList=[classDate]
			}
			$.each(dateList, function(v, t){
				let o=$('<option/>').attr('value', t).text(t)
				o.appendTo($('#classDate'))
			})
			$('#classDate').val(classDate)
			$('#meet-startTime').text(startTime)
			$('#meet-endTime').text(endTime)
			if(typeof(_activeMeetID)=='undefined'){
				_activeMeetID=''
			}
			$('#meet-meet-id').text(_activeMeetID)
			$('#logging-info')[$('#gma-log').val()==''?'removeClass':'addClass']( 'showing' )

			let d=$('<div/>')
			d.attr('id','student-row-header').attr('data-student-name', 'Names')
			$('<span/>').addClass('student-name').attr('data-html', true).appendTo(d)
			$('<span/>').addClass('arrived-at sub-column').attr('title','Arrrived at').appendTo(d)
			$('<span/>').addClass('stayed-for sub-column').attr('title','Length of stay in min').appendTo(d)
			$('<span/>').addClass('last-seen sub-column').attr('title','Last seen at').appendTo(d)
			let wwt=[], st=startTime.split(':'), earliestTime=twod(st[0])+':'+twod(st[1]), et=endTime.split(':'), latestTime=twod(et[0])+':'+twod(et[1])
			let atVersion=3
			if(_arrivalTimes.indexOf('{\"name\":')===-1){
				wwt=JSON.parse(_arrivalTimes)
				atVersion=1
			}
			else{
				if( _arrivalTimes.indexOf(':true') > -1 ){
					atVersion=2
				}
				$.each(JSON.parse(_arrivalTimes), function( id, checks ) {
					if(!wwt[checks.name]){
						wwt[checks.name]=[]
						wwt[checks.name].checks=[]
					}
					if(!wwt[checks.name].checks.includes(checks.arrived)) wwt[checks.name].checks.push(checks.arrived)

					$.each(checks.checks, function( n, m ){
						let v=atVersion==3?m:n
						let nn=(v).split(':')
						let ct=twod(nn[0])+':'+twod(nn[1])
						if ( ct < earliestTime ) earliestTime=ct
						if ( ct > latestTime ) latestTime=ct
						if(wwt[checks.name].checks.includes(v)) return
						wwt[checks.name].checks.push(v)
					})
					if(!wwt[checks.name].checks.includes(checks.last_seen)) wwt[checks.name].checks.push(checks.last_seen)
				})
			}
			$('#meet-earliestTime').text(earliestTime)
			let meetLength=(et[0]*60+et[1]*1)-(st[0]*60+st[1]*1)+(et[0]*1<st[0]*1?60*24:0)
			$('#meet-length').text( meetLength )
			let eat=earliestTime.split(':')
			let smin=Math.floor(eat[1]*1/5)*5, shr=eat[0]*1
			let lat=latestTime.split(':')
			let emin=Math.floor(lat[1]*1/5)*5 + 5, ehr=lat[0]*1
			smin=eat[1]%5==0?smin-5:smin
			if (smin===-5){
				smin=55
				shr--
			}
			let meetDuration=(ehr*60+emin)-(shr*60+smin)+(ehr<shr?60*24:0)
			for (let nn=0; nn<meetDuration; nn++){
				let ct=shr*1+':'+twod(smin)
				let s=$('<span/>').addClass('i-'+ct.replace(':','-')).addClass('cc').attr('title', ct)
				if (ct==startTime || ct==endTime || nn%5===0){
					s.addClass(ct==startTime?'m-st':ct==endTime?'m-et':'')
					if(nn%5===0) s.addClass('col5')
					let s2=$('<span/>').text(shr*1+':'+twod(smin)).addClass('rotated')
					s2.appendTo(s)
				}
				s.appendTo(d)
				smin=(smin+1)%60
				if(smin===0) {
					shr++
					shr=shr%24
				}
			}
			d.appendTo('#main-table')
			let cla=classList.split(',')
			$('#student-row-header').clone(true,true).removeAttr('id').addClass('spacer-row').appendTo('#main-table')
			$.each(cla, function( index, value ) {
				let d=$('#student-row-header').clone(true,true).removeAttr('id').addClass('student-row').addClass('not-present')
				let lcn=value.trim().toLowerCase()
				let wr=$('[data-student-name="'+lcn+'"]')
				if(!wr.length){
					d.attr('data-student-name', lcn).find('.student-name').text(lcn)
					d.appendTo('#main-table')
				}
				else{
					addWonkyData("the name <i>'"+value+"'</i> appears more than once in the <b>'classList'</b> variable<br/>&rarr; you can (and probably should) delete the duplicated entries.  Only one row has been added into the table above")
					wr.addClass('wonky')
				}
			});
			$('#student-row-header').clone(true,true).removeAttr('id').addClass('spacer-row').appendTo('#main-table')
			$('.student-row .cc, .spacer-row .cc').text('')
			$('#student-row-header .student-name').text('Names')
			$('#classDate').change(function(){
				window.open($('#className').text()+' ('+$(this).val()+').html')
			})
			let _atd=JSON.parse(_arrivalTimes)
			if( $.isEmptyObject(_atd) ){
				addWonkyData("the <b>'_arrivalTimes'</b> variable is empty so there is no attendance information to display?!?")
			}
			$.each(_atd, function( id, checks ) {
				function earliestArrivalTime(k,j){
					if( !k ) return j
					let a=k.split(':'), b=j.split(':')
					return (twod(a[0])+twod(a[1]) < twod(b[0])+twod(b[1])) ? k : j
				}
				function lastSeenTime(k,j){
					if( !k ) return j
					let a=k.split(':'), b=j.split(':')
					return (twod(a[0])+twod(a[1]) > twod(b[0])+twod(b[1])) ? k : j
				}

				let name=atVersion==1?id:checks.name, lcn=name.toLowerCase()
				let wr=$('[data-student-name="'+name.trim().toLowerCase()+'"]')
				if(!wr.length){
					let mmm=cla.filter(function(nn,b){
						return nn && nn.toLowerCase().indexOf(lcn)===0
					})
					if(mmm.length==1){
						wr=$('[data-student-name="'+mmm[0].trim().toLowerCase()+'"]')
					}
					else{
						let pm=cla.filter(element => element.toLowerCase().includes(lcn))
						if(pm.length==1){
							wr=$('[data-student-name="'+pm[0].trim().toLowerCase()+'"]')
							wr.addClass('wonky')
							addWonkyData("the entry <i>'"+name+"'</i> in the <b>'_arrivalTimes'</b> variable does not appear in the <b>'classList'</b> variable... however, it has a partial (and unique) match to <i>'"+pm[0].trim()+"'</i> in the <b>'classList'</b><br/>&rarr; so, the results for <i>'"+name+"'</i> have been merged into the row for <i>'"+pm[0].trim()+"'</i>")
						}
						else{
							addWonkyData("the entry <i>'"+name+"'</i> in the <b>'_arrivalTimes'</b> variable does not uniquely match any of the names in the <b>'classList'</b> variable?!?<br/>&rarr; a row has been appended to the bottom of the table")
							wr=$('.student-row:last').clone(true).detach()
							wr.addClass('wonky').attr('data-student-name', lcn).find('.student-name').text(lcn)
							wr.find('.cc').removeClass('present pattern-0 pattern-1 pattern-2')
							$('.student-row:last').after(wr)
						}
					}
				}
				let npe=wr.attr('data-num-entries'), te=!npe||npe==''?1:(1*npe+1)
				let lat=earliestArrivalTime( wr.attr( 'data-arrived' ), checks.arrived )
				let lst=lastSeenTime( wr.attr( 'data-left' ), checks.last_seen )
				let nc=atVersion==3?wwt[name].checks.length:Object.keys(wwt[name].checks).length
				$(wr).removeClass('not-present')
				wr.find('.arrived-at').text( lat )
				wr.find('.stayed-for').text( nc )
				wr.find('.last-seen').text( lst )

				$.each(wwt[name].checks, function( n, m){
					let v=atVersion==1?n:m
					let ct='i-'+v.replace(':','-')
					$(wr).find('.'+ct).addClass('present').addClass('pattern-'+te%3)
				})
				wr.attr( 'data-arrived', lat ).attr( 'data-left', lst ).attr( 'data-stayed', nc ).attr( 'data-num-entries', te )
			});
			$('#student-row-header .student-name').text($('.student-row').length+' Names ('+$('.not-present').length+' absent)')

			$('#student-row-header .student-name').click(function(){
				$('#main-table').toggleClass('show-sub-columns')
			})
			$('.student-row :not(.student-name)')
				.mouseenter(function(e){
					hideToolTip(e)
				})
			$('.student-row .student-name')
				.mouseenter(function(e){
					showToolTip(e)
				})
				.mouseleave(function(e){
					hideToolTip(e)
				})
			$('#updateOldReportFiles').click(function(){
				$(this).val('')
			})
			.change(function(e){

				$('#louf').empty()
				const files = e.currentTarget.files;
				let curHead=$('head')[0].outerHTML
				let curBody=$('body').html().replace($('#main-table').html(),'').replace($('#gma-log').html(),'').replace($('#wonky-data').html(),'')
				let curStyles=$('style').text()
				let oldHead=''
				$.each(Array.from(files), function(a,f){
					let fname=f.name
					let reader = new FileReader();
					reader.readAsText(f);
					reader.onload = function(e) {
						let fc = e.target.result
						let htmlTxt=(new DOMParser()).parseFromString(fc, "text/html")
						let cli=!htmlTxt.all['gma-log']?'':htmlTxt.all['gma-log'].value
						htmlTxt.body.innerHTML=curBody
						htmlTxt.scripts[3].textContent=document.scripts[3].textContent
						$(htmlTxt).find('style').text( curStyles )
						$(htmlTxt).find('#gma-log').val( cli )
						let blob = new Blob( [ htmlTxt.all[0].outerHTML ] , {type: 'text/HTML;charset=utf-8'} )

						let temp_a = document.createElement("a")
						temp_a.download = fname
						temp_a.href = window.webkitURL.createObjectURL(blob)
						temp_a.click()
						$('<li/>').text('updated ' + fname).appendTo('#louf')
					}
				})
			})
        });
	</script>
	<style>
		div#main-table { border-top: 2px solid; border-bottom: 2px solid; box-shadow: #555 2px 2px 2px; }
		#main-table.show-sub-columns .sub-column{ display: inline-block; }
		#main-table.show-sub-columns .student-name{ width: 228px; }
		#main-table #student-row-header .student-name:after { content: '☆'; padding-left: 6px; }
		#main-table.show-sub-columns  #student-row-header .student-name:after { content: '★'; padding-left: 6px; }
		.cc { border-left: 1px solid #ccc; flex: 1; max-width: 32px; position: relative;}
		.rotated { bottom: 10px; display: inline-block; font-size: smaller; left: -8px; position: absolute; transform: rotate(-90deg);  }
		.col5{ border-left: 2px solid #333;	}
		.student-row, .spacer-row { display:flex; position: relative; }
		.student-row:nth-child(2n+1){ background-color: #ddd; }
		.student-row.not-present , .legend .cc.absent{ background-color: #fcc; }
		.student-row:nth-child(5n+1) { border-bottom: 1px solid #aaa; }
		.student-row:hover { background-color: #3b770355; border: 2px solid #738ca0; border-left: 0; border-right: 0; }
		.student-row.not-present:hover { background-color: #ef9494; }
		.spacer-row { height: 6px; }
		.student-name, .spacer-student-name { border-left: 2px solid #333; cursor:pointer; display: inline-block; min-width: 100px; overflow: hidden; text-overflow: ellipsis; text-transform: capitalize; white-space: nowrap; width: 184px;}
		.student-row .student-name::before { content: "✔ "; color: #3b7703; }
		.student-row:last-child { border-bottom: 2px solid #333; }
		.not-present .student-name::before { content: " "; padding-right: 15px; }
		.cc{ flex:1; }
		#main-table .cc:last-child { border-right: 2px solid #333; }
		fieldset { background: #eee; border-radius: 12px; margin: 20px 3px; }
		legend { font-weight: bold; }
		.legend p{ margin: 1px; }
		.legend .cc { background-color: #629235; border: 0px; display: inline-block; height: 20px;max-width: unset; min-width: 11px; padding: 0px 8px; vertical-align: middle;  }
		.legend .cc.present.grey { background-color: #5B8B2E; }
		.legend .cc.missing.grey { background-color: #ddd; }
		.legend .cc.missing.white { background-color: #fff; }
		.present { background: #3b7703cc; }
		#student-row-header { background: #777; border-bottom: 3px double #333; color: white; display: flex; font-weight: bold; height: 36px; text-align:center; }
		#student-row-header .student-name, #student-row-header .sub-column { padding-top: 12px; }
		#className, #classDate, #meet-startTime, #meet-endTime, #meet-length, #meet-earliestTime, #meet-meet-id{ font-weight:bold; margin-right: 24px; }
		#meet-length:after { content: " min"; font-weight: normal; }
		#meet-meet-id:empty:before { content: "n/a"; }
		#gmatt-tooltip{ position: absolute; background:#cbdbbc; border:2px solid  #3e6914; border-radius:8px; display:none; padding: 4px 8px; left: 134px; top:-4px; z-index:88; }
		body>#gmatt-tooltip{ display:none!important; }
		.student-row.not-present #gmatt-tooltip { background:#ffafaf; border-color: #7b3900; }
		.student-row.not-present #gmatt-tooltip .was-present { display: none; }
		.student-row.not-present #gmatt-tooltip .was-absent { display: block; }
		.student-row #gmatt-tooltip .was-absent { display: none; }
		.sub-column { display: none; text-align: center; width: 48px; }
		.arrived-at { border-left: 1px solid;  }
		#student-row-header .arrived-at:before{ content: "Arr"}
		#student-row-header .stayed-for:before{ content: "min"}
		#student-row-header .last-seen:before{ content: "Last"}
		.pattern-2 { background: repeating-linear-gradient( 45deg, #3b7703dd, #3b770377 2px, #3b7703cc 3px, #3b7703ff 3px )!important; }
		.pattern-0 { background: repeating-linear-gradient( -45deg, #3b7703dd, #3b770377 1px, #3b7703cc 2px, #3b7703ff 3px  )!important; }
		.m-st { border-left: 5px double #82020266; }
		.m-et { border-right: 5px double #82020266!important; }
		#student-row-header .m-st, #student-row-header .m-et { background-color: #82020266;}
		#questions { background: lightblue; border: 2px solid blue; border-radius: 12px; box-shadow: #bbb 4px 4px 8px; font-weight: bold; opacity: .75; padding: 6px; position: absolute; right: 24px; text-decoration: none; top: 42px; }
		#questions:hover{ opacity: 1; }
		#questions:active{ opacity: .333; right: 21px; top: 45px; }
		#logging-info { display: none; }
		#logging-info.showing { display: block; }
		#gma-log { width: 100%; }
		#gma-log:focus { height: 500px; }
		#wonky-data { background-color: #fff98a; border: 1px solid #444; border-radius: 12px; padding: 12px; }
		#wonky-data:empty { display: none; }
		#wonky-data p { font-weight: bold; margin: 0; }
		#wonky-data li { margin-left: 20px; }
		.wonky .student-name::after, #wonky-data .wonky::after { color: red; content: " **"; }

	</style>
	</head>
	<body>

	<div id='attendance-report'>
		<h1>Attendance Report</h1>
		<p>Class: <span id='className'></span>Meet ID: <span id='meet-meet-id'></span>Date: <select id='classDate'></select> Earliest Arrival(s): <span id='meet-earliestTime'></span>  Start Time: <span id='meet-startTime'></span> End Time: <span id='meet-endTime'></span> Length of Meet: <span id='meet-length'></span>
			<a id='questions' target='_blank' href='mailto:al@caughey.ca?subject=Questions/Feedback about Attendance report&body=Before sending this message, please check to see whether your issue has been noted on:%0D%0A- the Facebook page [https://www.facebook.com/GoogleMeetAttendance], or %0D%0A- in the videos at my YouTube channel [https://www.youtube.com/channel/UCcD48u9-OBB8HefX4P3KGgQ]  %0D%0A%0D%0AOtherwise, please provide as much information in this email as possible - for example: a description of the problem, screenshots that highlight the issue.  It would be *really* helpful if you also attached the HTML file in question.%0D%0A%0D%0AThanks for your assistance%0D%0A%0D%0AAl'>Questions or Feedback?</a>
		</p>
		<div id='main-table'>
		</div>

		 <fieldset class='legend'>
			<legend>Legend:</legend>
			<p><span class='cc absent' title='Student was absent'>The student missed the entire class</span></p>
			<p><span class='cc present' title='Student was present'>The student was present</span><span class='' title='Student left the meet'> then exited </span><span class='cc present pattern-2' title='Student was present'>rejoined</span><span class='cc present pattern-0' title='Student was present'>and rejoined again</span><span class='cc present' title='Student was present'> etc.</span><span class='cc present pattern-2' title='Student was present'> etc.</span> (the alternating background patterns indicate that the student may have left and rejoined the Meet)</p>
			<p>To help your eye follow across the page, the table rows alternate between white and <span class='cc missing grey'> grey </span> backgrounds which leads to two subtly different shades of green for the times when the student was present</p>
			<p><b><u>NB</u></b> - If you want a printed copy of this report, make sure that the 'More settings' &rarr; 'Background graphics' checkbox is checked in the Print dialog,.</p>
		 </fieldset>
		 <fieldset id='logging-info' class='legend'>
			<legend>Logging Information:</legend>
			<textarea id='gma-log'>[%%gmaLog%%]</textarea>
		</fieldset>
		 <fieldset id='up-rev-files' class='legend'>
			<legend>Up-Rev Prior Attendance Reports:</legend>
			<p>This allows you to update your old Attendance reports to the latest version of the HTML file.  This will fix a number of issues and errors in the earlier versions of the reports.</p>
			<ul>
				<li>Click the 'Choose files' button below and then navigate to the location where your old attendance reports are located.<br/>By default, the attenance reports are saved to your <i>'Downloads'</i> directory but you can (and probably should) move them to a more permanent location.
				<li>The updated files will get saved once again to your <i>'Downloads'</i> directory.  <br/> Browser security dictates that the files can only be written to that directory... I cannot automatically save them elsewhere.
				<li><b>NB</b> - you can update several files at once using the <i>&lt;shift&gt;</i> and/or <i>&lt;ctrl&gt;</i> keys to select multiple files (but you will likely have to click <i>'Allow'</i> in a system dialog before the updated reports are download).
			</ul>
			<p><input type='file' id='updateOldReportFiles' multiple/></p>
			<ol id='louf'></ol>
		</fieldset>
	</div>
	<footer>
		<p>Generated by the <a href='https://chrome.google.com/webstore/detail/fkdjflnaggakjamjkmimcofefhppfljd/publish-accepted?authuser=0&hl=en' target='_blank'>Google Meet Attendance extension</a> v`+chrome.runtime.getManifest().version+`</p>
	</footer>
	<div id='gmatt-tooltip'>
		<div class='was-present'>
			Arrived: <span id='gmatt-arr'></span><br/>
			Departed: <span id='gmatt-lft'></span><br/>
			Stayed: <span id='gmatt-sty'></span>min<br/>
			Entries: <span id='gmatt-ne'></span>
		</div>
		<div class='was-absent'>
			Absent
		</div>
	</div>
</body>
</html>`