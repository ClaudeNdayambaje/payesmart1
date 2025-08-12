// Traductions néerlandaises pour les produits
const nlTranslations = {
    // Traductions des noms de produits
    productNames: {
        "SUNMI T3 PRO FAMILY": "SUNMI T3 PRO FAMILY",
        "SUNMI D3 MINI": "SUNMI D3 MINI", 
        "SUNMI P3 MIX": "SUNMI P3 MIX"
    },
    
    // Traductions des sous-titres
    productSubtitles: {
        "Solution professionnelle pour votre commerce": "Professionele oplossing voor uw bedrijf",
        "Terminal compact et performant pour tous types de": "Compacte en krachtige terminal voor alle soorten bedrijven",
        "Solution compacte et puissante pour les petites entreprises": "Compacte en krachtige oplossing voor kleine bedrijven",
        "La solution de caisse complète pour tous les commerces": "De complete kassaoplossing voor alle bedrijven"
    },
    
    // Traductions des descriptions (textes exacts de Firebase)
    productDescriptions: {
        // Description exacte SUNMI T3 PRO FAMILY (texte commencant par "Le terminal SUNMI T3 PRO FAMILY offre...")
        "Le terminal SUNMI T3 PRO FAMILY offre une solution de point de vente tout-en-un élégante et puissante. Avec son écran tactile HD de 15,6 pouces, son processeur octa-core et sa batterie longue durée, il assure une expérience utilisateur fluide même pendant les heures de pointe. Son design modulaire permet d'ajouter facilement des périphériques comme scanners et imprimantes.": 
        "De SUNMI T3 PRO FAMILY terminal biedt een elegante en krachtige alles-in-één kassaoplossing. Met zijn 15,6-inch HD touchscreen, octa-core processor en langdurige batterij zorgt het voor een vlotte gebruikerservaring, zelfs tijdens piekuren. Het modulaire ontwerp maakt het eenvoudig om randapparatuur zoals scanners en printers toe te voegen.",
        
        // Ancienne description SUNMI T3 PRO FAMILY (au cas où)
        "Le SUNMI T3 PRO FAMILY est un terminal de point de vente professionnel conçu pour les entreprises de toutes tailles. Avec son écran tactile haute résolution, son processeur puissant et ses multiples options de connectivité, il offre une expérience utilisateur exceptionnelle. Idéal pour les restaurants, magasins de détail et autres commerces nécessitant un système de caisse robuste et fiable.": 
        "De SUNMI T3 PRO FAMILY is een professionele kassaterminal ontworpen voor bedrijven van alle groottes. Met zijn hoogresolutie touchscreen, krachtige processor en meerdere connectiviteitsopties biedt het een uitzonderlijke gebruikerservaring. Ideaal voor restaurants, winkels en andere bedrijven die een robuust en betrouwbaar kassasysteem nodig hebben.",
        
        // Description exacte SUNMI D3 MINI de Firebase
        "Le SUNMI D3 MINI est un terminal de point de vente compact et puissant, idéal pour les petits et moyens commerces. Avec son design élégant, son écran tactile réactif et son processeur rapide, il offre toutes les fonctionnalités nécessaires pour gérer efficacement votre activité commerciale. Sa taille réduite permet une installation facile, même dans les espaces limités.":
        "De SUNMI D3 MINI is een compacte en krachtige kassaterminal, ideaal voor kleine en middelgrote bedrijven. Met zijn elegante design, responsieve touchscreen en snelle processor biedt het alle nodige functionaliteiten om uw bedrijfsactiviteiten efficiënt te beheren. Zijn compacte formaat maakt eenvoudige installatie mogelijk, zelfs in beperkte ruimtes.",
        
        // Description exacte SUNMI P3 MIX de Firebase
        "Le SUNMI P3 MIX est un terminal point de vente compact idéal pour les petits commerces et restaurants. Son design élégant et minimaliste s'intègre dans tous les environnements. Malgré sa taille réduite, il offre toutes les fonctionnalités nécessaires avec son écran tactile de haute qualité, son imprimante thermique intégrée et sa batterie de secours.":
        "De SUNMI P3 MIX is een compacte kassaterminal ideaal voor kleine winkels en restaurants. Zijn elegante en minimalistische design past in elke omgeving. Ondanks zijn compacte formaat biedt het alle benodigde functionaliteiten met zijn hoogwaardige touchscreen, geïntegreerde thermische printer en back-up batterij."
    },
    
    // Traductions des boutons CTA
    buttonLabels: {
        "Demander un devis": "Vraag een offerte aan",
        "En savoir plus": "Meer informatie",
        "Contacter": "Contact opnemen"
    },
    
    // Traductions des catégories
    categories: {
        "Terminal Fixe": "Vaste Terminal",
        "Terminal Mobile": "Mobiele Terminal",
        "Accessoires": "Accessoires"
    },
    
    // Traductions spécifiques aux accessoires
    accessoryNames: {
        "Scanner de Code-barres 1D/2D": "1D/2D Barcode Scanner",
        "Imprimante Thermique 80mm": "Thermische Printer 80mm",
        "Terminal de Paiement PayeSmart": "PayeSmart Betaalterminal"
    },
    
    accessoryDescriptions: {
        "Scanner haute performance pour codes-barres 1D et 2D. Idéal pour les commerces à volume élevé.": "Hoogwaardige scanner voor 1D en 2D barcodes. Ideaal voor winkels met hoog volume.",
        "Imprimante rapide et fiable pour tickets de caisse. Compatible avec notre logiciel PayeSmart.": "Snelle en betrouwbare printer voor kassabonnen. Compatibel met onze PayeSmart software.",
        "Terminal de paiement électronique sécurisé compatible avec toutes les cartes bancaires.": "Veilige elektronische betaalterminal compatibel met alle bankkaarten."
    },
    
    accessoryCategories: {
        "Tous": "Alle",
        "Lecteurs": "Scanners",
        "Imprimantes": "Printers",
        "Terminaux": "Terminals",
        "Autres": "Overige"
    },
    
    // Traductions pour les sections de la page accessoires
    accessoryPageTexts: {
        "Nos Accessoires": "Onze Accessoires",
        "Découvrez notre gamme d'accessoires pour compléter votre solution de caisse PayeSmart.": "Ontdek ons assortiment accessoires om uw PayeSmart kassaoplossing te vervolledigen.",
        "Vous souhaitez en savoir plus sur nos accessoires?": "Wilt u meer weten over onze accessoires?",
        "Nos experts sont disponibles pour vous présenter notre gamme complète d'accessoires et vous aider à choisir les solutions adaptées à votre commerce.": "Onze experts zijn beschikbaar om u ons complete assortiment accessoires te presenteren en u te helpen de juiste oplossingen voor uw winkel te kiezen.",
        "Contactez-nous": "Neem contact op",
        "Demander un devis": "Offerte aanvragen"
    }
};

