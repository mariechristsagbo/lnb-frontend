"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import Cookies from "js-cookie";

interface Permission {
  id: number;
  name: string;
  description: string;
  level: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  parent_role: number;
  permissions: Permission[];
}

interface UserFormData {
  nom: string;
  prenom: string;
  email: string;
  username: string;
  role: string;
  telephone: string;
  adresse: {
    city: string;
    country: string;
  };
  date_naissance: string;
  lieu_naissance: string;
  password: string;
}

interface Address {
  id: number;
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  created_at: string;
  updated_at: string;
}

// Ajout des types d'erreur
type ApiError = Error & {
  stack?: string;
  message: string;
};

export default function AddUser() {
  const router = useRouter();
  const [formData, setFormData] = useState<UserFormData>({
    nom: "",
    prenom: "",
    email: "",
    username: "",
    role: "",
    telephone: "",
    adresse: {
      city: "",
      country: "",
    },
    date_naissance: "",
    lieu_naissance: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    const fetchAddresses = async () => {
      const token = Cookies.get("authTokens");
      if (!token) {
        setError("Non authentifié");
        return;
      }

      const accessToken = JSON.parse(token).access;
      try {
        const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/addresses/", {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        const data = await response.json();
        setAddresses(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des adresses:", error);
        setError("Impossible de charger la liste des adresses");
      }
    };

    fetchAddresses();
  }, []);

  useEffect(() => {
    const fetchRoles = async () => {
      console.log("Début de fetchRoles");
      const token = Cookies.get("authTokens");
      if (!token) {
        console.log("Token non trouvé");
        setError("Non authentifié");
        return;
      }

      const accessToken = JSON.parse(token).access;
      console.log("Token récupéré:", accessToken.substring(0, 10) + "..."); // Pour la sécurité, on n'affiche qu'une partie

      try {
        console.log("Envoi de la requête à l'API");
        const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/roles/list-roles/", {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        console.log("Statut de la réponse:", response.status);
        console.log("Headers de la réponse:", Object.fromEntries([...response.headers.entries()]));

        if (!response.ok) {
          console.log("Réponse non OK:", response.status, response.statusText);
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        // Récupérer le texte brut de la réponse d'abord pour déboguer
        const rawText = await response.text();
        console.log("Réponse brute:", rawText);
        
        // Essayer de parser le JSON
        let data;
        try {
          data = JSON.parse(rawText);
          console.log("Données JSON parsées:", data);
        } catch {
          console.log("La réponse n'est pas un JSON valide");
          setRoles([]);
          return;
        }

        // Analyse détaillée de la structure des données
        console.log("Type de la réponse:", typeof data);
        if (typeof data === 'object') {
          console.log("Clés de l'objet de réponse:", Object.keys(data));
          
          // Si data est un objet avec une clé 'roles'
          if (data.roles) {
            console.log("Données dans data.roles:", data.roles);
            console.log("Type de data.roles:", typeof data.roles);
            console.log("data.roles est un tableau:", Array.isArray(data.roles));
            setRoles(Array.isArray(data.roles) ? data.roles : []);
          } 
          // Rechercher une clé qui pourrait contenir les rôles
          else {
            const possibleArrayKey = Object.keys(data).find(key => 
              Array.isArray(data[key]) && data[key].length > 0 && data[key][0].name
            );
            
            if (possibleArrayKey) {
              console.log(`Utilisation de la clé '${possibleArrayKey}' qui semble contenir les rôles:`, data[possibleArrayKey]);
              setRoles(data[possibleArrayKey]);
            } else if (Array.isArray(data)) {
              console.log("La réponse est un tableau:", data);
              setRoles(data);
            } else {
              console.log("Aucune structure appropriée trouvée pour les rôles");
              setRoles([]);
            }
          }
        } else if (Array.isArray(data)) {
          console.log("La réponse est directement un tableau:", data);
          setRoles(data);
        } else {
          console.log("Format inattendu:", typeof data);
          setRoles([]);
        }
        
        console.log("Rôles définis dans l'état");  // Suppression de la référence à roles
      } catch (error) {
        console.error("Complete error during role retrieval:", error as ApiError);
        console.log("Error message:", (error as ApiError).message);
        console.log("Stack trace:", (error as ApiError).stack);
        setError("Impossible de charger la liste des rôles");
        setRoles([]);
      }
    };

    fetchRoles();
  }, []); // Le tableau de dépendances vide est maintenant correct

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Envoi du formulaire avec les données:", formData);
    setIsLoading(true);
    setError(null);

    const token = Cookies.get("authTokens");
    if (!token) {
      setError("Non authentifié");
      setIsLoading(false);
      return;
    }

    const accessToken = JSON.parse(token).access;
    try {
      // URL corrigée (suppression du caractère '<')
      const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/inscription/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      console.log("Statut de la réponse de création:", response.status);
      
      // Récupérer le texte brut de la réponse pour déboguer
      const rawResponseText = await response.text();
      console.log("Réponse brute de création:", rawResponseText);
      
      let responseData;
      try {
        responseData = JSON.parse(rawResponseText);
        console.log("Données de réponse:", responseData);
      } catch {
        console.log("La réponse n'est pas un JSON valide");
      }

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      console.log("Utilisateur créé avec succès, redirection vers /users");
      router.push("/users");
    } catch (error) {
      if (error instanceof Error) {
        console.error("Complete error during creation:", error);
        console.log("Error message:", error.message);
        console.log("Stack trace:", error.stack);
      } else {
        console.error("An unknown error occurred:", error);
      }
      setError("Erreur lors de la création de l'utilisateur");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <ComponentCard title="Ajouter un nouvel utilisateur">
          {error && (
            <div className="mb-6 p-4 text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations personnelles */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Nom d&apos;utilisateur *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Informations supplémentaires */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Rôle *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    <option value="">Sélectionnez un rôle</option>
                    {roles.length > 0 ? (
                      roles.map((role) => (
                        <option key={role.id || role.name} value={role.name}>
                          {role.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Chargement des rôles...</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    value={formData.date_naissance}
                    onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Lieu de naissance
                  </label>
                  <input
                    type="text"
                    value={formData.lieu_naissance}
                    onChange={(e) => setFormData({ ...formData, lieu_naissance: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Adresse */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Ville
                </label>
                <select
                  value={formData.adresse.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    adresse: { ...formData.adresse, city: e.target.value }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Sélectionnez une ville</option>
                  {addresses
                    .filter((address, index, self) => 
                      index === self.findIndex(a => a.city === address.city)
                    )
                    .map((address) => (
                      <option key={address.id} value={address.city}>
                        {address.city}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Pays
                </label>
                <select
                  value={formData.adresse.country}
                  onChange={(e) => setFormData({
                    ...formData,
                    adresse: { ...formData.adresse, country: e.target.value }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Sélectionnez un pays</option>
                  {addresses
                    .filter((address, index, self) => 
                      index === self.findIndex(a => a.country === address.country)
                    )
                    .map((address) => (
                      <option key={address.id} value={address.country}>
                        {address.country}
                      </option>
                    ))
                  }
                </select>
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Mot de passe *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.push("/users")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Création en cours..." : "Créer l&apos;utilisateur"}
              </button>
            </div>
          </form>
        </ComponentCard>
      </div>
    </div>
  );
}