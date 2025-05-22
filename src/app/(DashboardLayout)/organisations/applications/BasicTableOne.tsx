"use client";

import React, { useState, useEffect } from "react";
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { PlusIcon } from "@/icons";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal/index";
import { OptimizedImage } from '@/components/ui/image/OptimizedImage';
import { Loader2, AlertTriangle } from 'lucide-react'; // Pour indicateurs

// --- Interfaces ---
interface Application {
  id: number;
  name: string;
  description: string;
  url: string; // Renommé de 'website' à 'url' pour correspondre à l'API
  profile_photo: string | null; // URL de l'image ou null
  file: string | null; // URL du fichier ou null
  creator_id: number; // Ajouté pour la logique potentielle
  created_at: string; // Ajouté pour info
  updated_at: string; // Ajouté pour info
}

interface NewApplicationState {
  name: string;
  description: string;
  url: string;
  profile_photo: File | null;
  file: File | null;
}

interface JwtPayload {
  exp: number;
  user_id?: number;
  [key: string]: unknown;
}

// --- Fonctions utilitaires (Authentification) ---
const getConnectedUserId = (): number | null => {
  const tokenData = Cookies.get('authTokens');
  if (!tokenData) {
    console.error("Aucun token d'authentification trouvé dans les cookies.");
    return null;
  }
  try {
    const parsedToken = JSON.parse(tokenData);
    const accessToken = parsedToken.access;
    if (!accessToken) {
      console.error("Le token d'accès est manquant dans les données des cookies.");
      return null;
    }
    const decodedToken = jwtDecode<JwtPayload>(accessToken);
    const userId = decodedToken.user_id;
    if (typeof userId === 'number') {
      return userId;
    } else {
      console.error("L'ID utilisateur n'a pas été trouvé ou n'est pas un nombre dans le token décodé.", decodedToken);
      return null;
    }
  } catch (error) {
    console.error("Erreur lors de la lecture ou du décodage du token:", error);
    return null;
  }
};

const getToken = (): string | null => {
    const tokenCookie = Cookies.get("authTokens");
    if (!tokenCookie) return null;
    try {
        const tokenData = JSON.parse(tokenCookie);
        return tokenData.access;
    } catch {
        console.error("Impossible de lire les informations de session.");
        return null;
    }
};

// --- URLs API ---
const API_BASE_URL = "https://www.backend.lnb-intranet.globalitnet.org"; // Base URL locale
const API_URLS = {
  GET_APPLICATIONS: `${API_BASE_URL}/services/applications/`, // Sera complété par /user_id/
  CREATE_APPLICATION: `${API_BASE_URL}/services/create-application/`, // Sera complété par /user_id/
};

