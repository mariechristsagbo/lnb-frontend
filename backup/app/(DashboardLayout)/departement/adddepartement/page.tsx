"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import Cookies from "js-cookie";

interface User {
  id: number;
  role: string;
  nom: string;
  prenom: string;
}

interface DepartmentFormData {
  name: string;
  description: string;
  responsable_id: string;
}

export default function AddDepartment() {
  const router = useRouter();
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: "",
    description: "",
    responsable_id: "",
  });

  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = Cookies.get('authTokens');
      if (!token) {
        setError("Non authentifié");
        return;
      }

      const accessToken = JSON.parse(token).access;
      try {
        const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/list-users/", {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        const data = await response.json();
        setUsers(data.utilisateurs || []);
      } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs:", error);
        setError("Impossible de charger la liste des utilisateurs");
      }
    };

    fetchUsers();
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
      const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/services/departments/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          responsable_id: formData.responsable_id ? parseInt(formData.responsable_id) : null,
        }),
      });

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

      router.push("/departement");
    } catch (error) {
      console.error("Erreur lors de la création du département:", error);
      setError("Erreur lors de la création du département");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-2xl p-6">
        <ComponentCard title="Ajouter un nouveau département">
          {error && (
            <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom du département */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Nom du département *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                placeholder="Entrez le nom du département"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                placeholder="Décrivez le département..."
              />
            </div>

            {/* Responsable */}
            <div>
              <label htmlFor="responsable_id" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Responsable *
              </label>
              <select
                id="responsable_id"
                value={formData.responsable_id}
                onChange={(e) => setFormData({ ...formData, responsable_id: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="">Sélectionnez un responsable</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.prenom} {user.nom} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push("/departement")}
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
                {isLoading ? "Création en cours..." : "Créer le département"}
              </button>
            </div>
          </form>
        </ComponentCard>
      </div>
    </div>
  );
}