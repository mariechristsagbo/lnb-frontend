'use client';
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Agent } from 'https';

interface Tokens {
  access: string;
  refresh: string;
}

interface User {
  id: number;
  username: string;
  role: string;
  nom: string;
  prenom: string;
  email: string;
  departement: string | null;
  service: string | null;
  statut: string;
  langue: string;
  timezone: string;
  telephone: string;
  adresse: string;
  date_naissance: string;
  lieu_naissance: string;
  photo_profil: string | null;
  is_deleted: boolean;
  position_info: {
    ip: string;
    bogon: boolean;
  };
  organigramme: object | null;
  inactifDepuis: string | null;
  adresse_details: {
    street: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
  } | null;
}

export interface AuthContextProps {
  tokens: {
    access: string;
    refresh?: string;
  } | null;
  user: {
    id: number;
    prenom: string;
    nom: string;
    email: string;
  } | null;
  loading: boolean;
  login?: (credentials: { username: string; password: string }) => Promise<boolean>;
  setTokens?: (tokens: Tokens | null) => void; // Type spécifique au lieu de any
  setUser?: (user: User | null) => void; // Type spécifique au lieu de any
}

export const AuthContext = createContext<AuthContextProps>({
  tokens: null,
  user: null,
  login: async () => false,
  loading: true, // Valeur initiale de loading est true
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Nouvel état

  // Fonction pour initialiser les tokens depuis les cookies
  useEffect(() => {
    const initAuth = async () => {
      console.log("Initialisation de l'authentification...");
      const storedTokens = Cookies.get('authTokens');
      
      if (storedTokens) {
        console.log('Tokens trouvés dans les cookies');
        try {
          const parsedTokens = JSON.parse(storedTokens);
          setTokens(parsedTokens);
          await fetchUserProfile(parsedTokens.access);
          await fetchOrganigramme(parsedTokens.access);
        } catch (error) {
          console.error("Erreur lors de l'initialisation de l'authentification:", error);
        }
      } else {
        console.log('Aucun token trouvé dans les cookies');
      }
      
      console.log("Fin de l'initialisation, loading passe à false");
      setLoading(false);
    };

    initAuth();
  }, []);

  // Log de l'état user à chaque mise à jour
  useEffect(() => {
    console.log('User state updated:', user);
  }, [user]);

  // Interface pour les erreurs de certificat
  interface CertificateError {
    code?: string;
    message: string;
    name?: string;
    stack?: string;
    response?: {
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
      headers?: unknown;
      status?: number;
      data?: unknown;
    };
    headers?: unknown;
    status?: number;
    data?: unknown;
  }

  // Ajouter cette fonction utilitaire en haut du fichier, après les imports
  const handleApiCall = async <T,>(apiCall: () => Promise<{ data: T }>) => {
    try {
      console.log('🚀 Démarrage de l\'appel API');
      const response = await apiCall();
      console.log('✅ Réponse API reçue:', response);
      return response;
    } catch (error: unknown) {
      const certError = error as CertificateError;
      console.log('🔍 Analyse détaillée de l\'erreur de certificat:', {
        code: certError.code,
        message: certError.message,
        certificatInfo: certError.response?.request?._client?.ssl?.getPeerCertificate?.() || 'Non disponible',
        certificatDate: {
          systemeDate: new Date().toISOString(),
          certificatValidDe: certError.response?.request?._client?.ssl?.getPeerCertificate?.()?.valid_from,
          certificatValidJusqua: certError.response?.request?._client?.ssl?.getPeerCertificate?.()?.valid_to
        },
        headers: certError.response?.headers,
        statusCode: certError.response?.status,
        errorDetails: certError.response?.data
      });

      if (certError.code === 'ERR_CERT_DATE_INVALID') {
        console.log('⚠️ Détails du problème de certificat:', {
          message: "Le certificat SSL du serveur n'est pas valide temporellement",
          systemTime: new Date().toISOString(),
          timezoneName: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timezoneOffset: new Date().getTimezoneOffset()
        });
        
        const storedTokens = Cookies.get('authTokens');
        console.log('🔐 Tokens stockés:', storedTokens ? 'Présents' : 'Absents');
        
        if (storedTokens) {
          const parsedTokens = JSON.parse(storedTokens);
          console.log('📝 Tokens parsés:', {
            accessPresent: !!parsedTokens.access,
            refreshPresent: !!parsedTokens.refresh,
            expiration: parsedTokens.expiration
          });

          console.log('🔄 Tentative de rafraîchissement du token');
          const newToken = await refreshAccessToken(parsedTokens.refresh);
          
          if (newToken) {
            console.log('✨ Nouveau token obtenu, nouvelle tentative d\'appel API');
            return await apiCall();
          } else {
            console.log('❌ Échec de l\'obtention d\'un nouveau token');
          }
        }
      }
      
      console.error('💥 Erreur finale:', {
        name: certError.name,
        message: certError.message,
        stack: certError.stack
      });
      throw certError;
    }
  };

  // Fonction de login : récupère les tokens et l'utilisateur
  const login = async (credentials: { username: string; password: string }): Promise<boolean> => {
    try {
      console.log('🔑 Tentative de connexion pour:', credentials.username);
      
      const axiosInstance = axios.create({
        httpsAgent: new Agent({  
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        })
      });
      console.log('📡 Instance Axios créée en mode:', process.env.NODE_ENV);

      const makeLoginCall = async () => {
        console.log('📤 Envoi de la requête de connexion');
        const response = await axiosInstance.post(
          'https://www.backend.lnb-intranet.globalitnet.org/api/token/',
          {
            username: credentials.username,
            password: credentials.password,
          }
        );
        console.log('📥 Réponse reçue:', {
          status: response.status,
          headers: response.headers,
          data: response.data ? 'Données présentes' : 'Pas de données'
        });
        return response;
      };

      const { data } = await handleApiCall(makeLoginCall);
      console.log('🔍 Analyse de la réponse:', {
        accessPresent: !!data.access,
        refreshPresent: !!data.refresh
      });

      if (data.access && data.refresh) {
        console.log('✅ Connexion réussie');
        const tokenData = {
          ...data,
          expiration: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString()
        };
        
        console.log('💾 Sauvegarde des tokens:', {
          expiration: tokenData.expiration,
          cookieSet: true
        });
        
        Cookies.set('authTokens', JSON.stringify(tokenData), { expires: 1, path: '/' });
        setTokens(data);
        
        console.log('👤 Récupération du profil utilisateur');
        await fetchUserProfile(data.access);
        console.log('🌳 Récupération de l\'organigramme');
        await fetchOrganigramme(data.access);
        
        return true;
      }
      
      console.log('❌ Échec de connexion: tokens manquants');
      return false;
    } catch (error) {
      console.error('💥 Erreur lors de la connexion:', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  };

  // Récupérer le profil utilisateur
  const fetchUserProfile = async (accessToken: string) => {
    try {
      console.log('Récupération du profil utilisateur avec le token:', accessToken);
      const profileResponse = await axios.get(
        'https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/user-profile/',
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      console.log('Profil utilisateur récupéré:', profileResponse.data.utilisateur);
      setUser((prevUser) => ({
        ...prevUser,
        ...profileResponse.data.utilisateur, // Merge des données utilisateur récupérées
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération du profil utilisateur:', error);
    }
  };

  // Récupérer l'organigramme de l'utilisateur
  const fetchOrganigramme = async (accessToken: string) => {
    try {
      console.log('Récupération de l\'organigramme utilisateur avec le token:', accessToken);
      const organigrammeResponse = await axios.get(
        'https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/get-organigramme/',
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      console.log('Organigramme utilisateur récupéré:', organigrammeResponse.data);
      setUser((prevUser) => {
        if (!prevUser) return prevUser;
        return {
          ...prevUser,
          organigramme: organigrammeResponse.data,
        };
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'organigramme:', error);
    }
  };

  // Rafraîchir le token d'accès en utilisant le refresh token
  const refreshAccessToken = useCallback(async (refreshToken?: string) => {
    const tokenToUse = refreshToken || tokens?.refresh;
    if (!tokenToUse) return null;
    try {
      console.log('Rafraîchissement du token d\'accès avec le refresh token:', tokenToUse);
      const refreshResponse = await axios.post(
        'https://www.backend.lnb-intranet.globalitnet.org/api/token/refresh/',
        { refresh: tokenToUse },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (refreshResponse.data.access) {
        console.log('Token d\'accès rafraîchi:', refreshResponse.data.access);
        setTokens((prev) => (prev ? { ...prev, access: refreshResponse.data.access } : null));
        Cookies.set('authTokens', JSON.stringify({ ...tokens, access: refreshResponse.data.access }), {
          expires: 1,
          path: '/',
        });
        return refreshResponse.data.access;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      return null;
    }
  }, [tokens]);

  // Utilisation de useEffect pour lancer le rafraîchissement automatique
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAccessToken(tokens?.refresh);
      refreshAccessToken();
    }, 1416 * 60 * 1000); // 1416 minutes
    return () => clearInterval(interval);
  }, [refreshAccessToken, tokens]);

  return (
    <AuthContext.Provider value={{ tokens, user, login, loading }}> {/* Ajout de loading */}
      {children}
    </AuthContext.Provider>
  );
};
