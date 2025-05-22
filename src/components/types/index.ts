export interface Utilisateur {
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
}

export interface UserProfileResponse {
  utilisateur: Utilisateur;
}

// Organigramme lorsque l'utilisateur a un supérieur hiérachique
export interface Organigramme {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  position: string; // Par exemple : "Supérieur hiérachique"
  subalternes: Organigramme[];
}

// Pour le cas où aucun supérieur n'est assigné, le backend renvoie un objet avec "message"
export type OrganigrammeResponse = Organigramme | { message: string };
