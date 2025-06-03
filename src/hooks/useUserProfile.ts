import { useState, useEffect } from 'react';
import { api } from '@/config/api';

export interface UserProfile {
  id: number;
  username: string;
  role: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  date_naissance: string;
  lieu_naissance: string;
  statut: string;
  photo_profil: string;
  is_deleted: boolean;
  language: string;
  timezone: string;
  date_joined?: string;
  last_login?: string;
  groups?: number[];
  user_permissions?: number[];
}

interface ApiResponse {
  utilisateur: UserProfile;
}

const DEFAULT_ERROR_MESSAGE = 'Impossible de charger le profil utilisateur';

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data } = await api.get<ApiResponse>('/utilisateurs/user-gestion/user-profile/');
        setProfile(data.utilisateur);

      } catch (err: any) {
        const errorMessage = err?.response?.data?.message ||
          err?.message ||
          DEFAULT_ERROR_MESSAGE;

        setError(errorMessage);
        console.error('Erreur lors de la récupération du profil:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { profile, isLoading, error };
};

export default useUserProfile;
