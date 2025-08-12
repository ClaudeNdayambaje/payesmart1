// Wrapper pour axios qui fonctionne à la fois en développement et en production
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Vérifier si nous sommes dans un environnement navigateur
const isBrowser = typeof window !== 'undefined';

// Interface pour les réponses d'axios simulées
interface MockAxiosResponse<T = any> {
  data: T;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  config?: AxiosRequestConfig;
}

// Création d'un mock d'axios typé
const createMockAxios = (): AxiosInstance => {
  const mockAxios = {
    get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
      console.warn('[Mock Axios] GET:', url);
      return { data: {} as T, status: 200, statusText: 'OK', headers: {}, config } as AxiosResponse<T>;
    },
    post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
      console.warn('[Mock Axios] POST:', url, data);
      return { data: {} as T, status: 200, statusText: 'OK', headers: {}, config } as AxiosResponse<T>;
    },
    request: async <T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
      console.warn('[Mock Axios] Request:', config);
      return { data: {} as T, status: 200, statusText: 'OK', headers: {}, config } as AxiosResponse<T>;
    },
    create: (config?: AxiosRequestConfig): AxiosInstance => {
      console.warn('[Mock Axios] Create with config:', config);
      return mockAxios;
    },
    defaults: {
      headers: {
        common: {}
      }
    },
    interceptors: {
      request: {
        use: () => 0,
        eject: () => {}
      },
      response: {
        use: () => 0,
        eject: () => {}
      }
    }
  } as unknown as AxiosInstance;
  
  return mockAxios;
};

// Fonction pour obtenir axios - soit depuis le module importé, soit depuis le CDN global
const getAxios = (): AxiosInstance => {
  // Si axios est disponible globalement (depuis le CDN)
  if (isBrowser && window.axios) {
    return window.axios;
  }

  // Sinon, essayer d'importer le module normalement
  try {
    // @ts-ignore - L'importation dynamique est utilisée pour la compatibilité ESM
    const axiosModule = require('axios');
    return axiosModule.default || axiosModule;
  } catch (error) {
    console.error('Erreur lors de l\'importation d\'axios:', error);
    return createMockAxios();
  }
};

// Exporter l'instance axios obtenue
const axiosInstance = getAxios();
export default axiosInstance;

// Déclarer le type global pour window.axios
declare global {
  interface Window {
    axios: AxiosInstance;
  }
}
