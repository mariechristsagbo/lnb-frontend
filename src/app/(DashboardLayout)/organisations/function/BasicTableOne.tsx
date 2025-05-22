"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// --- MODIFICATION Icons ---
import { PlusIcon, TrashBinIcon, EyeIcon, PencilIcon } from "@/icons"; // Ajoute PencilIcon
// --- FIN MODIFICATION ---
import Cookies from 'js-cookie';
import Link from 'next/link';
import { Tooltip } from 'react-tooltip';
// --- AJOUT: Import Modal et Loader ---
import { Modal } from "@/components/ui/modal/index"; // Assurez-vous que le chemin est correct
import { Loader2 } from 'lucide-react'; // Pour l'indicateur de chargement
// --- FIN AJOUT ---


// --- MODIFICATION: Interface Function ---
interface Function {
  id: number;
  name: string;
  description: string;
  department: {
    id: number;
    name: string;
  } | null;
  created_at?: string; // Rendre optionnel car non présent dans l'API de détail
  updated_at?: string; // Rendre optionnel car non présent dans l'API de détail
}
// --- FIN MODIFICATION ---

// --- Constante pour les textes ---
const NOT_AVAILABLE = "Non renseigné";

// --- AJOUT: URL API Locale ---
const API_BASE_URL = "https://www.backend.lnb-intranet.globalitnet.org"; // Ou votre URL de production
const API_URLS = {
  GET_FUNCTIONS: `${API_BASE_URL}/services/functions/`,
  CREATE_FUNCTION: `${API_BASE_URL}/services/functions/create/`,
  DELETE_FUNCTION: (id: number) => `${API_BASE_URL}/services/functions/${id}/delete/`,
  GET_FUNCTION_DETAILS: (id: number) => `${API_BASE_URL}/services/functions/${id}/`,
  UPDATE_FUNCTION: (id: number) => `${API_BASE_URL}/services/functions/${id}/update/`, // <-- AJOUT
};
// --- FIN AJOUT ---


