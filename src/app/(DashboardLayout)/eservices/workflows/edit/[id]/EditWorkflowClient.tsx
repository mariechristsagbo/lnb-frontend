"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, TrashBinIcon } from "@/icons";
import Cookies from 'js-cookie';
import { entityService } from '@/services/entityService';
import { jwtDecode } from 'jwt-decode';
// --- AJOUT: Importer une fonction de création d'étape ---
import {
  retrieveWorkflow,
  partialUpdateWorkflow,
  // updateWorkflowStep, // On n'utilise plus celle-ci pour la création
  createWorkflowStep, // Assurez-vous que cette fonction existe et appelle le bon endpoint POST
  partialUpdateWorkflowStep,// Assurez-vous que cette fonction existe pour la suppression physique si nécessaire
  listWorkflowSteps,
  updateWorkflowStartStepOrder,
  handleAxiosError
} from "../../../../../../services/workflows_endpoints";
// --- AJOUT: Importer une librairie de comparaison profonde (optionnel mais recommandé) ---
import isEqual from 'lodash/isEqual'; // Example: npm install lodash @types/lodash

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
  id?: number;
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
  allow_reassignment?: boolean; // <-- Ajouté ici pour correspondre à l'API
}

// Interface WorkflowFormData conforme à l'API
interface WorkflowFormData {
  id?: number;
  name: string;
  description: string;
  code: string;
  status: 'active' | 'inactive' | 'maintenance';
  services: number[];
  departments: number[];
  authorized_viewers: {
    roles: number[];
    departments: number[];
    services: number[];
    functions: number[];
    users: number[];
  };
  steps: WorkflowStepForm[];
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

// --- MODIFICATION: Définition de l'interface pour les props ---
interface EditWorkflowPageProps {
  id: string; // La prop id est requise et est une chaîne
  // Ajoutez ici d'autres props si nécessaire à l'avenir
}
// --- FIN MODIFICATION ---

// --- AJOUT: Type pour stocker l'état original ---
type OriginalWorkflowData = Omit<WorkflowFormData, 'steps'>;// --- FIN AJOUT ---

// --- MODIFICATION: Utilisation de l'interface et déstructuration de 'id' ---
export default function EditWorkflowClient({ id }: EditWorkflowPageProps) {
// --- FIN MODIFICATION ---
  const router = useRouter();
  // Utiliser l'ID directement depuis les props
  const workflowId = parseInt(id); // Convertir l'ID en nombre

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
    services: [],
    departments: [],
    authorized_viewers: {
      roles: [],
      departments: [],
      services: [],
      functions: [],
      users: []
    },
    steps: []
  });

  // --- AJOUT: États pour stocker les données originales ---
  const [originalWorkflowData, setOriginalWorkflowData] = useState<OriginalWorkflowData | null>(null);
  const [originalSteps, setOriginalSteps] = useState<WorkflowStepForm[]>([]); // Utiliser WorkflowStepForm pour comparaison directe
  // --- FIN AJOUT ---

  const [stepsToDelete, setStepsToDelete] = useState<number[]>([]); // Garder pour suppression logique/physique

  // Ajoutez cette interface pour correspondre à la structure attendue des étapes du workflow depuis l'API
  interface ApiWorkflowStep {
    id: number;
    workflow: number | { id: number };
    name: string;
    description?: string;
    status: 'active' | 'inactive' | 'pending';
    order: number;
    is_validation_required: boolean;
    hierarchy_level?: string | number | null;
    allow_reassignment?: boolean;
    assigned_roles?: { id: number }[];
    assigned_departments?: { id: number }[];
    assigned_services?: { id: number }[];
    // Ajoutez d'autres propriétés si nécessaire selon la réponse de l'API
  }

  // Ajoutez un état pour le type d'autorisation
  const [authorizationType, setAuthorizationType] = useState<'roles' | 'departments' | 'services' | 'functions' | 'users'>('roles');

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

  // Ajoutez ces états pour suivre ce qui a été mis à jour
  const [_workflowUpdated, _setWorkflowUpdated] = useState(false);
  const [_stepsUpdated, _setStepsUpdated] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

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

  // Charger les données du workflow à éditer
  const fetchWorkflowData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Récupérer les détails du workflow
      const workflowResponse = await retrieveWorkflow(workflowId);
      const workflow = workflowResponse.data;

      // Récupérer les étapes du workflow
      const stepsResponse = await listWorkflowSteps(workflowId);
      const stepsApi = stepsResponse.data as ApiWorkflowStep[]; // Utiliser l'interface API ici

      // --- MODIFICATION: Mapper les données API vers WorkflowFormData et stocker l'original ---
      const mappedSteps: WorkflowStepForm[] = stepsApi.map((step: ApiWorkflowStep) => ({
        id: step.id,
        workflow: typeof step.workflow === "object" && step.workflow !== null
          ? (step.workflow as { id: number }).id
          : (step.workflow as number),
        name: step.name,
        description: step.description || '',
        status: step.status,
        order: step.order,
        validation_required: step.is_validation_required,
        hierarchical_validation: Boolean(step.hierarchy_level), // Ou step.use_hierarchy si disponible
        can_reassign: step.allow_reassignment ?? false,
        allow_reassignment: step.allow_reassignment ?? false, // Garder pour la forme
        assign_to: {
          roles: (step.assigned_roles as { id: number }[] | undefined)?.map((r) => r.id) || [],
          departments: (step.assigned_departments as { id: number }[] | undefined)?.map((d) => d.id) || [],
          services: (step.assigned_services as { id: number }[] | undefined)?.map((s) => s.id) || [],
          functions: [], // Non défini dans l'API, laisser vide
          users: [],     // Non défini dans l'API, laisser vide
          hierarchy_level: step.hierarchy_level?.toString() || undefined
        }
      }));

      const currentFormData: WorkflowFormData = {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description || '',
        code: workflow.code,
        status: workflow.status,
        services: (workflow.services as { id: number }[])?.map((s) => s.id) || [],
        departments: (workflow.departments as { id: number }[])?.map((d) => d.id) || [],
        authorized_viewers: {
          roles: (workflow.authorized_roles as { id: number }[] | undefined)?.map(role => role.id) || [],
          // Assurez-vous que ces clés correspondent à la réponse de retrieveWorkflow
          departments: (workflow as { authorized_departments?: { id: number }[] }).authorized_departments?.map(dept => dept.id) || [],
          services: (workflow as { authorized_services?: { id: number }[] }).authorized_services?.map(service => service.id) || [],
          functions: (workflow as { authorized_functions?: { id: number }[] }).authorized_functions?.map(func => func.id) || [],
          users: (workflow as { authorized_users?: { id: number }[] }).authorized_users?.map(user => user.id) || [],
        },
        steps: mappedSteps
      };

      setFormData(currentFormData);

      // Stocker les données originales pour comparaison
      const { steps, ...originalWf } = currentFormData;
      setOriginalWorkflowData(originalWf);
      setOriginalSteps(steps); // Stocker les étapes mappées

      // --- FIN MODIFICATION ---

      // Déterminer le type d'assignation (service ou département)
      if (workflow.services && workflow.services.length > 0) {
        setAssignationType('service');
        setSelectedService(workflow.services[0].id);
      } else if (workflow.departments && workflow.departments.length > 0) {
        setAssignationType('department');
        setSelectedDepartment(workflow.departments[0].id);
      }

    } catch (error) {
      console.error("Erreur lors de la récupération des données du workflow:", error);
      const errorMessage = handleAxiosError(error);
      setError(errorMessage);
      setNotification({
        type: 'error',
        message: `Erreur lors du chargement: ${errorMessage}`
      });
    } finally {
      setIsLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    const token = Cookies.get('authTokens');
    if (token) {
      const parsedToken = JSON.parse(token);
      setAccessToken(parsedToken.access);
      _setRefreshToken(parsedToken.refresh);
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      fetchEntities();
      fetchWorkflowData();
    }
  }, [accessToken, fetchEntities, fetchWorkflowData]);

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

    const stepToRemove = formData.steps[index];
    
    // Si l'étape a un ID, on la marque pour suppression en base de données
    if (stepToRemove.id) {
      setStepsToDelete(prev => [...prev, stepToRemove.id as number]);
    }

    setFormData(prev => ({
      ...prev,
      steps: prev.steps
        .filter((_step, i) => i !== index)
        .map((step, i) => ({
          ...step,
          order: i + 1
        }))
    }));
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

  // Gestion du changement de type d'assignation
  const handleAssignationTypeChange = (type: 'service' | 'department') => {
    setAssignationType(type);
    
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

  // --- MODIFICATION: Ajuster le payload de setStartStepOrder ---
  const setStartStepOrder = async (stepIndex: number) => {
    try {
      if (!accessToken) throw new Error("Non authentifié");
      setIsLoading(true);

      // L'API attend probablement l'ordre basé sur 1
      const orderPayload = { start_step_order: formData.steps[stepIndex].order }; // Utiliser l'ordre réel de l'étape

      await updateWorkflowStartStepOrder(workflowId, orderPayload);

      setNotification({
        type: 'success',
        message: `Étape ${formData.steps[stepIndex].order} définie comme étape de début.`
      });
      // Optionnel: Rafraîchir les données si l'API ne renvoie pas l'état mis à jour
      // fetchWorkflowData();
    } catch (error) {
      console.error("Erreur lors de la définition de l'étape de début:", error);
      const errorMessage = handleAxiosError(error);
      setNotification({ type: 'error', message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };
  // --- FIN MODIFICATION ---

  // --- MODIFICATION MAJEURE: handleSubmit avec validation frontend ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setNotification(null);

    if (!accessToken || !originalWorkflowData) {
      setNotification({ type: 'error', message: "Données non chargées ou non authentifié." });
      setIsLoading(false);
      return;
    }

    // --- AJOUT: Validation Frontend des Étapes ---
    for (let i = 0; i < formData.steps.length; i++) {
        const step = formData.steps[i];
        const hasDirectAssignment =
            (step.assign_to.users && step.assign_to.users.length > 0) ||
            (step.assign_to.roles && step.assign_to.roles.length > 0) ||
            (step.assign_to.departments && step.assign_to.departments.length > 0) ||
            (step.assign_to.services && step.assign_to.services.length > 0);

        if (!step.hierarchical_validation && !hasDirectAssignment) {
            setNotification({
                type: 'error',
                message: `Erreur à l'étape ${i + 1} (${step.name || 'Nouvelle étape'}): Vous devez assigner au moins un utilisateur/rôle/département/service OU activer la validation hiérarchique.`
            });
            setIsLoading(false);
            return; // Arrêter la soumission
        }
        // Vérifier aussi que le nom de l'étape n'est pas vide
        if (!step.name || step.name.trim() === '') {
             setNotification({
                type: 'error',
                message: `Erreur à l'étape ${i + 1}: Le nom de l'étape ne peut pas être vide.`
            });
            setIsLoading(false);
            return; // Arrêter la soumission
        }
    }
    // --- FIN AJOUT ---


    let didWorkflowUpdate = false;
    let didStepsUpdate = false;
    const updatePromises: Promise<unknown>[] = [];

    try {
      // 1. Comparer et mettre à jour le workflow principal
      const currentWorkflowDataForCompare: OriginalWorkflowData = {
        id: formData.id,
        name: formData.name,
        description: formData.description,
        code: formData.code, // Le code ne devrait pas changer, mais incluons-le
        status: formData.status,
        services: formData.services,
        departments: formData.departments,
        authorized_viewers: formData.authorized_viewers,
      };

      if (!isEqual(currentWorkflowDataForCompare, originalWorkflowData)) {
        console.log("Changements détectés dans le workflow principal.");
        // Préparer le payload PATCH (uniquement les champs modifiés si possible, sinon tout)
        // Vérifiez les noms exacts attendus par votre API PATCH/PUT
        const workflowUpdatePayload: Record<string, unknown> = {
            name: formData.name,
            description: formData.description,
            status: formData.status,
            service_ids: formData.services, // API expects 'service_ids'
            department_ids: formData.departments, // API expects 'department_ids'
            authorized_role_ids: formData.authorized_viewers.roles, // API expects 'authorized_role_ids'
            authorized_department_ids: formData.authorized_viewers.departments, // API expects 'authorized_department_ids'
            authorized_service_ids: formData.authorized_viewers.services, // API expects 'authorized_service_ids'
            authorized_function_ids: formData.authorized_viewers.functions, // API expects 'authorized_function_ids'
            authorized_user_ids: formData.authorized_viewers.users, // API expects 'authorized_user_ids'
        };
        // Supprimer les clés avec des tableaux vides si l'API ne les aime pas pour PATCH
        Object.keys(workflowUpdatePayload).forEach(key => {
            const value = workflowUpdatePayload[key];
            if (Array.isArray(value) && value.length === 0) {
                // delete workflowUpdatePayload[key]; // Décommentez si nécessaire
            }
        });


        updatePromises.push(
            partialUpdateWorkflow(workflowId, workflowUpdatePayload).then(response => {
                console.log("Workflow mis à jour:", response);
                didWorkflowUpdate = true;
            })
        );
      } else {
        console.log("Aucun changement détecté dans le workflow principal.");
      }

      // 2. Comparer, mettre à jour ou créer les étapes
      for (const currentStep of formData.steps) {
        // --- Le payload est construit comme avant ---
        const stepPayload = {
            workflow: workflowId,
            name: currentStep.name,
            order: currentStep.order,
            description: currentStep.description,
            status: currentStep.status === 'pending' ? 'inactive' : currentStep.status,
            is_validation_required: currentStep.validation_required,
            use_hierarchy: currentStep.hierarchical_validation, // Mappé depuis la checkbox
            hierarchy_min_level: 0, // Ajuster si nécessaire
            hierarchy_max_level: 0, // Ajuster si nécessaire
            allow_reassignment: currentStep.can_reassign,
            send_notification_on_assignment: true,
            assigned_user_ids: currentStep.assign_to.users,
            assigned_role_ids: currentStep.assign_to.roles,
            assigned_department_ids: currentStep.assign_to.departments,
            assigned_service_ids: currentStep.assign_to.services,
        };

        // La validation frontend ci-dessus devrait empêcher d'envoyer un payload invalide
        // mais on garde les logs pour le débogage si besoin.

        if (currentStep.id) {
          // Étape existante
          const originalStep = originalSteps.find(os => os.id === currentStep.id);
          if (!originalStep || !isEqual(currentStep, originalStep)) {
            console.log(`[UPDATE] Payload pour étape ID ${currentStep.id}:`, JSON.stringify(stepPayload, null, 2));
            updatePromises.push(
              partialUpdateWorkflowStep(currentStep.id, stepPayload).then(response => {
                console.log("Étape mise à jour:", response);
                didStepsUpdate = true;
              })
            );
          } else {
             console.log(`Aucun changement détecté dans l'étape ID: ${currentStep.id}.`);
          }
        } else {
          // Nouvelle étape : TEST AVEC PAYLOAD MINIMAL
          const minimalStepPayload = {
              workflow: workflowId, // ID Parent (Obligatoire)
              name: currentStep.name, // Nom (Obligatoire)
              order: currentStep.order, // Ordre (Obligatoire)
              status: 'active' as const, // Statut simple (Test)              // --- Ajouter une assignation minimale si la validation hiérarchique est false ---
              ...( !currentStep.hierarchical_validation && currentStep.assign_to.users.length > 0 && { assigned_user_ids: currentStep.assign_to.users } ),
              ...( !currentStep.hierarchical_validation && currentStep.assign_to.roles.length > 0 && { assigned_role_ids: currentStep.assign_to.roles } ),
              // ... ajouter les autres types d'assignation si nécessaire pour le test ...
              // --- Ajouter use_hierarchy si la validation hiérarchique est true ---
              ...( currentStep.hierarchical_validation && { use_hierarchy: true } ),
              // Ajoutez is_validation_required si c'est pertinent pour le test minimal
              is_validation_required: currentStep.validation_required,

              // --- NE PAS INCLURE LES AUTRES CHAMPS POUR CE TEST ---
              // description: currentStep.description,
              // hierarchy_min_level: 0,
              // hierarchy_max_level: 0,
              // allow_reassignment: currentStep.can_reassign,
              // send_notification_on_assignment: true,
              // assigned_department_ids: currentStep.assign_to.departments,
              // assigned_service_ids: currentStep.assign_to.services,
          };

          console.log(`[CREATE - MINIMAL TEST] Payload pour nouvelle étape "${currentStep.name}":`, JSON.stringify(minimalStepPayload, null, 2));

          updatePromises.push(
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                createWorkflowStep(minimalStepPayload).then(response => { // Utiliser le payload minimal
              console.log("Étape créée (Test Minimal):", response);
              didStepsUpdate = true;
              // ... (mise à jour ID local) ...
            })
          );
        }
      }

      // 3. Gérer les suppressions (logique ou physique)
      for (const stepIdToDelete of stepsToDelete) {
        console.log(`Suppression/Désactivation de l'étape ID: ${stepIdToDelete}.`);
        // Option 1: Suppression logique (PATCH status) - comme avant
        updatePromises.push(
          partialUpdateWorkflowStep(stepIdToDelete, { status: 'inactive' }).then(response => {
            console.log("Étape désactivée:", response);
            didStepsUpdate = true; // Considéré comme une mise à jour des étapes
          })
        );
        // Option 2: Suppression physique (DELETE) - si votre API le supporte
        // Assurez-vous que deleteWorkflowStep existe et fonctionne
        // updatePromises.push(
        //   deleteWorkflowStep(stepIdToDelete).then(response => {
        //     console.log("Étape supprimée physiquement:", response);
        //     didStepsUpdate = true;
        //   })
        // );
      }

      // Attendre que toutes les mises à jour soient terminées
      await Promise.all(updatePromises);

      // Afficher le message de succès
      let message = '';
      if (didWorkflowUpdate && didStepsUpdate) {
        message = 'Le workflow et ses étapes ont été mis à jour avec succès!';
      } else if (didWorkflowUpdate) {
        message = 'Les informations du workflow ont été mises à jour avec succès!';
      } else if (didStepsUpdate) {
        message = 'Les étapes du workflow ont été mises à jour avec succès!';
      } else {
        message = 'Aucune modification détectée.'; // Message si rien n'a été envoyé
      }

      setUpdateMessage(message);
      setShowSuccessPopup(true);
      setStepsToDelete([]); // Réinitialiser après succès

      // Recharger les données après toutes les mises à jour pour refléter l'état final
      // et obtenir les IDs des nouvelles étapes
      await fetchWorkflowData();

      // Redirection après un délai
      setTimeout(() => {
        router.push('/workflows'); // Ou retour aux détails ? `/workflows/details/${workflowId}`
      }, 2000);

    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      const errorMessage = handleAxiosError(error);
      setNotification({ type: 'error', message: `Erreur lors de la mise à jour: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };
  // --- FIN MODIFICATION MAJEURE ---

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      {/* Afficher le popup de succès */}
      {showSuccessPopup && (
        <SuccessPopup
          message={updateMessage}
          onClose={() => setShowSuccessPopup(false)}
        />
      )}
  
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-emerald-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modification du e-service</h1>
        </div>
  
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
  
        {!isLoading && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-6 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note :</strong> Aucun champ n&apos;est obligatoire lors de la mise à jour d&apos;un workflow.
              Seuls les champs modifiés seront pris en compte.
            </p>
          </div>
        )}
  
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section Configuration de base du workflow */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-6 border border-emerald-200 dark:border-emerald-800">
              <h2 className="text-lg font-semibold mb-4 text-emerald-800 dark:text-emerald-200">Configuration de base du workflow</h2>
  
              <div className="space-y-4">
                {/* Code du workflow (non modifiable) */}
                <div>
                  <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-1">
                    Code du eService
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    disabled
                    className="block w-full rounded-md bg-gray-100 border-emerald-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                  />
                </div>
  
                {/* Nom du eService */}
                <div>
                  <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-1">
                    Nom du eService
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full rounded-md border-emerald-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                  />
                </div>
  
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="block w-full rounded-md border-emerald-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                    rows={3}
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
                    Statut du eService
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'maintenance' })}
                    className="block w-full rounded-md border-emerald-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                  >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
  
                {/* Section autorisations */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-1">
                      Type d&apos;autorisation
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
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
                        onClick={() => setAuthorizationType('users')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                          authorizationType === 'users'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                        }`}
                      >
                        Utilisateurs
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
                          authorizationType === 'users' ? entities.users.length :
                          0)
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
                  Étapes du workflow
                </h2>
                <div className="flex space-x-2">
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
                    Aucune étape définie. Le workflow ne pourra pas être utilisé sans étapes.
                  </p>
                  <button
                    type="button"
                    onClick={addStep}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    <PlusIcon className="h-5 w-5 mr-1" />
                    Ajouter une étape
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {formData.steps.map((step, index) => (
                    <StepComponent
                      key={`${step.id || 'new'}-${index}`}
                      step={step}
                      index={index}
                      entities={entities}
                      onStepChange={(field, value) => handleStepChange(index, field, value)}
                      onAssignmentChange={(type, values) => handleAssignmentChange(index, type, values)}
                      onRemove={() => removeStep(index)}
                      canRemove={formData.steps.length > 1}
                      onSetAsStartStep={setStartStepOrder}
                    />
                  ))}
                </div>
              )}
            </div>
  
            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push(`/workflows/details/${workflowId}`)}
                className="px-4 py-2 text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-800/30"
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Mise à jour...' : 'Mettre à jour le workflow'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
  
}

// Composants réutilisables (comme dans la page de création)
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
  onSetAsStartStep: (index: number) => void;
}

