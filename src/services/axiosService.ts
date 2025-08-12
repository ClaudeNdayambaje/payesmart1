import axios from 'axios';

// Créer une instance Axios avec une configuration de base
const axiosInstance = axios.create({
  timeout: 30000, // 30 secondes
  headers: {
    'Content-Type': 'application/json',
  }
});

// Intercepteur pour les requêtes
axiosInstance.interceptors.request.use(
  (config) => {
    // Vous pouvez ajouter des en-têtes communs ici si nécessaire
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Gérer les erreurs de réponse ici
    console.error('Erreur Axios:', error);
    return Promise.reject(error);
  }
);

// Exporter l'instance pour l'utiliser dans toute l'application
export default axiosInstance;

// Exporter les méthodes courantes pour faciliter l'utilisation
export const get = async (url: string, params = {}) => {
  try {
    const response = await axiosInstance.get(url, { params });
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la requête GET à ${url}:`, error);
    throw error;
  }
};

export const post = async (url: string, data = {}) => {
  try {
    const response = await axiosInstance.post(url, data);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la requête POST à ${url}:`, error);
    throw error;
  }
};

export const put = async (url: string, data = {}) => {
  try {
    const response = await axiosInstance.put(url, data);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la requête PUT à ${url}:`, error);
    throw error;
  }
};

export const del = async (url: string) => {
  try {
    const response = await axiosInstance.delete(url);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la requête DELETE à ${url}:`, error);
    throw error;
  }
};
