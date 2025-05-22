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
// Assurez-vous que Modal, Input, Button, etc. sont importés depuis votre bibliothèque UI
// Exemple: import { Modal, Input, Button } from '@/components/ui'; 
import { PlusIcon, PencilIcon, TrashBinIcon} from "@/icons";
import Cookies from 'js-cookie';
import { Modal } from "@/components/ui/modal/index";
import { Loader2 } from 'lucide-react';
import { Tooltip } from 'react-tooltip';

// Interface simplifiée selon l'API list-services
interface Service {
  id: number;
  name: string;
  description?: string; // Optionnel ? À vérifier selon l'API
  department: {
    id: number;
    name: string;
  } | null;
  function?: { id: number; name: string } | null; // Ajout de la propriété function
  chef: {
    id: number;
    username: string;
  } | null;
}

// AJOUTER EN HAUT DU FICHIER
interface ServiceDetail {
  id: number;
  name: string;
  description?: string;
  department: { id: number; name: string } | null;
  function?: { id: number; name: string } | null;
  chef: { id: number; username: string } | null;
}

interface Department {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  // Ajoutez d'autres champs si nécessaire depuis l'API
}

interface Function {
  id: number;
  name: string;
  // Ajoutez d'autres champs si nécessaire depuis l'API
}

// Composant Modal (exemple basique, à adapter/remplacer par votre composant UI)
const EditServiceModal = ({ service, onClose, onSave }: { service: Service | null, onClose: () => void, onSave: (updatedService: Service) => void }) => {
  const [formData, setFormData] = useState<Partial<Service>>(service || {});
  // États pour stocker les listes
  const [departments, setDepartments] = useState<Department[]>([]); // Correction: Utiliser Department[]
  const [users, setUsers] = useState<User[]>([]); // Correction: Utiliser User[]
  const [functions, setFunctions] = useState<Function[]>([]); // Correction: Utiliser Function[]
  const [isLoadingOptions, setIsLoadingOptions] = useState(true); // Optionnel: pour l'UX

  useEffect(() => {
    setFormData(service || {});

    const fetchOptions = async () => {
      setIsLoadingOptions(true);
      const token = Cookies.get('authTokens');
      if (!token) {
        console.error("Token manquant pour charger les options");
        setIsLoadingOptions(false);
        return;
      }
      const accessToken = JSON.parse(token).access;
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      };

      try {
        const [deptResponse, userResponse, funcResponse] = await Promise.all([
          fetch("https://www.backend.lnb-intranet.globalitnet.org/services/departments/", { headers }),
          fetch("https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/list-all-users/", { headers }),
          fetch("https://www.backend.lnb-intranet.globalitnet.org/services/functions/", { headers }),
        ]);

        if (!deptResponse.ok || !userResponse.ok || !funcResponse.ok) {
          console.error("Erreur lors du chargement des options");
        }

        const deptData = await deptResponse.json();
        const userData = await userResponse.json();
        const funcData = await funcResponse.json();

        setDepartments(deptData.departments || deptData || []);
        let usersArray: User[] = []; // Correction: Utiliser User[]
        if (Array.isArray(userData)) usersArray = userData;
        else if (Array.isArray(userData.users)) usersArray = userData.users;
        else if (Array.isArray(userData.utilisateurs)) usersArray = userData.utilisateurs;
        else usersArray = [];
        setUsers(usersArray);

        // Correction ici pour la liste des fonctions
        let functionsArray: Function[] = []; // Correction: Utiliser Function[]
        if (Array.isArray(funcData)) functionsArray = funcData;
        else if (Array.isArray(funcData.functions)) functionsArray = funcData.functions;
        else if (Array.isArray(funcData.results)) functionsArray = funcData.results;
        else functionsArray = [];
        setFunctions(functionsArray);

      } catch (error) {
        console.error("Erreur fetch options:", error);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    if (service) {
      fetchOptions();
    }
  }, [service]);

  useEffect(() => {
    const token = Cookies.get('authTokens');
    if (!token) return;
    const accessToken = JSON.parse(token).access;
    const headers = { "Authorization": `Bearer ${accessToken}` };

    // Départements
    fetch("https://www.backend.lnb-intranet.globalitnet.org/services/departments/", { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDepartments(data);
        else if (Array.isArray(data.departments)) setDepartments(data.departments);
        else if (Array.isArray(data.results)) setDepartments(data.results);
        else setDepartments([]);
      });

    // Utilisateurs
    fetch("https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/list-all-users/", { headers })
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data) ? data : data.users || data.utilisateurs || []));

    // Fonctions (si une API existe, à adapter)
    fetch("https://www.backend.lnb-intranet.globalitnet.org/services/list-services/", { headers })
      .then(res => res.json())
      .then(data => setFunctions(Array.isArray(data) ? data : data.functions || data.results || []));
  }, []);

  if (!service) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { // Ajouter HTMLTextAreaElement
    const { name, value } = e.target;
    if (name === 'name') {
      setFormData(prev => ({ ...prev, name: value }));
    } else if (name === 'description') { // Gérer la description
      setFormData(prev => ({ ...prev, description: value }));
    } else if (name === 'department_id') {
      const departmentId = value ? parseInt(value, 10) : null;
      setFormData(prev => ({
        ...prev,
        department: departmentId ? { id: departmentId, name: '' } : null
      }));
    } else if (name === 'chef_id') {
      const chefId = value ? parseInt(value, 10) : null;
      setFormData(prev => ({
        ...prev,
        chef: chefId ? { id: chefId, username: '' } : null
      }));
    } else if (name === 'function_id') {
      const functionId = value ? parseInt(value, 10) : null;
      setFormData(prev => ({
        ...prev,
        function: functionId ? { id: functionId, name: '' } : undefined
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 dark:text-white">Modifier le Service</h2>
        <div className="space-y-4">
          {/* Champ Nom (existant) */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom du Service</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Champ Description (à ajouter) */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description || ''}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Champ Département (Select - à ajouter) */}
          <div>
            <label htmlFor="department_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Département</label>
            <select
              id="department_id"
              name="department_id"
              value={formData.department?.id || ''} // Utiliser l'ID du département dans formData
              onChange={handleChange}
              disabled={isLoadingOptions} // Désactiver pendant le chargement
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value="">{isLoadingOptions ? "Chargement..." : "-- Sélectionner --"}</option>
              {departments.map(dep => (
                <option key={dep.id} value={dep.id}>{dep.name}</option>
              ))}
            </select>
          </div>

          {/* Champ Chef (Select - à ajouter) */}
          <div>
            <label htmlFor="chef_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Chef de Service</label>
            <select
              id="chef_id"
              name="chef_id"
              value={formData.chef?.id || ''} // Utiliser l'ID du chef dans formData
              onChange={handleChange}
              disabled={isLoadingOptions} // Désactiver pendant le chargement
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value="">{isLoadingOptions ? "Chargement..." : "-- Sélectionner --"}</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.username}</option>
              ))}
            </select>
          </div>

          {/* Ajouter le champ pour function_id si nécessaire */}
          <div>
            <label htmlFor="function_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fonction</label>
            <select
              id="function_id"
              name="function_id"
              value={formData.function?.id || ''} // Utiliser l'ID de la fonction dans formData
              onChange={handleChange}
              disabled={isLoadingOptions} // Désactiver pendant le chargement
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value="">{isLoadingOptions ? "Chargement..." : "-- Sélectionner --"}</option>
              {functions.map(func => (
                <option key={func.id} value={func.id}>{func.name}</option>
              ))}
            </select>
          </div>

        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              if (formData && formData.name) {
                onSave(formData as Service);
              }
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