const StepComponent = ({ 
  step, 
  index, 
  entities, 
  onStepChange,
  onRemove, 
  canRemove,
  onSetAsStartStep
}: StepComponentProps) => {
  const [assignmentType, setAssignmentType] = useState<'roles' | 'departments' | 'services' | 'users'>('roles');

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
        Étape {index + 1} {step.id ? `(ID: ${step.id})` : '(Nouvelle)'}
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
            onChange={(e) => setAssignmentType(e.target.value as 'roles' | 'departments' | 'services' | 'users')}
            className="w-full p-2 border border-emerald-300 dark:border-emerald-600 rounded-md focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="roles">Rôles</option>
            <option value="departments">Départements</option>
            <option value="services">Services</option>
            <option value="users">Utilisateurs</option>
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
                 assignmentType === 'users' ? 'Sélectionner un ou plusieurs utilisateurs' : // Ajout de la condition pour les utilisateurs
                 ''}
              </label>
              <button
                type="button"
                onClick={() => {
                  const options = assignmentType === 'roles' ? entities.roles :
                               assignmentType === 'departments' ? entities.departments :
                               assignmentType === 'services' ? entities.services :
                               entities.users; // Default to users if not roles, departments, or services
                
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
                  assignmentType === 'users' ? entities.users.length : // Ajout de la condition pour les utilisateurs
                  0)
                  ? 'Désélectionner tout' 
                  : 'Sélectionner tout'
                }
              </button>
            </div>

            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {/* Removed duplicate opening div */}
              {(assignmentType === 'roles' ? entities.roles :
                assignmentType === 'departments' ? entities.departments :
                assignmentType === 'services' ? entities.services :
                entities.users).map(option => ( // Default to users if not roles, departments, or services
                <div key={option.id} className="flex items-center py-1">
                  <input
                    type="checkbox"
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
                    {/* Adapter l'affichage en fonction du type d'entité */}
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

// Ajoutez ce composant PopupSuccess pour afficher un message élégant
const SuccessPopup = ({ message }: { message: string; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full transform transition-all">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Mise à jour réussie</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Redirection vers la liste des workflows...</p>
      </div>
    </div>
  </div>
);