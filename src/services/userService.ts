import api from "./api";
import { UserProfileResponse, Organigramme } from "../components/types"; // Correction des chemins d'importation

// Récupérer les infos utilisateur
export const fetchUserProfile = async (): Promise<UserProfileResponse> => {
  const response = await api.get<UserProfileResponse>("utilisateurs/user-gestion/user-profile/");
  return response.data;
};

// Récupérer l'organigramme
export const fetchOrganigramme = async (): Promise<Organigramme> => {
  const response = await api.get<Organigramme>("utilisateurs/user-gestion/get-organigramme/");
  return response.data;
};