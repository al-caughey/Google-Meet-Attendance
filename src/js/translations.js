// not a full localization... just the messages from Meet; not the extension UI
// v0.5.3-->removed more and hide because they were language independent
const meetUIStrings = {
	de:{ presenting:"präsentation", presentation:"blidschirm", you:"ich", joined:"nimmt teil", hide:'(teilnehmer \\w*|\\w* participant)'},
	en:{ presenting:"presenting", presentation:"presentation", you:"you", joined:"(has |)joined", hide:'\\w* participant'},
	es:{ presenting:"presenting", presentation:"presentación", you:"tú", joined:"(se ha unido|se unió)", hide:'\\w* participant(e)?'},
	fr:{ presenting:"présentez", presentation:"présentation", you:"vous", joined:"(participe|s'est joint à l'appel)", hide:'(\\w* le participant|\\w* participant)'},
	it:{ presenting:"presentando", presentation:"presentazione", you:"tu", joined:"(sta partecipando|partecipa)", hide:'\\w* (partecipante|participant)'},
	nl:{ presenting:"presentatie", presentation:"presenteert", you:"jij", joined:"neemt( nu|) deel", hide:'(deelnemer \\w*|\\w* particpant)'},
	pt:{ presenting:"apresentando", presentation:"apresentação", you:"(eu|você)", joined:"(Participando|aderiu( à chamada|))", hide:'\\w* participant(e)?'},
}
const dropDownStrings = {
	de:{ classList:"Klassenliste", myClasses:"Meine Klassen", otherOptions:"Andere Optionen", add:"Hinzufügen", reset:"Zurücksetzen"},
	en:{ classList:"Class List", myClasses:"My Classes", otherOptions:"Other Options", add:"Add", reset:"Reset"},
	es:{ classList:"Lista de clase", myClasses:"Mis clases", otherOptions:"Otras opciones", add:"Añadir", reset:"Reiniciar"},
	fr:{ classList:"Liste des classes", myClasses:"Mes classes", otherOptions:"Autres options", add:"Ajouter", reset:"Réinitialiser"},
	it:{ classList:"Elenco delle classi", myClasses:"Le mie classi", otherOptions:"Altre opzioni", add:"Inserisci", reset:"Ripristina"},
	nl:{ classList:"Klassenlijst", myClasses:"Mijn lessen", otherOptions:"Andere opties", add:"Toevoegen", reset:"Reset"},
	pt:{ classList:"Lista de turmas", myClasses:"Minhas aulas", otherOptions:"Outras opções", add:"Adicionar", reset:"Redefinir"},
}
// return strings based on language
function getMeetUIStrings(){
	let lang = document.documentElement.lang.split('-')[0]||'en'
	if( !meetUIStrings[lang] ) lang = 'en'
	meetUIStrings[lang].more='(\\b\\w)? \\w* \\d+.*'
	return meetUIStrings[lang]
}

// return strings based on language
function getDropDownStrings(){
	let lang = document.documentElement.lang.split('-')[0]||'en'
	if( !dropDownStrings[lang] ) lang = 'en'
	return dropDownStrings[lang]
}

