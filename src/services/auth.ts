import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { Agent } from 'https';

// Modifier l'interface DetailedError pour étendre AxiosError
interface DetailedError extends AxiosError {
  name: string;
  message: string;
  code?: string;
  response?: {
    status: number;
    statusText: string;
    data: unknown;
    headers: import('axios').AxiosResponseHeaders;
    config: import('axios').InternalAxiosRequestConfig;
    request?: {
      _client?: {
        ssl?: {
          getPeerCertificate?: () => {
            valid_from?: string;
            valid_to?: string;
          };
        };
      };
    };
  };
  config?: import('axios').InternalAxiosRequestConfig;
}

const API_BASE_URL = 'https://www.backend.lnb-intranet.globalitnet.org';

// Nouvelle fonction pour vérifier et rafraîchir automatiquement le token
export const getValidToken = async () => {
  try {
    const authTokens = Cookies.get('authTokens');
    if (!authTokens) throw new Error('Aucun token disponible');

    const parsedTokens = JSON.parse(authTokens);
    
    // Si le token est expiré, on tente de le rafraîchir
    if (isAccessTokenExpired()) {
      console.log('Token expiré, tentative de rafraîchissement...');
      const newAccessToken = await refreshAccessToken();
      return newAccessToken;
    }

    return parsedTokens.access;
  } catch (error) {
    console.error('Erreur lors de la récupération du token:', error);
    // Si une erreur survient pendant le refresh, on déconnecte l'utilisateur
    logoutUser();
    throw error;
  }
};

// Modifier la fonction fetchAPI pour utiliser getValidToken
const fetchAPI = async (endpoint: string, method: string, body?: object) => {
  try {
    const token = await getValidToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Erreur lors de la requête.');

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
};

// **Connexion de l'utilisateur**
export const loginUser = async (credentials: { identifier: string; password: string }) => {
  try {
    console.log('🔑 Tentative de connexion:', {
      username: credentials.identifier,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });

    const axiosInstance = axios.create({
      httpsAgent: new Agent({
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      })
    });

    console.log('📡 Envoi requête vers:', `${API_BASE_URL}/api/token/`);
    
    const response = await axiosInstance.post(`${API_BASE_URL}/api/token/`, {
      username: credentials.identifier,
      password: credentials.password,
    });

    console.log('📥 Réponse reçue:', {
      status: response.status,
      headers: response.headers,
      hasData: !!response.data,
      tokens: {
        hasAccess: !!response.data?.access,
        hasRefresh: !!response.data?.refresh
      }
    });

    const { data } = response;

    if (data.access && data.refresh) {
      console.log('✅ Tokens valides reçus');
      
      // Calculer la date d'expiration pour les cookies
      const accessExpirationDate = new Date();
      accessExpirationDate.setHours(accessExpirationDate.getHours() + 23);
      
      console.log('⏰ Dates d\'expiration:', {
        calculée: accessExpirationDate.toISOString(),
        tempsRestant: `${accessExpirationDate.getTime() - Date.now()}ms`
      });

      // Stocker les tokens dans un cookie
      const tokenData = {
        access: data.access,
        refresh: data.refresh,
        expiresAt: accessExpirationDate.toISOString()
      };

      console.log('💾 Stockage des tokens dans les cookies');
      Cookies.set('authTokens', JSON.stringify(tokenData), { expires: 1, path: '/' });
      Cookies.set('accessTokenExpiration', accessExpirationDate.toISOString(), { expires: 1, path: '/' });

      // Vérification du stockage
      const storedTokens = Cookies.get('authTokens');
      const storedExpiration = Cookies.get('accessTokenExpiration');
      
      console.log('🔍 Vérification du stockage:', {
        tokensStockés: !!storedTokens,
        expirationStockée: !!storedExpiration,
        cookiesDisponibles: document.cookie.length > 0
      });

      return { success: true };
    }

    console.log('❌ Échec de connexion: tokens manquants dans la réponse');
    return { success: false, error: 'Identifiants invalides' };

  } catch (error: unknown) {
    const typedError = error as DetailedError;
    console.error('💥 Erreur détaillée:', {
      name: typedError.name,
      message: typedError.message,
      code: typedError.code,
      response: {
        status: typedError.response?.status,
        statusText: typedError.response?.statusText,
        data: typedError.response?.data,
        headers: typedError.response?.headers
      },
      request: {
        url: typedError.config?.url,
        method: typedError.config?.method,
        headers: typedError.config?.headers
      },
      certificat: typedError.response?.request?._client?.ssl?.getPeerCertificate?.() || 'Non disponible',
      systeme: {
        date: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        offset: new Date().getTimezoneOffset()
      }
    });

    return { success: false, error: 'Erreur réseau' };
  }
};

// **Vérifier si l'access token est expiré**
export const isAccessTokenExpired = () => {
  const accessTokenExpiration = Cookies.get('accessTokenExpiration');
  if (!accessTokenExpiration) return true;

  const expirationDate = new Date(accessTokenExpiration);
  return expirationDate <= new Date();
};

// **Rafraîchir le token d'accès**
export const refreshAccessToken = async () => {
  try {
    const authTokens = Cookies.get('authTokens');
    if (!authTokens) throw new Error('Refresh token introuvable');

    const parsedTokens = JSON.parse(authTokens);
    const { data } = await axios.post(`${API_BASE_URL}/api/token/refresh/`, {
      refresh: parsedTokens.refresh,
    });

    if (data.access) {
      parsedTokens.access = data.access;
      // Mettre à jour les cookies avec le nouveau token d'accès
      Cookies.set('authTokens', JSON.stringify(parsedTokens), { expires: 1, path: '/' });

      // Mettre à jour l'expiration de l'access token
      const accessExpirationDate = new Date();
      accessExpirationDate.setHours(accessExpirationDate.getHours() + 23);
      Cookies.set('accessTokenExpiration', accessExpirationDate.toISOString(), { expires: 1, path: '/' });

      return data.access;
    }
    throw new Error('Échec du rafraîchissement du token');
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    throw error;
  }
};

// **Vérification de la validité globale des tokens (6 jours max)**
export const isTokenExpiredLongTerm = () => {
  const loginDate = Cookies.get('loginDate');
  if (!loginDate) return true;

  const lastLoginDate = new Date(loginDate);
  const currentDate = new Date();

  // Si plus de 6 jours se sont écoulés depuis la dernière connexion
  return currentDate.getTime() - lastLoginDate.getTime() > 6 * 24 * 60 * 60 * 1000;
};

// **Déconnexion de l'utilisateur**
export const logoutUser = () => {
  Cookies.remove('authTokens', { path: '/' });
  Cookies.remove('accessTokenExpiration', { path: '/' });
  Cookies.remove('loginDate', { path: '/' });
  window.location.href = '/auth/login';
};

// **Activer la vérification en deux étapes**
export const activate2FA = async (userDetails: { user_id: number; email: string; otp_code: string }) =>
  fetchAPI('/utilisateurs/activate-2fa/', 'POST', userDetails);

// **Envoyer un code OTP**
export const sendOTPCode = async (userDetails: { user_id: number }) =>
  fetchAPI('/utilisateurs/send-otp-code/', 'POST', userDetails);

// **Demander la réinitialisation du mot de passe**
export const forgotPassword = async (email: string) =>
  fetchAPI('/password/forgot_password/', 'POST', { email });

// **Mettre à jour le mot de passe**
export const updatePassword = async (uid: string, token: string, newPassword: string) =>
  fetchAPI(`/password/update_password/${uid}/${token}/`, 'POST', { password: newPassword });