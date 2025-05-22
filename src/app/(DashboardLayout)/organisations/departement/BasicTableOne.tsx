"use client";

import React, { useEffect, useState } from "react";
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// --- MODIFICATION Icons ---
import { PlusIcon, PencilIcon, TrashBinIcon, UserIcon, EyeIcon } from "@/icons";
// --- FIN MODIFICATION ---
import Cookies from 'js-cookie';
import { Tooltip } from 'react-tooltip';
// --- AJOUT: Import Modal ---
import { Modal } from "@/components/ui/modal/index"; // Assurez-vous que le chemin est correct
import { Loader2 } from 'lucide-react'; // Pour l'indicateur de chargement
// --- FIN AJOUT ---

// --- MODIFICATION: Interface Department ---
interface Responsable {
  id: number;
  username: string;
  email: string;
}

interface Department {
  id: number;
  name: string;
  description: string;
  responsable: Responsable | string | null;
  functions?: string[]; // Garder optionnel si non retourné par l'API de détail
  services?: string[]; // Garder optionnel si non retourné par l'API de détail
  created_at?: string; // Garder optionnel si non retourné par l'API de détail
  updated_at?: string; // Garder optionnel si non retourné par l'API de détail
  // --- AJOUT: Champs de l'API de détail ---
  code?: string | null;
  is_active?: boolean;
  // --- FIN AJOUT ---
}
// --- FIN MODIFICATION ---

// --- Constante pour les textes ---
const NOT_AVAILABLE = "Non renseigné";

// --- MODIFICATION: URL API Locale ---
const API_BASE_URL = "https://www.backend.lnb-intranet.globalitnet.org"; // Base URL locale
const API_URLS = {
  GET_DEPARTMENTS: `${API_BASE_URL}/services/departments/`,
  DELETE_DEPARTMENT: `${API_BASE_URL}/services/departments/`, // Sera complété par /{id}/delete/
  GET_DEPARTMENT_DETAILS: `${API_BASE_URL}/services/departments/`, // Sera complété par /{id}/
};
// --- FIN MODIFICATION ---

