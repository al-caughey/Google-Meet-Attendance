function addClassButtons(){
	ClearClassButtons()
	chrome.storage.sync.get( [ '__GMA_ClassLists', 'Current-Class-Code' ], function (r) {
		let currentClassCode = sessionStorage.getItem( '_Class4ThisMeet' )||r[ 'Current-Class-Code' ]||'Class-List'
		let rs=[]
		let cl=!r['__GMA_ClassLists' ][ currentClassCode ]?{}:r['__GMA_ClassLists' ][ currentClassCode ].s
		write2log( 'addClassButtons --> currentClassCode: ' + currentClassCode )
		//console.log( 'addClassButtons --> cl', cl )
		let tcl = Object.entries( cl || {} )
		
		for (let [ nn, dd ] of tcl) {
			let dn=dd.d==''?nn:(dd.d + ' ( ' + nn + ' )' )
			let em=dd.e==''?'':' <'+dd.e+'>'
			rs.push( dn+em )
			addClassButton( nn, dd.d, dd.e, dd.sn||'' )
		}
		sortButtons()
		document.getElementById( 'invited-list' ).value = rs.join( '\n' ).trim()
		if( document.querySelectorAll( '.student-button' ).length > 0 ){
			document.getElementById( 'gma-attendance-fields' ).classList.remove( 'empty' )
		}
		updateAttendanceSummary()
	})
	
}
function getStudentNames(){
	let rs=[]
	chrome.storage.sync.get( [ '__GMA_ClassLists', 'Current-Class-Code' ], function (r) {
		let currentClassCode = sessionStorage.getItem( '_Class4ThisMeet' )||r[ 'Current-Class-Code' ]||'Class-List'
		write2log( 'getStudentNames: ' + currentClassCode )
		let cl=!r['__GMA_ClassLists' ][ currentClassCode ]?{}:r['__GMA_ClassLists' ][ currentClassCode ].s
		for (let [nn, dd] of Object.entries( cl || {} )) {			
			let dn=dd.d==''?nn:(dd.d + ' ('+nn+')' )
			let em=dd.e==''?'':' <'+dd.e+'>'
			rs.push(dn+em)
		}
		document.getElementById( 'invited-list' ).value = rs.join( '\n' ).trim()
    });
}

function getButtonList(){
	let bArr={}
	let bList = document.querySelectorAll( ".student-button" ) || {}
	for ( let b of bList ){
		let ln = ( b.getAttribute( 'data-login-name' ) || '' ).trim().toLowerCase()
		bArr[ ln ] = {}
		bArr[ ln ][ 'display-name' ] = b.innerText.trim()
		bArr[ ln ][ 'email' ]=(b.getAttribute( 'data-email' ) || '').trim()
		bArr[ ln ][ 'comments' ] = ( b.getAttribute( 'data-comments' ) || '' ).trim()
	}
	return bArr
}

function getButtonListCSV( cn ){
	//console.log( 'getButtonListCSV', cn )
	let txt='', ct=''
	let bList = document.querySelectorAll( ".student-button" ) || {}
	for ( let b of bList ){
		ln = ( b.getAttribute( 'data-login-name' ) || '' ).trim().toLowerCase()
		dn = b.innerText
		em = b.getAttribute( 'data-email' ) || ''
		co = b.getAttribute( 'data-comments' ) || ''
		let lot = '"' + dn + '", "' + em + '", "' + co + '"'
		if ( !cn[ ln ] ){
			ct = ''
		}
		else{
			let dt = cn[ ln ].joined < 2 ? '' : ( ', ' + cn[ ln ].details.join( ',' ) )
			ct = ', "' + cn[ ln ].arrived + '", "' + cn[ ln ].last_seen + '", "' + cn[ ln ].checks + '", "' + cn[ ln ].joined + '"' + dt
		}
		txt = txt + lot + ct + '\n'
	}
	return txt
}

