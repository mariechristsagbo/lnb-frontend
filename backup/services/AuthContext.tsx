'use client';
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

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

  // Fonction de login : récupère les tokens et l'utilisateur
  const login = async (credentials: { username: string; password: string }): Promise<boolean> => {
    try {
      console.log('Tentative de connexion avec les identifiants:', credentials);
      const { data } = await axios.post(
        'https://www.backend.lnb-intranet.globalitnet.org/api/token/',
        {
          username: credentials.username,
          password: credentials.password,
        }
      );

      if (data.access && data.refresh) {
        console.log('Connexion réussie, tokens reçus:', data);
        Cookies.set('authTokens', JSON.stringify(data), { expires: 1, path: '/' });
        setTokens(data);
        await fetchUserProfile(data.access);  // On récupère aussi le profil utilisateur
        await fetchOrganigramme(data.access); // Récupérer l'organigramme
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
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
  const refreshAccessToken = useCallback(async () => {
    if (!tokens?.refresh) return;
    try {
      console.log('Rafraîchissement du token d\'accès avec le refresh token:', tokens.refresh);
      const refreshResponse = await axios.post(
        'https://www.backend.lnb-intranet.globalitnet.org/api/token/refresh/',
        { refresh: tokens.refresh },
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
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
    }
  }, [tokens]);

  // Utilisation de useEffect pour lancer le rafraîchissement automatique
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAccessToken();
    }, 1416 * 60 * 1000); // 1416 minutes
    return () => clearInterval(interval);
  }, [refreshAccessToken]);

  return (
    <AuthContext.Provider value={{ tokens, user, login, loading }}> {/* Ajout de loading */}
      {children}
    </AuthContext.Provider>
  );
};
