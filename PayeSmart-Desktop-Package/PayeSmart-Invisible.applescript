-- Script pour lancer PayeSmart Desktop de manière totalement invisible
-- Cette version améliorée garantit qu'aucun terminal n'est visible

on run
	try
		-- Chemins absolus pour éviter toute confusion
		set scriptPath to "/Users/claudendayambaje/Documents/Logiciel-Caisse8-main/PayeSmart-Desktop-Package/scripts/payesmart-desktop.sh"
		
		-- Vérifier que le script existe
		tell application "System Events"
			if not (exists file scriptPath) then
				display dialog "Erreur: Script introuvable à " & scriptPath with title "PayeSmart" with icon stop
				return
			end if
		end tell
		
		-- Lancer le script de manière totalement invisible
		do shell script "nohup bash " & quoted form of scriptPath & " > /dev/null 2>&1 &"
		
		-- Notification de lancement
		display notification "PayeSmart Desktop est en cours de démarrage" with title "PayeSmart" subtitle "Veuillez patienter..." sound name "Glass"
		
	on error errorMessage
		display dialog "Erreur: " & errorMessage with title "PayeSmart" with icon stop
	end try
end run