function findArrivalTime( n ){
	let ats = JSON.parse( sessionStorage.getItem( '_arrivalTimes' ) )
	let rts='', eat=''
	for (let [ pid, dd ] of Object.entries( ats || {} )) {
		if( dd.name.toLowerCase() != n ) continue
		if( eat == '' || dd.arrived < eat ){
			eat = dd.arrived
		}
	}
	return eat
}
function addClassButton( nm, dn, me, sn ){
	let gclb = document.getElementById( 'student-buttons' )
	let st = ''
	let ccl = JSON.parse( sessionStorage.getItem( '_studentsAtThisMeet' ) )||{}
	if( nm[0] == '✔' || ( !!ccl[nm] && ccl[nm].s == '✔' ) ){
		st='✔'
	}
	else if( nm[0]=='?' || ( !!ccl[nm] && ccl[nm].s=='?' ) ){
		st='?'
	}
	let cm = ( !!ccl[nm] && !!ccl[nm].c ) ? ccl[nm].c : ''
	//console.log( 'addClassButton', nm, dn, me, st )
	nm=nm.replace( /[\?✔]/g, '' ).trim().toLowerCase()

	if( !dn || dn == '' ) dn=nm
	let nb = addElement( gclb, 'span', '', '', 'student-button', dn )
	nb.setAttribute( 'data-login-name', nm )
	nb.setAttribute( 'data-surname', sn )
	nb.setAttribute( 'data-email', me || '' )
	nb.setAttribute( 'data-comments', cm )
	nb.setAttribute( 'data-arrived', findArrivalTime( nm ) )
	nb.setAttribute( 'data-last-seen', '' )
	nb.setAttribute( 'data-status', st )
	nb.addEventListener( 'click', editStudent, false)
}
function ClearClassButtons(){
	write2log( 'ClearClassButtons' )
	document.getElementById( 'student-buttons' ).innerHTML = ''
	document.getElementById( 'invited-list' ).value = ''
}
function editStudent(e){
	write2log( 'editStudent --> ' + e.target.getAttribute( 'data-login-name' ))
	let css=document.querySelectorAll( '.current-edit' )
	if( !!css[0] ) css[0].classList.remove( 'current-edit' )
	e.target.classList.add( 'current-edit' )
	document.getElementById( 'class-notes' ).classList.add( 'hidden' )
	document.getElementById( 'p-attendance-summary' ).classList.add( 'hidden' )	
	document.getElementById( 'next-student' ).style.visibility='visible'	
	document.getElementById( 'prev-student' ).style.visibility='visible'	
	if( e.target == document.querySelectorAll( '.student-button:last-of-type' )[0] ){
		document.getElementById( 'next-student' ).style.visibility='hidden'
	}
	if( e.target == document.querySelectorAll( '.student-button:first-of-type' )[0] ){
		document.getElementById( 'prev-student' ).style.visibility='hidden'
	}
	let dn = e.target.innerText.replace( /[\(\)]*/g, '' ).trim().toLowerCase()
	let ln = ( e.target.getAttribute( 'data-login-name' )||'' ).trim().toLowerCase()
	dn = dn==''||dn==ln ? '' : dn

	document.getElementById( 'gma-display-name' ).setAttribute( 'placeholder', ln )

	let sn= ( e.target.getAttribute( 'data-surname' )||'' ).trim().toLowerCase()
	
	let snt = dn=='' ? ln : dn 
	snt = ( snt.indexOf( ',' ) > -1 ) ? snt.split( ',' )[0].trim() : [ ...snt.split( ' ' ) ].pop().trim()
	document.getElementById( 'gma-surname' ).setAttribute( 'placeholder', snt )
	
	let em = ( e.target.getAttribute( 'data-email' ) || '' ).replace( /[<>]*/g,'' ).trim()
	let cm = ( e.target.getAttribute( 'data-comments' ) || '').trim()
	document.getElementById( 'student-buttons' ).classList.add( 'editting' )
	document.getElementById( 'student-edit-div' ).style.display='block'
	document.getElementById( 'gma-login-name' ).value=ln
	document.getElementById( 'gma-surname' ).value=sn
	document.getElementById( 'gma-display-name' ).value=dn
	document.getElementById( 'gma-email' ).value=em||''
	document.getElementById( 'gma-comments' ).value=cm||''
}

