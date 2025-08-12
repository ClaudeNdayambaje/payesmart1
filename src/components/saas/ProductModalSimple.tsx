import React, { useState, useEffect, useRef } from 'react';
import { MarketingProduct } from '../../services/marketingProductsService';
import { toast } from 'react-hot-toast';
import { uploadProductVideoViaCloud } from "../../services/productVideoCloudService";
import { uploadProductImageViaCloud } from "../../services/productImageCloudService";
import { uploadProductVideoDirectly } from "../../services/productVideoDirectService";
import { uploadVideoSimple } from "../../services/productVideoSimpleService";
import { FiUpload, FiVideo } from 'react-icons/fi';

interface ProductModalSimpleProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<MarketingProduct>) => Promise<boolean>;
  product: MarketingProduct | null;
  isEdit: boolean;
}

const ProductModalSimple: React.FC<ProductModalSimpleProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  product, 
  isEdit 
}) => {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [active, setActive] = useState(true);
  const [imageUrl, setImageUrl] = useState<string>(product?.imageUrl || "");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  // Variable retirée car non nécessaire avec le nouveau système d'upload
  // const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // États pour la vidéo
  const [videoUrl, setVideoUrl] = useState<string>(product?.videoUrl || "");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [showVideoButton, setShowVideoButton] = useState<boolean>(product?.showVideoButton !== false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [buttonCTAs, setButtonCTAs] = useState<Array<{label: string, url: string, type: 'primary' | 'secondary'}>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fonction pour valider les URLs
  const isValidUrl = (url: string): boolean => {
    // Valider aussi les URLs blob: pour les prévisualisations locales
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:');
  };

  // Initialiser les champs avec les valeurs du produit en cas d'édition
  useEffect(() => {
    if (product && isEdit) {
      setName(product.name || '');
      setSubtitle(product.subtitle || '');
      setDescription(product.description || '');
      setCategory(product.category || '');
      setActive(product.active !== false);
      
      // Définir l'URL de l'image pour le stockage et la prévisualisation
      const productImageUrl = product.imageUrl || '';
      setImageUrl(productImageUrl);
      
      // Toujours montrer l'image existante dans la prévisualisation
      if (productImageUrl && !productImageUrl.includes('placehold.co')) {
        setImagePreviewUrl(productImageUrl);
      } else {
        setImagePreviewUrl('');
      }
      
      // Réinitialiser les états de téléchargement pour permettre une nouvelle modification
      setIsImageUploading(false);
      setIsVideoUploading(false);
      
      // Définir l'URL de la vidéo pour le stockage
      const productVideoUrl = product.videoUrl || '';
      setVideoUrl(productVideoUrl);
      
      setFeatures(product.features || []);
      setButtonCTAs(product.buttonCTAs || []);
    } else {
      // Réinitialiser le formulaire pour un nouveau produit
      setName('');
      setSubtitle('');
      setDescription('');
      setCategory('');
      setActive(true);
      setImageUrl('');
      setFeatures([]);
      setButtonCTAs([]);
    }
  }, [product, isEdit, isOpen]);

  if (!isOpen) return null;

  // Gérer le champ d'URL d'image
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
  };
  
  // Gérer la sélection et le téléchargement de l'image
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Début de handleImageFileChange');
    const fileInput = e.target;
    
    if (!fileInput.files || fileInput.files.length === 0) {
      console.log('Aucun fichier sélectionné');
      return;
    }
    
    // Vérifier l'authentification avant de commencer
    const { auth } = await import('../../firebase');
    if (!auth.currentUser) {
      console.error('Utilisateur non authentifié');
      toast.error("Vous devez être connecté pour télécharger une image");
      return;
    }
    console.log('Utilisateur authentifié:', auth.currentUser.uid);
    
    // Vérification détaillée de la connexion internet
    if (!navigator.onLine) {
      console.error('Utilisateur hors ligne');
      toast.error("Vous êtes hors ligne. Veuillez vérifier votre connexion internet.");
      return;
    }
    
    // Vérification supplémentaire avec Firebase
    try {
      const { goOnline } = await import('../../firebase');
      // Force la connexion Firebase pour s'assurer que Storage est accessible
      goOnline();
      console.log('Connexion Firebase Storage activée');
    } catch (networkErr) {
      console.error('Erreur lors de l\'activation de la connexion Firebase:', networkErr);
    }
    
    const file = fileInput.files[0];
    console.log('Image sélectionnée:', file.name, file.type, `${(file.size / 1024).toFixed(2)} KB`);
    setImageFile(file);
    
    try {
      // Afficher une prévisualisation de l'image immédiatement
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setImagePreviewUrl(result);
        }
      };
      reader.readAsDataURL(file);
      
      // Démarrer le processus d'upload
      setIsImageUploading(true);
      // Progression désactivée

      // Vérifier la taille de l'image (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error(`L'image est trop volumineuse (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum: 5MB`);
        setIsImageUploading(false);
        return;
      }

      // Utiliser le service Cloud Function pour l'upload d'images
      const uploadResult = await uploadProductImageViaCloud(file, {
        onProgress: (_) => {
          // Ignorer la progression, nous utilisons un indicateur simplifié
        }
      });
      
      // Vérifier si l'upload a réussi et mettre à jour l'URL
      if (!uploadResult.success || !uploadResult.imageUrl) {
        throw new Error(uploadResult.error || "Erreur lors du téléchargement de l'image");
      }
      
      // Mettre à jour l'URL de l'image
      console.log('✅ Image téléchargée avec succès via service SDK:', uploadResult.imageUrl);
      setImageUrl(uploadResult.imageUrl);
      
      toast.success("Image téléchargée avec succès!", {
        style: {
          borderRadius: '10px',
          background: '#4A7B34',
          color: '#fff',
        },
        duration: 3000,
      });
      
      // Réinitialiser l'input file pour permettre la resélection du même fichier
      if (fileInput instanceof HTMLInputElement) {
        fileInput.value = '';
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'upload de l\'image:', error);
      
      // Réinitialiser les états en cas d'erreur mais garder la prévisualisation
      setImageUrl('');
      
      // Afficher un message d'erreur adapté
      const errorMessage = error?.message || "Erreur lors du téléchargement de l'image";
      toast.error(errorMessage, {
        style: {
            background: '#FFF0F0',
            color: '#D32F2F',
            border: '1px solid #FFCCCC',
            whiteSpace: 'pre-wrap' // Permet les sauts de ligne dans le message
        }
      });
      
      // Réinitialiser la prévisualisation d'image si l'upload a échoué
      setImagePreviewUrl('');
      // Progression désactivée
    } finally {
      setIsImageUploading(false);
    }
  };

  // Gérer la sélection et le téléchargement de la vidéo
  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;
    
    if (!fileInput.files || fileInput.files.length === 0) {
      console.log('Aucun fichier vidéo sélectionné');
      return;
    }
    
    const file = fileInput.files[0];
    console.log('Vidéo sélectionnée:', file.name, file.type, `${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    setVideoFile(file);
    
    // Démarrer le processus d'upload avec notification toast
    setIsVideoUploading(true);
    setVideoUploadProgress(0);
    
    const toastId = toast.loading('Téléchargement de la vidéo en cours...', {
      style: {
        backgroundColor: '#F0F9FF',
        color: '#0369A1'
      }
    });
    
    try {
      // Utiliser la méthode simplifiée sans événements de progression
      toast.loading('Tentative de téléchargement avec méthode simplifiée...', {
        id: toastId,
        style: {
          backgroundColor: '#E0F2FE',
          color: '#0284C7'
        }
      });
      
      // Mise à jour visuelle de la progression
      setVideoUploadProgress(20);
      
      // Version simplifiée sans événements de progression qui pourraient bloquer
      const uploadResult = await uploadVideoSimple(file);
      
      // Simuler une progression complète pour l'interface
      setVideoUploadProgress(100);
      
      // Vérifier si l'upload a réussi et mettre à jour l'état
      if (!uploadResult.success || !uploadResult.videoUrl) {
        throw new Error(uploadResult.error || "Échec de l'upload de la vidéo pour une raison inconnue");
      }
      
      // Forcer un délai court pour s'assurer que les états sont mis à jour correctement
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mettre à jour l'état avec l'URL de la vidéo explicitement
      console.log('✅ Vidéo téléchargée avec succès via Cloud Function:', uploadResult.videoUrl);
      const videoUrlResult = uploadResult.videoUrl;
      setVideoUrl(videoUrlResult);
      
      // Confirmer avec toast
      toast.success("Vidéo téléchargée avec succès!", {
        id: toastId,
        style: {
          borderRadius: '10px',
          background: '#4A7B34',
          color: '#fff',
        },
        duration: 5000,
      });
      
      // Activer automatiquement l'option d'affichage du bouton vidéo
      setShowVideoButton(true);
      
      // Vérification additionnelle avec log détaillé
      console.log('État après téléchargement:', {
        videoUrl: videoUrlResult,
        isVideoUploading: false,
        videoFile: file.name
      });
      
    } catch (error: any) {
      console.error('❌ Erreur lors du téléchargement de la vidéo:', error);
      setVideoUrl("");
      
      toast.error(error.message || "Erreur lors de l'upload de la vidéo", {
        id: toastId,
        duration: 8000,
        style: {
          backgroundColor: '#FFEEEE',
          border: '1px solid #FF0000',
          color: '#990000',
          whiteSpace: 'pre-line'
        },
      });
    } finally {
      setIsVideoUploading(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };
  
  // Gestionnaires pour les caractéristiques
  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };
  
  const handleRemoveFeature = (index: number) => {
    const updatedFeatures = [...features];
    updatedFeatures.splice(index, 1);
    setFeatures(updatedFeatures);
  };
  
  // Les gestionnaires pour les spécifications techniques ont été supprimés car cette fonctionnalité n'est plus utilisée
  
  // Les gestionnaires pour les boutons CTA ont été simplifiés - plus besoin de suppression manuelle
  
  // La fonction temporaire de test d'upload a été supprimée pour la production

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Début de soumission du formulaire produit');
    
    if (!name.trim()) {
      toast.error('Le nom du produit (titre principal) est requis');
      return;
    }
    
    if (!subtitle.trim()) {
      toast.error('Le sous-titre est requis');
      return;
    }
    
    // Empêcher la soumission si des téléchargements sont en cours
    if (isImageUploading) {
      toast.error('Veuillez attendre la fin du téléchargement avant de soumettre');
      return;
    }
    

    
    if (!category.trim()) {
      toast.error('La catégorie est requise');
      return;
    }
    
    setIsLoading(true);
    console.log('Validation du formulaire réussie, préparation des données');
    
    try {
      // Vérifier l'authentification
      const auth = (await import('../../firebase')).auth;
      if (!auth.currentUser) {
        console.error('L\'utilisateur n\'est pas authentifié');
        toast.error('Vous devez être connecté pour enregistrer un produit');
        setIsLoading(false);
        return;
      }
      
      console.log('Utilisateur authentifié:', auth.currentUser.email);
      
      // L'image est déjà téléchargée à ce stade grâce à handleFileSelect
      // Nous pouvons directement utiliser imageUrl
      
      if (imageUrl && !isValidUrl(imageUrl)) {
        toast.error('Veuillez entrer une URL d\'image valide commençant par http://, https:// ou blob:');
        setIsLoading(false);
        return;
      }

      // Vérification d'URL vidéo supprimée
      
      const productData: Partial<MarketingProduct> = {
        name,
        subtitle,
        description,
        category,
        active,
        imageUrl: imageUrl,
        videoUrl: videoUrl, // Ajout de l'URL de la vidéo
        showVideoButton, // Contrôle si le bouton vidéo doit être affiché
        features,
        buttonCTAs,
        createdBy: auth.currentUser.uid,
        updatedAt: new Date().toISOString()
      };
      
      console.log('Données du produit préparées pour enregistrement:', productData);
      console.log('URL vidéo à enregistrer:', videoUrl);
      
      // S'assurer que videoUrl est correctement géré
      if (videoUrl === undefined || videoUrl === '') {
        console.log('URL vidéo est vide ou undefined, mise à chaîne vide');
        productData.videoUrl = '';
      }
      
      const success = await onSave(productData);
      
      if (success) {
        console.log('Produit enregistré avec succès');
        toast.success(`Produit ${isEdit ? 'modifié' : 'ajouté'} avec succès`);
        onClose();
      } else {
        console.error('Echec de l\'enregistrement du produit');
        toast.error(`Erreur lors de ${isEdit ? 'la modification' : 'l\'ajout'} du produit`);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du produit:', error);
      console.error('Détails complets:', JSON.stringify(error, null, 2));
      toast.error(`Une erreur est survenue: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-indigo-800">
            {isEdit ? 'Modifier la fiche produit marketing' : 'Ajouter une nouvelle fiche produit marketing'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Nom du produit (H1) */}
            <div className="col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Titre principal (H1) *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isLoading}
                placeholder="Ex: SUNMI T3 PRO FAMILY"
              />
            </div>
            
            {/* Sous-titre (H2) */}
            <div className="col-span-2">
              <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-1">
                Sous-titre accroche (H2) *
              </label>
              <input
                type="text"
                id="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isLoading}
                placeholder="Ex: La solution de caisse complète pour tous les commerces"
              />
            </div>
            
            {/* Catégorie */}
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie *
              </label>
              <input
                type="text"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isLoading}
              />
            </div>
            

            
            {/* Statut */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                  Produit actif
                </label>
              </div>
            </div>
            
            {/* Description */}
            <div className="col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description détaillée *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isLoading}
                placeholder="Ex: Le terminal SUNMI T3 PRO FAMILY offre une solution de point de vente tout-en-un élégante et puissante..."
              ></textarea>
            </div>
            
            {/* Section vidéo supprimée pour une interface plus professionnelle */}
            
            {/* Caractéristiques */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Caractéristiques du produit
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Nouvelle caractéristique"
                  className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  disabled={isLoading || !newFeature.trim()}
                >
                  Ajouter
                </button>
              </div>
              
              {features.length > 0 && (
                <ul className="mt-2 space-y-1 border border-gray-200 rounded-md p-2 bg-gray-50">
                  {features.map((feature, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <span>{feature}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        disabled={isLoading}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* Image Upload et URL */}
            <div className="col-span-2">
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Image du produit {!isEdit && '*'}
              </label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    id="imageFile"
                    ref={imageInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    disabled={isLoading || isImageUploading}
                  >
                    <FiUpload />
                    <span>{isImageUploading ? 'Téléchargement...' : 'Télécharger une image'}</span>
                  </button>
                  <span className="text-sm text-gray-500">ou</span>
                  <input
                    type="url"
                    id="imageUrl"
                    value={imageUrl}
                    onChange={handleImageUrlChange}
                    placeholder="https://exemple.com/image.jpg"
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isLoading || isImageUploading}
                  />
                </div>
                
                {isImageUploading && (
                  <div className="mt-2">
                    <div className="text-sm text-blue-600 font-medium">
                      Téléchargement en cours...
                    </div>
                  </div>
                )}
                
                {imageFile && !isImageUploading && (
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-green-600">Image sélectionnée: {imageFile.name}</p>
                    {imageUrl && (
                      <button 
                        type="button" 
                        onClick={() => setImageFile(null)} 
                        className="text-xs text-red-500 hover:text-red-700"
                        disabled={isLoading}
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500 mb-2">Téléchargez une image (max. 5MB) ou entrez l'URL d'une image existante.</p>
              </div>
              
              {(imagePreviewUrl || imageUrl) && (
                <div className="mt-3">
                  <img 
                    src={imagePreviewUrl || imageUrl} 
                    alt="Prévisualisation" 
                    className="h-32 object-contain rounded-md border border-gray-300" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Image+non+disponible';
                      toast.error('URL d\'image invalide ou inaccessible');
                    }}
                  />
                  {imageFile && (
                    <p className="text-xs text-green-600 mt-1">
                      ✅ Prévisualisation locale active. Cette image sera visible dans l'interface admin.
                    </p>
                  )}
                  {!imageFile && imageUrl && imageUrl.includes('placehold.co') && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Image temporaire de substitution. Pour une meilleure qualité, rétéléchargez votre image.
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {/* Section pour l'upload de vidéo */}
            <div className="col-span-2 mt-4">
              <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Vidéo du produit (optionnel)
              </label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    id="videoFile"
                    ref={videoInputRef}
                    className="hidden"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center space-x-2"
                    disabled={isLoading || isVideoUploading}
                  >
                    <FiVideo />
                    <span>{isVideoUploading ? 'Téléchargement...' : 'Télécharger une vidéo'}</span>
                  </button>
                  <span className="text-sm text-gray-500">ou</span>
                  <input
                    type="url"
                    id="videoUrl"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://exemple.com/video.mp4"
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isLoading || isVideoUploading}
                  />
                </div>
                
                {isVideoUploading && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-purple-600 h-2.5 rounded-full" 
                        style={{width: `${videoUploadProgress}%`}}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {videoUploadProgress.toFixed(0)}%
                    </div>
                  </div>
                )}
                
                {videoFile && !isVideoUploading && (
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-green-600">Vidéo sélectionnée: {videoFile.name}</p>
                    <button 
                      type="button" 
                      onClick={() => setVideoFile(null)} 
                      className="text-xs text-red-500 hover:text-red-700"
                      disabled={isLoading}
                    >
                      Supprimer
                    </button>
                  </div>
                )}
                
                {videoUrl && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-600">
                        ✅ Vidéo téléchargée avec succès
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setVideoUrl('')} 
                        className="text-xs text-red-500 hover:text-red-700 flex items-center"
                        disabled={isLoading}
                      >
                        <span className="mr-1">Supprimer</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="border border-gray-300 rounded-md overflow-hidden">
                      <video 
                        controls 
                        className="w-full h-48 object-contain bg-black" 
                        src={videoUrl}
                      >
                        Votre navigateur ne prend pas en charge la lecture de vidéos HTML5.
                      </video>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mb-2">Téléchargez une vidéo (max. 100MB) ou entrez l'URL d'une vidéo existante.</p>
                
                {/* Option pour afficher/masquer le bouton vidéo */}
                <div className="mt-3 flex items-center">
                  <input
                    type="checkbox"
                    id="showVideoButton"
                    checked={showVideoButton}
                    onChange={(e) => setShowVideoButton(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    disabled={isLoading || !videoUrl}
                  />
                  <label htmlFor="showVideoButton" className="ml-2 block text-sm text-gray-700">
                    Afficher le bouton "Voir la vidéo" sur la page produit
                  </label>
                </div>
                {!videoUrl && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Vous devez d'abord ajouter une URL de vidéo pour activer cette option
                  </p>
                )}
              </div>
            </div>
            

            
            {/* Boutons CTA */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Boutons d'action (CTA)
              </label>
              
              {/* Options de boutons prédéfinis */}
              <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Boutons prédéfinis</h4>
                
                {/* Option pour le bouton Demander un devis */}
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="showQuoteButton"
                    checked={buttonCTAs.some(b => b.label === "Demander un devis")}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setButtonCTAs([...buttonCTAs, {
                          label: "Demander un devis",
                          url: "/contact",
                          type: "primary"
                        }]);
                      } else {
                        setButtonCTAs(buttonCTAs.filter(b => b.label !== "Demander un devis"));
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    disabled={isLoading}
                  />
                  <label htmlFor="showQuoteButton" className="ml-2 block text-sm text-gray-700">
                    Afficher le bouton "Demander un devis"
                  </label>
                </div>
                
                {/* Option pour le bouton Voir la vidéo (liée à l'option vidéo) */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="addVideoButtonCTA"
                    checked={showVideoButton && videoUrl !== ""}
                    onChange={(e) => {
                      setShowVideoButton(e.target.checked);
                      if (!videoUrl && e.target.checked) {
                        toast.error("Ajoutez une URL vidéo pour activer cette fonctionnalité");
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    disabled={isLoading || !videoUrl}
                  />
                  <label htmlFor="addVideoButtonCTA" className="ml-2 block text-sm text-gray-700">
                    Afficher le bouton "Voir la vidéo"
                  </label>
                </div>
                {!videoUrl && (
                  <p className="text-xs text-amber-600 mt-1 ml-6">
                    ⚠️ Vous devez d'abord ajouter une URL de vidéo dans la section vidéo
                  </p>
                )}
              </div>
              


            </div>
          </div>
          
          {/* Prévisualisation du produit */}
          {(name || subtitle || description || imageUrl) && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-indigo-800 mb-4">
                Prévisualisation de la fiche produit
              </h3>
              
              <div className="bg-gray-900 text-white p-6 rounded-lg overflow-hidden">
                <div className="flex flex-col lg:flex-row gap-6 items-center">
                  {/* Image du produit */}
                  <div className="lg:w-1/2 flex justify-center">
                    {(imagePreviewUrl || imageUrl) ? (
                      <img 
                        src={imagePreviewUrl || imageUrl} 
                        alt={name} 
                        className="max-h-96 object-contain rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/EEE/31343C?text=Image+non+disponible';
                        }}
                      />
                    ) : (
                      <div className="bg-gray-800 w-full h-64 rounded-lg flex items-center justify-center text-gray-400">
                        <span>Image du produit</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Description du produit */}
                  <div className="lg:w-1/2">
                    <h1 className="text-3xl font-bold">{name || 'Titre principal du produit'}</h1>
                    <h2 className="text-xl font-medium text-yellow-500 mt-2">{subtitle || 'Sous-titre accroche du produit'}</h2>
                    
                    <div className="mt-4 text-gray-300">
                      {description || 'Description détaillée du produit...'}
                    </div>
                    
                    {/* Affichage des caractéristiques */}
                    {features.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">Caractéristiques:</h3>
                        <ul className="list-disc pl-5 text-gray-300 space-y-1">
                          {features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Affichage des boutons CTA */}
                    {buttonCTAs.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-3">
                        {buttonCTAs.map((button, index) => (
                          <div 
                            key={index}
                            className={`px-4 py-2 rounded-md text-sm font-medium cursor-pointer ${
                              button.type === 'primary'
                                ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400'
                                : 'bg-transparent text-white border border-white hover:bg-white hover:text-gray-900'
                            } transition-colors`}
                          >
                            {button.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end pt-4 border-t border-gray-200 mt-6">
            {/* Le bouton de test temporaire a été supprimé pour la production */}
            
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
              disabled={isLoading}
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isEdit ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModalSimple;
