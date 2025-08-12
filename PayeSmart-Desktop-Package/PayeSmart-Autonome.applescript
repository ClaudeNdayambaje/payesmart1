-- PayeSmart Autonome - Application AppleScript
-- Lance PayeSmart sans aucune dépendance visible aux navigateurs

-- Chemins
property payesmartPath : "/Users/claudendayambaje/Documents/Logiciel-Caisse8-main"
property launcherPath : "/Users/claudendayambaje/Documents/Logiciel-Caisse8-main/PayeSmart-Desktop-Package/PayeSmart-Autonome.sh"

-- Fonction pour afficher une notification simple (sans attendre)
on showNotification(message)
	do shell script "osascript -e 'display notification \"" & message & "\" with title \"PayeSmart\"'"
end showNotification

-- Fonction principale
on run
	try
		-- Vérifier que le script existe
		set launcherExists to do shell script "test -f " & quoted form of launcherPath & " && echo 'true' || echo 'false'"
		
		if launcherExists is "false" then
			display dialog "Le lanceur PayeSmart est introuvable à l'emplacement :" & return & launcherPath buttons {"Fermer"} default button 1 with icon stop
			return
		end if
		
		-- Afficher une notification de démarrage
		showNotification("Démarrage de PayeSmart...")
		
		-- Lancer le script en arrière-plan
		do shell script "chmod +x " & quoted form of launcherPath
		do shell script quoted form of launcherPath & " > /dev/null 2>&1 &"
		
		-- Afficher des notifications de progression sans bloquer
		delay 1
		showNotification("Initialisation des composants...")
		delay 1
		showNotification("Démarrage des services...")
		delay 1
		showNotification("Lancement de l'interface...")
		
		-- Pas de message final pour éviter de bloquer
		
	on error errMsg
		-- Gestion des erreurs sans bloquer
		showNotification("Erreur lors du lancement de PayeSmart")
		do shell script "echo '" & errMsg & "' >> /tmp/payesmart-error.log"
	end try
end run