// Fonction pour traduire un texte en néerlandais
function translateToNL(text, category = 'productDescriptions') {
    if (!text) return text;
    
    // Chercher la traduction exacte
    if (nlTranslations[category] && nlTranslations[category][text]) {
        return nlTranslations[category][text];
    }
    
    // Si pas de traduction exacte trouvée, retourner le texte original
    return text;
}

// Fonction spécifique pour traduire les accessoires
function translateAccessoryToNL(accessory) {
    if (!accessory || !isNLVersion()) return accessory;
    
    const translated = { ...accessory };
    
    // Traduire le nom
    if (translated.name && nlTranslations.accessoryNames[translated.name]) {
        translated.name = nlTranslations.accessoryNames[translated.name];
    }
    
    // Traduire la description
    if (translated.description && nlTranslations.accessoryDescriptions[translated.description]) {
        translated.description = nlTranslations.accessoryDescriptions[translated.description];
    }
    
    return translated;
}

// Fonction pour détecter si on est sur la version néerlandaise
function isNLVersion() {
    return window.location.pathname.includes('/nl/');
}

// Log de débogage pour vérifier le chargement
console.log('[NL-TRANSLATIONS] Script de traductions néerlandaises chargé');
console.log('[NL-TRANSLATIONS] Fonctions disponibles:', typeof translateToNL, typeof isNLVersion);
console.log('[NL-TRANSLATIONS] Version NL détectée:', typeof isNLVersion === 'function' ? isNLVersion() : 'fonction non disponible');

// Export pour utilisation dans d'autres scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { nlTranslations, translateToNL, translateAccessoryToNL, isNLVersion };
}
