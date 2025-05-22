"use client";

import React, { useState, useEffect } from "react";
import { fetchUserProfile } from "../../services/userService";
// Use local type definitions instead of importing potentially conflicting ones
// import { UserProfileResponse, Utilisateur } from "../types";
// --- AJOUT: Icônes supplémentaires ---
import { FaUser, FaEnvelope, FaPhone, FaMapMarker, FaBirthdayCake, FaGlobe, FaClock, FaUsers, FaBuilding, FaBriefcase, FaUserShield } from "react-icons/fa";

const InfoCard: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
    <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 border-b pb-2 mb-4">
      {title}
    </h4>
    {children}
  </div>
);

const InfoItem: React.FC<{ icon: React.ReactNode, label: string, value: string | React.ReactNode }> = ({ icon, label, value }) => (
  <div className="flex items-center space-x-2">
    <div className="text-gray-500 dark:text-gray-400">{icon}</div>
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800 dark:text-white/90">{value}</p>
    </div>
  </div>
);

export default function UserInfoCard() {
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);
  // --- SUPPRESSION: État organigramme si non utilisé pour l'utilisateur actuel ---
  // const [organigramme, setOrganigramme] = useState<Organigramme | null>(null);
  const [loading, setLoading] = useState(true); // Ajouter un état de chargement
  const [error, setError] = useState<string | null>(null); // Ajouter un état d'erreur

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const userData = await fetchUserProfile();
        setUserProfile(userData);
        // --- SUPPRESSION: Appel fetchOrganigramme si non pertinent ici ---
        // const organigrammeData = await fetchOrganigramme();
        // setOrganigramme(organigrammeData);
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
        setError("Impossible de charger les informations du profil.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- MODIFICATION: Gestion du chargement et de l'erreur ---
  if (loading) {
    return <p className="text-center p-5">Chargement des informations...</p>;
  }

  if (error) {
    return <p className="text-center p-5 text-red-600">{error}</p>;
  }

  if (!userProfile) {
     return <p className="text-center p-5">Aucune information de profil trouvée.</p>;
  }
  // --- FIN MODIFICATION ---

  // --- SUPPRESSION: renderSubordinates et hasNoSuperior si non pertinent ---
  // const renderSubordinates = ...
  // const hasNoSuperior = ...

  // Helper pour afficher le nom ou "Non défini"
  const getEntityName = (entity: { name: string } | null | undefined): string => {
    return entity?.name || "Non défini";
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informations personnelles - Section principale */}
          <InfoCard title="Informations Personnelles">
            <InfoItem icon={<FaUser />} label="Nom d'utilisateur" value={userProfile.utilisateur.username} />
            <InfoItem icon={<FaEnvelope />} label="Email" value={userProfile.utilisateur.email || "Non défini"} />
            <InfoItem icon={<FaPhone />} label="Téléphone" value={userProfile.utilisateur.telephone || "Non défini"} />
            <InfoItem icon={<FaMapMarker />} label="Adresse" value={userProfile.utilisateur.adresse || "Non défini"} />
            {/* Afficher Nom et Prénom s'ils existent */}
            {userProfile.utilisateur.nom && <InfoItem icon={<FaUser />} label="Nom" value={userProfile.utilisateur.nom} />}
            {userProfile.utilisateur.prenom && <InfoItem icon={<FaUser />} label="Prénom" value={userProfile.utilisateur.prenom} />}
          </InfoCard>

          {/* Informations complémentaires */}
          <InfoCard title="Informations Complémentaires">
            <InfoItem icon={<FaBirthdayCake />} label="Date de naissance" value={userProfile.utilisateur.date_naissance || "Non défini"} />
            <InfoItem icon={<FaMapMarker />} label="Lieu de naissance" value={userProfile.utilisateur.lieu_naissance || "Non défini"} />
            <InfoItem icon={<FaGlobe />} label="Langue" value={userProfile.utilisateur.language || "Non défini"} />
            <InfoItem icon={<FaClock />} label="Fuseau horaire" value={userProfile.utilisateur.timezone || "Non défini"} />
          </InfoCard>
        </div>

        {/* --- MODIFICATION: Section renommée et contenu mis à jour --- */}
        <InfoCard title="Position dans l'Organisation">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"> {/* Ajuster le nombre de colonnes si besoin */}
            <InfoItem
              icon={<FaBuilding />}
              label="Département"
              value={getEntityName(userProfile.utilisateur.departement)}
            />
            <InfoItem
              icon={<FaBriefcase />}
              label="Service"
              value={getEntityName(userProfile.utilisateur.service)}
            />
            <InfoItem
              icon={<FaUsers />}
              label="Rôle"
              value={userProfile.utilisateur.role || "Non défini"}
            />
            {/* Afficher le statut Superutilisateur si disponible */}
            {userProfile.utilisateur.is_superuser !== undefined && (
               <InfoItem
                 icon={<FaUserShield />}
                 label="Statut Administrateur"
                 value={userProfile.utilisateur.is_superuser ?
                   <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Oui</span> :
                   <span className="text-gray-500 dark:text-gray-400">Non</span>
                 }
               />
            )}
             {/* Afficher le statut général de l'utilisateur */}
             <InfoItem
               icon={<FaUser />}
               label="Statut Compte"
               value={userProfile.utilisateur.statut || "Non défini"}
             />
          </div>
          {/* --- SUPPRESSION: Affichage des subalternes si non pertinent ici --- */}
          {/*
          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Subalternes</p>
            <div className="text-sm font-medium text-gray-800 dark:text-white/90">
              ...
            </div>
          </div>
          */}
        </InfoCard>
        {/* --- FIN MODIFICATION --- */}
      </div>
    </div>
  );
}

// Assuming Utilisateur and UserProfileResponse types are correctly defined in '../types'
// The local declarations below have been removed to resolve the import conflict.

// export interface Utilisateur { ... } // Removed

// export interface UserProfileResponse { ... } // Removed

export interface Utilisateur {
  username: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  nom?: string;
  prenom?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  language?: string;
  timezone?: string;
  role?: string;
  statut?: string;
  is_superuser?: boolean;
  departement?: { name: string } | null;
  service?: { name: string } | null;
  // Ajoutez d'autres champs si nécessaire
}

export interface UserProfileResponse {
  utilisateur: Utilisateur;
  // Ajoutez d'autres champs de la réponse si nécessaire
}
