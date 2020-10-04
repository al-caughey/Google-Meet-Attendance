function addClassButtons(){
	ClearClassButtons()
	chrome.storage.sync.get( [ '__GMA_ClassLists', 'Current-Class-Code' ], function (r) {
	console.log( 'addClassButtons' )
		let currentClassCode = sessionStorage.getItem( '_Class4ThisMeet' )||r[ 'Current-Class-Code' ]||'Class-List'
		let rs=[]
		let cl=!r['__GMA_ClassLists' ][ currentClassCode ]?{}:r['__GMA_ClassLists' ][ currentClassCode ].s
		write2log( 'addClassButtons --> currentClassCode: ' + currentClassCode )
		console.log( 'addClassButtons --> cl', cl )
		for (let [ nn, dd ] of Object.entries( cl || {} )) {
			let dn=dd.d==''?nn:(dd.d + ' ( ' + nn + ' )' )
			let em=dd.e==''?'':' <'+dd.e+'>'
			rs.push( dn+em )
			addClassButton( nn, dd.d, em )
		}
		document.getElementById( 'invited-list' ).value = rs.join( '\n' ).trim()
		if( document.querySelectorAll( '.student-button' ).length > 0 ){
			document.getElementById( 'gma-attendance-fields' ).classList.remove( 'empty' )
		}
		updateAttendanceSummary()
	})
	
}
function getStudentNames(){
	 chrome.storage.sync.get( [ '__GMA_ClassLists', 'Current-Class-Code' ], function (r) {
		let rs=[]
		let currentClassCode = sessionStorage.getItem( '_Class4ThisMeet' )||r[ 'Current-Class-Code' ]||'Class-List'
		write2log( 'getStudentNames: ' + currentClassCode )
		let cl=!r['__GMA_ClassLists' ][ currentClassCode ]?{}:r['__GMA_ClassLists' ][ currentClassCode ].s
		for (let [nn, dd] of Object.entries( cl || {} )) {			
			let dn=dd.d==''?nn:(dd.d + ' ('+nn+')' )
			let em=dd.e==''?'':' <'+dd.e+'>'
			rs.push(dn+em)
		}
		document.getElementById( 'invited-list' ).value = rs.join( '\n' ).trim()
	}) 
}
function findArrivalTime( n ){
	let ats = JSON.parse( sessionStorage.getItem( '_arrivalTimes' ) )||{}
	let rts='', eat=''
	for (let [ pid, dd ] of Object.entries( ats || {} )) {
		if( dd.name.toLowerCase() != n ) continue
		console.log( 'findArrivalTime', n, dd.name, dd.arrived )
		if( eat == '' || dd.arrived < eat ){
			eat = dd.arrived
		}
	}
	console.log( 'findArrivalTime -->', eat )
	return eat
}
function addClassButton( nm, dn, me ){
	let gclb = document.getElementById( 'student-buttons' )
	let st = ''
	let ccl = JSON.parse( sessionStorage.getItem( '_studentsAtThisMeet' ) )||{}
	if( nm[0] == '✔' || ( !!ccl[nm] && ccl[nm].s == '✔' ) ){
		st='✔'
	}
	else if( nm[0]=='?' || ( !!ccl[nm] && ccl[nm].s=='?' ) ){
		st='?'
	}
	console.log( 'addClassButton', nm, dn, me, st )
	nm=nm.replace( /[\?✔]/g, '' ).trim().toLowerCase()

	if( !dn || dn == '' ) dn=nm
	let nb = addElement( gclb, 'span', '', '', 'student-button', dn )
	nb.setAttribute( 'data-login-name', nm )
	nb.setAttribute( 'data-email', me||'' )
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
	let dn = e.target.innerText.replace( /[\(\)]*/g, '' ).trim().toLowerCase()
	let ln = e.target.getAttribute( 'data-login-name' ).trim().toLowerCase()
	dn = dn==''||dn==ln ? '' : dn
	let em=e.target.getAttribute( 'data-email' ).replace( /[<>]*/g,'' ).trim()
	document.getElementById( 'student-buttons' ).classList.add( 'editting' )
	document.getElementById( 'student-edit-div' ).style.display='flex'
	document.getElementById( 'gma-login-name' ).value=ln
	document.getElementById( 'gma-display-name' ).value=dn
	document.getElementById( 'gma-email' ).value=em||''
}