function cancelEditStudent(){
	document.getElementById( 'student-edit-div' ).style.display='none'	
	document.getElementById( 'class-notes' ).classList.remove( 'hidden' )
	document.getElementById( 'p-attendance-summary' ).classList.remove( 'hidden' )
	document.getElementById( 'gma-login-name' ).value=''
	document.getElementById( 'gma-display-name' ).value=''
	document.getElementById( 'gma-email' ).value=''
	document.getElementById( 'gma-comments' ).value=''
	let css=document.querySelectorAll( '.current-edit' )
	if ( css.length == 0 ) return
	css[0].classList.remove( 'current-edit' )
	document.getElementById( 'student-buttons' ).classList.remove( 'editting' )
}
function saveEditStudent(){
	let css=document.querySelectorAll( '.current-edit' )[0]
	css.innerText=document.getElementById( 'gma-display-name' ).value||document.getElementById( 'gma-login-name' ).value.trim()
	css.setAttribute( 'data-login-name', document.getElementById( 'gma-login-name' ).value.trim() )
	css.setAttribute( 'data-surname', document.getElementById( 'gma-surname' ).value.trim() )
	css.setAttribute( 'data-email', document.getElementById( 'gma-email' ).value.trim() )
	css.setAttribute( 'data-comments', document.getElementById( 'gma-comments' ).value.trim() )
	css.classList.remove( 'current-edit' )
	document.getElementById( 'student-edit-div' ).style.display='none'
	updateClassList()
	document.getElementById( 'class-notes' ).classList.remove( 'hidden' )
	document.getElementById( 'p-attendance-summary' ).classList.remove( 'hidden' )
	document.getElementById( 'student-buttons' ).classList.remove( 'editting' )
	document.getElementById( 'save-student-edits' ).style.visibility='hidden'	
	document.getElementById( 'gma-attendance-fields' ).setAttribute('data-save-needed-html', ( _generateFiles == 'both' || _generateFiles == 'html') )
	document.getElementById( 'gma-attendance-fields' ).setAttribute('data-save-needed-csv', ( _generateFiles == 'both' || _generateFiles == 'csv') )
}
function editStudentChanged(){
	
	document.getElementById( 'save-student-edits' ).style.visibility='visible'	
	
	let dn = document.getElementById( 'gma-display-name' ).value.trim()
	let ln = document.getElementById( 'gma-login-name' ).value.trim()
	dn = dn==''||dn==ln ? '' : dn
	document.getElementById( 'gma-display-name' ).setAttribute( 'placeholder', ln )
	
	let snt = dn=='' ? ln : dn 
	snt = ( snt.indexOf( ',' ) > -1 ) ? snt.split( ',' )[0].trim() : [ ...snt.split( ' ' ) ].pop().trim()
	document.getElementById( 'gma-surname' ).setAttribute( 'placeholder', snt )
	
}
function deleteStudent(){
	let dsn=document.getElementById( 'gma-login-name' ).value.toLowerCase()
	if (!confirm( 'Do you really want to delete `'+dsn+'`?  There is no undo!' )) return 
	write2log( 'deleteStudent --> ' + dsn )
	let etr=document.querySelector( '[data-login-name="'+dsn+'"]' )
	document.getElementById( 'student-buttons' ).removeChild(etr);
	document.getElementById( 'save-student-edits' ).style.visibility='visible'	
	document.getElementById( 'student-edit-div' ).style.display='none'
	document.getElementById( 'student-buttons' ).classList.remove( 'editting' )
	document.getElementById( 'class-notes' ).classList.remove( 'hidden' )
	document.getElementById( 'p-attendance-summary' ).classList.remove( 'hidden' )
	updateAttendanceSummary()
	updateClassList()

}
function nextStudent(){
	nb=document.querySelector( '.current-edit' ).nextElementSibling
	if( !nb ) {
		return false
	}
	else if( nb == document.querySelectorAll( '.student-button:last-of-type' )[0] ){
		document.getElementById( 'next-student' ).style.visibility='hidden'
	}
	document.getElementById( 'prev-student' ).style.visibility='visible'
	nb.scrollIntoView();
	nb.click()
}
function prevStudent(){
	let pb=document.querySelector( '.current-edit' ).previousElementSibling
	if( !pb ) {
		return false
	}
	else if( pb == document.querySelectorAll( '.student-button:first-of-type' )[0] ){
		document.getElementById( 'prev-student' ).style.visibility='hidden'
	}
	document.getElementById( 'next-student' ).style.visibility='visible'
	pb.scrollIntoView();
	pb.click()
}
function updateClassList(){
	//console.log( 'updateClassList' )
	let sb=document.querySelectorAll( '.student-button' )
	chrome.storage.sync.get( [ '__GMA_ClassLists', 'Current-Class-Code' ], function (r) {
		let currentClassCode = sessionStorage.getItem( '_Class4ThisMeet' )||r[ 'Current-Class-Code' ]||'Class-List'
		let gcls = r[ '__GMA_ClassLists' ]
		let tsl = {}
		let ilt = []
		let ccl = JSON.parse( sessionStorage.getItem( '_studentsAtThisMeet' ) ) || {}
		for (let ss of sb){
			
			let ln = ss.getAttribute( 'data-login-name' ).trim()
			let sn = (ss.getAttribute( 'data-surname' )||'').trim()
			let cm = (ss.getAttribute( 'data-comments' )||'').trim()
			let st = ss.getAttribute( 'data-status' ).trim()
			let dn = ss.innerText.trim()
			let sdn = dn=='' || dn.toLowerCase()==ln.toLowerCase()?'':dn
			let em = ss.getAttribute( 'data-email' ).replace( /[<>]*/g,'' ).trim()
			
			tsl[ln] = { d:sdn, e:em , sn : sn }
			let ildn = sdn==''?ln:( sdn + ' ('+ln+')' )
			let ilem = em==''?'':' <'+em+'>'
			ilt.push( ( st + ' ' + ildn + ilem ).trim() )
			
			ccl[ln] = { s : st , c:cm } 
		}
		sortButtons()
		gcls[currentClassCode].s=tsl
		chrome.storage.sync.set( { '__GMA_ClassLists': gcls },null )
		sessionStorage.setItem( '_studentsAtThisMeet', JSON.stringify( ccl ) )
	})
}
function filterButtons( e ){
	let fid = e.target.id
	let btn_st = { 'attendance-present' : '✔', 'attendance-new' : '?', 'attendance-absent' : ''}
	let ic=e.target.classList.contains('checked')
	if(ic){
		e.target.classList.remove('checked')
		let sb=document.querySelectorAll( '.student-button.hidden' )||{}
		for ( let wb of sb ){
			wb.classList.remove( 'hidden' )
		}
	}
	else{
		let oc = document.querySelector('.gma-btn.checked')
		if ( oc ){
			oc.classList.remove('checked')
		}
		e.target.classList.add('checked')
		
		let sb=document.querySelectorAll( '.student-button' )||{}
		for ( let wb of sb ){
			if ( fid == 'attendance-present' && ( wb.getAttribute( 'data-status' ) == '✔' || wb.getAttribute( 'data-status' ) == '?' ) ){
				wb.classList.remove( 'hidden' )
				continue
			} 
			else if ( wb.getAttribute( 'data-status' ) == btn_st[ fid ] ) {
				wb.classList.remove( 'hidden' )
				continue				
			}
			wb.classList.add( 'hidden' ) 
		}
	}
}
function sortButtons(){
	chrome.storage.sync.get( [ 'sort-names' ], function (r) {
		if ( r[ 'sort-names' ] == 'first' ){
			sortByFirst()
		}
		else if ( r[ 'sort-names' ] == 'last' ){
			sortByLast()
		}
	})
}
function sortByFirst(){
	function nWC( v ){ //handles names with commas
		let rv = ''
		if ( v.indexOf( ',' ) == -1 ){
			rv = v.toLowerCase()
		}
		else{
			let tn = v.toLowerCase().split( ',')
			rv = tn[ 1 ].trim() + ' ' + tn[ 0 ].trim() 
		}
		return rv
	}
	let sbd = document.getElementById( "student-buttons" )
	let bl = sbd.querySelectorAll( ".student-button" )

	let sbl = Array.from( bl ).sort( ( a, b ) => {
		let an = nWC( a.innerText ), bn = nWC( b.innerText )
		let rv = an < bn ? -1 : an > bn ? 1 : 0
		return rv
	})

	sbd.innerHTML = "";
	sbl.forEach( b => sbd.appendChild(  b ) )		
}
function sortByLast(){
	function gLN(v){
		let nn = v.innerText
		let sna = v.getAttribute( 'data-surname' )||''
		let rv = sna != '' ? sna : ( nn.indexOf( ',' ) > -1 ? nn.split( ',' )[0].trim() : [ ...nn.split( ' ' ) ].pop() )
		return rv.toLowerCase().trim()
	}

	let sbd = document.getElementById( "student-buttons" )
	let bl = sbd.querySelectorAll( ".student-button" )

	let sbl = Array.from( bl ).sort( ( a, b ) => {
		let an = a.innerText, bn = b.innerText
		let asn = gLN( a ), bsn = gLN( b )
		let rv = asn < bsn ? -1 : asn > bsn ? 1 : ( an < bn ? -1 : an > bn ? 1 : 0 )
		return rv
	})

	sbd.innerHTML = "";
	sbl.forEach( b => sbd.appendChild(  b ) )		
}