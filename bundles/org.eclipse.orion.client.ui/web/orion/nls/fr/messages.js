/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 ******************************************************************************/

//NLS_CHARSET=UTF-8
/*eslint-env browser, amd*/
define({
	"Navigator": "Navigateur",
	"Sites": "Sites",
	"Shell": "Shell",
	"ShellLinkWorkspace": "Shell",
	"Get Plugins": "Obtention de plug-ins",
	"Global": "Global",
	"Editor": "Editeur",
	"EditorRelatedLink": "Afficher le dossier en cours",
	"EditorRelatedLinkParent": "Afficher le dossier contenant les correspondances",
	"EditorLinkWorkspace": "Edition",
	"EditorRelatedLinkProj": "Afficher le projet",
	"Filter bindings": "Filtrer les combinaisons",
	"Orion Editor": "Editeur Orion",
	"Orion Image Viewer": "Orion Image Viewer",
	"Orion Markdown Editor": "Orion Markdown Editor",
	"Orion Markdown Viewer": "Orion Markdown Viewer",
	"Orion JSON Editor": "Orion JSON Editor",
	"View on Site": "Afficher sur le site",
	"View this file or folder on a web site hosted by Orion": "Afficher ce fichier ou dossier sur un site Web hébergé par Orion.",
	"ShowAllKeyBindings": "Afficher une liste de toutes les combinaisons de touches sur cette page",
	"Show Keys": "Afficher des touches",
	"HideShowBannerFooter": "Masquer ou afficher la bannière ou le bas de page",
	"Toggle banner and footer": "Afficher/masquer la bannière ou le bas de page",
	"ChooseFileOpenEditor": "Sélectionnez un fichier par son nom et ouvrez un éditeur en cliquant dessus",
	"FindFile": "Rechercher le fichier nommé...",
	"System Configuration Details": "Détails de la configuration du système",
	"System Config Tooltip": "Accéder à la page Détails de la configuration du système",
	"Background Operations": "Opérations d'arrière-plan",
	"Background Operations Tooltip": "Accédez à la page Opérations d'arrière-plan",
	"Operation status is unknown": "Le statut de l'opération est inconnu",
	"Unknown item": "Elément inconnu",
	"NoSearchAvailableErr": "Recherche impossible : aucun service de recherche n'est disponible",
	"Related": "Associé",
	"Options": "Options",
	"FAQ": "FAQ",
	"Report a Bug": "Bogues",
	"Privacy Policy": "Confidentialité",
	"Terms of Use": "Dispositions",
	"Copyright Agent": "Copyright",
	"Orion Logo": "Logo Orion",
	"Orion is in Beta. Please try it out but BEWARE your data may be lost.": "@buildLabel@",
	"LOG: ": "JOURNAL : ",
	"View": "Vue",
	"no parent": "aucun parent",
	"no tree model": "aucun modèle d'arborescence",
	"no renderer": "aucun présentateur de rendu",
	"could not find table row ": "ligne de table introuvable ",
	"Operations": "Opérations",
	"Operations running": "Opérations en cours",
	"SomeOpWarning": "Certaines opérations se sont terminées par un avertissement",
	"SomeOpErr": "Certaines opérations se sont terminées par une erreur",
	"no service registry": "aucun registre de services",
	"Tasks": "Tâches",
	"Close": "Fermer",
	"Expand all": "Développer tout",
	"Collapse all": "Réduire tout",
	"Search" : "Recherche",
	"Advanced search" : "Recherche avancée",
	"Submit" : "Soumettre",
	"More" : "Plus",
	"Recent searches" : "Recherches récentes",
	"Regular expression" : "Expression régulière",
	"Search options" : "Options de recherche",
	"Global search" : "Recherche globale",
	"Orion Home" : "Orion - Accueil",
	"Close notification" : "Fermer la notification",
	"OpPressSpaceMsg" : "Opérations - Appuyez sur la barre d'espace pour afficher les opérations en cours",
	"Toggle side panel" : "Afficher/masquer le panneau latéral",
	"Open or close the side panel": "Ouvrir ou fermer le panneau latéral",
	"Projects" : "Projets",
	"Toggle Sidebar" : "Afficher/masquer la barre de navigation",
	"Sample HTML5 Site": "Exemple de site HTML5",
	"Generate an HTML5 'Hello World' website, including JavaScript, HTML, and CSS files.": "Générez un site Web HTML5 'Hello World' comportant des  fichiers JavaScript, HTML et CSS.",
	"Sample Orion Plugin": "Exemple de plug-in Orion",
	"Generate a sample plugin for integrating with Orion.": "Générez un exemple de plug-in pour l'intégration à Orion.",
	"Browser": "Navigateur Web",
	"OutlineProgress": "Obtention de la structure de ${0} à partir de ${1}",
	"outlineTimeout": "Le service de structure est arrivé à expiration. Essayez de recharger la page et d'ouvrir la structure à nouveau.",
	"UnknownError": "Une erreur inconnue s'est produite.",
	"UnknownWarning": "Un avertissement inconnu s'est produit.",
	"Filter": "Filtre (* = toute chaîne, ? = tout caractère)",
	"TemplateExplorerLabel": "Modèles",
	"OpenTemplateExplorer": "Ouvrir l'explorateur de modèles",
	"Edit": "Edition",
	"CentralNavTooltip": "Activer/désactiver le menu de navigation",
	"Wrote: ${0}": "Ecriture : ${0}",
	"GenerateHTML": "Générer un fichier HTML",
	"GenerateHTMLTooltip": "Ecrire un fichier HTML généré à partir du contenu de l'éditeur Markdown en cours",
	"alt text": "texte alternatif",
	"blockquote": "bloc de citation",
	"code": "code",
	"code (block)": "code (bloc)",
	"code (span)": "code (étendue)",
	"emphasis": "mise en évidence",
	"fenced code (${0})": "code isolé (${0})",
	"header (${0})": "en-tête (${0})",
	"horizontal rule": "règle horizontale",
	"label": "libellé",
	"link (auto)": "lien (automatique)",
	"link (image)": "lien (image)",
	"link (inline)": "lien (en ligne)",
	"link label": "libellé de lien",
	"link label (optional)": "libellé de lien (facultatif)",
	"link (ref)": "lien (référence)",
	"list item (bullet)": "élément de liste (puce)",
	"list item (numbered)": "élément de liste (numéro)",
	"strikethrough (${0})": "barré (${0})",
	"strong": "gras",
	"table (${0})": "table (${0})",
	"text": "text",
	"title (optional)": "titre (facultatif)",
	"url": "url",
	"TogglePaneOrientationTooltip": "Basculer l'orientation de fractionnement de la sous-fenêtre",
	"WarningHeaderTooDeep": "Le niveau d'en-tête ne peut pas être supérieur à 6",
	"WarningUnorderedListItem": "Elément de liste non ordonné dans une liste ordonnée",
	"WarningOrderedListItem": "Elément de liste ordonné dans une liste non ordonnée",
	"WarningOrderedListShouldStartAt1": "Le premier élément dans une liste ordonnée doit avoir l'index 1",
	"WarningLinkHasNoText": "Le lien ne possède pas de texte",
	"WarningLinkHasNoURL": "Le lien ne possède pas d'adresse URL",
	"WarningUndefinedLinkId": "ID de lien non défini : ${0}",
	"PageTitleFormat": "${0} - ${1}", // ${0} is the file or resource being edited; ${1} is the task (eg. "Editor")
	// Display names for keys:
	"KeyCTRL": "Ctrl",
	"KeySHIFT": "Maj",
	"KeyALT": "Alt",
	"KeyBKSPC": "Retour arrière",
	"KeyDEL": "Suppr",
	"KeyEND": "Fin",
	"KeyENTER": "Entrer",
	"KeyESCAPE": "Echap",
	"KeyHOME": "Accueil",
	"KeyINSERT": "Inser",
	"KeyPAGEDOWN": "Page avant",
	"KeyPAGEUP": "Page arrière",
	"KeySPACE": "Espace",
	"KeyTAB": "Tabulation",
	// End key names
});