export default function DepartmentsPage() {
  // --- États ---
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  // --- AJOUT: États pour la modale de détails ---
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDepartmentDetails, setSelectedDepartmentDetails] = useState<Department | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  // --- FIN AJOUT ---

  // --- AJOUT: États pour la modale d'édition ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDepartment, setEditDepartment] = useState<Department | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; description: string; responsable_id: number | "" }>({ name: "", description: "", responsable_id: "" });
  // --- FIN AJOUT ---

  // --- AJOUT: État pour la liste des utilisateurs ---
  const [users, setUsers] = useState<Responsable[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  // --- FIN AJOUT ---

  // --- Fonction de suppression (inchangée) ---
  const handleDeleteDepartments = async (departmentIds: number[]) => {
    const token = Cookies.get('authTokens');
    if (!token) {
      setNotification({ type: "error", message: "Non authentifié. Impossible de supprimer." });
      return;
    }

    let accessToken;
    try {
      accessToken = JSON.parse(token).access;
    } catch {
      setNotification({ type: "error", message: "Session invalide. Veuillez vous reconnecter." });
      return;

    }

    setNotification({ type: "success", message: `Suppression de ${departmentIds.length} département(s) en cours...` });

    try {
      // Envoyer une requête DELETE pour chaque ID sélectionné
      const deletePromises = departmentIds.map(id =>
        fetch(`${API_URLS.DELETE_DEPARTMENT}${id}/delete/`, { // Utilisation de la nouvelle URL
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "application/json", // Ajouté selon l'exemple curl
            // Pas de 'Content-Type' ou 'body' nécessaire pour cette API DELETE
          },
        })
      );

      const responses = await Promise.all(deletePromises);

      // Vérifier si toutes les réponses sont OK (ou 204 No Content)
      const failedDeletes = responses.filter(res => !res.ok);

      if (failedDeletes.length > 0) {
        let errorMsg = `Erreur lors de la suppression de ${failedDeletes.length} département(s).`;
        try {
          // Essayer de lire le message d'erreur de la première réponse échouée
          const firstFailedResponse = failedDeletes[0];
          if (firstFailedResponse && firstFailedResponse.status !== 204) { // Ne pas essayer de parser un 204
            const errorData = await firstFailedResponse.json();
            errorMsg = errorData.detail || `Erreur HTTP: ${firstFailedResponse.status}`;
          } else if (firstFailedResponse) {
             errorMsg = `Erreur HTTP: ${firstFailedResponse.status}`;
          }
        } catch { /* Ignorer l'erreur de parsing JSON */ }
        throw new Error(errorMsg);
      }

      // Mise à jour de l'état local si tout s'est bien passé
      setDepartments((prev) => prev.filter((d) => !departmentIds.includes(d.id)));
      setSelectedDepartments([]); // Vider la sélection
      setNotification({ type: "success", message: "Département(s) supprimé(s) avec succès." });

    } catch (error) {
      console.error("Erreur lors de la suppression des départements:", error);
      setNotification({ type: "error", message: error instanceof Error ? error.message : "Impossible de supprimer les départements." });
    }
  };

  // --- Fonction pour formater la date (inchangée) ---
  const _formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return NOT_AVAILABLE;
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      console.error("Erreur de formatage de date:", e);
      return NOT_AVAILABLE;
    }
  };

  // --- AJOUT: Fonction pour récupérer les détails d'un département ---
  const fetchDepartmentDetails = async (departmentId: number) => {
    setIsDetailModalOpen(true); // Ouvre la modale immédiatement
    setDetailLoading(true);
    setDetailError(null);
    setSelectedDepartmentDetails(null); // Réinitialiser les détails précédents

    const token = Cookies.get('authTokens');
    if (!token) {
      setDetailError("Non authentifié.");
      setDetailLoading(false);
      return;
    }

    let accessToken;
    try {
      accessToken = JSON.parse(token).access;
    } catch {
      setDetailError("Session invalide.");
      setDetailLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URLS.GET_DEPARTMENT_DETAILS}${departmentId}/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
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

      const data: Department = await response.json();
      setSelectedDepartmentDetails(data);

    } catch (error) {
      console.error("Erreur lors de la récupération des détails du département:", error);
      setDetailError(error instanceof Error ? error.message : "Impossible de charger les détails.");
    } finally {
      setDetailLoading(false);
    }
  };
  // --- FIN AJOUT ---

  // --- AJOUT: Fonction pour ouvrir la modale d'édition ---
  const openEditModal = async () => {
    if (selectedDepartments.length !== 1) return;
    const departmentId = selectedDepartments[0];
    setEditLoading(true);
    setEditError(null);
    setIsEditModalOpen(true);

    const token = Cookies.get('authTokens');
    if (!token) {
      setEditError("Non authentifié.");
      setEditLoading(false);
      return;
    }
    let accessToken;
    try {
      accessToken = JSON.parse(token).access;
    } catch {
      setEditError("Session invalide.");
      setEditLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URLS.GET_DEPARTMENT_DETAILS}${departmentId}/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
        },
      });
      if (!response.ok) throw new Error("Impossible de charger le département.");
      const data: Department = await response.json();
      setEditDepartment(data);
      setEditForm({
        name: data.name || "",
        description: data.description || "",
        responsable_id: typeof data.responsable === "object" && data.responsable ? data.responsable.id : "",
      });
    } catch {
      setEditError("Erreur lors du chargement du département.");
    } finally {
      setEditLoading(false);
    }
  };
  // --- FIN AJOUT ---

  // --- AJOUT: Fonction pour soumettre la modification ---
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDepartment) return;
    setEditLoading(true);
    setEditError(null);

    const token = Cookies.get('authTokens');
    if (!token) {
      setEditError("Non authentifié.");
      setEditLoading(false);
      return;
    }
    let accessToken;
    try {
      accessToken = JSON.parse(token).access;
    } catch {
      setEditError("Session invalide.");
      setEditLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `http://www.backend.lnb-intranet.globalitnet.org/services/departments/${editDepartment.id}/update/`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editForm.name,
            description: editForm.description,
            responsable_id: editForm.responsable_id,
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erreur lors de la modification.");
      }
      // Mettre à jour la liste locale
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === editDepartment.id
            ? {
                ...d,
                name: editForm.name,
                description: editForm.description,
                responsable:
                  typeof editForm.responsable_id === "number" && editForm.responsable_id > 0
                    ? {
                        ...(typeof d.responsable === "object" && d.responsable !== null
                          ? d.responsable
                          : { id: editForm.responsable_id, username: "", email: "" }),
                        id: editForm.responsable_id,
                      }
                    : null,
              }
            : d
        )
      );
      setNotification({ type: "success", message: "Département modifié avec succès." });
      setIsEditModalOpen(false);
      setSelectedDepartments([]);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Erreur lors de la modification.");
    } finally {
      setEditLoading(false);
    }
  };
  // --- FIN AJOUT ---

  // --- useEffect pour charger les départements (inchangé) ---
  useEffect(() => {
    async function fetchDepartments() {
      setLoading(true); // Début du chargement
      setError(null); // Réinitialiser l'erreur
      const token = Cookies.get('authTokens');
      if (!token) {
        console.error("Token d'accès introuvable");
        setError("Non authentifié. Impossible de charger les départements.");
        setLoading(false); // Fin du chargement (erreur)
        return;
      }

      let accessToken;
      try {
        accessToken = JSON.parse(token).access;
      } catch (e) {
        console.error("Erreur parsing token:", e);
        setError("Session invalide. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      console.log("Token d'accès trouvé. Tentative de récupération des départements...");
      try {
        // --- MODIFICATION: Utilisation de l'URL locale ---
        const response = await fetch(API_URLS.GET_DEPARTMENTS, {
        // --- FIN MODIFICATION ---
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          let errorMsg = `Erreur HTTP: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.detail || errorMsg; // Essayer de récupérer le message d'erreur de l'API
          } catch { /* Ignorer si pas de JSON */ }
          throw new Error(errorMsg);
        }

        const data = await response.json();
        // --- MODIFICATION: Ajustement à la structure de réponse locale (supposée) ---
        // Si l'API locale retourne directement un tableau:
        if (Array.isArray(data)) {
            setDepartments(data);
        // Si l'API locale retourne { departments: [...] } comme l'ancienne:
        } else if (data && Array.isArray(data.departments)) {
           setDepartments(data.departments);
        }
        // --- FIN MODIFICATION ---
         else {
          console.warn("Structure de données inattendue reçue de l'API:", data);
          setDepartments([]); // Mettre à vide si la structure n'est pas bonne
          setError("Réponse inattendue du serveur.");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des départements:", error);
        setError(error instanceof Error ? error.message : "Impossible de charger les départements.");
        setDepartments([]); // Vider en cas d'erreur
      } finally {
        setLoading(false); // Fin du chargement
      }
    }

    fetchDepartments();
  }, []);

  // --- AJOUT: Récupération des utilisateurs pour le select ---
  useEffect(() => {
    if (!isEditModalOpen) return;
    setUsersLoading(true);
    setUsersError(null);

    const token = Cookies.get('authTokens');
    if (!token) {
      setUsersError("Non authentifié.");
      setUsersLoading(false);
      return;
    }
    let accessToken;
    try {
      accessToken = JSON.parse(token).access;
    } catch {
      setUsersError("Session invalide.");
      setUsersLoading(false);
      return;
    }

    console.log("Début récupération des utilisateurs...");
    fetch("https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/list-all-users/", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
      },
    })
      .then(res => {
        console.log("Réponse brute utilisateurs:", res);
        if (!res.ok) throw new Error("Erreur lors du chargement des utilisateurs.");
        return res.json();
      })
      .then(data => {
        console.log("Données utilisateurs reçues:", data);
        setUsers(Array.isArray(data) ? data : data.utilisateurs || []);
      })
      .catch(err => {
        console.error("Erreur récupération utilisateurs:", err);
        setUsersError(err.message);
      })
      .finally(() => {
        console.log("Fin récupération des utilisateurs.");
        setUsersLoading(false);
      });
  }, [isEditModalOpen]);
  // --- FIN AJOUT ---

  // --- Filtrage (inchangé) ---
  const filteredDepartments = departments.filter(department => {
    const searchLower = searchQuery.toLowerCase();
    if (!searchLower) return true; // Si la recherche est vide, tout afficher

    const name = department.name?.toLowerCase() || '';
    const description = department.description?.toLowerCase() || '';
    const responsableName = (typeof department.responsable === 'object' && department.responsable?.username?.toLowerCase()) || '';
    // --- AJOUT: Recherche dans les fonctions et services ---
    const functionsString = Array.isArray(department.functions) ? department.functions.join(' ').toLowerCase() : '';
    const servicesString = Array.isArray(department.services) ? department.services.join(' ').toLowerCase() : '';
    // --- FIN AJOUT ---

    return name.includes(searchLower) ||
           description.includes(searchLower) ||
           responsableName.includes(searchLower) ||
           functionsString.includes(searchLower) || // Recherche dans les fonctions
           servicesString.includes(searchLower);   // Recherche dans les services
  });

  // --- AJOUT: Fonction pour rendre la modale de détails ---
  const renderDetailModal = () => (
    <Modal
      isOpen={isDetailModalOpen}
      onClose={() => setIsDetailModalOpen(false)}
      className="max-w-lg" // Ajuster la taille si nécessaire
    >
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Détails du Département
        </h2>

        {detailLoading && (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {detailError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md text-sm">
            {detailError}
          </div>
        )}

        {!detailLoading && !detailError && selectedDepartmentDetails && (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p><strong>ID :</strong> {selectedDepartmentDetails.id}</p>
            <p><strong>Nom :</strong> {selectedDepartmentDetails.name || NOT_AVAILABLE}</p>
            <p><strong>Code :</strong> {selectedDepartmentDetails.code || NOT_AVAILABLE}</p>
            <p><strong>Description :</strong> {selectedDepartmentDetails.description || NOT_AVAILABLE}</p>
            <p>
              <strong>Statut :</strong>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                selectedDepartmentDetails.is_active
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {selectedDepartmentDetails.is_active ? 'Actif' : 'Inactif'}
              </span>
            </p>
            <p>
              <strong>Responsable :</strong>
              {typeof selectedDepartmentDetails.responsable === "object" && selectedDepartmentDetails.responsable !== null
                ? selectedDepartmentDetails.responsable.username
                : NOT_AVAILABLE}
            </p>
            {/* Optionnel: Afficher les dates si elles sont retournées par l'API de détail */}
            {/* <p><strong>Créé le :</strong> {formatDate(selectedDepartmentDetails.created_at)}</p> */}
            {/* <p><strong>Mis à jour le :</strong> {formatDate(selectedDepartmentDetails.updated_at)}</p> */}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsDetailModalOpen(false)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
  // --- FIN AJOUT ---

  // --- AJOUT: Modale d'édition ---
  const renderEditModal = () => (
    <Modal
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      className="max-w-lg"
    >
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Modifier le Département
        </h2>
        {editLoading && (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}
        {editError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md text-sm">
            {editError}
          </div>
        )}
        {!editLoading && editDepartment && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <input
                type="text"
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Responsable</label>
              {usersLoading ? (
                <div className="text-gray-500 text-sm">Chargement des utilisateurs...</div>
              ) : usersError ? (
                <div className="text-red-500 text-sm">{usersError}</div>
              ) : (
                <select
                  value={editForm.responsable_id}
                  onChange={e => setEditForm(f => ({ ...f, responsable_id: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded"
                  required
                >
                  <option value="">Sélectionner un responsable</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
  // --- FIN AJOUT ---

  // --- Début du JSX retourné ---
  return (
    <div>
      {/* --- Installation Tooltip --- */}
      <Tooltip id="department-tooltip" />
      {/* --- Fin Installation --- */}

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full">
          {/* Barre d'actions */}
          <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Départements
              </h1>

              {/* Barre de recherche */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {/* Icône de recherche (optionnel) */}
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href="/organisations/departement/adddepartement">
                <button
                  className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Nouveau
                </button>
              </Link>

              {selectedDepartments.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={openEditModal}
                    disabled={selectedDepartments.length !== 1}
                    className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors
                      ${selectedDepartments.length === 1
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    data-tooltip-id="department-tooltip"
                    data-tooltip-content={selectedDepartments.length === 1 ? "Modifier le département sélectionné" : "Sélectionnez un seul département pour modifier"}
                  >
                    <PencilIcon className="w-5 h-5 mr-2" />
                    Modifier
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedDepartments.length} département(s) ?`)) {
                        handleDeleteDepartments(selectedDepartments);
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    data-tooltip-id="department-tooltip"
                    data-tooltip-content={`Supprimer ${selectedDepartments.length} département(s) sélectionné(s)`}
                  >
                    <TrashBinIcon className="w-5 h-5 mr-2" />
                    Supprimer ({selectedDepartments.length})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          {/* Affichage Erreur bloquante (avant la table) */}
          {error && !loading && (
            // --- MODIFICATION: Suppression AlertCircleIcon ---
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md flex items-center gap-3">
              {/* <AlertCircleIcon className="h-5 w-5 flex-shrink-0" /> */}
              <span>{error}</span>
            </div>
            // --- FIN MODIFICATION ---
          )}
          {notification && (
            <div
              className={`mb-4 p-4 rounded-md text-center ${
                notification.type === "success" ? "bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200"
                                                : "bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200"
              }`}
            >
              {notification.message}
            </div>
          )}

          {/* Affichage Chargement */}
          {loading && (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">Chargement des départements...</p>
              {/* Optionnel: ajouter un spinner */}
              <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mt-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}

          {/* Affichage si vide après chargement (et pas d'erreur bloquante) */}
          {!loading && !error && filteredDepartments.length === 0 && (
             <div className="text-center py-10 px-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
               <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                 {searchQuery ? "Aucun département ne correspond à votre recherche" : "Aucun département trouvé"}
               </h2>
               <p className="text-gray-500 dark:text-gray-400 mt-2">
                 {searchQuery ? "Essayez d'autres termes de recherche." : "Vous pouvez ajouter un nouveau département."}
               </p>
             </div>
          )}

          {/* Table améliorée (si pas en chargement et des départements à afficher) */}
          {!loading && filteredDepartments.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] w-full">
              <div className="w-full overflow-x-auto">
                <Table className="w-full">
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50 dark:bg-gray-800">
                    <TableRow>
                      <TableCell isHeader className="w-10 px-5 py-3">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            const allIds = filteredDepartments.map(d => d.id); // Utiliser filteredDepartments
                            setSelectedDepartments(e.target.checked ? allIds : []);
                          }}
                          checked={selectedDepartments.length === filteredDepartments.length && filteredDepartments.length > 0}
                          className="rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                          aria-label="Sélectionner tous les départements visibles"
                        />
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm">
                        Nom
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm">
                        Description
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm">
                        Responsable
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm">
                        Infos (Fonctions / Services)
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {filteredDepartments.map((department) => (
                      <TableRow key={department.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <TableCell className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={selectedDepartments.includes(department.id)}
                            onChange={() => {
                              const isSelected = selectedDepartments.includes(department.id);
                              setSelectedDepartments(
                                isSelected
                                  ? selectedDepartments.filter(id => id !== department.id)
                                  : [...selectedDepartments, department.id]
                              );
                            }}
                            className="rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                            aria-label={`Sélectionner le département ${department.name || ''}`}
                          />
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-sm font-medium text-gray-800 dark:text-gray-100">
                          {department.name || NOT_AVAILABLE}
                        </TableCell>
                        <TableCell
                          className="px-5 py-4 text-start text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" // Limite la largeur et tronque
                          data-tooltip-id="department-tooltip"
                          data-tooltip-content={department.description || NOT_AVAILABLE}
                        >
                          {department.description || NOT_AVAILABLE}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-sm text-gray-600 dark:text-gray-400">
                          {typeof department.responsable === "object" && department.responsable !== null ? (
                            <div className="flex items-center gap-2">
                              <UserIcon className="w-4 h-4 text-gray-500 flex-shrink-0" /> {/* Icône utilisateur */}
                              <span>{department.responsable.username}</span>
                            </div>
                          ) : (
                            NOT_AVAILABLE
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-sm text-gray-600 dark:text-gray-400">
                           {/* Badges pour Fonctions et Services */}
                           <div className="flex items-center gap-3">
                             {/* --- MODIFICATION: Suppression BriefcaseIcon --- */}
                             <span
                               className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-0.5 rounded-full"
                               data-tooltip-id="department-tooltip"
                               data-tooltip-content={Array.isArray(department.functions) && department.functions.length > 0 ? `Fonctions: ${department.functions.join(", ")}` : `Fonctions: ${NOT_AVAILABLE}`}
                             >
                               {/* <BriefcaseIcon className="w-3 h-3" /> */}
                               {`F: ${Array.isArray(department.functions) ? department.functions.length : 0}`} {/* Texte plus court */}
                             </span>
                             {/* --- FIN MODIFICATION --- */}
                             {/* --- MODIFICATION: Suppression ServerIcon --- */}
                             <span
                               className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium px-2 py-0.5 rounded-full"
                               data-tooltip-id="department-tooltip"
                               data-tooltip-content={Array.isArray(department.services) && department.services.length > 0 ? `Services: ${department.services.join(", ")}` : `Services: ${NOT_AVAILABLE}`}
                             >
                               {/* <ServerIcon className="w-3 h-3" /> */}
                               {`S: ${Array.isArray(department.services) ? department.services.length : 0}`} {/* Texte plus court */}
                             </span>
                             {/* --- FIN MODIFICATION --- */}
                           </div>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <div className="flex items-center gap-1"> {/* Réduit l'espace */}
                            <button
                              onClick={() => fetchDepartmentDetails(department.id)} // Appelle la fonction fetch
                              className="p-1.5 text-blue-600 hover:text-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                              title="Voir les détails"
                              data-tooltip-id="department-tooltip"
                              data-tooltip-content="Voir les détails"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Affichage Erreur bloquante (déplacé avant la table) */}
          {/* {!loading && error && ( ... )} */}

        </div>
      </div>
      {/* --- AJOUT: Appel pour rendre la modale --- */}
      {renderDetailModal()}
      {renderEditModal()}
      {/* --- FIN AJOUT --- */}
    </div>
  ); // --- Fin du JSX retourné ---
} // --- Fin du composant DepartmentsPage ---