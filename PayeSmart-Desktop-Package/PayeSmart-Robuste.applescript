-- Script AppleScript robuste pour lancer PayeSmart Desktop sans terminal
-- Version améliorée pour plus de fiabilité

on run
	try
		-- Chemin vers notre nouveau script shell robuste
		set launcherPath to "/Users/claudendayambaje/Documents/Logiciel-Caisse8-main/PayeSmart-Desktop-Package/PayeSmartLauncher.sh"
		
		-- Vérifier que le script existe
		tell application "System Events"
			if not (exists file launcherPath) then
				display dialog "Erreur: Script introuvable à " & launcherPath with title "PayeSmart" with icon stop
				return
			end if
		end tell
		
		-- Exécuter notre script robuste avec le chemin complet à bash
		do shell script "/bin/bash " & quoted form of launcherPath
		
		-- Message de confirmation
		display dialog "PayeSmart Desktop a été lancé avec succès" buttons {"OK"} default button "OK" with title "PayeSmart"
		
	on error errorMessage
		display dialog "Erreur lors du lancement: " & errorMessage with title "PayeSmart" with icon stop
	end try
end run
