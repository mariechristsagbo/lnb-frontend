"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import { Loader2 } from 'lucide-react';
import { fetchUsers, createDepartment } from './apiService';
interface User {
  id: number;
  role: string;
  nom: string;
  prenom: string;
  username: string;
}

interface DepartmentFormData {
  name: string;
  description: string;
  responsable_id: string;
}

const API_URLS = {
  LIST_USERS: `utilisateurs/user-gestion/list-all-users/`,
  CREATE_DEPARTMENT: `services/departments/create/`,
};

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
  const [isFetchingUsers, setIsFetchingUsers] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsFetchingUsers(true);
        setError(null);
        
        const usersData = await fetchUsers();
        setUsers(usersData);
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs:", error);
        const errorMessage = error instanceof Error ? error.message : "Impossible de charger la liste des utilisateurs";
        setError(errorMessage);
      } finally {
        setIsFetchingUsers(false);
      }
    };

    loadUsers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        responsable_id: formData.responsable_id ? parseInt(formData.responsable_id) : null,
      };

      await createDepartment(payload);
      router.push("/organisations/departement");
    } catch (error) {
      console.error("Erreur lors de la création du département:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue lors de la création";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex justify-center items-start pt-10 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-2xl p-4 sm:p-6">
        <ComponentCard title="Ajouter un nouveau département">
          {error && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 border border-red-400 dark:border-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nom du département */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Nom du département <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                placeholder="Entrez le nom du département"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description" 
                name="description"  
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                placeholder="Décrivez le département..."
              />
            </div>

            {/* Responsable */}
            <div>
              <label htmlFor="responsable_id" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Responsable (Optionnel)
              </label>
              <select
                id="responsable_id"
                name="responsable_id"
                value={formData.responsable_id}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={isFetchingUsers}
              >
                <option value="">{isFetchingUsers ? "Chargement..." : "Aucun responsable sélectionné"}</option>
                {!isFetchingUsers && users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.prenom} {user.nom} ({user.username || user.role || 'Utilisateur'})
                  </option>
                ))}
              </select>
               {isFetchingUsers && <p className="text-xs text-gray-500 mt-1">Chargement de la liste des utilisateurs...</p>}
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading || isFetchingUsers}
                className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 ${
                  (isLoading || isFetchingUsers) ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Création..." : "Créer le département"}
              </button>
            </div>
          </form>
        </ComponentCard>
      </div>
    </div>
  );
}