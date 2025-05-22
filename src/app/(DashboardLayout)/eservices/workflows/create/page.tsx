"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, TrashBinIcon } from "@/icons";
import Cookies from 'js-cookie';
import { entityService } from '@/services/entityService';
import { jwtDecode } from 'jwt-decode';
import {
  createWorkflow,
  createWorkflowStep,
  HierarchyConfig as _ApiHierarchyConfig,
  handleAxiosError,
  updateWorkflowStartStepOrder
} from "../../../../../services/workflows_endpoints";

// Types pour remplacer any
interface JwtPayload {
  exp: number;
  [key: string]: unknown;
}

// Interfaces conformes à l'API
interface AssignableEntity {
  id: number;
  name: string;
  username?: string;
  email?: string;
}

// Interface WorkflowStep conforme à l'API
interface WorkflowStepForm {
  workflow?: number;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'pending';
  order: number;
  assign_to: {
    roles: number[];
    departments: number[];
    services: number[];
    functions: number[];
    users: number[];
    hierarchy_level?: string;
  };
  hierarchical_validation: boolean;
  validation_required: boolean;
  can_reassign: boolean;
}

// Interface WorkflowFormData conforme à l'API
interface WorkflowFormData {
  name: string;
  description: string;
  code: string;
  status: 'active' | 'inactive' | 'maintenance';
  public_access: boolean; // Ajout de la propriété pour l'accès public
  services: number[];
  departments: number[];
  authorized_viewers: {
    roles: number[];
    departments: number[];
    services: number[];
    functions: number[];
    users: number[];
    [key: string]: number[]; // Allow for dynamic access
  };
  steps: WorkflowStepForm[]; // Peut être vide
}

// Types spécifiques pour remplacer les any
type FieldType = keyof WorkflowStepForm;
type AssignToType = {
  roles: number[];
  departments: number[];
  services: number[];
  functions: number[];
  users: number[];
  hierarchy_level?: string;
};

type FieldValue = string | number | boolean | null | number[] | undefined | AssignToType;

