// not a full localization... just the messages from Meet; not the extension UI
// v0.5.3-->removed more and hide because they were language independent
// v0.6.3-->added chinese

const meetUIStrings = {
	de : { presenting : "präsentation", presentation : "blidschirm", you : "ich", joined : "nimmt teil", hide : '(teilnehmer \\w*|\\w* participant)'},
	en : { presenting : "presenting", presentation : "presentation", you : "you", joined : "(has |)joined", hide : '\\w* participant'},
	es : { presenting : "presentando", presentation : "presentación", you : "tú", joined : "(se unió|se ha unido)", hide : '\\w* participant(e)?'},
	fr : { presenting : "présentez", presentation : "présentation", you : "vous", joined : "(participe|s'est joint à l'appel)", hide : '(\\w* le participant|\\w* participant)'},
	it : { presenting : "presentando", presentation : "presentazione", you : "tu", joined : "(sta partecipando|partecipa)", hide : '\\w* (partecipante|participant)'},
	nl : { presenting : "presentatie", presentation : "presenteert", you : "jij", joined : "neemt( nu|) deel", hide : '(deelnemer \\w*|\\w* particpant)'},
	pt : { presenting : "apresentando", presentation : "apresentação", you : "(eu|você)", joined : "(está|participando|aderiu( à chamada|))", hide : '\\w* participant(e)?'},
	ro : { presenting : "prezentare", presentation : "prezentare", you : "tu", joined : "(está|participando|aderiu( à chamada|))", hide : '\\w* participant(e)?'},
	zh : { presenting : "你的演示|你正在向所有人展示|停止展示|展示内容中的音频", presentation : "展示", you : "你", joined : "(已加入|加入了通话)", hide : '\\w* participant(e)?'},
}
const dropDownStrings = {
	en : { classList : "Class List", myClasses : "My Classes", otherOptions : "Other Options", add : "Add", reset : "Reset", adding : 'Enter the name of your class', added : 'The class was added', not_added : 'The class was not added', clearChecks : 'Do you want to clear the checks (`✔`) from your previous Meet? (Recommended Yes)' },
	de : { classList : "Klassenliste", myClasses : "Meine Klassen", otherOptions : "Andere Optionen", add : "Hinzufügen", reset : "Zurücksetzen", adding : 'Geben Sie den Namen Ihrer Klasse eins', added : 'Die Klasse wurde hinzugefügt', not_added : 'Die Klasse wurde *nicht* hinzugefügt' },
	es : { classList : "Lista de clase", myClasses : "Mis clases", otherOptions : "Otras opciones", add : "Añadir", reset : "Reiniciar", adding : 'Ingrese el nombre de su clase', added : 'La clase fue agregado', not_added : 'La clase fue *no* agregada' },
	fr : { classList : "Liste des classes", myClasses : "Mes classes", otherOptions : "Autres options", add : "Ajouter", reset : "Réinitialiser", adding : 'Entrez le nom de votre classe', added : 'La classe a été ajoutée', not_added : 'La classe n\'a *pas* été ajoutée' },
	it : { classList : "Elenco delle classi", myClasses : "Le mie classi", otherOptions : "Altre opzioni", add : "Inserisci", reset : "Ripristina", adding : 'Inserisci il nome della tua classe', added : 'La classe è stata aggiunta', not_added : 'La classe è stata *non* aggiunta' },
	nl : { classList : "Klassenlijst", myClasses : "Mijn lessen", otherOptions : "Andere opties", add : "Toevoegen", reset : "Reset", adding : 'Voer de naam van je klas in', added : 'De klas is toegevoegd', not_added : 'De klas is *niet* toegevoegd' },
	pt : { classList : "Lista de turmas", myClasses : "Minhas aulas", otherOptions : "Outras opções", add : "Adicionar", reset : "Redefinir", adding : 'Digite o nome da sua turma', added : 'A turma foi adicionada', not_added : 'A turma foi *não* adicionada' },
	ro : { classList : "Lista de clase", myClasses : "Cursurile mele", otherOptions : "Alte optiuni", add : "Adăuga", reset : "Resetați", adding : 'Introduceți numele clasei dvs.', added : 'Clasa a fost adăugată', not_added : 'Clasa nu a fost adăugată' },
	zh : { classList : "班级名单", myClasses : "我的课室", otherOptions : "其他选项/其他选择", add : "加", reset : "重启", adding : '输入您的班级名称', added : '该课程已添加', not_added : '未添加课程' },
}

// return strings based on language
function getMeetUIStrings(){
	let lang = document.documentElement.lang.split( '-' )[ 0 ]||'en'
	if( !meetUIStrings[ lang ] ) lang = 'en'
	meetUIStrings[ lang ].more = '(\\b\\w)? \\w* \\d+.*'
	meetUIStrings[ lang ].keep_off = 'keep_off' //placeholder to exclude spurious keep_off entries
	write2log( 'Using UI strings for ' + lang )
	return meetUIStrings[ lang ]
}

// return strings based on language
function getDropDownStrings(){
	let ret = dropDownStrings[ 'en' ]
	let lang = document.documentElement.lang.split( '-' )[ 0 ] || 'en'
	if( lang!='en' && !!dropDownStrings[ lang ] ){
		for( let [ k, v ] of Object.entries( dropDownStrings[ lang ] ) ){
			ret[ k ]=v
		}
	}
	write2log( 'Using drop down strings for ' + lang )
	return ret
}

