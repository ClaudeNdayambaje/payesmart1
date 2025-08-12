// Configuration Firebase pour le site marketing
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si Firebase est disponible et pas encore initialisé
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK n\'est pas chargé');
        return;
    }
    
    // Vérifier si Firebase est déjà initialisé
    if (firebase.apps && firebase.apps.length > 0) {
        console.log('Firebase est déjà initialisé');
        return;
    }

    // Configuration Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyD-D2qvB1zQ3ta-31LuAvBawR_6KJHb07Y",
        authDomain: "logiciel-de-caisse-7e58e.firebaseapp.com",
        projectId: "logiciel-de-caisse-7e58e",
        storageBucket: "logiciel-de-caisse-7e58e.appspot.com",
        messagingSenderId: "845468395395",
        appId: "1:845468395395:web:4c4adddef147c29f0338b6"
    };

    try {
        // Initialiser Firebase
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialisé avec succès pour le site marketing');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation Firebase:', error);
    }
});