export default function AddWorkflow() {
  const router = useRouter();
  
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, _setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ 
    type: 'success' | 'error';
    message: string 
  } | null>(null);
  
  // État initial conforme à l'API
  const [formData, setFormData] = useState<WorkflowFormData>({
    name: '',
    description: '',
    code: '',
    status: 'active',
    public_access: false, // Valeur par défaut à false
    services: [],
    departments: [],
    authorized_viewers: {
      roles: [],
      departments: [],
      services: [],
      functions: [],
      users: []
    },
    steps: [{
      name: '',
      description: '',
      order: 1,
      status: 'active',
      assign_to: {
        roles: [],
        departments: [],
        services: [],
        functions: [],
        users: [],
        hierarchy_level: undefined
      },
      hierarchical_validation: false,
      validation_required: true,
      can_reassign: false
    }]
  });

  // Ajoutez un état pour le type d'autorisation
  const [authorizationType, setAuthorizationType] = useState<'users' | 'departments' | 'services' | 'functions' | 'roles'>('users');

  // Pour la rétrocompatibilité avec l'UI existante
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [assignationType, setAssignationType] = useState<'service' | 'department'>('service');

  const [entities, setEntities] = useState<{
    users: AssignableEntity[];
    services: AssignableEntity[];
    functions: AssignableEntity[];
    departments: AssignableEntity[];
    roles: AssignableEntity[];
  }>({
    users: [],
    services: [],
    functions: [],
    departments: [],
    roles: []
  });

  const [newWorkflowId, setNewWorkflowId] = useState<number | null>(null);

  // Fonction pour générer un code workflow à partir du nom
  const generateWorkflowCode = (name: string): string => {
    return name
      .replace(/[^\w\s]/gi, '') // Enlever les caractères spéciaux
      .replace(/\s+/g, '_') // Remplacer les espaces par des underscores
      .toUpperCase()
      .substring(0, 10) + '_' + Math.floor(Math.random() * 1000); // Ajouter un suffixe aléatoire
  };

  // Rafraîchissement du token
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch('https://www.backend.lnb-intranet.globalitnet.org/auth/api/token/refresh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data: { access: string } = await response.json();
        const tokens = {
          access: data.access,
          refresh: refreshToken,
        };
        Cookies.set('authTokens', JSON.stringify(tokens));
        setAccessToken(data.access);
        return data.access;
      } else {
        router.push('/authentication/login');
        return null;
      }
    } catch (error: unknown) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      router.push('/authentication/login');
      return null;
    }
  }, [refreshToken, router]);

  const fetchEntities = useCallback(async () => {
    if (!accessToken) {
      console.log("Pas de token d'accès disponible");
      return;
    }
  
    try {
      setIsLoading(true);
      setError(null);
  
      console.log("Début du chargement des entités...");
  
      let token = accessToken;
      const decodedToken: JwtPayload = jwtDecode(token);
      
      if (decodedToken.exp * 1000 < Date.now()) {
        console.log("Token expiré, rafraîchissement...");
        const newToken = await refreshAccessToken();
        if (!newToken) return;
        token = newToken;
      }
  
      console.log("Chargement des données...");
      const [usersData, rolesData, departmentsData, functionsData, servicesData] = await Promise.all([
        entityService.getAllUsers(token),
        entityService.getAllRoles(token),
        entityService.getAllDepartments(token),
        entityService.getAllFunctions(token),
        entityService.getAllServices(token)
      ]);
  
      console.log('Données reçues:', {
        users: usersData?.results?.length,
        roles: rolesData?.results?.length,
        departments: departmentsData?.results?.length,
        functions: functionsData?.results?.length,
        services: servicesData?.results?.length
      });
  
      setEntities({
        users: usersData?.results || [],
        roles: rolesData?.results || [],
        departments: departmentsData?.results || [],
        functions: functionsData?.results || [],
        services: servicesData?.results || []
      });
  
    } catch (error) {
      console.error("Erreur détaillée:", error);
      setError("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, refreshAccessToken]);

  useEffect(() => {
    if (accessToken) {
      fetchEntities();
    }
  }, [accessToken, fetchEntities]);

  useEffect(() => {
    const token = Cookies.get('authTokens');
    if (token) {
      const parsedToken = JSON.parse(token);
      setAccessToken(parsedToken.access);
      _setRefreshToken(parsedToken.refresh);
    }
  }, []);

  // Gestion des étapes - adaptée pour la nouvelle interface
  const handleStepChange = (index: number, field: FieldType, value: FieldValue) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index 
          ? { ...step, [field]: value } 
          : step
      )
    }));
  };

  // Gestion des valeurs d'assignation - adaptée pour l'API
  const handleAssignmentChange = (index: number, type: 'roles' | 'departments' | 'services' | 'functions' | 'users', values: number[]) => {
    setFormData(prev => {
      const newSteps = [...prev.steps];
      if (type === 'roles') {
        newSteps[index] = { ...newSteps[index], assign_to: { ...newSteps[index].assign_to, roles: values } };
      } else if (type === 'departments') {
        newSteps[index] = { ...newSteps[index], assign_to: { ...newSteps[index].assign_to, departments: values } };
      } else if (type === 'services') {
        newSteps[index] = { ...newSteps[index], assign_to: { ...newSteps[index].assign_to, services: values } };
      } else if (type === 'functions') {
        newSteps[index] = { ...newSteps[index], assign_to: { ...newSteps[index].assign_to, functions: values } };
      } else if (type === 'users') {
        newSteps[index] = { ...newSteps[index], assign_to: { ...newSteps[index].assign_to, users: values } };
      }
      return { ...prev, steps: newSteps };
    });
  };

  // Ajout d'étape - adaptée pour la nouvelle interface
  const addStep = () => {
    if (formData.steps.length >= 10) {
      setNotification({ type: 'error', message: 'Maximum 10 étapes autorisées' });
      return;
    }

    setFormData(prev => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          name: '',
          description: '',
          order: prev.steps.length + 1,
          status: 'active',
          assign_to: {
            roles: [],
            departments: [],
            services: [],
            functions: [],
            users: [],
            hierarchy_level: undefined
          },
          hierarchical_validation: false,
          validation_required: true,
          can_reassign: false
        }
      ]
    }));
  };

  // Suppression d'étape - adaptée pour la nouvelle interface
  const removeStep = (index: number) => {
    if (formData.steps.length <= 1) {
      setNotification({ type: 'error', message: 'Un workflow doit avoir au moins une étape' });
      return;
    }

    setFormData(prev => ({
      ...prev,
      steps: prev.steps
        .filter((_, i) => i !== index)
        .map((step, i) => ({
          ...step,
          order: i + 1
        }))
    }));
  };

  // Soumission du formulaire - utilisation des fonctions d'API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      if (!accessToken) {
        throw new Error("Non authentifié");
      }

      // Génération du code si non fourni
      if (!formData.code) {
        setFormData(prev => ({
          ...prev,
          code: generateWorkflowCode(formData.name)
        }));
      }

      // Construction des tableaux d'autorisations selon le schéma backend
      const authorized_role_ids = formData.authorized_viewers.roles;
      const authorized_service_ids = formData.authorized_viewers.services;
      const authorized_department_ids = formData.authorized_viewers.departments;
      const authorized_function_ids = formData.authorized_viewers.functions;
      const authorized_user_ids = formData.authorized_viewers.users;

      // Construction du payload conforme au backend
      const apiWorkflowData = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        public_access: formData.public_access,
        start_step_order: 0,
        service_ids: formData.services,
        department_ids: formData.departments,
        authorized_role_ids,
        authorized_service_ids,
        authorized_department_ids,
        authorized_function_ids,
        authorized_user_ids,
      };

      // Vérification d'au moins une attribution ou validation hiérarchique
      // Ne pas vérifier les attributions si l'accès public est activé
      if (
        !formData.public_access && // Ajouter cette condition
        authorized_role_ids.length === 0 &&
        authorized_service_ids.length === 0 &&
        authorized_department_ids.length === 0 &&
        authorized_function_ids.length === 0 &&
        authorized_user_ids.length === 0 &&
        !formData.steps.some(step => step.hierarchical_validation)
      ) {
        setNotification({
          type: 'error',
          message: "Vous devez spécifier au moins une attribution (utilisateurs, rôles, départements, services) ou utiliser la validation hiérarchique."
        });
        setIsLoading(false);
        return;
      }

      // Création du workflow principal
      const response = await createWorkflow(apiWorkflowData);
      const newWorkflow = response.data;
      setNewWorkflowId(newWorkflow.id);

      // Création des étapes (inchangé)
      if (formData.steps.length > 0) {
        for (const step of formData.steps) {
          const stepData = {
            workflow: newWorkflow.id,
            name: step.name,
            description: step.description,
            order: step.order,
            status: step.status === 'pending' ? 'inactive' : step.status,
            is_validation_required: step.validation_required,
            use_hierarchy: step.hierarchical_validation,
            hierarchy_min_level: step.hierarchical_validation && step.assign_to.hierarchy_level ?
              (() => {
                const level = step.assign_to.hierarchy_level;
                if (level === 'L1') return 1;
                if (level === 'L2') return 2;
                if (level === 'L3') return 3;
                if (level === 'LT') return 99;
                return 0;
              })() : 0,
            hierarchy_max_level: step.hierarchical_validation && step.assign_to.hierarchy_level ?
              (() => {
                const level = step.assign_to.hierarchy_level;
                if (level === 'L1') return 1;
                if (level === 'L2') return 2;
                if (level === 'L3') return 3;
                if (level === 'LT') return 99;
                return 0;
              })() : 0,
            hierarchy_scope: "department",
            allow_reassignment: step.can_reassign,
            send_notification_on_assignment: true,
            max_processing_time: 0,
            assigned_user_ids: step.assign_to.users || [],
            assigned_role_ids: step.assign_to.roles || [],
            assigned_department_ids: step.assign_to.departments || [],
            assigned_service_ids: step.assign_to.services || [],
            assign_to_all_users: false
          };
          await createWorkflowStep(stepData);
        }
      }

      setNotification({
        type: 'success',
        message: 'Workflow créé avec succès!'
      });

      setTimeout(() => router.push("/workflows"), 1500);

    } catch (error) {
      console.error("Erreur:", error);
      const errorMessage = handleAxiosError(error);
      setNotification({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Gestion du changement de type d'assignation
  const handleAssignationTypeChange = (type: 'service' | 'department') => {
    setAssignationType(type);
    
    // Mise à jour des tableaux services/departments dans formData
    if (type === 'service') {
      setFormData(prev => ({
        ...prev,
        services: selectedService ? [selectedService] : [],
        departments: []
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        services: [],
        departments: selectedDepartment ? [selectedDepartment] : []
      }));
    }
  };

  // Mise à jour des états pour les autorisations
  const updateAuthorizedViewers = (type: 'roles' | 'departments' | 'services' | 'functions' | 'users', values: number[]) => {
    setFormData(prev => ({
      ...prev,
      authorized_viewers: {
        ...prev.authorized_viewers,
        [type]: values
      }
    }));
  };

  // Ajoutez cette fonction à votre composant AddWorkflow
  const setStartStepOrder = async (stepIndex: number) => {
    try {
      if (!accessToken) {
        throw new Error("Non authentifié");
      }

      setIsLoading(true);
      
      // Assurez-vous que le workflow a été créé et que vous avez son ID
      if (!newWorkflowId) {
        setNotification({
          type: 'error',
          message: 'Veuillez d\'abord créer le workflow'
        });
        return;
      }

      // Utilisez la fonction d'API pour définir l'étape de début
      await updateWorkflowStartStepOrder(newWorkflowId, { 
        start_step_order: stepIndex 
      });

      setNotification({
        type: 'success',
        message: `Étape de début définie avec succès`
      });
    } catch (error) {
      console.error("Erreur lors de la définition de l'étape de début:", error);
      const errorMessage = handleAxiosError(error);
      setNotification({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-emerald-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Créations de e-services</h1>
        </div>
        
        {notification && (
          <Notification 
            type={notification.type} 
            message={notification.message} 
            onClose={() => setNotification(null)} 
          />
        )}

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-6 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note :</strong> Vous pouvez créer un workflow sans définir d&apos;étapes immédiatement. 
            Les étapes pourront être ajoutées ultérieurement depuis la page de détail du workflow.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section Configuration de base du workflow */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-6 border border-emerald-200 dark:border-emerald-800">
            <h2 className="text-lg font-semibold mb-4 text-emerald-800 dark:text-emerald-200">Configuration de base du workflow</h2>
            
            <div className="space-y-4">
              {/* Nom du eService */}
              <div>
                <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-1">
                  Nom du eService <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="block w-full rounded-md border-emerald-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="block w-full rounded-md border-emerald-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                  rows={3}
                  required
                />
              </div>

              {/* Type d'assignation du workflow */}
              <div>
                <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-1">
                  Le workflow appartient à <span className="text-red-500">*</span>
                </label>
                <select
                  value={assignationType}
                  onChange={(e) => handleAssignationTypeChange(e.target.value as 'service' | 'department')}
                  className="block w-full rounded-md border-emerald-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                >
                  <option value="service">Service</option>
                  <option value="department">Département</option>
                </select>
              </div>

              {/* Sélection du service ou département */}
              <div>
                <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-1">
                  {assignationType === 'service' ? 'Service' : 'Département'} <span className="text-red-500">*</span>
                </label>

                <select
                  value={assignationType === 'service' ? selectedService ?? '' : selectedDepartment ?? ''}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (assignationType === 'service') {
                      setSelectedService(value);
                      setFormData(prev => ({
                        ...prev,
                        services: value ? [value] : []
                      }));
                    } else {
                      setSelectedDepartment(value);
                      setFormData(prev => ({
                        ...prev,
                        departments: value ? [value] : []
                      }));
                    }
                  }}
                  className="block w-full rounded-md border-emerald-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                  required
                >
                  <option value="">Sélectionner...</option>
                  {assignationType === 'service' 
                    ? entities.services.map(service => (
                        <option key={service.id} value={service.id}>{service.name}</option>
                      ))
                    : entities.departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))
                  }
                </select>
              </div>

              {/* Statut du workflow */}
              <div>
                <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-1">
                  Statut du eService <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive' | 'maintenance'})}
                  className="block w-full rounded-md border-emerald-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                  required
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              {/* Ajout de la case à cocher pour l'accès public */}
              <div>
                <FormCheckbox
                  label="Accès public pour tous les utilisateurs"
                  checked={formData.public_access}
                  onChange={(e) => setFormData({...formData, public_access: e.target.checked})}
                  className="border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 ml-6 mt-1">
                  Si activé, ce workflow sera accessible à tous les utilisateurs du système indépendamment des autorisations spécifiques.
                </p>
              </div>

              {/* Section autorisations */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-1">
                    Type d&apos;autorisation <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setAuthorizationType('users')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                        authorizationType === 'users' 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                      }`}
                    >
                      Utilisateurs
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthorizationType('departments')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                        authorizationType === 'departments' 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                      }`}
                    >
                      Départements
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthorizationType('services')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                        authorizationType === 'services' 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                      }`}
                    >
                      Services
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthorizationType('functions')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                        authorizationType === 'functions' 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                      }`}
                    >
                      Fonctions
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthorizationType('roles')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                        authorizationType === 'roles' 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                      }`}
                    >
                      Rôles
                    </button>
                  </div>
                  
                  <div className="relative border border-emerald-200 rounded-md p-2 bg-white dark:bg-gray-800">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                        {authorizationType === 'roles' ? 'Rôles autorisés' :
                        authorizationType === 'departments' ? 'Départements autorisés' :
                        authorizationType === 'services' ? 'Services autorisés' :
                        authorizationType === 'functions' ? 'Fonctions autorisées' :
                        'Utilisateurs autorisés'}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const options = 
                            authorizationType === 'roles' ? entities.roles :
                            authorizationType === 'departments' ? entities.departments :
                            authorizationType === 'services' ? entities.services :
                            authorizationType === 'functions' ? entities.functions :
                            entities.users;
                          
                          const allIds = options.map(item => item.id);
                          const currentIds = formData.authorized_viewers[authorizationType];
                          
                          updateAuthorizedViewers(
                            authorizationType, 
                            currentIds.length === allIds.length ? [] : allIds
                          );
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                      >
                        {formData.authorized_viewers[authorizationType].length === 
                        (authorizationType === 'roles' ? entities.roles.length :
                          authorizationType === 'departments' ? entities.departments.length :
                          authorizationType === 'services' ? entities.services.length :
                          authorizationType === 'functions' ? entities.functions.length :
                          entities.users.length)
                          ? 'Désélectionner tout' 
                          : 'Sélectionner tout'
                        }
                      </button>
                    </div>

                    <div className="max-h-[200px] overflow-y-auto space-y-2">
                      {(authorizationType === 'roles' ? entities.roles :
                        authorizationType === 'departments' ? entities.departments :
                        authorizationType === 'services' ? entities.services :
                        authorizationType === 'functions' ? entities.functions :
                        entities.users).map(item => (
                        <div key={item.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`auth-${authorizationType}-${item.id}`}
                            checked={formData.authorized_viewers[authorizationType].includes(item.id)}
                            onChange={() => {
                              const currentIds = formData.authorized_viewers[authorizationType];
                              const newIds = currentIds.includes(item.id)
                                ? currentIds.filter(id => id !== item.id)
                                : [...currentIds, item.id];
                              
                              updateAuthorizedViewers(authorizationType, newIds);
                            }}
                            className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <label 
                            htmlFor={`auth-${authorizationType}-${item.id}`} 
                            className="ml-2 text-sm cursor-pointer"
                          >
                            {item.name || item.username || `#${item.id}`}
                            {item.email && ` (${item.email})`}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Étapes */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
                Étapes du workflow (optionnel)
              </h2>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, steps: []}))}
                  className="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  disabled={formData.steps.length === 0}
                >
                  Effacer toutes les étapes
                </button>
                <button
                  type="button"
                  onClick={addStep}
                  className="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  disabled={formData.steps.length >= 10}
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Ajouter une étape
                </button>
              </div>
            </div>
            
            {formData.steps.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Aucune étape définie. Vous pourrez ajouter des étapes après la création du workflow.
                </p>
                <button
                  type="button"
                  onClick={addStep}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Ajouter une étape maintenant
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {formData.steps.map((step, index) => (
                  <StepComponent
                    key={index}
                    step={step}
                    index={index}
                    entities={entities}
                    onStepChange={(field, value) => handleStepChange(index, field, value)}
                    onAssignmentChange={(type, values) => handleAssignmentChange(index, type, values)}
                    onRemove={() => removeStep(index)}
                    canRemove={formData.steps.length > 1}
                    onSetAsStartStep={(index) => setStartStepOrder(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push("/workflows")}
              className="px-4 py-2 text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-800/30"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={(e) => {
                // Créer une copie du formulaire sans les étapes
                const formDataWithoutSteps = {
                  ...formData,
                  steps: []
                };
                // Sauvegarder temporairement pour la soumission
                setFormData(formDataWithoutSteps);
                // Soumettre le formulaire
                handleSubmit(e as unknown as React.FormEvent<HTMLButtonElement>);
              }}
              className="px-4 py-2 bg-emerald-400 hover:bg-emerald-500 text-white rounded-lg focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Créer sans étapes
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Création...' : 'Créer avec étapes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Composants réutilisables
const Notification = ({ type, message, onClose }: {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}) => (
  <div className={`mb-6 p-4 rounded-md flex justify-between items-center ${
    type === 'success' 
      ? 'bg-emerald-100 border-emerald-400 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-200' 
      : 'bg-red-100 border-red-400 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200'
  }`}>
    <div className="flex items-center">
      <svg className={`h-5 w-5 mr-2 ${type === 'success' ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {type === 'success' 
          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        }
      </svg>
      <span>{message}</span>
    </div>
    <button onClick={onClose} aria-label="Fermer la notification">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

const FormInput = ({ label, value, onChange, required, type = 'text', className = '' }: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
  className?: string;
}) => (
  <div>
    <label className="block text-sm font-medium mb-1 text-emerald-800 dark:text-emerald-200">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      className={`w-full p-2 border ${className} rounded-md focus:ring-2 dark:bg-gray-800 dark:text-white`}
      required={required}
    />
  </div>
);

const FormTextarea = ({ label, value, onChange, rows, required, className = '' }: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows: number;
  required?: boolean;
  className?: string;
}) => (
  <div>
    <label className="block text-sm font-medium mb-1 text-emerald-800 dark:text-emerald-200">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      value={value}
      onChange={onChange}
      rows={rows}
      className={`w-full p-2 border ${className} rounded-md focus:ring-2 dark:bg-gray-800 dark:text-white`}
      required={required}
    />
  </div>
);

const FormCheckbox = ({ label, checked, onChange, className = '' }: {
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}) => (
  <div className="flex items-center">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={`rounded ${className} focus:ring-2 dark:bg-gray-800`}
    />
    <label className="ml-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">
      {label}
    </label>
  </div>
);

interface StepComponentProps {
  step: WorkflowStepForm;
  index: number;
  entities: {
    users: AssignableEntity[];
    services: AssignableEntity[];
    functions: AssignableEntity[];
    departments: AssignableEntity[];
    roles: AssignableEntity[];
  };
  onStepChange: (field: keyof WorkflowStepForm, value: FieldValue) => void;
  onAssignmentChange: (type: 'roles' | 'departments' | 'services' | 'functions' | 'users', values: number[]) => void;
  onRemove: () => void;
  canRemove: boolean;
  onSetAsStartStep: (index: number) => void; // Nouvelle prop
}

const StepComponent = ({ 
  step, 
  index, 
  entities, 
  onStepChange,
  onRemove, 
  canRemove,
  onSetAsStartStep // Nouvelle prop
}: StepComponentProps) => {
  const [assignmentType, setAssignmentType] = useState<'users' | 'departments' | 'services' | 'roles'>('users');

  // Nouvelle fonction pour mettre à jour les attributions
  const updateAssignTo = (type: 'roles' | 'departments' | 'services' | 'functions' | 'users', values: number[]) => {
    const updatedAssignTo = {
      ...step.assign_to,
      [type]: values
    };
    
    onStepChange('assign_to', updatedAssignTo);
  };

  return (
    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-6 border border-emerald-200 dark:border-emerald-800 relative">
      <div className="absolute -top-3 left-4 px-2 py-1 bg-emerald-600 text-white text-xs rounded-full">
        Étape {index + 1}
      </div>
      
      <div className="flex justify-between mb-4">
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700"
            aria-label={`Supprimer l'étape ${index + 1}`}
          >
            <TrashBinIcon className="h-5 w-5" />
          </button>
        )}
        
        {/* Nouveau bouton pour définir l'étape de début */}
        <button
          type="button"
          onClick={() => onSetAsStartStep(index)}
          className="ml-auto px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-md"
        >
          Définir comme étape de début
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <FormInput
          label="Nom de l'étape"
          value={step.name}
          onChange={(e) => onStepChange('name', e.target.value)}
          required
          className="border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500"
        />
        
        {/* Statut */}
        <div>
          <label className="block text-sm font-medium mb-1 text-emerald-800 dark:text-emerald-200">
            Statut <span className="text-red-500">*</span>
          </label>
          <select
            value={step.status}
            onChange={(e) => onStepChange('status', e.target.value as 'active' | 'inactive' | 'pending')}
            className="w-full p-2 border border-emerald-300 rounded-md focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white"
            required
          >
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="pending">En attente</option>
          </select>
        </div>
      </div>
      
      <FormTextarea
        label="Description de l'étape"
        value={step.description}
        onChange={(e) => onStepChange('description', e.target.value)}
        rows={2}
        required
        className="border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500"
      />

      {/* Options de validation */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormCheckbox
          label="Validation requise"
          checked={step.validation_required}
          onChange={(e) => onStepChange('validation_required', e.target.checked)}
          className="border-emerald-300 text-emerald-600 focus:ring-emerald-500"
        />
        
        <FormCheckbox
          label="Validation hiérarchique"
          checked={step.hierarchical_validation}
          onChange={(e) => onStepChange('hierarchical_validation', e.target.checked)}
          className="border-emerald-300 text-emerald-600 focus:ring-emerald-500"
        />
        
        <FormCheckbox
          label="Possibilité de réassigner"
          checked={step.can_reassign}
          onChange={(e) => onStepChange('can_reassign', e.target.checked)}
          className="border-emerald-300 text-emerald-600 focus:ring-emerald-500"
        />
      </div>

      {/* Type d'assignation */}
      <div className="mt-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-emerald-800 dark:text-emerald-200">
            Type d&apos;assignation
          </label>
          <select
            value={assignmentType}
            onChange={(e) => setAssignmentType(e.target.value as 'users' | 'departments' | 'services' | 'roles')}
            className="w-full p-2 border border-emerald-300 dark:border-emerald-600 rounded-md focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="users">Utilisateurs</option>
            <option value="departments">Départements</option>
            <option value="services">Services</option>
            <option value="roles">Rôles</option>
          </select>
        </div>

        {/* Liste d'entités selon le type d'assignation */}
        <div className="mt-4">
          <div className="relative border border-emerald-200 rounded-md p-4 bg-white dark:bg-gray-800">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                {assignmentType === 'roles' ? 'Sélectionner un ou plusieurs rôles' :
                 assignmentType === 'departments' ? 'Sélectionner un ou plusieurs départements' :
                 assignmentType === 'services' ? 'Sélectionner un ou plusieurs services' :
                 'Sélectionner un ou plusieurs utilisateurs'}
              </label>
              <button
                type="button"
                onClick={() => {
                  const options = 
                    assignmentType === 'roles' ? entities.roles :
                    assignmentType === 'departments' ? entities.departments :
                    assignmentType === 'services' ? entities.services :
                    assignmentType === 'users' ? entities.users : [];
                
                  const allIds = options.map(opt => opt.id);
                  const currentValues = step.assign_to[assignmentType];
                                     
                  updateAssignTo(
                    assignmentType,
                    currentValues.length === allIds.length ? [] : allIds
                  );
                }}
                className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                {step.assign_to[assignmentType].length === 
                 (assignmentType === 'roles' ? entities.roles.length :
                  assignmentType === 'departments' ? entities.departments.length :
                  assignmentType === 'services' ? entities.services.length :
                  assignmentType === 'users' ? entities.users.length : 0)
                  ? 'Désélectionner tout' 
                  : 'Sélectionner tout'
                }
              </button>
            </div>

            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {(assignmentType === 'roles' ? entities.roles :
                assignmentType === 'departments' ? entities.departments :
                assignmentType === 'services' ? entities.services :
                assignmentType === 'users' ? entities.users : []).map(option => (
                <div key={option.id} className="flex items-center py-1">
                  <input
                    type="checkbox"
                    id={`step-${index}-${assignmentType}-${option.id}`}
                    checked={step.assign_to[assignmentType].includes(option.id)}
                    onChange={(e) => {
                      const currentValues = step.assign_to[assignmentType];
                      const newValues = e.target.checked
                        ? [...currentValues, option.id]
                        : currentValues.filter(id => id !== option.id);
                        
                      updateAssignTo(assignmentType, newValues);
                    }}
                    className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label 
                    htmlFor={`step-${index}-${assignmentType}-${option.id}`}
                    className="ml-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer"
                  >
                    {assignmentType === 'users' 
                      ? `${option.username || ''} ${option.email ? `(${option.email})` : option.name || ''}`
                      : option.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Configuration hiérarchique */}
      {step.hierarchical_validation && (
        <div className="mt-6 border-t border-emerald-200 pt-6">
          <h3 className="text-md font-medium mb-4 text-emerald-800 dark:text-emerald-200">
            Configuration de la hiérarchie
          </h3>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-emerald-800 dark:text-emerald-200">
              Niveau hiérarchique
            </label>
            <select
              value={step.assign_to.hierarchy_level || ''}
              onChange={(e) => {
                const updatedAssignTo = {
                  ...step.assign_to,
                  hierarchy_level: e.target.value || undefined
                };
                onStepChange('assign_to', updatedAssignTo);
              }}
              className="w-full p-2 border border-emerald-300 rounded-md focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Sélectionner un niveau</option>
              <option value="L1">Niveau 1 (Supérieur direct)</option>
              <option value="L2">Niveau 2</option>
              <option value="L3">Niveau 3</option>
              <option value="LT">Top (Niveau le plus élevé)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};