import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = 'https://www.backend.lnb-intranet.globalitnet.org';

// Fonction pour exécuter les requêtes API avec `fetch`
const fetchAPI = async (endpoint: string, method: string, body?: object) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
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
    const { data } = await axios.post(`${API_BASE_URL}/api/token/`, {
      username: credentials.identifier,
      password: credentials.password,
    });

    if (data.access && data.refresh) {
      // Calculer la date d'expiration pour les cookies
      const accessExpirationDate = new Date();
      accessExpirationDate.setHours(accessExpirationDate.getHours() + 23); // Expiration après 23 heures

      // Stocker les tokens dans un cookie
      Cookies.set('authTokens', JSON.stringify(data), { expires: 1, path: '/' });
      Cookies.set('accessTokenExpiration', accessExpirationDate.toISOString(), { expires: 1, path: '/' });

      console.log('Tokens stored in cookies:', data);
      return { success: true };
    }
    return { success: false, error: 'Identifiants invalides' };
  } catch {
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