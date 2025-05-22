"use client";
import React, { useEffect, useState } from "react";
import { fetchUserProfile } from "../../services/userService";
import { UserProfileResponse } from "../types";

export default function UserAddressCard() {
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await fetchUserProfile(); // Récupère les informations de l'utilisateur
        setUserProfile(userData);
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
      }
    };

    fetchData();
  }, []);

  if (!userProfile) {
    return <p>Chargement des informations...</p>;
  }

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Adresse
            </h4>
  
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Pays
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {/* Séparer l'adresse en deux parties */}
                  {userProfile?.utilisateur.adresse
                    ? userProfile.utilisateur.adresse.split(",")[1]?.trim() || "Non défini"
                    : "Non défini"}
                </p>
              </div>
  
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Ville/État
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {/* Extraire la ville/état */}
                  {userProfile?.utilisateur.adresse
                    ? userProfile.utilisateur.adresse.split(",")[0]?.trim() || "Non défini"
                    : "Non défini"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}  
