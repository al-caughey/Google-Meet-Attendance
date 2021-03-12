// save the attendance info to an html file... only if option is set
function saveHTMLFile(){
	chrome.storage.sync.get( null, function(r) {
	let ssf = r[ 'generate-files' ] == 'both' || r[ 'generate-files' ] == 'html'
		if( !ssf ){
			write2log ( 'Exiting without saving the HTML report' )
		}

		let now = new Date(), d = now.getDate(), m = now.getMonth() + 1, y = now.getFullYear()
		let ctime = now.getHours() + ':' + twod( now.getMinutes() )
		let cdate = y + '-' + twod(m) + '-' + twod(d)
		let cmet=sessionStorage.getItem( 'Meeting-end-time' )||ctime, cmeta=cmet.split( ':' )
		if ( cmeta[0] * 60 + cmeta[1] * 1 < now.getHours() * 60 + now.getMinutes() * 1 ) cmet = ctime
		sessionStorage.setItem( 'Meeting-end-time', cmet )

		let currentClassCode = sessionStorage.getItem( '_Class4ThisMeet' )||r[ 'Current-Class-Code' ]||'Class-List'
		let className = r[ '__GMA_ClassLists' ][ currentClassCode ].n
		//let studentNames = Object.keys( r[ '__GMA_ClassLists' ][ currentClassCode ].s ) .join( ';' )
		//let studentNames = document.getElementById( 'invited-list' ).value.replace( /\n/gm, ';' )
		let studentNames = getButtonList()

		let filename = className+' ( '+cdate+' ).html'

		let sal = r[ 'saved-attendance' ]||{}
		if( !sal[ className ] ) sal[ className ]=[]
		if( !sal[ className ].includes( cdate ) ) sal[ className ].push( cdate )

		let html=htmlTemplate;
		let cn=sessionStorage.getItem( 'class-notes' )||''
		html=html.replace( '[%%classDate%%]', cdate )
		html=html.replace( '[%%startTime%%]', sessionStorage.getItem( 'Meeting-start-time' ) )
		html=html.replace( '[%%endTime%%]', sessionStorage.getItem( 'Meeting-end-time' ) )
		html=html.replace( '[%%className%%]', className )
		html=html.replace( '[%%_activeMeetID%%]', sessionStorage.getItem( '_activeMeetIDs' ) )

		html=html.replace( '[%%dateList%%]', JSON.stringify( sal[className ] ) )
		html=html.replace( '[%%classList%%]', JSON.stringify( studentNames ) )
		html=html.replace( '[%%arrivalTimes%%]', JSON.stringify( sessionStorage.getItem( '_arrivalTimes' ) ) )
		html=html.replace( '[%%gmaLog%%]', !r['generate-log' ]?'':sessionStorage.getItem( 'GMA-Log' ) )
		html=html.replace( '[%%classNotes%%]', cn.replace( /\\n/gm, '<br/>' ).trim() )

		let blob = new Blob( [ html ] , { type: 'text/html;charset=utf-8' } )
		let temp_a = document.createElement( 'a' )
		temp_a.download = filename
		temp_a.href = window.webkitURL.createObjectURL( blob )
		temp_a.click()

		document.getElementById( 'gma-attendance-fields' ).setAttribute('data-save-needed-html', false )

		sal[className][cdate]=filename
		chrome.storage.sync.set( {'saved-attendance': sal}, null )
		write2log( 'HTML file saved - ' + filename )
})
}