const ApplicationsPage: React.FC = () => {
  // --- États ---
  const [applications, setApplications] = useState<Application[]>([]); // État pour les applications récupérées
  const [loading, setLoading] = useState<boolean>(true); // État de chargement
  const [error, setError] = useState<string | null>(null); // État d'erreur

  // État pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const applicationsPerPage = 6;

  // État pour le formulaire d'ajout
  const [newApplication, setNewApplication] = useState<NewApplicationState>({
    name: "",
    description: "",
    url: "",
    profile_photo: null,
    file: null,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // État pour la soumission du formulaire

  // --- Fonctions ---

  // Récupération des applications
  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    const userId = getConnectedUserId();
    const token = getToken();

    if (!userId || !token) {
      setError("Impossible de récupérer les informations utilisateur. Veuillez vous reconnecter.");
      setLoading(false);
      setApplications([]); // Vider les applications si non authentifié
      return;
    }

    try {
      const response = await fetch(`${API_URLS.GET_APPLICATIONS}${userId}/`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        // Essayer de lire le message d'erreur de l'API
        let errorMsg = `Erreur ${response.status} lors de la récupération des applications.`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorMsg;
        } catch { /* Ignorer l'erreur de parsing JSON */ }
        throw new Error(errorMsg);
      }

      const data: Application[] = await response.json();
      setApplications(data);
    } catch (err) {
      console.error("Erreur fetchApplications:", err);
      setError(err instanceof Error ? err.message : "Une erreur inconnue est survenue.");
      setApplications([]); // Vider en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  // Effet pour charger les applications au montage
  useEffect(() => {
    fetchApplications();
  }, []); // Dépendance vide pour exécuter une seule fois au montage

  // Gestion des changements dans le formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'file') {
      const fileInput = e.target as HTMLInputElement;
      setNewApplication(prevState => ({
        ...prevState,
        [name]: fileInput.files ? fileInput.files[0] : null,
      }));
    } else {
      setNewApplication(prevState => ({ ...prevState, [name]: value }));
    }
  };

  // Soumission du formulaire de création
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null); // Réinitialiser l'erreur avant la soumission

    const userId = getConnectedUserId();
    const token = getToken();

    if (!userId || !token) {
      setError("Impossible de soumettre le formulaire. Veuillez vous reconnecter.");
      setIsSubmitting(false);
      return;
    }

    // Utilisation de FormData pour envoyer les fichiers
    const formData = new FormData();
    formData.append('name', newApplication.name);
    formData.append('description', newApplication.description);
    formData.append('url', newApplication.url);
    if (newApplication.profile_photo) {
      formData.append('profile_photo', newApplication.profile_photo);
    }
    if (newApplication.file) {
      formData.append('file', newApplication.file);
    }

    try {
      const response = await fetch(`${API_URLS.CREATE_APPLICATION}${userId}/`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          // 'Content-Type': 'multipart/form-data' est défini automatiquement par le navigateur avec FormData
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = `Erreur ${response.status} lors de la création de l'application.`;
        try {
          const errorData = await response.json();
          // Gérer les erreurs de validation potentielles (ex: { field: ["error message"] })
          if (typeof errorData === 'object' && errorData !== null) {
             errorMsg = Object.entries(errorData)
               .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
               .join('; ') || errorMsg;
          } else {
             errorMsg = errorData.detail || errorMsg;
          }
        } catch { /* Ignorer l'erreur de parsing JSON */ }
        throw new Error(errorMsg);
      }

      // Succès
      console.log("Nouvelle application ajoutée avec succès");
      setIsModalOpen(false);
      // Réinitialiser le formulaire
      setNewApplication({
        name: "", description: "", url: "", profile_photo: null, file: null
      });
      // Recharger la liste des applications pour afficher la nouvelle
      fetchApplications();

    } catch (err) {
      console.error("Erreur handleSubmit:", err);
      setError(err instanceof Error ? err.message : "Une erreur inconnue est survenue lors de la création.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calcul pour la pagination basé sur l'état `applications`
  const indexOfLastApplication = currentPage * applicationsPerPage;
  const indexOfFirstApplication = indexOfLastApplication - applicationsPerPage;
  const currentApplications = applications.slice(
    indexOfFirstApplication,
    indexOfLastApplication
  );
  const totalPages = Math.ceil(applications.length / applicationsPerPage);

  // Fonction pour changer de page
  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // --- Rendu JSX ---
  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Applications
            </h1>
            <button
              onClick={() => {
                setError(null); // Nettoyer les erreurs en ouvrant la modale
                setIsModalOpen(true);
              }}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg inline-flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Ajouter une application
            </button>
          </div>

          {/* Affichage Erreur Globale */}
          {error && !isModalOpen && ( // N'affiche pas l'erreur globale si la modale est ouverte (elle a son propre affichage d'erreur)
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Affichage Chargement */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
          ) : applications.length === 0 && !error ? (
            // Affichage si aucune application et pas d'erreur
            <div className="text-center py-10 px-6 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Aucune application trouvée</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Commencez par ajouter une nouvelle application.</p>
            </div>
          ) : (
            // Grille des applications (si chargement terminé et applications existent)
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentApplications.map((app) => (
                  <div
                    key={app.id}
                    className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:scale-105"
                  >
                    {/* Image de l'application */}
                    <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                      {app.profile_photo ? (
                        <OptimizedImage
                          // Préfixer avec l'URL de base si l'API retourne des chemins relatifs
                          src={app.profile_photo.startsWith('http') ? app.profile_photo : `${API_BASE_URL}${app.profile_photo}`}
                          alt={app.name}
                          width={300}
                          height={192} // Ajusté pour le ratio h-48
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">Pas d&apos;image</span>
                      )}
                    </div>

                    {/* Contenu de la carte */}
                    <div className="p-6">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 truncate" title={app.name}>
                        {app.name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 h-10 overflow-hidden text-ellipsis">
                        {app.description}
                      </p>
                      <a
                        href={app.url} // Utilise app.url
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-300"
                      >
                        <span>Visiter le site</span>
                        {/* ... icône lien externe ... */}
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                      {/* Optionnel: Lien vers le fichier si 'app.file' existe */}
                      {app.file && (
                         <a
                           href={app.file.startsWith('http') ? app.file : `${API_BASE_URL}${app.file}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="ml-4 inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-300 text-sm"
                           title="Télécharger le fichier associé"
                         >
                           {/* Icône Fichier (exemple) */}
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                           Fichier
                         </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => paginate(i + 1)}
                      className={`mx-1 px-4 py-2 rounded-lg transition-colors duration-300 ${
                        currentPage === i + 1
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-600 hover:text-white"
                      }`}
                      disabled={currentPage === i + 1}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Modal pour le formulaire d'ajout */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => !isSubmitting && setIsModalOpen(false)} // Empêche la fermeture pendant la soumission
            className="max-w-xl"
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Ajouter une nouvelle application</h2>

              {/* Affichage Erreur dans la Modale */}
              {error && isModalOpen && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Champs Nom, Description, URL (inchangés) */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Nom de l&apos;application <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newApplication.name}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={newApplication.description}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="url" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    id="url"
                    name="url"
                    value={newApplication.url}
                    onChange={handleChange}
                    required
                    placeholder="https://example.com"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Champ Image (profile_photo) */}
                <div>
                  <label htmlFor="profile_photo" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Image de profil (Optionnel)
                  </label>
                  <input
                    type="file"
                    id="profile_photo"
                    name="profile_photo"
                    accept="image/*" // Accepter seulement les images
                    onChange={handleChange}
                    className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800 disabled:opacity-50"
                    disabled={isSubmitting}
                  />
                   {newApplication.profile_photo && <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Fichier sélectionné: {newApplication.profile_photo.name}</span>}
                </div>

                {/* Champ Fichier (file) */}
                <div>
                  <label htmlFor="file" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Fichier associé (Optionnel)
                  </label>
                  <input
                    type="file"
                    id="file"
                    name="file"
                    onChange={handleChange}
                    className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800 disabled:opacity-50"
                    disabled={isSubmitting}
                  />
                   {newApplication.file && <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Fichier sélectionné: {newApplication.file.name}</span>}
                </div>

                {/* Boutons d'action */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Annuler
                  </Button>
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ajout en cours...
                      </>
                    ) : (
                      'Ajouter'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsPage;