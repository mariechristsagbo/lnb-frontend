"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import Cookies from "js-cookie";
import { Loader2 } from 'lucide-react'; // Importer Loader2

interface User {
  id: number;
  role: string;
  nom: string;
  prenom: string;
  username: string; // Ajouter username pour un affichage potentiellement plus utile
}

interface DepartmentFormData {
  name: string;
  description: string;
  responsable_id: string; // Garder string pour la valeur du select
}

// --- AJOUT: URL API Locale ---
const API_BASE_URL = "https://www.backend.lnb-intranet.globalitnet.org"; // Ou votre URL de production
const API_URLS = {
  LIST_USERS: `${API_BASE_URL}/utilisateurs/user-gestion/list-all-users/`,
  CREATE_DEPARTMENT: `${API_BASE_URL}/services/departments/create/`,
};
// --- FIN AJOUT ---

export default function AddDepartment() {
  const router = useRouter();
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: "",
    description: "",
    responsable_id: "", // Initialisé à vide
  });

  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(true); // État pour le chargement des utilisateurs

  useEffect(() => {
    const fetchUsers = async () => {
      setIsFetchingUsers(true); // Début du chargement des utilisateurs
      setError(null); // Réinitialiser l'erreur
      const token = Cookies.get('authTokens');
      if (!token) {
        setError("Non authentifié. Impossible de charger les utilisateurs.");
        setIsFetchingUsers(false);
        return;
      }

      let accessToken;
      try {
        accessToken = JSON.parse(token).access;
      } catch {
        setError("Session invalide. Veuillez vous reconnecter.");
        setIsFetchingUsers(false);
        return;
      }

      try {
        // --- MODIFICATION: Utilisation de l'URL locale ---
        const response = await fetch(API_URLS.LIST_USERS, {
        // --- FIN MODIFICATION ---
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          let errorMsg = `Erreur HTTP: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.detail || errorMsg;
          } catch { /* Ignorer */ }
          throw new Error(errorMsg);
        }
        const data = await response.json();
        // --- MODIFICATION: Ajustement à la structure de réponse locale (supposée) ---
        // Si l'API locale retourne directement un tableau d'utilisateurs:
        if (Array.isArray(data)) {
            setUsers(data);
        // Si l'API locale retourne { utilisateurs: [...] } comme l'ancienne:
        } else if (data && Array.isArray(data.utilisateurs)) {
           setUsers(data.utilisateurs);
        }
        // --- FIN MODIFICATION ---
        else {
          console.warn("Structure de données utilisateurs inattendue:", data);
          setUsers([]);
          setError("Réponse inattendue pour la liste des utilisateurs.");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs:", error);
        setError(error instanceof Error ? error.message : "Impossible de charger la liste des utilisateurs.");
        setUsers([]); // Vider en cas d'erreur
      } finally {
        setIsFetchingUsers(false); // Fin du chargement des utilisateurs
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    console.log("[handleSubmit] Début de la soumission."); // Log début

    const token = Cookies.get('authTokens');
    if (!token) {
      setError("Non authentifié");
      setIsLoading(false);
      console.error("[handleSubmit] Erreur: Token d'authentification manquant."); // Log erreur token
      return;
    }

    let accessToken;
     try {
       accessToken = JSON.parse(token).access;
       console.log("[handleSubmit] Token d'accès obtenu."); // Log token OK
     } catch {
       setError("Session invalide. Veuillez vous reconnecter.");
       setIsLoading(false);
       console.error("[handleSubmit] Erreur: Impossible de parser le token."); // Log erreur parsing token
       return;
     }

    const payload = {
      name: formData.name,
      description: formData.description,
      responsable_id: formData.responsable_id ? parseInt(formData.responsable_id) : null,
    };
    console.log("[handleSubmit] Payload préparé:", JSON.stringify(payload)); // Log payload

    try {
      console.log(`[handleSubmit] Envoi de la requête POST vers ${API_URLS.CREATE_DEPARTMENT}`); // Log avant fetch
      const response = await fetch(API_URLS.CREATE_DEPARTMENT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      console.log(`[handleSubmit] Réponse reçue avec statut: ${response.status}`); // Log statut réponse

      if (!response.ok) {
        let errorMsg = `Erreur HTTP: ${response.status}`;
        let errorData: unknown = null; // Utiliser unknown
        try {
          errorData = await response.json();
          console.error("[handleSubmit] Données d'erreur API:", errorData); // Log données erreur API
          // Essayer de récupérer des détails d'erreur plus spécifiques
          if (errorData && typeof errorData === 'object') {
             errorMsg = Object.entries(errorData)
               .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`) // S'assurer que value est une string
               .join('; ') || errorMsg;
          } else if (errorData && typeof errorData === 'string') {
             errorMsg = errorData;
          }
        } catch (parseError: unknown) { // Utiliser unknown
            console.error("[handleSubmit] Impossible de parser la réponse d'erreur JSON:", parseError); // Log erreur parsing JSON
            try {
                const textResponse = await response.text();
                console.error("[handleSubmit] Réponse d'erreur texte:", textResponse); // Log réponse texte si JSON échoue
                errorMsg = textResponse || errorMsg; // Utiliser la réponse texte si disponible
            } catch { /* Ignorer si text() échoue aussi */ }
        }
        throw new Error(errorMsg);
      }

      // --- AJOUT: Log de la réponse en cas de succès ---
      try {
        const successData = await response.json();
        console.log("[handleSubmit] Création réussie ! Réponse API:", successData); // Log succès + données API
      } catch (parseError: unknown) { // Utiliser unknown
        console.warn("[handleSubmit] Création réussie (statut OK), mais impossible de parser la réponse JSON:", parseError);
        // Tenter de lire comme texte si le JSON échoue même avec un statut OK
        try {
            const textResponse = await response.text();
            console.log("[handleSubmit] Réponse texte (succès):", textResponse);
        } catch { /* Ignorer */ }
      }
      // --- FIN AJOUT ---

      // Optionnel: Afficher une notification de succès avant de rediriger
      // alert("Département créé avec succès !");

      console.log("[handleSubmit] Redirection vers /departement..."); // Log avant redirection
      router.push("/organisations/departement"); // Redirection vers la liste

    } catch (error: unknown) { // Utiliser unknown
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue lors de la création";
      console.error("[handleSubmit] Erreur catch:", error); // Log erreur catchée
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      console.log("[handleSubmit] Fin de la soumission."); // Log fin
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
                Description <span className="text-red-500">*</span>
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
              {/* --- MODIFICATION: Label sans astérisque --- */}
              <label htmlFor="responsable_id" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Responsable (Optionnel)
              </label>
              {/* --- FIN MODIFICATION --- */}
              <select
                id="responsable_id"
                value={formData.responsable_id}
                onChange={(e) => setFormData({ ...formData, responsable_id: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                // --- MODIFICATION: Suppression de 'required' ---
                // required
                // --- FIN MODIFICATION ---
                disabled={isFetchingUsers} // Désactiver pendant le chargement des users
              >
                <option value="">{isFetchingUsers ? "Chargement..." : "Aucun responsable sélectionné"}</option>
                {!isFetchingUsers && users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {/* Affichage amélioré: Prénom Nom (Username) */}
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
                onClick={() => router.back()} // Utiliser router.back() pour revenir à la page précédente
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading || isFetchingUsers} // Désactiver aussi si les users chargent
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