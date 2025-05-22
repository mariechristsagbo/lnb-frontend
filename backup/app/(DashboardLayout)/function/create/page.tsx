"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import Cookies from "js-cookie";

interface Department {
  id: number;
  name: string;
}

interface FunctionFormData {
  name: string;
  description: string;
  department_id: string;
}

export default function CreateFunction() {
  const router = useRouter();
  const [formData, setFormData] = useState<FunctionFormData>({
    name: "",
    description: "",
    department_id: "",
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Récupération des départements
  useEffect(() => {
    const fetchDepartments = async () => {
      const token = Cookies.get('authTokens');
      if (!token) {
        setError("Non authentifié");
        return;
      }

      const accessToken = JSON.parse(token).access;
      try {
        const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/services/departments/", {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        const data = await response.json();
        setDepartments(data.departments || []);
      } catch (error) {
        console.error("Erreur lors de la récupération des départements:", error);
        setError("Impossible de charger la liste des départements");
      }
    };

    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const token = Cookies.get('authTokens');
    if (!token) {
      setError("Non authentifié");
      setIsLoading(false);
      return;
    }

    const accessToken = JSON.parse(token).access;
    try {
      const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/services/functions/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          department_id: formData.department_id ? parseInt(formData.department_id) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Erreur HTTP: ${response.status}`);
      }

      router.push("/function");
    } catch (error) {
      console.error("Erreur lors de la création de la fonction:", error);
      setError("Erreur lors de la création de la fonction");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-2xl p-6">
        <ComponentCard title="Créer une nouvelle fonction">
          {error && (
            <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom de la fonction */}
            <div>
              <label 
                htmlFor="name" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
              >
                Nom de la fonction *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                placeholder="Entrez le nom de la fonction"
              />
            </div>

            {/* Description */}
            <div>
              <label 
                htmlFor="description" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
              >
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                placeholder="Décrivez la fonction..."
              />
            </div>

            {/* Département */}
            <div>
              <label 
                htmlFor="department_id" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
              >
                Département *
              </label>
              <select
                id="department_id"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="">Sélectionnez un département</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push("/function")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Création en cours..." : "Créer la fonction"}
              </button>
            </div>
          </form>
        </ComponentCard>
      </div>
    </div>
  );
}