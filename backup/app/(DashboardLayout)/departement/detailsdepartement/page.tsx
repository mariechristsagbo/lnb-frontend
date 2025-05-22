"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';

export default function DepartmentDetails() {
  const params = useParams();
  interface Department {
    name: string;
    description: string;
    responsable?: { username: string } | null;
    functions?: string[];
    services?: string[];
    created_at: string;
  }

  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartmentDetails = async () => {
      const token = Cookies.get('authTokens');
      if (!token) {
        setError("Non authentifié");
        setIsLoading(false);
        return;
      }

      const accessToken = JSON.parse(token).access;
      try {
        const response = await fetch(`https://www.backend.lnb-intranet.globalitnet.org/services/departments/${params.id}/`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        const data = await response.json();
        setDepartment(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des détails:", error);
        setError("Impossible de charger les détails du département.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartmentDetails();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-100 rounded-md">
        {error}
      </div>
    );
  }

  if (!department) {
    return (
      <div className="p-4 text-gray-600">
        Département non trouvé
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
        {/* En-tête */}
        <div className="p-6 border-b dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {department.name}
            </h1>
            <Link 
              href="/departement"
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Retour à la liste
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {department.description}
          </p>
        </div>

        {/* Détails */}
        <div className="p-6 grid gap-6">
          {/* Responsable */}
          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Responsable
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              {typeof department.responsable === "object" && department.responsable 
                ? department.responsable.username 
                : "Non assigné"}
            </p>
          </div>

          {/* Fonctions */}
          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Fonctions
            </h2>
            {Array.isArray(department.functions) && department.functions.length > 0 ? (
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                {department.functions.map((func, index) => (
                  <li key={index}>{func}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Aucune fonction associée</p>
            )}
          </div>

          {/* Services */}
          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Services
            </h2>
            {Array.isArray(department.services) && department.services.length > 0 ? (
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                {department.services.map((service, index) => (
                  <li key={index}>{service}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Aucun service associé</p>
            )}
          </div>

          {/* Informations de création */}
          <div className="border-t dark:border-gray-700 pt-4 mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Créé le : {new Date(department.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}