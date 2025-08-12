// Script de construction pour Netlify - assure la présence des images au bon emplacement
const fs = require('fs');
const path = require('path');

console.log('🚀 Démarrage du script de construction Netlify...');

// S'assurer que le dossier img/backgrounds existe dans le dossier public
const targetDir = path.join(__dirname, 'public', 'img', 'backgrounds');
const sourceDir = path.join(__dirname, 'public', 'marketing', 'img', 'backgrounds');

// Créer le répertoire cible s'il n'existe pas
if (!fs.existsSync(path.join(__dirname, 'public', 'img'))) {
  fs.mkdirSync(path.join(__dirname, 'public', 'img'));
  console.log('✅ Dossier /public/img créé');
}

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir);
  console.log('✅ Dossier /public/img/backgrounds créé');
}

// Copier toutes les images du dossier marketing/img/backgrounds vers img/backgrounds
try {
  const files = fs.readdirSync(sourceDir);
  
  files.forEach(file => {
    if (file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.gif')) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Image copiée: ${file}`);
    }
  });
  
  console.log('🎉 Toutes les images ont été copiées avec succès!');
} catch (error) {
  console.error('❌ Erreur lors de la copie des images:', error);
  process.exit(1);
}

console.log('✨ Script de construction Netlify terminé avec succès');
