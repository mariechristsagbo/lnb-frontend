"use client";
import React, { useState, useEffect } from "react";
import { fetchUserProfile, fetchOrganigramme } from "../../services/userService";
import { UserProfileResponse, Organigramme } from "../types";

export default function UserInfoCard() {
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);
  const [organigramme, setOrganigramme] = useState<Organigramme | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await fetchUserProfile();
        setUserProfile(userData);
        const organigrammeData = await fetchOrganigramme();
        setOrganigramme(organigrammeData);
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
      }
    };

    fetchData();
  }, []);

  if (!userProfile || !organigramme) {
    return <p>Chargement des informations...</p>;
  }

  // Fonction pour afficher les subalternes avec numérotation
  const renderSubordinates = (subalternes: Organigramme[]) => {
    return subalternes.map((subordinate, index) => (
      <p key={subordinate.id} className="text-sm font-medium text-gray-800 dark:text-white/90">
        N°{index + 1} : {subordinate.nom}  {subordinate.prenom}   |   {subordinate.role}
      </p>
    ));
  };

  // Vérifie si le backend retourne un message (aucun supérieur assigné)
  const hasNoSuperior = "message" in organigramme;

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6">

        {/* Informations personnelles - Section principale */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Colonne 1 - Informations de base */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 border-b pb-2">
              Informations Personnelles
            </h4>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Nom d&apos;utilisateur</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {userProfile.utilisateur.username}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {userProfile.utilisateur.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Téléphone</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {userProfile.utilisateur.telephone || "Non défini"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Adresse</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {userProfile.utilisateur.adresse || "Non défini"}
                </p>
              </div>
            </div>
          </div>

          {/* Colonne 2 - Informations complémentaires */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 border-b pb-2">
              Informations Complémentaires
            </h4>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Date de naissance</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {userProfile.utilisateur.date_naissance || "Non défini"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Lieu de naissance</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {userProfile.utilisateur.lieu_naissance || "Non défini"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Langue</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {userProfile.utilisateur.language || "Non défini"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Fuseau horaire</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {userProfile.utilisateur.timezone || "Non défini"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section du supérieur hiérarchique */}
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 border-b pb-2">
            Supérieur Hiérarchique
          </h4>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            {hasNoSuperior ? (
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                Vous n&apos;avez aucun supérieur assigné actuellement !
              </p>
            ) : (
              <>
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Nom</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {organigramme.nom || "Non défini"}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Prénom</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {organigramme.prenom || "Non défini"}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Role</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {organigramme.role || "Non défini"}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Position</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {organigramme.position || "Non défini"}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Subalternes</p>
                  <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {organigramme.subalternes && organigramme.subalternes.length > 0
                      ? renderSubordinates(organigramme.subalternes)
                      : "Aucun subalterne"}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
