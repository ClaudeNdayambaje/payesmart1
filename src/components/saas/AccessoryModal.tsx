import React, { useState, useEffect, useRef } from 'react';
import { Accessory } from '../../services/accessoiresService';
import { toast } from 'react-hot-toast';
import { uploadProductVideoViaCloud, VideoUploadResult } from "../../services/productVideoCloudService";
import { uploadProductImageViaCloud } from "../../services/productImageCloudService";
import { FiUpload, FiVideo, FiEdit } from 'react-icons/fi';
import { getMarketingCategories } from '../../services/marketingCategoryService';
import { Category } from '../../types';
import CategoriesManager from './CategoriesManager';

interface AccessoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (accessory: Partial<Accessory>) => Promise<boolean>;
  accessory: Accessory | null;
  isEdit: boolean;
}

const AccessoryModal: React.FC<AccessoryModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  accessory, 
  isEdit 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [active, setActive] = useState(true);
  const [availability, setAvailability] = useState(true);
  const [imageUrl, setImageUrl] = useState<string>(accessory?.imageUrl || "");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [isImageUploading, setIsImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // États pour la vidéo
  const [videoUrl, setVideoUrl] = useState<string>(accessory?.videoUrl || "");
  // État pour le fichier vidéo sélectionné
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [showVideoButton, setShowVideoButton] = useState<boolean>(accessory?.showVideoButton !== false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // États pour la gestion des catégories
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

  // Fonction pour valider les URLs
  const isValidUrl = (url: string): boolean => {
    // Valider aussi les URLs blob: pour les prévisualisations locales
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:');
  };

  // Charger les catégories au montage du composant
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);
  
  // Fonction pour récupérer les catégories spécifiques aux accessoires marketing
  const fetchCategories = async () => {
    setIsCategoriesLoading(true);
    try {
      const fetchedCategories = await getMarketingCategories();
      console.log("📋 Catégories marketing récupérées:", fetchedCategories.length);
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des catégories marketing:", error);
      toast.error("Erreur lors du chargement des catégories");
    } finally {
      setIsCategoriesLoading(false);
    }
  };
  
  // Gérer la sélection d'une catégorie depuis le gestionnaire
  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    toast.success(`Catégorie "${selectedCategory}" sélectionnée`);
  };
  
  // Initialiser les champs avec les valeurs de l'accessoire en cas d'édition
  useEffect(() => {
    console.log("🔍 Initialisation du modal", { isOpen, isEdit });
    
    if (accessory && isEdit) {
      console.log("📝 Édition de l'accessoire:", accessory.id);
      console.log("Image URL initiale:", accessory.imageUrl);
      
      setName(accessory.name || '');
      setDescription(accessory.description || '');
      setCategory(accessory.category || '');
      setPrice(accessory.price || 0);
      setStock(accessory.stock || 0);
      setActive(accessory.active !== false);
      setAvailability(accessory.availability !== false);
      
      // Définir l'URL de l'image pour le stockage et la prévisualisation
      const accessoryImageUrl = accessory.imageUrl || '';
      
      // Ajouter un timestamp pour éviter le cache du navigateur
      const freshImageUrl = accessoryImageUrl && !accessoryImageUrl.includes('placehold.co') ?
        `${accessoryImageUrl}${accessoryImageUrl.includes('?') ? '&' : '?'}t=${Date.now()}` :
        accessoryImageUrl;
        
      console.log("🖼️ URL d'image fraîche:", freshImageUrl);
      
      setImageUrl(freshImageUrl);
      
      // Toujours montrer l'image existante dans la prévisualisation
      if (freshImageUrl && !freshImageUrl.includes('placehold.co')) {
        console.log("🟢 Configuration de l'image de prévisualisation");
        setImagePreviewUrl(freshImageUrl);
      } else {
        setImagePreviewUrl('');
        console.log("🔴 Pas d'image de prévisualisation disponible");
      }
      
      // Réinitialiser les états de téléchargement pour permettre une nouvelle modification
      setIsImageUploading(false);
      setIsVideoUploading(false);
      
      // Définir l'URL de la vidéo pour le stockage
      const accessoryVideoUrl = accessory.videoUrl || '';
      setVideoUrl(accessoryVideoUrl);
      
      setFeatures(accessory.features || []);
    } else {
      // Réinitialiser le formulaire pour un nouvel accessoire
      setName('');
      setDescription('');
      setCategory('');
      setPrice(0);
      setStock(0);
      setActive(true);
      setAvailability(true);
      setImageUrl('');
      setImagePreviewUrl('');
      setVideoUrl('');
      setFeatures([]);
      
      // Réinitialiser les états de téléchargement
      setIsImageUploading(false);
      setIsVideoUploading(false);
      
      // Réinitialiser les champs de fichier
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
      
      console.log("🧹 Formulaire complètement réinitialisé");
    }
  }, [accessory, isEdit, isOpen]);

  if (!isOpen) return null;

  // Gérer le champ d'URL d'image
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    if (isValidUrl(e.target.value)) {
      setImagePreviewUrl(e.target.value);
    }
  };

  // Gérer la sélection et le téléchargement de l'image
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("🖼️ Fonction handleImageFileChange appelée");
    
    // On annule d'abord tout toast en cours pour éviter les interférences
    toast.dismiss('imageUpload');
    
    if (!e.target.files || e.target.files.length === 0) {
      console.log("❌ Aucun fichier sélectionné");
      return;
    }

    const file = e.target.files[0];
    console.log(`📄 Fichier sélectionné: ${file.name}, type: ${file.type}, taille: ${(file.size / 1024).toFixed(2)}KB`);
    
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (file.size > maxSize) {
      toast.error(`Fichier trop volumineux. Maximum: 5MB, Actuel: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      console.log(`❌ Fichier trop volumineux: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      // Réinitialiser l'input file pour permettre une nouvelle sélection du même fichier
      if (imageInputRef.current) imageInputRef.current.value = '';
      return;
    }

    // Vérifier le type MIME
    if (!file.type.startsWith('image/')) {
      toast.error(`Format de fichier non pris en charge: ${file.type}`);
      console.log(`❌ Format non supporté: ${file.type}`);
      // Réinitialiser l'input file
      if (imageInputRef.current) imageInputRef.current.value = '';
      return;
    }

    setIsImageUploading(true);

    try {
      // Créer une URL de prévisualisation locale
      console.log("🔍 Création de la prévisualisation locale...");
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreviewUrl(e.target.result as string);
          console.log("✅ Prévisualisation créée avec succès");
        }
      };
      reader.readAsDataURL(file);

      // Préparer l'upload
      const toastId = 'imageUpload-' + Date.now(); // ID unique pour chaque upload
      toast.loading("Téléchargement de l'image en cours...", { id: toastId });
      console.log("☁️ Début du téléchargement vers Firebase Storage...");

      // Télécharger vers Firebase Storage
      const result = await uploadProductImageViaCloud(file, {
        onProgress: (progress: number) => {
          console.log(`📊 Progression de l'upload: ${progress}%`);
        }
      });

      if (result && result.imageUrl) {
        // Mise à jour de l'URL de l'image
        console.log(`✅ Image téléchargée avec succès. URL: ${result.imageUrl.substring(0, 50)}...`);
        setImageUrl(result.imageUrl);
        toast.success("Image téléchargée avec succès", { id: toastId });
      } else {
        throw new Error('URL de l\'image non reçue après upload');
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du téléchargement de l\'image:', error);
      const errorMessage = error.message || 'Erreur inconnue';
      toast.error(`Erreur: ${errorMessage}`, { id: 'imageUpload-error' });
      
      // Si l'erreur concerne une URL déjà utilisée ou une duplication
      if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        console.log("⚠️ Tentative de résolution du conflit de duplication...");
        toast.error("Cette image existe déjà, essayez d'en choisir une autre ou de renommer le fichier", { duration: 5000 });
      }
    } finally {
      setIsImageUploading(false);
      // Réinitialiser l'input file pour permettre une nouvelle sélection du même fichier
      setTimeout(() => {
        if (imageInputRef.current) {
          imageInputRef.current.value = '';
          console.log("🔄 Input file réinitialisé pour permettre une nouvelle sélection");
        }
      }, 100); // Petit délai pour s'assurer que le navigateur a bien terminé son traitement
    }
  };

  // Gérer la sélection et le téléchargement de la vidéo
  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validation du type et de la taille
    if (!file.type.startsWith('video/')) {
      toast.error('Veuillez sélectionner une vidéo valide (MP4, WebM)');
      return;
    }
    
    if (file.size > 100 * 1024 * 1024) {
      toast.error('La vidéo est trop volumineuse (maximum 100 Mo)');
      return;
    }
    
    setIsVideoUploading(true);
    setVideoUploadProgress(0);
    
    toast.loading('Téléchargement de la vidéo en cours...', { id: 'videoUpload' });
    
    try {
      // Préparation pour le téléchargement de la vidéo
      
      uploadProductVideoViaCloud(file, { 
        onProgress: (progress: number) => setVideoUploadProgress(progress) 
      })
        .then((result: VideoUploadResult) => {
          if (result.videoUrl) {
            setVideoUrl(result.videoUrl);
            toast.success('Vidéo téléchargée avec succès !', { id: 'videoUpload' });
          } else {
            toast.error('URL de vidéo non disponible', { id: 'videoUpload' });
          }
        })
        .catch((error) => {
          console.error('Erreur lors du téléchargement de la vidéo:', error);
          toast.error('Erreur lors du téléchargement de la vidéo', { id: 'videoUpload' });
        })
        .finally(() => {
          setIsVideoUploading(false);
          setVideoUploadProgress(0);
        });
    } catch (error) {
      console.error('Erreur lors du téléchargement de la vidéo:', error);
      toast.error('Erreur lors du téléchargement de la vidéo', { id: 'videoUpload' });
    } finally {
      setIsVideoUploading(false);
      setVideoUploadProgress(0);
    }
  };

  // Gestionnaires pour les caractéristiques
  const handleAddFeature = () => {
    if (newFeature.trim() !== '') {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };
  
  // Gérer l'ouverture du gestionnaire de catégories
  const openCategoriesManager = () => {
    setIsCategoriesModalOpen(true);
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Annuler tous les toasts en cours pour éviter les interférences
    toast.dismiss();
    
    // Validation des champs obligatoires
    if (!name.trim()) {
      toast.error('Le nom de l\'accessoire est requis');
      setIsLoading(false);
      return;
    }
    
    if (!description.trim()) {
      toast.error('La description de l\'accessoire est requise');
      setIsLoading(false);
      return;
    }
    
    if (!category.trim()) {
      toast.error('La catégorie de l\'accessoire est requise');
      setIsLoading(false);
      return;
    }
    
    if (!imageUrl) {
      toast.error('Une image est requise pour l\'accessoire');
      setIsLoading(false);
      return;
    }
    
    console.log("💾 Sauvegarde de l'accessoire avec l'URL d'image:", imageUrl);
    
    // Construire l'objet accessoire à enregistrer
    const accessoryData: Partial<Accessory> = {
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      price: parseFloat(price.toString()) || 0,
      stock: parseInt(stock.toString()) || 0,
      features: features,
      imageUrl: imageUrl,
      videoUrl: videoUrl || undefined,
      showVideoButton: videoUrl ? showVideoButton : undefined,
      active: active,
      availability: availability,
      updatedAt: new Date().toISOString(),
    };
    
    // Si c'est un nouvel accessoire, ajouter la date de création et l'utilisateur
    if (!isEdit) {
      accessoryData.createdAt = new Date().toISOString();
      // Si l'authentification utilisateur est disponible, on peut ajouter l'ID utilisateur
      // accessoryData.createdBy = currentUser?.uid;
    }
    
    // En cas d'édition, conserver l'ID
    if (isEdit && accessory) {
      accessoryData.id = accessory.id;
      console.log("✏️ Édition de l'accessoire ID:", accessory.id);
    }
    
    try {
      // Enregistrer l'accessoire
      console.log("🚀 Tentative de sauvegarde de l'accessoire:", accessoryData);
      const success = await onSave(accessoryData);
      
      if (success) {
        toast.success(isEdit ? 'Accessoire mis à jour avec succès !' : 'Nouvel accessoire ajouté !');
        // Attendre un instant pour s'assurer que la mise à jour a bien été enregistrée
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        toast.error('Erreur lors de l\'enregistrement de l\'accessoire');
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'enregistrement de l\'accessoire:', error);
      toast.error(`Erreur: ${error?.message || 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{isEdit ? 'Modifier l\'accessoire' : 'Ajouter un nouvel accessoire'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Informations de base */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Nom *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Nom de l'accessoire"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-1">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-32"
                  placeholder="Description détaillée de l'accessoire"
                  required
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Catégorie</label>
                <div className="flex">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-l-md bg-gray-700 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    disabled={isCategoriesLoading}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((cat) => {
                      // Assurons-nous que cat.name est bien une chaîne de caractères
                      const categoryName = typeof cat.name === 'string' ? cat.name : '';
                      return (
                        <option key={cat.id} value={categoryName}>{categoryName}</option>
                      );
                    })}
                  </select>
                  <button
                    type="button"
                    onClick={openCategoriesManager}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 transition-colors"
                    title="Gérer les catégories"
                  >
                    <FiEdit size={16} />
                  </button>
                </div>
                {isCategoriesLoading && (
                  <div className="mt-1 text-xs text-gray-400">
                    Chargement des catégories...
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Prix (€) *</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Stock</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min="0"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Actif</span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={availability}
                      onChange={(e) => setAvailability(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Disponible</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Image et Vidéo */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Image *</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={handleImageUrlChange}
                    className="flex-grow border border-gray-300 rounded-md px-3 py-2"
                    placeholder="URL de l'image"
                  />
                  <span className="text-gray-500 font-medium">ou</span>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md flex items-center"
                    disabled={isImageUploading}
                  >
                    <FiUpload className="mr-1" />
                    {isImageUploading ? 'Téléchargement...' : 'Parcourir'}
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </div>
                
                {imagePreviewUrl && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-500 mb-1">Aperçu :</p>
                    <div className="relative w-full max-w-xs">
                      <img
                        src={imagePreviewUrl}
                        alt="Aperçu"
                        className="w-full h-auto rounded-md border border-gray-200 object-contain"
                        style={{ maxHeight: '200px' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/EEE/31343C?text=Image+non+disponible';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-1">Vidéo (optionnelle)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="flex-grow border border-gray-300 rounded-md px-3 py-2"
                    placeholder="URL de la vidéo"
                  />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md flex items-center"
                    disabled={isVideoUploading}
                  >
                    <FiVideo className="mr-1" />
                    {isVideoUploading ? `${videoUploadProgress}%` : 'Parcourir'}
                  </button>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    className="hidden"
                  />
                </div>
                
                {videoUrl && (
                  <label className="flex items-center mt-2 space-x-2">
                    <input
                      type="checkbox"
                      checked={showVideoButton}
                      onChange={(e) => setShowVideoButton(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Afficher le bouton vidéo</span>
                  </label>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-1">Caractéristiques</label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    className="flex-grow border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Ajouter une caractéristique"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
                  >
                    Ajouter
                  </button>
                </div>
                
                {features.length > 0 && (
                  <ul className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {features.map((feature, index) => (
                      <li key={index} className="flex justify-between items-center py-1">
                        <span>{feature}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          
          {/* Prévisualisation de l'accessoire */}
          <div className="border-t border-gray-200 pt-4 mt-6">
            <h3 className="text-lg font-semibold mb-3">Aperçu de l'accessoire</h3>
            
            <div className="bg-gray-900 text-white p-6 rounded-lg">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Image de l'accessoire */}
                <div className="lg:w-1/2 flex items-center justify-center">
                  {imagePreviewUrl ? (
                    <img
                      src={imagePreviewUrl}
                      alt={name || 'Accessoire'}
                      className="max-h-96 object-contain rounded-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/EEE/31343C?text=Image+non+disponible';
                      }}
                    />
                  ) : (
                    <div className="bg-gray-800 w-full h-64 rounded-lg flex items-center justify-center text-gray-400">
                      <span>Image de l'accessoire</span>
                    </div>
                  )}
                </div>
                
                {/* Description de l'accessoire */}
                <div className="lg:w-1/2">
                  <h1 className="text-3xl font-bold">{name || 'Nom de l\'accessoire'}</h1>
                  <div className="mt-2 flex items-center">
                    <span className="bg-yellow-500 text-gray-900 px-2 py-1 rounded text-sm font-medium">{category || 'Catégorie'}</span>
                    <span className="ml-2 text-xl font-bold text-yellow-500">{price} €</span>
                  </div>
                  
                  <div className="mt-4 text-gray-300">
                    {description || 'Description détaillée de l\'accessoire...'}
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
                  
                  {/* Status de disponibilité */}
                  <div className="mt-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm ${availability ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                      {availability ? 'Disponible' : 'Indisponible'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t border-gray-200 mt-6">
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
      
      {/* Modal de gestion des catégories */}
      <CategoriesManager
        isOpen={isCategoriesModalOpen}
        onClose={() => {
          setIsCategoriesModalOpen(false);
          // Recharger les catégories après la fermeture du gestionnaire
          fetchCategories();
        }}
        onCategorySelect={handleCategorySelect}
      />
    </div>
  );
};

export default AccessoryModal;