function cancelEditStudent(){
	document.getElementById( 'student-edit-div' ).style.display='none'	
	document.getElementById( 'gma-login-name' ).value=''
	document.getElementById( 'gma-display-name' ).value=''
	document.getElementById( 'gma-email' ).value=''
	let css=document.querySelectorAll( '.current-edit' )
	if ( css.length == 0 ) return
	css[0].classList.remove( 'current-edit' )
	document.getElementById( 'student-buttons' ).classList.remove( 'editting' )
}
function saveEditStudent(){
	let css=document.querySelectorAll( '.current-edit' )[0]
	css.innerText=document.getElementById( 'gma-display-name' ).value||document.getElementById( 'gma-login-name' ).value
	css.setAttribute( 'data-login-name', document.getElementById( 'gma-login-name' ).value )
	css.setAttribute( 'data-email', document.getElementById( 'gma-email' ).value )
	css.classList.remove( 'current-edit' )
	document.getElementById( 'student-edit-div' ).style.display='none'
	updateClassList()
	document.getElementById( 'student-buttons' ).classList.remove( 'editting' )
	document.getElementById( 'save-student-edits' ).style.display='none'	
}
function editStudentChanged(){
	document.getElementById( 'save-student-edits' ).style.display='inline-block'	
}
function deleteStudent(){
	let dsn=document.getElementById( 'gma-login-name' ).value.toLowerCase()
	if (!confirm( 'Do you really want to delete `'+dsn+'`?  There is no undo!' )) return 
	write2log( 'deleteStudent --> ' + dsn )
	let etr=document.querySelector( '[data-login-name="'+dsn+'"]' )
	document.getElementById( 'student-buttons' ).removeChild(etr);
	document.getElementById( 'save-student-edits' ).style.display='inline-block'	
	document.getElementById( 'student-edit-div' ).style.display='none'
	document.getElementById( 'student-buttons' ).classList.remove( 'editting' )
	updateClassList()
}
function updateClassList(){
	console.log( 'updateClassList' )
	let sb=document.querySelectorAll( '.student-button' )
	chrome.storage.sync.get( [ '__GMA_ClassLists', 'Current-Class-Code' ], function (r) {
		let currentClassCode = sessionStorage.getItem( '_Class4ThisMeet' )||r[ 'Current-Class-Code' ]||'Class-List'
		let gcls = r[ '__GMA_ClassLists' ]
		let tsl = {}
		let ilt = []
		let ccl = JSON.parse( sessionStorage.getItem( '_studentsAtThisMeet' ) ) || {}
		for (let ss of sb){
			
			let ln = ss.getAttribute( 'data-login-name' ).trim()
			let st = ss.getAttribute( 'data-status' ).trim()
			let dn = ss.innerText.trim()
			let sdn = dn=='' || dn.toLowerCase()==ln.toLowerCase()?'':dn
			let em = ss.getAttribute( 'data-email' ).replace( /[<>]*/g,'' ).trim()
			
			tsl[ln] = { d:sdn, e:em }
			let ildn = sdn==''?ln:( sdn + ' ('+ln+')' )
			let ilem = em==''?'':' <'+em+'>'
			ilt.push( ( st + ' ' + ildn + ilem ).trim() )
			ccl[ln]={s:st}
		}
		gcls[currentClassCode].s=tsl
		chrome.storage.sync.set( {'__GMA_ClassLists': gcls },null)
		sessionStorage.setItem( '_studentsAtThisMeet', JSON.stringify(ccl) )
	})
}