export default function FunctionsPage() {
  // --- États ---
  const [functions, setFunctions] = useState<Function[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedFunctions, setSelectedFunctions] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  // --- AJOUT: États pour la modale de détails ---
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedFunctionDetails, setSelectedFunctionDetails] = useState<Function | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  // --- FIN AJOUT ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<{ id: number; name: string; description: string; department_id: number } | null>(null);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);

  // --- Fonction de suppression (adaptée à l'API locale) ---
  const handleDeleteFunctions = async (functionIds: number[]) => {
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

    setNotification({ type: "success", message: `Suppression de ${functionIds.length} fonction(s) en cours...` });

    try {
      const deletePromises = functionIds.map(id =>
        // --- MODIFICATION: Utilisation de l'URL locale ---
        fetch(API_URLS.DELETE_FUNCTION(id), {
        // --- FIN MODIFICATION ---
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "application/json", // Ajouté par cohérence
          },
        })
      );

      const responses = await Promise.all(deletePromises);

      const failedDeletes = responses.filter(res => !res.ok);
      if (failedDeletes.length > 0) {
        let errorMsg = `Erreur lors de la suppression de ${failedDeletes.length} fonction(s).`;
        try {
          const firstFailedResponse = failedDeletes[0];
          if (firstFailedResponse && firstFailedResponse.status !== 204) {
            const errorData = await firstFailedResponse.json();
            errorMsg = errorData.detail || `Erreur HTTP: ${firstFailedResponse.status}`;
          } else if (firstFailedResponse) {
             errorMsg = `Erreur HTTP: ${firstFailedResponse.status}`;
          }
        } catch { /* Ignorer */ }
        throw new Error(errorMsg);
      }

      setFunctions((prev) => prev.filter((func) => !functionIds.includes(func.id)));
      setSelectedFunctions([]);
      setNotification({ type: "success", message: "Fonction(s) supprimée(s) avec succès." });

    } catch (error) {
      console.error("Erreur lors de la suppression des fonctions:", error);
      setNotification({ type: "error", message: error instanceof Error ? error.message : "Impossible de supprimer les fonctions." });
    }
  };

  // --- Fonction pour formater la date ---
  const _formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return NOT_AVAILABLE;
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        // Optionnel: ajouter l'heure
        // hour: '2-digit',
        // minute: '2-digit',
      });
    } catch (e) {
      console.error("Erreur de formatage de date:", e);
      return NOT_AVAILABLE;
    }
  };

  // --- AJOUT: Fonction pour récupérer les détails d'une fonction ---
  const fetchFunctionDetails = async (functionId: number) => {
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setSelectedFunctionDetails(null);

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
      // --- MODIFICATION: Utilisation de l'URL locale ---
      const response = await fetch(API_URLS.GET_FUNCTION_DETAILS(functionId), {
      // --- FIN MODIFICATION ---
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

      const data: Function = await response.json();
      setSelectedFunctionDetails(data);

    } catch (error) {
      console.error("Erreur lors de la récupération des détails de la fonction:", error);
      setDetailError(error instanceof Error ? error.message : "Impossible de charger les détails.");
    } finally {
      setDetailLoading(false);
    }
  };
  // --- FIN AJOUT ---

  const updateFunction = async (id: number, payload: { name: string; description: string; department_id: number }) => {
    const token = Cookies.get('authTokens');
    if (!token) {
      setNotification({ type: "error", message: "Non authentifié. Impossible de modifier." });
      return;
    }
  
    let accessToken;
    try {
      accessToken = JSON.parse(token).access;
    } catch {
      setNotification({ type: "error", message: "Session invalide. Veuillez vous reconnecter." });
      return;
    }
  
    try {
      const response = await fetch(API_URLS.UPDATE_FUNCTION(id), {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        let errorMsg = `Erreur HTTP: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorMsg;
        } catch { /* Ignorer */ }
        throw new Error(errorMsg);
      }
  
      setNotification({ type: "success", message: "Fonction modifiée avec succès." });
      // Optionnel : recharger la liste
      // fetchFunctions();
    } catch (error) {
      setNotification({ type: "error", message: error instanceof Error ? error.message : "Impossible de modifier la fonction." });
    }
  };

  const openEditModal = (func: Function) => {
    setEditForm({
      id: func.id,
      name: func.name || "",
      description: func.description || "",
      department_id: func.department?.id || 0,
    });
    // Recharge les départements si la liste est vide
    if (departments.length === 0) {
      (async () => {
        const token = Cookies.get('authTokens');
        if (!token) return;
        let accessToken;
        try {
          accessToken = JSON.parse(token).access;
        } catch {
          return;
        }
        try {
          const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/services/departments/", {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Accept": "application/json",
            },
          });
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) setDepartments(data);
            else if (data && Array.isArray(data.results)) setDepartments(data.results);
          }
        } catch{
          console.error("Erreur lors du chargement des départements:");
        }
      })();
    }
    setIsEditModalOpen(true);
  };

  // --- useEffect pour charger les fonctions (adapté à l'API locale) ---
  useEffect(() => {
    async function fetchFunctions() {
      setLoading(true);
      setError(null);
      setNotification(null); // Effacer les anciennes notifications
      const token = Cookies.get('authTokens');
      if (!token) {
        console.error("Token d'accès introuvable");
        setError("Non authentifié. Impossible de charger les fonctions.");
        setLoading(false);
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

      console.log("Token d'accès trouvé. Tentative de récupération des fonctions...");
      try {
        // --- MODIFICATION: Utilisation de l'URL locale ---
        const response = await fetch(API_URLS.GET_FUNCTIONS, {
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
            errorMsg = errorData.detail || errorMsg;
          } catch { /* Ignorer */ }
          throw new Error(errorMsg);
        }

        const data = await response.json();
        // L'API semble retourner directement le tableau, ajustons la vérification
        if (Array.isArray(data)) {
          console.log("Fonctions récupérées avec succès:", data);
          setFunctions(data);
        } else if (data && Array.isArray(data.functions)) { // Garder la vérification précédente au cas où
           console.log("Fonctions récupérées avec succès (structure imbriquée):", data.functions);
           setFunctions(data.functions);
        }
         else {
          console.warn("Structure de données inattendue reçue de l'API:", data);
          setFunctions([]);
          setError("Réponse inattendue du serveur.");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des fonctions:", error);
        setError(error instanceof Error ? error.message : "Impossible de charger les fonctions.");
        setFunctions([]); // Vider en cas d'erreur
      } finally {
        setLoading(false);
      }
    }

    fetchFunctions();
  }, []);

  useEffect(() => {
    async function fetchDepartments() {
      const token = Cookies.get('authTokens');
      if (!token) return;
      let accessToken;
      try {
        accessToken = JSON.parse(token).access;
      } catch {
        return;
      }
      try {
        const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/services/departments/", {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          console.log("Départements reçus:", data);
          if (Array.isArray(data)) setDepartments(data);
          else if (data && Array.isArray(data.departments)) setDepartments(data.departments); // <-- CORRECTION ICI
          else if (data && Array.isArray(data.results)) setDepartments(data.results);
          else setDepartments([]);
        }
      } catch (e) {
        console.error("Erreur lors du chargement des départements:", e);
        setDepartments([]);
      }
    }
    fetchDepartments();
  }, []);

  // --- Filtrage amélioré ---
  const filteredFunctions = functions.filter(func => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    const name = func.name?.toLowerCase() || '';
    const description = func.description?.toLowerCase() || '';
    const departmentName = func.department?.name?.toLowerCase() || ''; // Recherche sur le nom du département

    return name.includes(searchLower) ||
           description.includes(searchLower) ||
           departmentName.includes(searchLower);
  });

  // --- AJOUT: Fonction pour rendre la modale de détails ---
  const renderDetailModal = () => (
    <Modal
      isOpen={isDetailModalOpen}
      onClose={() => setIsDetailModalOpen(false)}
      className="max-w-md" // Ajuster la taille
    >
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Détails de la Fonction
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

        {!detailLoading && !detailError && selectedFunctionDetails && (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p><strong>ID :</strong> {selectedFunctionDetails.id}</p>
            <p><strong>Nom :</strong> {selectedFunctionDetails.name || NOT_AVAILABLE}</p>
            <p><strong>Description :</strong> {selectedFunctionDetails.description || NOT_AVAILABLE}</p>
            <p>
              <strong>Département :</strong>
              {selectedFunctionDetails.department
                ? ` ${selectedFunctionDetails.department.name} (ID: ${selectedFunctionDetails.department.id})`
                : ` ${NOT_AVAILABLE}`
              }
            </p>
            {/* Les dates ne sont pas dans l'API de détail fournie */}
            {/* <p><strong>Créé le :</strong> {formatDate(selectedFunctionDetails.created_at)}</p> */}
            {/* <p><strong>Mis à jour le :</strong> {formatDate(selectedFunctionDetails.updated_at)}</p> */}
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

  const renderEditModal = () => (
    <Modal
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      className="max-w-md"
    >
      <form
        className="p-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!editForm) return;
          await updateFunction(editForm.id, {
            name: editForm.name,
            description: editForm.description,
            department_id: editForm.department_id,
          });
          setIsEditModalOpen(false);
          // Optionnel : recharger la liste
          // fetchFunctions();
        }}
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Modifier la Fonction</h2>
        <div>
          <label className="block mb-1">Nom</label>
          <input
            type="text"
            value={editForm?.name || ""}
            onChange={e => setEditForm(f => f ? { ...f, name: e.target.value } : f)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Description</label>
          <textarea
            value={editForm?.description || ""}
            onChange={e => setEditForm(f => f ? { ...f, description: e.target.value } : f)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Département</label>
          <select
            value={editForm?.department_id || ""}
            onChange={e => setEditForm(f => f ? { ...f, department_id: Number(e.target.value) } : f)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="" disabled>Sélectionnez un département</option>
            {departments.map(dep => (
              <option key={dep.id} value={dep.id}>
                {dep.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(false)}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  );

  // --- Début du JSX retourné ---
  return (
    <div>
      {/* --- Installation Tooltip --- */}
      <Tooltip id="function-tooltip" />
      {/* --- Fin Installation --- */}

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full">
          {/* Barre d'actions */}
          <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Fonctions
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
                {/* Icône de recherche */}
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>

            <div className="flex gap-3">
              {/* --- MODIFICATION: Utilisation de Link pour Nouvelle fonction --- */}
              <Link href="/function/create/" passHref>
                <button
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Nouveau
                </button>
              </Link>
              {/* --- FIN MODIFICATION --- */}

              {selectedFunctions.length > 0 && (
                <div className="flex gap-2">
                  {/* Bouton Modifier */}
                  <button
                    disabled={selectedFunctions.length !== 1}
                    onClick={() => {
                      const func = functions.find(f => f.id === selectedFunctions[0]);
                      if (func) openEditModal(func);
                    }}
                    className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                      selectedFunctions.length === 1
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    data-tooltip-id="function-tooltip"
                    data-tooltip-content={selectedFunctions.length === 1 ? "Modifier la fonction sélectionnée" : "Sélectionnez une seule fonction pour modifier"}
                  >
                    <PencilIcon className="w-5 h-5 mr-2" />
                    Modifier
                  </button>
                  {/* Bouton Supprimer */}
                  <button
                    onClick={() => {
                      if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedFunctions.length} fonction(s) ?`)) {
                        handleDeleteFunctions(selectedFunctions);
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    data-tooltip-id="function-tooltip"
                    data-tooltip-content={`Supprimer ${selectedFunctions.length} fonction(s) sélectionnée(s)`}
                  >
                    <TrashBinIcon className="w-5 h-5 mr-2" />
                    Supprimer ({selectedFunctions.length})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notifications et Erreurs */}
          {notification && (
            <div
              className={`mb-4 p-4 rounded-md text-sm ${
                notification.type === "success" ? "bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200"
                                                : "bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200"
              }`}
            >
              {notification.message}
            </div>
          )}
          {error && !loading && ( // Afficher l'erreur principale si pas en chargement
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md flex items-center gap-3 text-sm">
              {/* Optionnel: Ajouter une icône d'alerte si disponible */}
              <span>{error}</span>
            </div>
          )}


          {/* Affichage Chargement */}
          {loading && (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">Chargement des fonctions...</p>
              <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mt-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}

          {/* Affichage si vide après chargement */}
          {!loading && !error && filteredFunctions.length === 0 && (
             <div className="text-center py-10 px-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
               <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                 {searchQuery ? "Aucune fonction ne correspond à votre recherche" : "Aucune fonction trouvée"}
               </h2>
               <p className="text-gray-500 dark:text-gray-400 mt-2">
                 {searchQuery ? "Essayez d'autres termes de recherche." : "Vous pouvez ajouter une nouvelle fonction."}
               </p>
             </div>
          )}

          {/* Table améliorée */}
          {!loading && filteredFunctions.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] w-full">
              <div className="w-full overflow-x-auto">
                <Table className="w-full">
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50 dark:bg-gray-800">
                    <TableRow>
                      <TableCell isHeader className="w-10 px-5 py-3">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            const allIds = filteredFunctions.map(f => f.id);
                            setSelectedFunctions(e.target.checked ? allIds : []);
                          }}
                          checked={selectedFunctions.length === filteredFunctions.length && filteredFunctions.length > 0}
                          className="rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                          aria-label="Sélectionner toutes les fonctions visibles"
                        />
                      </TableCell>
                      {/* <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm">ID</TableCell> */}
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm">Nom</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm">Description</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm">Département</TableCell>
                      {/* Suppression de la colonne "Créé le" */}
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {filteredFunctions.map((func) => (
                      <TableRow key={func.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <TableCell className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={selectedFunctions.includes(func.id)}
                            onChange={() => {
                              const isSelected = selectedFunctions.includes(func.id);
                              setSelectedFunctions(
                                isSelected
                                  ? selectedFunctions.filter(id => id !== func.id)
                                  : [...selectedFunctions, func.id]
                              );
                            }}
                            className="rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                            aria-label={`Sélectionner la fonction ${func.name || ''}`}
                          />
                        </TableCell>
                        {/* <TableCell className="px-5 py-4 text-start text-sm text-gray-500 dark:text-gray-400">{func.id}</TableCell> */}
                        <TableCell className="px-5 py-4 text-start text-sm font-medium text-gray-800 dark:text-gray-100">
                          {func.name || NOT_AVAILABLE}
                        </TableCell>
                        <TableCell
                          className="px-5 py-4 text-start text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate"
                          data-tooltip-id="function-tooltip"
                          data-tooltip-content={func.description || NOT_AVAILABLE}
                        >
                          {func.description || NOT_AVAILABLE}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-sm text-gray-600 dark:text-gray-400">
                          {func.department?.name || NOT_AVAILABLE}
                        </TableCell>
                        {/* Suppression de la cellule "Créé le" */}
                        <TableCell className="px-5 py-4 text-start">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => fetchFunctionDetails(func.id)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                              title="Voir les détails"
                              data-tooltip-id="function-tooltip"
                              data-tooltip-content="Voir les détails"
                            >
                              {EyeIcon ? <EyeIcon className="w-5 h-5" /> : "Voir"}
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
        </div>
      </div>
      {/* --- AJOUT: Appel pour rendre la modale --- */}
      {renderDetailModal()}
      {renderEditModal()}
      {/* --- FIN AJOUT --- */}
    </div>
  );
}