const NOT_AVAILABLE = "Non renseigné";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Ajouter un état de chargement
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [_showAddModal, _setShowAddModal] = useState(false); // Gardé pour cohérence si vous avez un modal d'ajout
  const [showEditModal, setShowEditModal] = useState(false); // État pour le modal de modification
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null); // État pour le service à modifier
  // const [_notification, setNotification] = useState<{ 
  //   type: "success" | "error"; 
  //   message: string 
  // } | null>(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [serviceDetail, setServiceDetail] = useState<ServiceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchServiceDetail = async (serviceId: number) => {
    setDetailLoading(true);
    setDetailError(null);
    setShowDetailModal(true);
    try {
      const token = Cookies.get('authTokens');
      if (!token) throw new Error("Non authentifié");
      const accessToken = JSON.parse(token).access;
      const response = await fetch(`https://www.backend.lnb-intranet.globalitnet.org/services/services/${serviceId}/`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
        },
      });
      if (!response.ok) throw new Error("Erreur lors de la récupération du service");
      const data = await response.json();
      setServiceDetail(data);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Erreur inconnue");
      setServiceDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const renderDetailModal = () => (
    <Modal
      isOpen={showDetailModal}
      onClose={() => setShowDetailModal(false)}
      className="max-w-md"
    >
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Détails du Service
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
        {!detailLoading && !detailError && serviceDetail && (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p><strong>Nom :</strong> {serviceDetail.name || NOT_AVAILABLE}</p>
            <p><strong>Description :</strong> {serviceDetail.description || NOT_AVAILABLE}</p>
            <p><strong>Département :</strong> {serviceDetail.department?.name || NOT_AVAILABLE}</p>
            <p><strong>Fonction :</strong> {serviceDetail.function?.name || NOT_AVAILABLE}</p>
            <p><strong>Chef :</strong> {serviceDetail.chef?.username || NOT_AVAILABLE}</p>
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setShowDetailModal(false)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );

  const renderEditModal = () => (
    showEditModal && serviceToEdit && (
      <EditServiceModal
        service={serviceToEdit}
        onClose={() => {
          setShowEditModal(false);
          setServiceToEdit(null);
        }}
        onSave={handleSaveService}
      />
    )
  );


  const fetchServices = async () => {
    setIsLoading(true); // Commence le chargement
    setError(null); // Réinitialise l'erreur
    const token = Cookies.get('authTokens');
    if (!token) {
      setError("Non authentifié. Impossible de récupérer les services.");
      setIsLoading(false);
      return;
    }

    try {
      const accessToken = JSON.parse(token).access;
      // **Vérifiez cette URL**
      const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/services/list-services/", { 
        method: "GET", // Assurez-vous que c'est GET
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`, // Assurez-vous que le token est nécessaire et correct
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log("Services récupérés:", data); 

      // MODIFICATION ICI: Vérifier si data.services est un tableau
      if (data && Array.isArray(data.services)) {
          setServices(data.services); // Utiliser data.services au lieu de data
      } else {
          console.error("La propriété 'services' dans la réponse de l'API n'est pas un tableau ou est manquante:", data);
          setServices([]); // Garder la liste vide en cas de format inattendu
      }

    } catch (err) {
      console.error("Erreur lors de la récupération des services:", err);
      setError(`Impossible de charger les services. ${err instanceof Error ? err.message : ''}`);
      setServices([]); // Vider les services en cas d'erreur
    } finally {
      setIsLoading(false); // Fin du chargement
    }
  };


  useEffect(() => {
    fetchServices();
  }, []); // Le tableau vide assure que l'effet s'exécute une seule fois au montage

  const handleDeleteServices = async (serviceIds: number[]) => {
    // ... (code existant pour la suppression) ...
    const token = Cookies.get('authTokens');
    if (!token) {
      console.error("Token d'accès introuvable");
      setError("Non authentifié");
      return;
    }

    const accessToken = JSON.parse(token).access;
    try {
      const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/services/delete-services/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ service_ids: serviceIds }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      setServices((prevServices) =>
        prevServices.filter((service) => !serviceIds.includes(service.id))
      );
      setSelectedServices([]); // Vider la sélection après suppression
      setNotification({ type: "success", message: "Services supprimés avec succès." });
    } catch (error) {
      console.error("Erreur lors de la suppression des services:", error);
      setNotification({ type: "error", message: "Impossible de supprimer les services." });
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    const token = Cookies.get('authTokens');
    if (!token) return;
    const accessToken = JSON.parse(token).access;
    try {
      const response = await fetch(`https://www.backend.lnb-intranet.globalitnet.org/services/delete-service/${serviceId}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error("Erreur lors de la suppression");
      setServices(prev => prev.filter(s => s.id !== serviceId));
      setNotification({ type: "success", message: "Service supprimé." });
    } catch {
      setNotification({ type: "error", message: "Erreur lors de la suppression." });
    }
  };

  // Fonction pour ouvrir le modal de modification
  const handleOpenEditModal = () => {
    if (selectedServices.length === 1) {
      const service = services.find(s => s.id === selectedServices[0]);
      if (service) {
        setServiceToEdit(service);
        setShowEditModal(true);
      }
    }
  };

  // Fonction pour gérer la sauvegarde (appel API)
  const handleSaveService = async (updatedFormData: Partial<Service>) => { // updatedFormData vient du modal
    const token = Cookies.get('authTokens');
    if (!token || !serviceToEdit) {
      setError("Erreur: Non authentifié ou service non sélectionné pour la modification.");
      setNotification({ type: "error", message: "Non authentifié ou service non sélectionné." });
      return;
    }
    const accessToken = JSON.parse(token).access;

    // Utilisation de l'URL en ligne
    const apiUrl = `https://www.backend.lnb-intranet.globalitnet.org/services/update-service/${serviceToEdit.id}/`;

    // Construction du corps de la requête basé sur l'exemple curl et les données du formulaire
    const requestBody = {
      name: updatedFormData.name || serviceToEdit.name, // Prend la nouvelle valeur ou l'ancienne si non modifiée
      description: updatedFormData.description || serviceToEdit.description || "", // Ajouter si géré dans le modal
      // Récupérer les IDs depuis formData (le modal doit les stocker !)
      department_id: updatedFormData.department?.id ?? serviceToEdit.department?.id ?? null,
      chef_id: updatedFormData.chef?.id ?? serviceToEdit.chef?.id ?? null,
      // function_id: updatedFormData.function?.id ?? serviceToEdit.function?.id ?? null, // Ajouter si géré
    };

    // Filtrer les clés nulles si l'API ne les accepte pas (optionnel)
    // Object.keys(requestBody).forEach(key => {
    //   if (requestBody[key as keyof typeof requestBody] === null) {
    //     delete requestBody[key as keyof typeof requestBody];
    //   }
    // });

    console.log("Envoi de la requête PUT vers:", apiUrl);
    console.log("Corps de la requête:", JSON.stringify(requestBody));


    try {
      const response = await fetch(apiUrl, {
        method: "PUT", // Méthode PUT comme dans l'exemple curl
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          // 'accept: application/json' est généralement implicite avec fetch pour le Content-Type JSON
        },
        body: JSON.stringify(requestBody), // Envoyer l'objet construit
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json(); // Essayer de lire le corps de l'erreur
        } catch {
          errorData = { detail: response.statusText }; // Fallback si le corps n'est pas JSON
        }
        console.error("Détails de l'erreur API:", errorData);
        throw new Error(`Erreur HTTP: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const savedService = await response.json(); // L'API devrait retourner le service mis à jour
      console.log("Service mis à jour reçu:", savedService);

      // Mettre à jour l'état local avec la réponse de l'API
      setServices(prevServices =>
        prevServices.map(s => (s.id === savedService.id ? savedService : s))
      );
      setShowEditModal(false);
      setServiceToEdit(null);
      setNotification({ type: "success", message: "Service modifié avec succès." });
      fetchServices();
    } catch (error) {
      console.error("Erreur lors de la modification du service:", error);
      setNotification({ type: "error", message: `Impossible de modifier le service. ${error instanceof Error ? error.message : ''}` });
      // Garder le modal ouvert en cas d'erreur
    }
  };

  const _handleCreateService = async (formData: {
    name: string;
    description: string;
    department_id: number;
    function_id: number;
    chef_id: number;
  }) => {
    const token = Cookies.get('authTokens');
    if (!token) return;
    const accessToken = JSON.parse(token).access;
    try {
      const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/services/create-service/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Erreur lors de la création du service");
      const newService = await response.json();
      setServices(prev => [...prev, newService]);
      setNotification({ type: "success", message: "Service créé avec succès." });
    } catch {
      setNotification({ type: "error", message: "Erreur lors de la création du service." });
    }
  };

  // Sécurisation de la fonction filter avec vérification de type
  const filteredServices = Array.isArray(services) 
    ? services.filter(service => {
        if (!searchQuery) return true;
        const searchLower = searchQuery.toLowerCase();
        return service?.name?.toLowerCase()?.includes(searchLower) ?? false;
      })
    : [];

  // Afficher un message de chargement
  if (isLoading) {
    return <div>Chargement des services...</div>;
  }

  return (
    <div>
      <Tooltip id="service-tooltip" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full">
          {/* Barre d'actions */}
          <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Services
              </h1>
              {/* Barre de recherche */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher un service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/organisations/services/addservice/">
                <button
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Nouveau
                </button>
              </Link>
              {selectedServices.length > 0 && (
                <div className="flex gap-2">
                  <button
                    disabled={selectedServices.length !== 1}
                    onClick={handleOpenEditModal}
                    className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                      selectedServices.length === 1
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    data-tooltip-id="service-tooltip"
                    data-tooltip-content={selectedServices.length === 1 ? "Modifier le service sélectionné" : "Sélectionnez un seul service pour modifier"}
                  >
                    <PencilIcon className="w-5 h-5 mr-2" />
                    Modifier
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedServices.length} service(s) ?`)) {
                        handleDeleteServices(selectedServices);
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    data-tooltip-id="service-tooltip"
                    data-tooltip-content={`Supprimer ${selectedServices.length} service(s) sélectionné(s)`}
                  >
                    <TrashBinIcon className="w-5 h-5 mr-2" />
                    Supprimer ({selectedServices.length})
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
          {error && !isLoading && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md flex items-center gap-3 text-sm">
              <span>{error}</span>
            </div>
          )}

          {/* Loader */}
          {isLoading && (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">Chargement des services...</p>
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mt-4" />
            </div>
          )}

          {/* Vide */}
          {!isLoading && !error && filteredServices.length === 0 && (
            <div className="text-center py-10 px-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                {searchQuery ? "Aucun service ne correspond à votre recherche" : "Aucun service trouvé"}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                {searchQuery ? "Essayez d'autres termes de recherche." : "Vous pouvez ajouter un nouveau service."}
              </p>
            </div>
          )}

          {/* Tableau */}
          {!isLoading && filteredServices.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] w-full">
              <div className="w-full overflow-x-auto">
                <Table className="w-full">
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50 dark:bg-gray-800">
                    <TableRow>
                      <TableCell isHeader className="w-10 px-5 py-3">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            const allIds = filteredServices.map(s => s.id);
                            setSelectedServices(e.target.checked ? allIds : []);
                          }}
                          checked={selectedServices.length === filteredServices.length && filteredServices.length > 0}
                          className="rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                          aria-label="Sélectionner tous les services visibles"
                        />
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm">Nom</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm">Département</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm">Chef</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm">Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {filteredServices.map((service) => (
                      <TableRow key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <TableCell className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(service.id)}
                            onChange={() => {
                              const isSelected = selectedServices.includes(service.id);
                              setSelectedServices(
                                isSelected
                                  ? selectedServices.filter(id => id !== service.id)
                                  : [...selectedServices, service.id]
                              );
                            }}
                            className="rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                            aria-label={`Sélectionner le service ${service.name || ''}`}
                          />
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-sm font-medium text-gray-800 dark:text-gray-100">
                          {service.name || NOT_AVAILABLE}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-sm text-gray-600 dark:text-gray-400">
                          {service.department?.name || NOT_AVAILABLE}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-sm text-gray-600 dark:text-gray-400">
                          {service.chef?.username || NOT_AVAILABLE}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => fetchServiceDetail(service.id)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                              title="Voir les détails"
                              data-tooltip-id="service-tooltip"
                              data-tooltip-content="Voir les détails"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setServiceToEdit(service);
                                setShowEditModal(true);
                              }}
                              className="p-1.5 text-yellow-500 hover:text-yellow-700 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-colors"
                              title="Modifier"
                              data-tooltip-id="service-tooltip"
                              data-tooltip-content="Modifier"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
                                  handleDeleteService(service.id);
                                }
                              }}
                              className="p-1.5 text-red-600 hover:text-red-800 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                              title="Supprimer"
                              data-tooltip-id="service-tooltip"
                              data-tooltip-content="Supprimer"
                            >
                              <TrashBinIcon className="w-5 h-5" />
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
      {renderDetailModal()}
      {renderEditModal()}
    </div>
  );
}