//To Do... account for email addresses in classList variable
let htmlTemplate = `
<html>
	<head>
	<meta charset = "UTF-8">
	<script type = "text/javascript">
		let reportsVersion = "1.0.1"
		let className = "[%%className%%]"
		let classDate = "[%%classDate%%]"
		let dateList = [%%dateList%%]
		let startTime = "[%%startTime%%]"
		let endTime = "[%%endTime%%]"
		let _activeMeetID = "[%%_activeMeetID%%]"
		let classList = [%%classList%%]
		let _arrivalTimes = [%%arrivalTimes%%]
	</script>
	<script type = "text/javascript" src="https://code.jquery.com/jquery-1.11.2.min.js"></script>
	<script type = "text/javascript" src="https://code.jquery.com/ui/1.11.3/jquery-ui.min.js"></script>
	<script type = 'text/javascript'>
		// Attendance summary v1.04
		// pad with a leading zero (for dates & time)
		function pad(v,n){
			if (!n) n = 2
			if(isNaN(v) && v.indexOf( ':' ) > -1) n = 5
			return ( '00000'+v ).slice( -n )
		}

		function showToolTip( e ){
			let tgt = $( e.target )
			let tgt_p = tgt.parent( '.student-row' )
			$( '#gmatt-tooltip' ).detach().appendTo(tgt).fadeIn( 'fast' )
			$( '#gmatt-arr' ).text(tgt_p.data( 'arrived' ) )
			$( '#gmatt-lft' ).text(tgt_p.data( 'left' ) )
			$( '#gmatt-sty' ).text(tgt_p.data( 'stayed' ) )
			$( '#gmatt-ne' ).text(tgt_p.data( 'num-entries' ) )
			$( '.gmatt-co' ).text(tgt.data( 'comments' ) )
		}

		function hideToolTip( e ){
			$( '#gmatt-tooltip' ).hide().detach().appendTo($( 'body' ) )
		}
		function showSummaryTip( e ){
			let tgt = $( e.target )
			let wd1 = $( event.currentTarget ).width()
			let wd2 = $( '#summary-tooltip' ).width()
			let lf = $( event.currentTarget ).position().left
			$( '#summary-tooltip' ).detach().css( 'left', 1*lf+(1*wd1-1*wd2)/2-7+'px' ).appendTo(tgt).fadeIn( 'fast' )
			$( '#sum-sta' ).text(tgt.data( 'start' ) )
			$( '#sum-end' ).text(tgt.data( 'end' ) )
			$( '#sum-dur' ).text(tgt.data( 'duration' ) )

		}
		function hideSummaryTip(e){
			$( '#summary-tooltip' ).hide().detach().appendTo($( 'body' ) )
		}
		function showStudentTip(e){
			let tgt=$( e.target )
			let tgt_p=tgt.parent( '.as' )

			//let wd1=$( event.currentTarget ).width()
			let wd1 = tgt.width()
			let wd2 = $( '#student-tooltip' ).width()
			//let lf = $(event.currentTarget).position().left
			let lf = tgt_p.position().left
			let nl=(wd1*1-1*wd2)/2+'px'
			$( '#student-tooltip' ).detach().css( 'left', nl ).appendTo( tgt ).fadeIn( 'fast' )
			$( '#stu-arr' ).text(tgt.data( 'arrived' ) )
			$( '#stu-lft' ).text(tgt.data( 'left' ) )
			$( '#stu-sty' ).text(tgt.data( 'stayed' ) )

		}
		function hideStudentTip(e){
			$( '#student-tooltip' ).hide().detach().appendTo($( 'body' ) )
		}
		function addWonkyData(txt){
			if( $( '#wonky-data' ).length == 0 ){
				let dwd=$( '<ul/>' ).attr( 'id', 'wonky-data' )
				$( '#main-table' ).after(dwd)
			}
			if( $( '#wonky-data:empty' ) ){
				$( '<p/>' ).addClass( 'wonky-header' ).html( "<span class = 'wonky'></span> There appears to be some odd data in this file:" ).appendTo( '#wonky-data' )
			}
			$( '<li/>' ).html(txt).appendTo( '#wonky-data' )
		}
		$( 'document' ).ready(function(){
			$( '.className' ).text(className)
			$( '#classDate' ).empty()
			if( typeof( dateList ) == 'undefined' ){
				dateList=[classDate]
			}
			$.each(dateList, function( v, t ){
				let o=$( '<option/>' ).attr( 'value', t ).text( t )
				o.appendTo($( '#classDate' ) )
			})
			$( '.classDate' ).text(classDate)
			$( '#classDate' ).val(classDate)
			$( '#meet-startTime' ).text(startTime)
			$( '#meet-endTime' ).text(endTime)
			if(typeof(_activeMeetID) == 'undefined' ){
				_activeMeetID=''
			}
			$( '#meet-meet-id' ).text(_activeMeetID)
			$( '#logging-info' )[$( '#gma-log' ).val() == ''?'removeClass':'addClass' ]( 'showing' )

			let d=$( '<div/>' )
			d.attr( 'id','student-row-header' ).attr( 'data-student-name', 'Names' )
			$( '<span/>' ).addClass( 'student-name' ).attr( 'data-html', true).appendTo(d)
			$( '<span/>' ).addClass( 'student-fullname' ).attr( 'data-html', true).appendTo(d)
			$( '<span/>' ).addClass( 'student-email' ).attr( 'data-html', true).appendTo(d)
			$( '<span/>' ).addClass( 'arrived-at sub-column' ).attr( 'title','Arrrived at' ).appendTo(d)
			$( '<span/>' ).addClass( 'stayed-for sub-column' ).attr( 'title','Length of stay in min' ).appendTo(d)
			$( '<span/>' ).addClass( 'last-seen sub-column' ).attr( 'title','Last seen at' ).appendTo(d)
			let wwt=[], earliestTime=pad(startTime)
			let atVersion=3
			if(_arrivalTimes.indexOf( '{\"name\":' ) === -1 ){
				wwt=JSON.parse( _arrivalTimes )
				atVersion=1
			}
			else{
				if( _arrivalTimes.indexOf( ':true' ) > -1 ){
					atVersion=2
				}
				$.each( JSON.parse( _arrivalTimes ), function( id, checks ) {
					if(!wwt[ checks.name ] ){
						wwt[ checks.name ] = []
						wwt[ checks.name ].checks = []
					}
					if( !wwt[ checks.name ].checks.includes( checks.arrived ) ) wwt[checks.name].checks.push(checks.arrived)

					$.each( checks.checks, function( n, m ){
						let v = atVersion == 3 ? m : n
						let ct=pad( v )
						if ( ct < earliestTime ) earliestTime = ct
						if( wwt[ checks.name ].checks.includes( v ) ) return
						wwt[ checks.name ].checks.push( v )
					})
					if( !wwt[ checks.name ].checks.includes( checks.last_seen ) ) wwt[ checks.name].checks.push( checks.last_seen )
				})
			}
			$( '#meet-earliestTime' ).text( earliestTime )
			let eat = earliestTime.split( ':' )
			let st = startTime.split( ':' )
			let et = endTime.split( ':' )
			let meetLength = ( et[0] * 60 + et[1] * 1 ) -( st[0] * 60 + st[1] * 1 ) + ( et[0] * 1 < st[0] * 1 ? 60 * 24 : 0 )
			$( '#meet-length' ).text( meetLength )
			let smin = Math.floor( eat[1] * 1 / 5 ) * 5, shr = eat[0] * 1
			let emin = Math.floor( et[1] * 1 / 5 ) * 5 + 5, ehr = et[0] * 1
			smin = eat[1] % 5 == 0 ? smin - 5 : smin
			if (smin === -5){
				smin = 55
				shr--
			}
			let meetDuration = ( ehr * 60 + emin ) - (shr * 60 + smin ) + (ehr < shr ? 60 * 24 : 0 )
			for ( let nn = 0; nn < meetDuration; nn++ ){
				let ct = shr * 1 + ':' + pad( smin )
				let s = $( '<span/>' ).addClass( 'i-' + ct.replace( ':' ,'-' ) ).addClass( 'cc' ).attr( 'title', ct)
				if ( ct == startTime || ct == endTime || nn%5 === 0 ){
					s.addClass(ct == startTime ? 'm-st' : ct == endTime ? 'm-et' : '' )
					if( nn%5 === 0) s.addClass( 'col5' )
					let s2 = $( '<span/>' ).text( shr * 1 + ':' + pad( smin ) ).addClass( 'rotated' )
					s2.appendTo( s )
				}
				s.appendTo( d )
				smin = ( smin+ 1 ) % 60
				if( smin === 0 ) {
					shr++
					shr = shr%24
				}
			}
			d.appendTo( '#main-table' )
			$( '#student-row-header' ).clone(true,true).removeAttr( 'id' ).addClass( 'spacer-row' ).appendTo( '#main-table' )
			
			let loginNames = []
			$.each( classList, function( loginName , value ) {
				let d = $( '#student-row-header' ).clone( true,true ).removeAttr( 'id' ).addClass( 'student-row' ).addClass( 'not-present' )
				let displayName = value[ 'display-name' ]
				let lcn = loginName.toLowerCase().trim()
				let email = value.email
				loginNames.push( loginName )
				let comments = value.comments
				let wr=$( '[data-student-name*="' + lcn + '"]' )
				if( wr.length != 1 ){
					d.attr( 'data-student-name', lcn).attr( 'data-login-name', loginName).attr( 'data-student-email', email).find( '.student-name' ).text(displayName).attr( 'data-comments', comments)
					d.find( '.student-fullname' ).text(lcn)
					d.find( '.student-email' ).text(email)
					d.appendTo( '#main-table' )
				}
				else{
					addWonkyData( "the name <i>'"+value+"'</i> appears more than once in the <b>'classList'</b> variable<br/>&rarr; you can (and probably should) delete the duplicated entries.  Only one row has been added into the table above" )
					wr.addClass( 'wonky' )
				}
			})
			$( '#student-row-header' ).clone(true,true).removeAttr( 'id' ).addClass( 'spacer-row' ).appendTo( '#main-table' )
			$( '.student-row .cc, .spacer-row .cc' ).text( '' )
			$( '#student-row-header .student-name' ).text( 'Names' )
			$( '#classDate' ).change(function(){
				window.location.href=($( '.className:first' ).text()+' ( '+$(this).val()+' ).html' )
			})
			let _atd=JSON.parse(_arrivalTimes)
			if( $.isEmptyObject(_atd) ){
				addWonkyData( "the <b>'_arrivalTimes'</b> variable is empty so there is no attendance information to display?!?" )
			}
			$.each(_atd, function( id, checks ) {
				function earliestArrivalTime(k,j){
					if( !k ) return j
					return (pad(k) < pad(j) )? k : j
				}
				function lastSeenTime(k,j){
					if( !k ) return j
					return (pad(k) > pad(j) ) ? k : j
				}
				function countInArray( array, what ) {
					return array.filter( item => item == what ).length;
				}
				function nearMatchInArray( array, what ) {
					return array.filter( item => item.includes( what ) > -1 ).length;
				}
				let name=atVersion == 1?id:checks.name, lcn=name.toLowerCase()
				let wr=$( '[data-student-name*="'+name.trim().toLowerCase()+'"]' )
				if(!wr.length){
					let non=countInArray( loginNames, lcn )
					if( non == 1 ){
						wr=$( '[data-student-name*="' + lcn + '"]' )
					}
					else{
						let pm=nearMatchInArray( loginNames, lcn )
						if( pm == 1 ){
							wr=$( '[data-student-name*="' + lcn + '"]' )
							wr.addClass( 'wonky' )
							//addWonkyData( "the entry <i>'"+name+"'</i> in the <b>'_arrivalTimes'</b> variable does not appear in the <b>'classList'</b> variable... however, it has a partial (and unique) match to <i>'"+pm[0].trim()+"'</i> in the <b>'classList'</b><br/>&rarr; so, the results for <i>'"+name+"'</i> have been merged into the row for <i>'"+pm[0].trim()+"'</i>" )
						}
						else{
							addWonkyData( "the entry <i>'"+name+"'</i> in the <b>'_arrivalTimes'</b> variable does not uniquely match any of the names in the <b>'classList'</b> variable?!?<br/>&rarr; a row has been appended to the bottom of the table" )
							wr=$( '.student-row:last' ).clone(true).detach()
							wr.addClass( 'wonky' ).attr( 'data-student-name', lcn).find( '.student-name' ).text(lcn)
							wr.addClass( 'wonky' ).attr( 'data-student-name', lcn).find( '.student-fullname' ).text(lcn)
							wr.find( '.cc' ).removeClass( 'present pattern-0 pattern-1 pattern-2' )
							$( '.student-row:last' ).after(wr)
						}
					}
				}
				let npe=wr.attr( 'data-num-entries' ), te=!npe||npe == ''?1:(1*npe+1)
				let lat=earliestArrivalTime( wr.attr( 'data-arrived' ), checks.arrived )
				let lst=lastSeenTime( wr.attr( 'data-left' ), checks.last_seen )
				let nc=atVersion == 3?wwt[name].checks.length:Object.keys(wwt[name].checks).length
				$(wr).removeClass( 'not-present' )
				wr.find( '.arrived-at' ).text( lat )
				wr.find( '.stayed-for' ).text( nc )
				wr.find( '.last-seen' ).text( lst )

				$.each(wwt[name].checks, function( n, m){
					let v=atVersion == 1?n:m
					let ct='i-'+v.replace( ':','-' )
					$(wr).find( '.'+ct).addClass( 'present' ).addClass( 'pattern-'+te%3)
				})
				wr.attr( 'data-arrived', lat ).attr( 'data-left', lst ).attr( 'data-stayed', nc ).attr( 'data-num-entries', te )
			});
			$( '#student-row-header .student-name' ).html($( '.student-row' ).length+' Names <span class = "daily">( '+$( '.not-present' ).length+' absent)</span>' )

			$( '#student-row-header .student-name' ).click(function(){
				$( '#main-table' ).toggleClass( 'show-sub-columns' )
			})
			$( '#student-row-header .student-name' ).dblclick(function(){
				$( '#main-table' ).toggleClass( 'hide-names' )
			})
			$( '.student-row :not(.student-name)' )
				.mouseenter(function(e){
					hideToolTip(e)
				})
			$( '.student-row .student-name' )
				.mouseenter(function(e){
					showToolTip(e)
				})
				.mouseleave(function(e){
					hideToolTip(e)
				})
			$( '#close-summary' ).click(function(){
				$( 'body' ).removeClass( 'showing-summary' ).addClass( 'showing-daily' )
				$( '.student-row .student-name' ).unbind( 'click' )
				removeStudentFilter()
				$( '.as' ).hide()
			})
			$( '#download-summary' ).click(function(){
				let cn=$( '.className:first' ).text()
				fname='Attendance Summary - '+cn+'.html'
				let ashtml=$( '<html/>' )
				let ash=$( '<head/>' )
				let asjq=$( '<script/>' ).attr( 'type','text/javascript' ).attr( 'src','https://code.jquery.com/jquery-1.11.2.min.js' )
				asjq.appendTo(ash)
				let asjs=$( '<script/>' ).attr( 'type','text/javascript' )
				asjs.text($( 'script[data-for-summary="true"]' ).text()+\`

$( 'document' ).ready(function(){
	$( '.student-row .student-name' ).click(function(e){
		filterByStudent(e)
	})
	$( '.class-checkbox input' ).click(function(e){
		showHideClasses(e)
	})
	})
	\`)
				asjs.appendTo(ash)
				let ashs=$( '<style/>' ).text($( 'style' ).text() )
				ashs.appendTo(ash)
				ash.appendTo(ashtml)
				let asb=$( '<body/>' ).addClass( 'showing-summary' )
				let ash1=$( 'h1.summary' ).clone()
				ash1.find( '.btn' ).remove()
				ash1.find( '#close-summary' ).remove()
				ash1.appendTo(asb)
				$( 'ul.summary' ).clone().appendTo(asb)
				let astb=$( '#main-table' ).clone()
				astb.find( '.cc,.sub-column' ).remove()
				if($( '.selected' ).length === 1){
					let pr=$( '.selected' ).parents( '.student-row' )
					fname='Attendance Summary - '+cn+':'+pr.data( 'student-name' ).replace(/ /g,'-' )+'.html'
					astb.find( '.student-row' ).remove()
					astb.find( '.spacer-row:last' ).remove()
					pr.clone().appendTo(astb)
					astb.find( '.spacer-row' ).clone().appendTo(astb)
				}
				astb.find( '.gma-pca' ).each(function(){
					let t=$(this)
				   t.attr( 'title', 'Arrived: '+t.data( 'arrived' )+'\\nLeft: '+t.data( 'left' )+'\\nStayed: '+t.data( 'stayed' )+'min' )
				})
				astb.appendTo(asb)
				$( '#wonky-data' ).clone().appendTo(asb)
				$( '.legend.summary' ).clone().appendTo(asb)
				$( 'footer' ).clone().appendTo(asb)

				asb.appendTo(ashtml)
				let blob = new Blob( [ ashtml[0].outerHTML ] , {type: 'text/HTML;charset=utf-8'} )

				let temp_a = document.createElement( "a" )
				temp_a.download = fname
				temp_a.href = window.webkitURL.createObjectURL(blob)
				temp_a.click()
			})

			$( '#deselect-student' ).click(function(){
				removeStudentFilter()
			})

			$( '#updateOldReportFiles' ).click(function(){
				$(this).val( '' )
			})
			.change(function(e){

				$( '#louf' ).empty()
				const files = e.currentTarget.files;
				let curHead=$( 'head' )[0].outerHTML
				let curBody=$( 'body' ).html().replace($( '#main-table' ).html(),'' ).replace($( '#gma-log' ).html(),'' ).replace($( '#wonky-data' ).html(),'' )
				let curStyles=$( 'style' ).text()
				let oldHead=''
				$.each(Array.from(files), function(a,f){
					let fname=f.name
					let reader = new FileReader();
					reader.readAsText(f);
					reader.onload = function(e) {
						let fc = e.target.result
						let htmlTxt=(new DOMParser() ).parseFromString(fc, "text/html" )
						let cli=!htmlTxt.all['gma-log' ]?'':htmlTxt.all['gma-log' ].value
						htmlTxt.body.innerHTML=curBody
						htmlTxt.scripts[3].textContent=document.scripts[3].textContent
						$(htmlTxt).find( 'style' ).text( curStyles )
						$(htmlTxt).find( '#gma-log' ).val( cli )
						let blob = new Blob( [ htmlTxt.all[0].outerHTML ] , {type: 'text/HTML;charset=utf-8'} )

						let temp_a = document.createElement( "a" )
						temp_a.download = fname
						temp_a.href = window.webkitURL.createObjectURL(blob)
						temp_a.click()
						$( '<li/>' ).text( 'updated ' + fname).appendTo( '#louf' )
					}
				})
			})
			function tallyAttendance(dd, st, fat, md){
				//console.log( 'tallyAttendance', fat )

				function ontime(s,a){
					return (timeDiff(s,a) )<5
				}
				function timeDiff(s,a){
					let st=s.split( ':' ), ar=a.split( ':' )
					return (Math.max(0,(60*ar[0]+1*ar[1] ) - (60*st[0]+1*st[1] ) ))
				}
				let atv=!fat.match(/name.*:/ig)?1:2
				let atd=JSON.parse(JSON.parse(fat) )
				let sep=(classList.indexOf( ';' )>-1)?';':','
				let cla=classList.split(sep)
				$.each(atd, function( id, data ) {
					let name=(atv == 1?id:data.name).toLowerCase().trim()
					let wr=$( '[data-student-name*="'+name+'"]' )
					if(!wr.length){
						let mmm=cla.filter(function(nn,b){
							return nn && nn.toLowerCase().indexOf(name) === 0
						})
						if(mmm.length == 1){
							wr=$( '[data-student-name*="'+mmm[0].trim().toLowerCase()+'"]' )
						}
						else{
							let pm=cla.filter(element => element.toLowerCase().includes(name) )
							if(pm.length == 1){
								wr=$( '[data-student-name*="'+pm[0].trim().toLowerCase()+'"]' )
								wr.addClass( 'wonky' )
								addWonkyData( "the entry <i>'"+name+"'</i> in the class on  <b>'"+dd+"'</b>  does not appear in the current <b>'classList'</b> variable... however, it has a partial (and unique) match to <i>'"+pm[0].trim()+"'</i> in the <b>'classList'</b><br/>&rarr; so, the results for <i>'"+name+"'</i> have been merged into the row for <i>'"+pm[0].trim()+"'</i>" )
							}
							else{
								addWonkyData( "the entry <i>'"+name+"'</i> in the class on  <b>'"+dd+"'</b> does not uniquely match any of the names in the <b>'classList'</b> variable?!?<br/>&rarr; a row has been appended to the bottom of the table" )
								wr=$( '.student-row:last' ).clone(true).detach()
								wr.addClass( 'wonky' ).attr( 'data-student-name', name).find( '.student-name' ).text(name)
								wr.addClass( 'wonky' ).attr( 'data-student-name', name).find( '.student-fullname' ).text(name)
								wr.attr( 'data-student-name', name).find( '.student-name' ).text(name)
								wr.find( '.cc' ).removeClass( 'present pattern-0 pattern-1 pattern-2' )
								wr.find( '.gma-pca' ).remove()
								wr.find( '.as' ).addClass( 'absent' )
								$( '.student-row:last' ).after(wr)
							}
						}
					}
					let wc=wr.find( '[data-date="'+dd+'"][data-start="'+st+'"]' )
					let td=timeDiff(st, data.arrived)*100/md*1
					let s=$( '<span/>' ).addClass( 'gma-pca' ).css( 'width', Math.min(100-td*1, data.stayed*100/md*1)+'%' ).css( 'left', (td)+'%' ).attr( 'data-arrived', data.arrived ).attr( 'data-left', data.last_seen ).attr( 'data-stayed', data.stayed )
					s.mouseenter(function(e){
						showStudentTip(e)
					})
					.mouseleave(function(e){
						hideStudentTip(e)
					})
					wc.removeClass( 'absent' ).attr( 'data-on-time', ontime(st, data.arrived) )
					s.appendTo(wc)
				})
			}
			function byFileName(a,b) {
				return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
			}
			function byLastModified(a,b) {
				return a.lastModified < b.lastModified ? -1 : a.lastModified > b.lastModified ? 1 : 0;
			}
			function addClassCheckbox(cn) {
				let ll=$( '<label/>' ).addClass( 'class-checkbox' ).attr( 'data-class-name',cn)
				let cb=$( '<input/>' ).attr( 'data-class-name',cn).attr( 'type','checkbox' ).attr( 'checked','checked' )
				ll.click(function(e){
					showHideClasses(e)
				})
				ll.html(cb[0].outerHTML+cn)
				$( '.for-student:first' ).after(ll)
			}
			function checkClassList(cl, cn) {
				let sep=(cl.indexOf( ';' )>-1)?';':','
				$.each(cl.split(sep), function(k, v ) {
					let name=v.toLowerCase().trim()
					let displayName=name.replace(/\\( [^\\)]*\\)/g,'' ).replace(/\\[[^\\]]*\\]/g,'' ).trim()
					let wr=$( '[data-student-name*="'+name+'"]' )
					if(!wr.length){
						wr=$( '.student-row:last' ).clone(true).detach()
						wr.removeClass( 'wonky' ).attr( 'data-classes', cn)
						wr.attr( 'data-student-name', name).find( '.student-name' ).text(displayName)
						wr.attr( 'data-student-name', name).find( '.student-fullname' ).text(name)
						wr.find( '.cc' ).removeClass( 'present pattern-0 pattern-1 pattern-2' )
						wr.find( '.gma-pca' ).remove()
						wr.find( '.as' ).addClass( 'absent' )
						$( '.student-row:last' ).after(wr)
					}
					else{
						let ccl=wr.attr( 'data-classes' )||''
						let ncl=ccl == ''||ccl == 'undefined'?cn:(ccl+','+cn)
						wr.attr( 'data-classes', ncl)
					}
				})
			}

			let summaryGenerated=false
			$( '#attendance-summary' ).click(function(e){
				$( '#student-row-header .student-name' ).html( 'Names' )
				if (className == '' ) {
					alert( "You cannot generate a summary from this file (because it does not contain any attendance data)!  This file exists to insert the new code into one of your existing attendance files.\\n\\n1. Click the \`Choose Files\` button below to update one of your Attendance files from a past Meet, and then\\n2. Open that file and finally click \`Show Attendance Summary\` button\\n\\nContact me (Al) if you still need help" )
					return false
				}
				$( '.student-row .student-name' ).click(function(e){
					filterByStudent(e)
				})
				if(!summaryGenerated){
					$(this).val( '' )
				}
				else{
					$( 'body' ).addClass( 'showing-summary' ).removeClass( 'showing-daily' )
					$( '.class-checkbox input:checked' ).each(function(a,b){
						let ccn=$(this).data( 'class-name' )
						$( '.as[data-class-name="'+ccn+'"]' ).fadeIn( 'slow' )
					})
					e = e || window.event;
					e.stopPropagation()
					return false
				}
			})
			.change(function(e){
				const files = [...e.currentTarget.files];

				$( 'body' ).addClass( 'showing-summary' ).removeClass( 'showing-daily' )

				let sep=(classList.indexOf( ';' )>-1)?';':','
				let cla=classList.split(sep)
				$.each( [...files].sort(byLastModified), function(a,f){
					let fname=f.name
					let reader = new FileReader();
					reader.readAsText(f);
					reader.onload = function(e) {
						summaryGenerated=true
						let fc = e.target.result
						let htmlTxt=(new DOMParser() ).parseFromString(fc, "text/html" )
						let vars=htmlTxt.scripts[0].innerText
						let fcn=vars.match(/className=.*/)[0].split( '=' )[1].replace(/"/g,'' )
						if($( '.className' ).text().indexOf(fcn) == -1){
							$( '.className' ).text($( '.className:first' ).text()+', '+fcn)
						}
						if($( 'input[data-class-name="'+fcn+'"]' ).length === 0){
							addClassCheckbox(fcn)
							let fcl=vars.match(/classList=.*/)[0].split( '=' )[1].replace(/"/g,'' )
							checkClassList(fcl, fcn)
						}
						let fcd=vars.match(/classDate=.*/)[0].split( '=' )[1].replace(/"/g,'' )
						let fst=vars.match(/startTime=.*/)[0].split( '=' )[1].replace(/"/g,'' )
						let fet=vars.match(/endTime=.*/)[0].split( '=' )[1].replace(/"/g,'' )
						let fs=fst.split( ':' ), fe=fet.split( ':' )
						let mdur=(fst, fet, 60*fe[0]+1*fe[1] ) - (60*fs[0]+1*fs[1] )

						if( $( '[data-date="'+fcd+'"][data-start="'+fst+'"]' ).length == 0 ){
							let s=$( '<span/>' ).addClass( 'as' ).attr( 'data-class-name', fcn).attr( 'data-date', fcd).attr( 'data-start', fst).css( 'flex-grow', mdur)
							s.clone().addClass( 'absent' ).appendTo( '.student-row' )
							let a=$( '<a/>' ).attr( 'href',fname).html(fcn+'<br/>'+fcd+'<br/>'+fst+'&rarr;'+fet)
							s.mouseenter(function(e){
								showSummaryTip(e)
							})
							.mouseleave(function(e){
								hideSummaryTip(e)
							})

							s.clone(true, true).attr( 'data-end', fet).attr( 'data-duration', mdur).html(a).appendTo( '#student-row-header' )
						}
						let fat=vars.match(/_arrivalTimes=.*/)[0].split( '=' )[1]
						tallyAttendance(fcd, fst, fat, mdur)

					}
				})
			})
        });

	</script>
	<script type = 'text/javascript' data-for-summary="true">
		function showHideClasses(e){
			let tgt=$(e.target), cn=tgt.data( 'class-name' )
			if(tgt.hasClass( 'disabled' ) ) return false
			let isChecked=$( 'input[data-class-name="'+cn+'"]' ).is( ':checked' )
			$( '.as[data-class-name="'+cn+'"]' )[isChecked?'fadeIn':'fadeOut' ]( 'slow' )
			if($( '.selected' ).length == 1) return
			$( '.student-row[data-classes*="'+cn+'"]' ).fadeOut( 'slow' )
			$( '.class-checkbox input:checked' ).each(function(a,b){
				let ccn=$(this).data( 'class-name' )
				$( '.student-row[data-classes*="'+ccn+'"]' ).fadeIn( 'slow' )
			})
		}
		function filterByStudent(e){
			let tgt=$(e.target)
			if(tgt.hasClass( 'selected' ) ){
				removeStudentFilter()
			}
			else{
				let pr=tgt.parents( '.student-row' )
				pr.siblings( '.student-row' ).fadeOut( 'slow' )
				$( '#wonky-data, #up-rev-files' ).fadeOut( 'slow' )
				$( '.for-student' ).text(pr.data( 'student-name' ) )
				$( '#deselect-student' ).fadeIn( 'slow' ).css( "display","inline-block" )
				tgt.addClass( 'selected' )
				let cl=pr.data( 'classes' ).split( ',' )
				$( '.class-checkbox' ).addClass( 'disabled' )
				$( '.class-checkbox input' ).attr( 'disabled',true)
				$( '.as' ).hide()
				$.each(cl, function( n, ccn ){
					$( '.class-checkbox[data-class-name="'+ccn+'"]' ).removeClass( 'disabled' )
					$( 'input[data-class-name="'+ccn+'"]' ).attr( 'disabled', false)
					if($( '[data-class-name="'+ccn+'"]' ).is( ':checked' ) ){
						$( '.as[data-class-name="'+ccn+'"]' ).fadeIn( 'slow' )
					}
				})
			}
		}
		function removeStudentFilter(){
			$( '.student-row,#wonky-data, #up-rev-files' ).fadeIn( 'slow' ).css( "display","" )
			$( '#deselect-student' ).fadeOut( 'slow' )
			$( '.for-student' ).empty()
			$( '.selected' ).removeClass( 'selected' )
			$( '.class-checkbox' ).show()
			$( '.class-checkbox' ).removeClass( 'disabled' )
			$( '.class-checkbox input' ).attr( 'disabled',false)

			$( '.student-row, .as' ).hide()
			$( '.class-checkbox input:checked' ).each( function( a, b ){
				let ccn = $(this).data( 'class-name' )
				$( '.student-row[data-classes*="' + ccn + '"]' ).fadeIn( 'slow' )
				$( '.as[data-class-name="' + ccn + '"]' ).fadeIn( 'slow' )
			})
		}
	</script>
	<style>
		.summary, .showing-daily .summary, .showing-summary .daily{ display: none; }
		.showing-summary .summary { display: inherit; }
		div#main-table { border-top: 2px solid; border-bottom: 2px solid; box-shadow: #555 2px 2px 2px; width: fit-content; min-width: 50%; }
		#main-table.show-sub-columns .sub-column{ display: inline-block; }
		#main-table.show-sub-columns .student-name{ display:none }
		#main-table.show-sub-columns #student-row-header .student-name, #main-table.show-sub-columns .student-fullname{ display: inline-block; width: 228px; }
		#main-table.show-sub-columns .student-email{ display: inline-block; min-width: 78px; padding: 0 6px; width: 78px; }
		#main-table #student-row-header .student-name:after { content: '☆'; padding-left: 6px; }
		#main-table.show-sub-columns  #student-row-header .student-name:after { content: '★'; padding-left: 6px; }
		.cc { border-left: 1px solid #ccc; flex: 1; min-width: 14px; position: relative;}
		.rotated { bottom: 10px; display: inline-block; font-size: smaller; left: -8px; position: absolute; transform: rotate(-90deg);  }
		.col5{ border-left: 2px solid #333;	}
		.student-row, .spacer-row { display:flex; position: relative; }
		.student-row:nth-child(2n+1), .showing-summary .student-row:nth-child(2n+1){ background-color: #ddd; }
		.student-row.not-present , .legend .cc.absent, .student-row .as.absent{ background-color: #ffccccaa; }
		.student-row:nth-child(5n+1) { border-bottom: 1px solid #aaa; }
		.student-row:hover { background-color: #3b770355; border: 2px solid #738ca0; border-left: 0; border-right: 0; }
		.student-row.not-present:hover { background-color: #ef9494; }
		.spacer-row { height: 6px; }
		.student-name, .student-fullname, .spacer-student-name, .student-email{ border-left: 2px solid #333; cursor:pointer; display: inline-block; min-width: 100px; overflow: hidden; text-overflow: ellipsis; text-transform: capitalize; white-space: nowrap; min-width: 196px; width: 196px; }
		.student-fullname, .student-email { display: none; }
		#student-row-header .student-fullname{ display: none!important; }
		.hide-names .student-row .student-name, .hide-names .student-row .student-fullname{ color: transparent; }
		.student-row .student-name::before, .show-sub-columns .student-row .student-fullname::before { content: "✔ "; color: #3b7703; }
		.student-row:last-child { border-bottom: 2px solid #333; }
		.not-present .student-name::before,.show-sub-columns .not-present .student-fullname::before, .showing-summary .student-row .student-name::before  { content: " "; padding-right: 15px; }
		.showing-summary .cc, .as { display: none; }
		.cc, .showing-summary .as { flex: 1; display:inline-block;}
		.as{ border-left: 1px solid; min-width: 88px; }
		.as a{ color:#EEE; text-decoration: none; }
		.showing-summary .student-row { background-color: unset; }
		.showing-summary .student-row:hover { background-color: #3b770355; border: 2px solid #738ca0; border-left: 0; border-right: 0; }
		fieldset { background: #eee; border-radius: 12px; margin: 20px 3px; }
		legend { font-weight: bold; }
		.legend p{ margin: 1px; }
		.legend .cc { background-color: #629235; border: 0px; display: inline-block; height: 20px;max-width: unset; min-width: 11px; padding: 0px 8px; vertical-align: middle;  }
		.legend .cc.present.grey { background-color: #5B8B2E; }
		.legend .cc.missing.grey { background-color: #ddd; }
		.legend .cc.missing.white { background-color: #fff; }
		.present { background: #3b7703cc; }
		.student-row .as { background: #3b770377; position: relative; }
		#student-row-header { background: #777; border-bottom: 3px double #333; color: white; display: flex; font-weight: bold; height: 36px; position: relative; text-align:center; }
		#student-row-header .student-name, #student-row-header .sub-column { padding-top: 12px; }
		.showing-summary h1 .className { display: none; }
		p .className, #classDate, #meet-startTime, #meet-endTime, #meet-length, #meet-earliestTime, #meet-meet-id{ font-weight:bold; margin-right: 24px; }
		.legend .className { font-style: italic; margin-right: 0; }
		#classDate:hover{ cursor: pointer; }
		#meet-length:after { content: " min"; font-weight: normal; }
		#meet-meet-id:empty:before { content: "n/a"; }
		body > #gmatt-tooltip, body > #summary-tooltip, body > #student-tooltip { display: none!important; }
		#gmatt-tooltip{ position: absolute; background:#cbdbbc; border:2px solid #3e6914; border-radius:8px; color: #222; display:none; padding: 4px 8px; left: 134px; top:-4px; z-index:88; }
		#summary-tooltip{ position: absolute; background:#cbdbbc; border:2px solid #3e6914; border-radius:8px; color: #222; display:none; font-weight: normal; left: -14px; padding: 4px 8px; top:42px; white-space: nowrap; width: 108px; z-index:88; }
		#student-tooltip{ position: absolute; background:#cbdbbc; border:2px solid #3e6914; border-radius:8px; color: #222; display:none; font-weight: normal; left: -14px; padding: 4px 8px; top:22px; white-space: nowrap; width: 108px; z-index:88; }
		.showing-summary #gmatt-tooltip{ display: none!important; }
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
		#questions, #attendance-summary-label, #close-summary { background: lightblue; border: 2px solid blue; border-radius: 12px; box-shadow: #bbb 4px 4px 8px; font-family: sans-serif; font-weight: bold; margin: 0 0 0 48px; opacity: .75; padding: 6px; text-decoration: none; vertical-align: middle; white-space: nowrap; font-size: 14px;}
		#questions { font-size: 30px; font-weight: bold; padding: 0px 8px; position: absolute; right: 24px; top: 13px; }
		#questions:hover, #attendance-summary-label:hover , #close-summary:hover { opacity: 1; }
		#questions:active, #attendance-summary-label:active, #close-summary:active { opacity: .333; right: 21px; top: 15px; }
		#logging-info { display: none; }
		#logging-info.showing { display: block; }
		#gma-log { width: 100%; }
		#gma-log:focus { height: 500px; }
		.wonky-header{ display: none; font-weight: bold; margin: 0; }
		.wonky-header:first-of-type { display: revert; }
		#wonky-data { background-color: #fff98a; border: 1px solid #444; border-radius: 12px; padding: 12px; }
		#wonky-data:empty { display: none; }
		#wonky-data li { margin-left: 20px; }
		.wonky .student-name, .wonky .student-fullname { background: #fff98a; }
		.wonky .student-name::after, .wonky .student-fullname::after, #wonky-data .wonky::after { color: red; content: " **"; }
		.gma-pca { background: #3b7703; border-radius: 6px; display: inline-block; height: 12px; margin: 3px 0; position:absolute; }
		.gma-pca:hover { border: 2px solid #1f4001; height: 8px; margin: 3px 0px; }
		#attendance-summary{ display: none; }
		.btn { background: #777; border-radius: 12px; box-shadow: #999 3px 3px 6px; color: white; display: inline-block; font-size: 14px; font-weight: bold; height: 18px; margin: 0 5px 2px 5px; opacity: .7; padding: 1px 3px 5px 3px; text-align: center; vertical-align: middle; width: 18px; }
		.btn:hover { color: #ff787e; opacity: 1; }
		.btn:active { margin: 2px 3px 0 7px; opacity: .33; }
		#download-summary { text-decoration: underline; }
		#deselect-student { display: none; }
		.for-student { text-transform: capitalize; }
		.for-student::before { content: ": "; }
		.for-student:empty::before { content: ""; }
		.class-checkbox { cursor: pointer; margin: 0 0 0 20px;}
		.class-checkbox input{ cursor: pointer; }
		.disabled, .disabled input{ color: #999; cursor: not-allowed; }
		#class-notes:empty { display: none; }
		#class-notes { white-space: pre; }
		#class-notes:before { content: "Class Notes:"; display: block; font-weight: bold; }
		.showing-summary .student-row:not( [data-classes] ) { display: none; }
		#up-rev-files{ display: none; }
		[data-comments]:not([data-comments=""]):after { content: "💬"; padding-left: 4px; }
		.gmatt-co{ display: inline-block; max-width: 108px; text-transform: unset; vertical-align: top; white-space: pre-wrap; }
		@media print {
			#up-rev-files { display: none; }
		}
	</style>
	</head>
	<body>

	<div id = 'attendance-report'>
		<h1 class = 'daily'>Daily Attendance Report for <span class = "className"></span>: <span class = "classDate"></span><label for='attendance-summary' id = "attendance-summary-label"><input type = "file" id = "attendance-summary" multiple="">Show Attendance Summary</label></h1>
		<h1 class = "summary">Attendance Summary Report for <span class = "className"></span> <span class = "for-student"></span><span id = "deselect-student" class = 'btn' title='Show all students'>X</span><span id = "download-summary" class = 'btn' title='Download the current summary'>🠟</span><button id = "close-summary">Close the Summary</button></h1>
		<ul class = 'summary'>
			<li>Click a class name checkbox above to show/hide the entries for that class
			<li>Click a student name below to show just that student; click again the student name again to show all students
		</ul>
		<p>
			<span class = 'daily'>
				Class:<span class = "className"></span>
				Meet ID: <span id = "meet-meet-id"></span>
				Date: <select id = "classDate"></select>
					Earliest Arrival(s): <span id = "meet-earliestTime"></span>
					Start Time: <span id = "meet-startTime"></span>
					End Time: <span id = "meet-endTime"></span>
					Length of Meet: <span id = "meet-length"></span>

			</span>

			<a id = "questions" title="Send questions or feedback" target="_blank" href="mailto:al@caughey.ca?subject=Questions/Feedback about Attendance report&amp;body=Before sending this message, please check to see whether your issue has been noted on:%0D%0A- the Facebook page [https://www.facebook.com/GoogleMeetAttendance], or %0D%0A- in the videos at my YouTube channel [https://www.youtube.com/c/AllanCaughey/]  %0D%0A%0D%0AOtherwise, please provide as much information in this email as possible - for example: a description of the problem, screenshots that highlight the issue.  It would be *really* helpful if you also attached the HTML file in question.%0D%0A%0D%0AThanks for your assistance%0D%0A%0D%0AAl">&#9993;</a>
		</p>
		<p id = 'class-notes' class = 'daily'>[%%classNotes%%]</p>
		<div id = "main-table"></div><ul id = "wonky-data"></ul>
		 <fieldset class = "legend summary">
			<legend>Attendance Summary Legend:</legend>
			<p>This report summarizes date for the following class(es): \`<span class = "className"></span>\`.</p>
			<p><span class = "cc present" title="Student was present">The student was present for some or all of the class.  The green bar in the field shows the approximate arrival time and length of stay.</span>  A gap between two (or more) green bars within a class indicates that the student joined, left and then rejoined again.</p>
			<p><span class = "cc absent" title="Student was absent">The student missed the entire class</span></p>
			<p>The widths of the columns shows the approximate length of the Meet relative to the others</p>
			<p><b><u>NB</u></b> - If you want a printed copy of this report, make sure that the 'More settings' → 'Background graphics' checkbox is checked in the Print dialog.</p>
		 </fieldset>
		 <fieldset class = "legend daily">
			<legend>Daily Attendance Legend:</legend>
			<p><span class = "cc present" title="Student was present">The student was present</span><span class = "" title="Student left the meet"> then exited </span><span class = "cc present pattern-2" title="Student was present">rejoined</span><span class = "cc present pattern-0" title="Student was present">and rejoined again</span><span class = "cc present" title="Student was present"> etc.</span><span class = "cc present pattern-2" title="Student was present"> etc.</span> (the alternating background patterns indicate that the student may have left and rejoined the Meet)</p>
			<p><span class = "cc absent" title="Student was absent">The student missed the entire class</span></p>
			<p>To help your eye follow across the page, the table rows alternate between white and <span class = "cc missing grey"> grey </span> backgrounds which leads to two subtly different shades of green for the times when the student was present</p>
			<p><b><u>NB</u></b> - If you want a printed copy of this report, make sure that the 'More settings' → 'Background graphics' checkbox is checked in the Print dialog.</p>
		 </fieldset>
		 <fieldset id = "logging-info" class = "legend">
			<legend>Logging Information:</legend>
			<textarea id = "gma-log">[%%gmaLog%%]</textarea>
		</fieldset>
		 <fieldset id = "up-rev-files" class = "legend">
			<legend>Up-Rev Prior Attendance Reports:</legend>
			<p>This allows you to update your old Attendance reports to the latest version of the HTML file.  This will fix a number of issues and errors in the earlier versions of the reports.</p>
			<ul>
				<li>Click the 'Choose files' button below and then navigate to the location where your old attendance reports are located.<br>By default, the attenance reports are saved to your <i>'Downloads'</i> directory but you can (and probably should) move them to a more permanent location.
				</li><li>The updated files will get saved once again to your <i>'Downloads'</i> directory.  <br> Browser security dictates that the files can only be written to that directory... I cannot automatically save them elsewhere.
				</li><li><b>NB</b> - you can update several files at once using the <i>&lt;shift&gt;</i> and/or <i>&lt;ctrl&gt;</i> keys to select multiple files (but you will likely have to click <i>'Allow'</i> in a system dialog before the updated reports are download).
			</li></ul>
			<p><input type = "file" id = "updateOldReportFiles" multiple=""></p>
			<ol id = "louf"></ol>
		</fieldset>
	</div>
	<footer>
		<p>Generated by the <a href="https://chrome.google.com/webstore/detail/fkdjflnaggakjamjkmimcofefhppfljd/publish-accepted?authuser=0&amp;hl=en" target="_blank">Google Meet Attendance extension (v`+chrome.runtime.getManifest().version+`)</a></p>
	</footer>

<div id = "gmatt-tooltip">
		<div class = "was-present">
			Arrived: <span id = "gmatt-arr"></span><br>
			Departed: <span id = "gmatt-lft"></span><br>
			Stayed: <span id = "gmatt-sty"></span>min<br>
			Entries: <span id = "gmatt-ne"></span><br>
			Comments: <span class = "gmatt-co"></span>
		</div>
		<div class = "was-absent">
			Absent<br>
			Comments: <span class = "gmatt-co"></span>
		</div>
</div>
<div id = "summary-tooltip">
	Start: <span id = "sum-sta"></span><br>
	End: <span id = "sum-end"></span><br>
	Duration: <span id = "sum-dur"></span>min<br>
</div>
<div id = "student-tooltip">
	Arrived: <span id = "stu-arr"></span><br>
	Departed: <span id = "stu-lft"></span><br>
	Stayed: <span id = "stu-sty"></span>min<br>
</div>
</body></html>`