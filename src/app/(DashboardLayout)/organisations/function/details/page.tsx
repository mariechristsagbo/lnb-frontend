"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';

interface Function {
  id: number;
  name: string;
  description: string;
  department: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export default function FunctionDetails() {
  const params = useParams();
  const [function_, setFunction] = useState<Function | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFunctionDetails = async () => {
      const token = Cookies.get('authTokens');
      if (!token) {
        setError("Non authentifié");
        setIsLoading(false);
        return;
      }

      const accessToken = JSON.parse(token).access;
      try {
        const response = await fetch(`https://www.backend.lnb-intranet.globalitnet.org/services/functions/${params.id}/`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        const data = await response.json();
        setFunction(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des détails:", error);
        setError("Impossible de charger les détails de la fonction.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFunctionDetails();
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

  if (!function_) {
    return (
      <div className="p-4 text-gray-600">
        Fonction non trouvée
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
              {function_.name}
            </h1>
            <Link 
              href="/function"
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Retour à la liste
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {function_.description}
          </p>
        </div>

        {/* Détails */}
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Département
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              {function_.department?.name || "Non assigné"}
            </p>
          </div>

          <div className="border-t dark:border-gray-700 pt-4">
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Date de création
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {new Date(function_.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Dernière modification
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {new Date(function_.updated_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}