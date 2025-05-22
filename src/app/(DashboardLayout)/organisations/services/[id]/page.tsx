"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";

// Interfaces pour typer les données
interface ServiceDetail {
  id: number;
  name: string;
  description: string;
  department: {
    id: number;
    name: string;
  } | null;
  // Correction: Renommer 'function' en 'functions' et typer comme un tableau
  functions: {
    id: number;
    name: string;
  }[]; // Ou number[] si l'API renvoie juste les IDs
  chef: {
    id: number;
    username: string;
  } | null;
}

interface ChiefDetail {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  // Vous pouvez ajouter d'autres champs si nécessaire
}

export default function ServiceDetail() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id;

  const [serviceDetail, setServiceDetail] = useState<ServiceDetail | null>(null);
  const [chiefDetail, setChiefDetail] = useState<ChiefDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Récupérer les détails du service
  useEffect(() => {
    async function fetchServiceDetails() {
      setLoading(true);
      const token = Cookies.get('authTokens');
      
      if (!token) {
        setError("Non authentifié");
        setLoading(false);
        return;
      }

      const accessToken = JSON.parse(token).access;
      
      try {
        // L'URL était incorrecte - il y a une duplication "services/services"
        // Utilisation de console.log pour déboguer l'URL
        const serviceDetailUrl = `https://www.backend.lnb-intranet.globalitnet.org/services/services/${serviceId}/`;
        console.log("Tentative de récupération des détails du service:", serviceDetailUrl);
        
        // Récupérer les détails du service
        const response = await fetch(serviceDetailUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Réponse d'erreur:", errorText);
          throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Données du service récupérées:", data);
        setServiceDetail(data);

        // Si le service a un chef, récupérer ses détails
        if (data.chef?.id) {
          const chiefUrl = `https://www.backend.lnb-intranet.globalitnet.org/services/${serviceId}/chief/`;
          console.log("Tentative de récupération des détails du chef:", chiefUrl);
          
          const chiefResponse = await fetch(chiefUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
            },
          });

          if (chiefResponse.ok) {
            const chiefData = await chiefResponse.json();
            console.log("Données du chef récupérées:", chiefData);
            setChiefDetail(chiefData);
          } else {
            console.error("Erreur lors de la récupération du chef:", chiefResponse.status);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des détails:", error);
        setError(`Impossible de charger les détails du service: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      } finally {
        setLoading(false);
      }
    }

    if (serviceId) {
      fetchServiceDetails();
    }
  }, [serviceId]);

  if (loading) {
    return (
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mb-4 p-4 text-white bg-red-600 rounded-md">
          {error}
        </div>
        <button 
          onClick={() => router.push('/services')}
          className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          Retour à la liste des services
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
      <div className="w-full max-w-4xl mx-auto">
        {/* En-tête avec actions */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Détails du service
          </h1>
          <div className="flex gap-3">
            <button 
              onClick={() => router.push('/services')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Retour
            </button>
            <Link 
              href={`/services/edit/${serviceId}`}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
            >
              Modifier
            </Link>
          </div>
        </div>

        {/* Informations sur le service */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Informations générales
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">ID</p>
                  <p className="mt-1 text-gray-900 dark:text-white">{serviceDetail?.id}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nom</p>
                  <p className="mt-1 text-gray-900 dark:text-white">{serviceDetail?.name}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Département</p>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {serviceDetail?.department?.name || "Non affecté"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fonctions associées</p> {/* Mise à jour du libellé */}
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {/* Mise à jour pour afficher les fonctions */}
                    {serviceDetail?.functions && serviceDetail.functions.length > 0
                      ? serviceDetail.functions.map(func => func.name).join(', ')
                      : "Aucune fonction définie"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Chef de service</p>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {serviceDetail?.chef?.username || "Non affecté"}
                  </p>
                </div>
              </div>
            </div>

            {/* Description complète */}
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</p>
              <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">
                {serviceDetail?.description || "Aucune description disponible"}
              </p>
            </div>
          </div>
        </div>

        {/* Détails du chef si disponible */}
        {chiefDetail && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Informations sur le chef de service
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nom complet</p>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {chiefDetail.first_name} {chiefDetail.last_name}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nom d&apos;utilisateur</p>
                    <p className="mt-1 text-gray-900 dark:text-white">{chiefDetail.username}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                    <p className="mt-1 text-gray-900 dark:text-white">{chiefDetail.email || "Non renseigné"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}