"use client";
import React, { useState, useEffect } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "../Label";
import Input from "../InputField";
import Cookies from "js-cookie";

interface Department {
  id: number;
  name: string;
}

interface Function {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  nom: string;
  prenom: string;
}

interface ServiceFormData {
  name: string;
  description: string;
  department_id: string;
  function_id: string;
  chef_id: string;
}

export default function ServiceForm() {
  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    description: "",
    department_id: "",
    function_id: "",
    chef_id: "",
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [functions, setFunctions] = useState<Function[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const token = Cookies.get('authTokens');
      if (!token) {
        setError("Non authentifié");
        setIsLoading(false);
        return;
      }

      const accessToken = JSON.parse(token).access;
      const headers = {
        "Authorization": `Bearer ${accessToken}`,
      };

      try {
        // Récupération des départements
        const deptResponse = await fetch("https://www.backend.lnb-intranet.globalitnet.org/services/departments/", {
          headers
        });
        const deptData = await deptResponse.json();
        // Vérification de la structure de la réponse
        setDepartments(Array.isArray(deptData) ? deptData : deptData.departments || []);

        // Récupération des fonctions
        const funcResponse = await fetch("https://www.backend.lnb-intranet.globalitnet.org/services/functions/", {
          headers
        });
        const funcData = await funcResponse.json();
        setFunctions(Array.isArray(funcData) ? funcData : funcData.functions || []);

        // Récupération des utilisateurs
        const userResponse = await fetch("https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/list-all-users/", {
          headers
        });
        const userData = await userResponse.json();
        console.log('Users Data:', userData); // Pour le débogage
        setUsers(userData.utilisateurs || []); // Changez ici car la clé est 'utilisateurs' et non 'users'

      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
        setError("Erreur lors du chargement des données");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (field: keyof ServiceFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const token = Cookies.get('authTokens');
    if (!token) {
      setError("Non authentifié");
      return;
    }

    const accessToken = JSON.parse(token).access;
    
    try {
      const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/services/create-service/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          department_id: formData.department_id ? parseInt(formData.department_id) : null,
          function_id: formData.function_id ? parseInt(formData.function_id) : null,
          chef_id: formData.chef_id ? parseInt(formData.chef_id) : null,
        }),
      });

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

      // Redirection ou notification de succès
    } catch (error) {
      console.error("Erreur lors de la création du service:", error);
      setError("Erreur lors de la création du service");
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl">
        <ComponentCard title="Formulaire d'ajout de Service">
          {error && (
            <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom du service */}
              <div>
                <Label htmlFor="name">Nom du service</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  maxLength={255}
                  placeholder="Entrez le nom du service"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="w-full p-3 border rounded-md dark:bg-dark-900 dark:border-gray-700"
                  rows={4}
                  placeholder="Décrivez le service..."
                  required
                />
              </div>

              {/* Département - Select */}
              <div>
                <Label htmlFor="department_id">Département</Label>
                <select
                  id="department_id"
                  value={formData.department_id}
                  onChange={(e) => handleChange("department_id", e.target.value)}
                  className="w-full p-3 border rounded-md dark:bg-dark-900 dark:border-gray-700"
                  required
                >
                  <option value="">Sélectionnez un département</option>
                  {departments && departments.length > 0 && departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fonction - Select */}
              <div>
                <Label htmlFor="function_id">Fonction</Label>
                <select
                  id="function_id"
                  value={formData.function_id}
                  onChange={(e) => handleChange("function_id", e.target.value)}
                  className="w-full p-3 border rounded-md dark:bg-dark-900 dark:border-gray-700"
                  required
                >
                  <option value="">Sélectionnez une fonction</option>
                  {functions && functions.length > 0 && functions.map((func) => (
                    <option key={func.id} value={func.id}>
                      {func.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chef de service - Select */}
              <div>
                <Label htmlFor="chef_id">Chef de service</Label>
                <select
                  id="chef_id"
                  value={formData.chef_id}
                  onChange={(e) => handleChange("chef_id", e.target.value)}
                  className="w-full p-3 border rounded-md dark:bg-dark-900 dark:border-gray-700"
                  required
                >
                  <option value="">Sélectionnez un chef de service</option>
                  {users && users.length > 0 && users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.prenom} {user.nom}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 dark:bg-blue-800 dark:hover:bg-blue-900"
              >
                Créer le Service
              </button>
            </form>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}