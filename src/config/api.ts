import Cookies from 'js-cookie';

// Types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type RequestOptions = {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  isFormData?: boolean;
  skipAuth?: boolean; // Pour les requêtes qui n'ont pas besoin d'auth
  skipTokenRefresh?: boolean; // Pour éviter les boucles infinies lors du refresh
};

type AuthTokens = {
  access: string;
  refresh: string;
};

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const TOKEN_COOKIE_NAME = 'authTokens';
const REFRESH_ENDPOINT = '/api/token/refresh/';
const LOGIN_URL = '/auth/login';

// Variable pour éviter les multiples refresh simultanés
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

/**
 * Traite la queue des requêtes en attente après refresh du token
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

/**
 * Construit une URL complète à partir d'un endpoint
 */
const buildUrl = (endpoint: string, params?: Record<string, any>): string => {
  let url = `${API_BASE_URL}${endpoint}`.replace(/([^:]\/)\/+/g, '$1');
  
  // Ajout des paramètres de requête
  if (params) {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => queryString.append(key, String(item)));
        } else {
          queryString.append(key, String(value));
        }
      }
    });
    
    const query = queryString.toString();
    if (query) {
      url += (url.includes('?') ? '&' : '?') + query;
    }
  }
  
  return url;
};

/**
 * Récupère les tokens d'authentification depuis les cookies
 */
const getAuthTokens = (): AuthTokens | null => {
  try {
    const tokens = Cookies.get(TOKEN_COOKIE_NAME);
    return tokens ? JSON.parse(tokens) : null;
  } catch (error) {
    console.error('Erreur lors de la récupération des tokens:', error);
    return null;
  }
};

/**
 * Sauvegarde les tokens d'authentification dans les cookies
 */
