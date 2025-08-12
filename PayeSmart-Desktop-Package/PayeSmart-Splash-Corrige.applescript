-- Script de lancement avec splash screen animé pour PayeSmart
-- Cette version crée une expérience de démarrage dynamique et engageante

on run
	try
		-- Lancer le script en arrière-plan
		do shell script "bash '/Users/claudendayambaje/Documents/Logiciel-Caisse8-main/PayeSmart-Desktop-Package/PayeSmartLauncher.sh' > /dev/null 2>&1 &"
		
		-- Afficher une série de dialogues animés pour simuler un chargement
		tell application "System Events"
			-- Premier dialogue
			display dialog "Démarrage de PayeSmart..." buttons {"Annuler"} default button "Annuler" giving up after 1.5 with title "PayeSmart" with icon 1
			delay 0.5
			
			-- Deuxième dialogue avec progression
			display dialog "Initialisation des composants... (20%)" buttons {"Annuler"} default button "Annuler" giving up after 1.5 with title "PayeSmart" with icon 1
			delay 0.8
			
			-- Troisième dialogue avec progression
			display dialog "Démarrage des services... (40%)" buttons {"Annuler"} default button "Annuler" giving up after 1.5 with title "PayeSmart" with icon 1
			delay 0.8
			
			-- Quatrième dialogue avec progression
			display dialog "Connexion à la base de données... (60%)" buttons {"Annuler"} default button "Annuler" giving up after 1.5 with title "PayeSmart" with icon 1
			delay 0.8
			
			-- Cinquième dialogue avec progression
			display dialog "Préparation de l'interface utilisateur... (80%)" buttons {"Annuler"} default button "Annuler" giving up after 1.5 with title "PayeSmart" with icon 1
			delay 0.8
			
			-- Sixième dialogue avec progression
			display dialog "Presque prêt... (95%)" buttons {"Annuler"} default button "Annuler" giving up after 1.5 with title "PayeSmart" with icon 1
			delay 0.8
		end tell
		
		-- Confirmation finale
		display dialog "PayeSmart Desktop a été lancé avec succès!" buttons {"OK"} default button "OK" with title "PayeSmart" with icon 1
		
	on error errorMessage
		display dialog "Erreur lors du lancement: " & errorMessage with title "PayeSmart" with icon stop
	end try
end run