const setAuthTokens = (tokens: AuthTokens | null) => {
  if (tokens) {
    Cookies.set(TOKEN_COOKIE_NAME, JSON.stringify(tokens), {
      expires: 7, // 7 jours
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
  } else {
    Cookies.remove(TOKEN_COOKIE_NAME);
  }
};

/**
 * Refresh le token d'accès
 */
const refreshAccessToken = async (): Promise<string> => {
  const tokens = getAuthTokens();
  
  if (!tokens?.refresh) {
    throw new Error('Aucun refresh token disponible');
  }

  try {
    const response = await fetch(buildUrl(REFRESH_ENDPOINT), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ refresh: tokens.refresh }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Erreur refresh token: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.access) {
      throw new Error('Nouveau token d\'accès non reçu');
    }

    // Mettre à jour les tokens
    const newTokens = { ...tokens, access: data.access };
    setAuthTokens(newTokens);
    
    return data.access;
  } catch (error) {
    console.error('Erreur lors du refresh du token:', error);
    // Nettoyer les tokens invalides
    setAuthTokens(null);
    throw error;
  }
};

/**
 * Gère la déconnexion automatique
 */
const handleLogout = () => {
  setAuthTokens(null);
  
  // Redirection vers la page de login
  if (typeof window !== 'undefined') {
    window.location.href = LOGIN_URL;
  }
};

/**
 * Effectue une requête HTTP générique avec gestion automatique des tokens
 */
const fetchApi = async <T = any>(
  method: HttpMethod,
  endpoint: string,
  options: RequestOptions = {}
): Promise<{ data: T; status: number; headers: Headers }> => {
  const { 
    headers = {}, 
    params, 
    data, 
    isFormData = false, 
    skipAuth = false,
    skipTokenRefresh = false 
  } = options;
  
  // Configuration de base de la requête
  const config: RequestInit = {
    method,
    headers: {
      'Accept': 'application/json',
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...headers,
    },
    credentials: 'include',
  };

  // Ajout du token d'authentification si nécessaire
  if (!skipAuth) {
    const tokens = getAuthTokens();
    if (tokens?.access) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${tokens.access}`,
      };
    }
  }

  // Ajout du corps de la requête si nécessaire
  if (method !== 'GET' && data) {
    config.body = isFormData ? data : JSON.stringify(data);
  }

  const url = buildUrl(endpoint, method === 'GET' ? params : undefined);
  
  try {
    const response = await fetch(url, config);
    
    // Gestion de la réponse
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json().catch(() => ({}));
    } else {
      responseData = await response.text();
    }

    // Gestion des erreurs 401 (non autorisé)
    if (response.status === 401 && !skipAuth && !skipTokenRefresh) {
      return handleUnauthorized(method, endpoint, options);
    }

    if (!response.ok) {
      const error = new Error(responseData.message || `Erreur HTTP: ${response.status}`);
      (error as any).status = response.status;
      (error as any).response = { data: responseData, status: response.status };
      throw error;
    }

    return {
      data: responseData,
      status: response.status,
      headers: response.headers,
    };
  } catch (error) {
    // Si c'est une erreur 401 et qu'on n'est pas déjà en train de refresh
    if ((error as any).status === 401 && !skipAuth && !skipTokenRefresh) {
      return handleUnauthorized(method, endpoint, options);
    }
    
    console.error(`Erreur lors de la requête ${method} ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Gère les erreurs 401 avec refresh automatique du token
 */
const handleUnauthorized = async <T = any>(
  method: HttpMethod,
  endpoint: string,
  options: RequestOptions = {}
): Promise<{ data: T; status: number; headers: Headers }> => {
  
  // Si on est déjà en train de refresh, on met cette requête en queue
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then(() => {
      // Retry la requête avec le nouveau token
      return fetchApi<T>(method, endpoint, { ...options, skipTokenRefresh: true });
    });
  }

  isRefreshing = true;

  try {
    // Tenter de refresh le token
    const newAccessToken = await refreshAccessToken();
    
    // Traiter la queue des requêtes en attente
    processQueue(null, newAccessToken);
    
    // Retry la requête originale avec le nouveau token
    return await fetchApi<T>(method, endpoint, { ...options, skipTokenRefresh: true });
    
  } catch (refreshError) {
    // Le refresh a échoué, traiter la queue et déconnecter
    processQueue(refreshError, null);
    
    console.error('Session expirée, redirection vers la page de connexion');
    handleLogout();
    
    throw new Error('Session expirée, veuillez vous reconnecter');
  } finally {
    isRefreshing = false;
  }
};

// Méthodes HTTP prédéfinies avec gestion automatique des tokens
export const api = {
  // Méthodes standards
  get: <T = any>(endpoint: string, params?: any, options: Omit<RequestOptions, 'data' | 'isFormData'> = {}) =>
    fetchApi<T>('GET', endpoint, { ...options, params }),
    
  post: <T = any>(endpoint: string, data?: any, options: Omit<RequestOptions, 'data'> = {}) =>
    fetchApi<T>('POST', endpoint, { ...options, data }),
    
  put: <T = any>(endpoint: string, data?: any, options: Omit<RequestOptions, 'data'> = {}) =>
    fetchApi<T>('PUT', endpoint, { ...options, data }),
    
  patch: <T = any>(endpoint: string, data?: any, options: Omit<RequestOptions, 'data'> = {}) =>
    fetchApi<T>('PATCH', endpoint, { ...options, data }),
    
  delete: <T = any>(endpoint: string, options: Omit<RequestOptions, 'data'> = {}) =>
    fetchApi<T>('DELETE', endpoint, options),
    
  // Méthode pour les uploads de fichiers
  upload: <T = any>(endpoint: string, formData: FormData, options: Omit<RequestOptions, 'data' | 'isFormData'> = {}) =>
    fetchApi<T>('POST', endpoint, { data: formData, isFormData: true, ...options }),

  // Méthodes utilitaires pour la gestion des tokens
  auth: {
    /**
     * Défini les tokens d'authentification
     */
    setTokens: (tokens: AuthTokens) => {
      setAuthTokens(tokens);
    },

    /**
     * Récupère les tokens actuels
     */
    getTokens: (): AuthTokens | null => {
      return getAuthTokens();
    },

    /**
     * Supprime les tokens et déconnecte l'utilisateur
     */
    logout: () => {
      handleLogout();
    },

    /**
     * Vérifie si l'utilisateur est connecté
     */
    isAuthenticated: (): boolean => {
      const tokens = getAuthTokens();
      return !!(tokens?.access && tokens?.refresh);
    },

    /**
     * Force le refresh du token
     */
    refreshToken: async (): Promise<string> => {
      return await refreshAccessToken();
    }
  }
};

// Export par défaut
export default api;