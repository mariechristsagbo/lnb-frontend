"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, TrashBinIcon } from "@/icons";
// Suppression de l'import non utilisé workflowService
import Cookies from 'js-cookie';
import { entityService } from '@/services/entityService';
import { jwtDecode } from 'jwt-decode';

// Types pour remplacer any
interface JwtPayload {
  exp: number;
  [key: string]: unknown;
}

// Interfaces (inchangées)
interface AssignableEntity {
  id: number;
  name: string;
  username?: string;
  email?: string;
}

// Ajouter cette interface pour la configuration hiérarchique
interface HierarchyConfig {
  use_hierarchy: boolean;
  min_level: number;
  max_level: number;
  require_all_levels: boolean;
  approval_sequence: 'ascending' | 'parallel';
  minimum_approvals_required: number;
  allow_skip_levels: boolean;
  require_sequential_approval: boolean;
  notifications: {
    notify_on_approval: boolean;
    notify_on_rejection: boolean;
    notify_next_level: boolean;
    escalation_delay: number;
  };
}

// Mise à jour de l'interface WorkflowStep
interface WorkflowStep {
  workflow?: number;
  name: string;
  description: string;
  order: number;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed';
  is_delegatable: boolean;
  assignment_type: 'user' | 'role' | 'service' | 'department' | 'function';
  assigned_to_user?: number | null;
  assigned_to_role?: number | null;
  assigned_to_service?: number | null;
  assigned_to_department?: number | null;
  assigned_to_function?: number | null;
  requires_documents: boolean;
  auto_notify: boolean;
  estimated_duration: string | null;
  deadline?: string | null;
  depends_on: number[];
  is_rejection_task: boolean;
  requires_all_approvals: boolean;
  auto_assign_next: boolean;
  is_final_step: boolean;
  assignment_value: string | number;
  hierarchy_config?: HierarchyConfig;
}

// Modifier l'interface WorkflowFormData
interface WorkflowFormData {
  name: string;
  description: string;
  service: number | null;
  department: number | null;
  is_active: boolean;
  assignation_type: 'service' | 'department';  // Nouveau champ pour le type d'assignation
  authorization_type: 'user' | 'role' | 'service' | 'department';
  authorized_entity: number | null;
  authorized_users: number[];
  authorized_roles: number[];
  authorized_services: number[];
  authorized_departments: number[];
  steps: WorkflowStep[];
  // Supprimer la config qui n'est pas nécessaire
}

// Types spécifiques pour remplacer les any
type FieldType = keyof WorkflowStep;
type FieldValue = string | number | boolean | HierarchyConfig | null;

export default function AddWorkflow() {
  const router = useRouter();
  
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, _setRefreshToken] = useState<string | null>(null);
  const [_isLoading, setIsLoading] = useState(true); // Préfixé avec _
  const [_error, setError] = useState<string | null>(null); // Préfixé avec _
  const [notification, setNotification] = useState<{ 
    type: 'success' | 'error';
    message: string 
  } | null>(null);
  
  // Déplacer la déclaration du state formData avant le useEffect
  // Modifier le state initial
  const [formData, setFormData] = useState<WorkflowFormData>({
    name: '',
    description: '',
    service: null,
    department: null,
    assignation_type: 'service',
    is_active: true,
    authorization_type: 'user',
    authorized_entity: null,
    authorized_users: [],
    authorized_roles: [],
    authorized_services: [],
    authorized_departments: [],
    steps: [{
      workflow: undefined,
      name: '',
      description: '',
      order: 1,
      status: 'pending',
      is_delegatable: true,
      assignment_type: 'user',
      assigned_to_user: null,
      assigned_to_role: null,
      assigned_to_service: null,
      assigned_to_department: null,
      assigned_to_function: null,
      requires_documents: false,
      auto_notify: true,
      estimated_duration: '',
      deadline: null,
      depends_on: [],
      is_rejection_task: false,
      requires_all_approvals: false,
      auto_assign_next: false,
      is_final_step: false,
      assignment_value: ''
    }]
  });

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
  // Ajouter la fonction de rafraîchissement du token
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
    if (!accessToken) return;
  
    try {
      setIsLoading(true);
      setError(null);
  
      let token = accessToken;
      const decodedToken: JwtPayload = jwtDecode(token);
      
      if (decodedToken.exp * 1000 < Date.now()) {
        const newToken = await refreshAccessToken();
        if (!newToken) return;
        token = newToken;
      }
  
      const [usersData, rolesData, departmentsData, functionsData, servicesData] = await Promise.all([
        entityService.getAllUsers(token),
        entityService.getAllRoles(token),
        entityService.getAllDepartments(token),
        entityService.getAllFunctions(token),
        entityService.getAllServices(token)
      ]);
  
      console.log('Données reçues après formatage:', {
        users: usersData,
        roles: rolesData,
        departments: departmentsData,
        functions: functionsData,
        services: servicesData
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

  // Gestion des étapes (inchangée)
  const handleStepChange = (index: number, field: FieldType, value: FieldValue) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  // Gestion des valeurs d'assignation (inchangée)
  const handleAssignmentValueChange = (index: number, value: string) => {
    setFormData(prev => {
      const newSteps = [...prev.steps];
      newSteps[index] = { ...newSteps[index], assignment_value: value };
      return { ...prev, steps: newSteps };
    });
  };

  // Ajout d'étape (inchangé)
  const addStep = () => {
    if (formData.steps.length >= 10) {
      setNotification({ type: 'error', message: 'Maximum 10 étapes autorisées' });
      return;
    }

    setFormData(prev => ({
      ...prev,
      steps: [
        ...prev.steps.map((step, i) => i === prev.steps.length - 1 ? { ...step, is_final_step: false } : step),
        {
          workflow: undefined,
          name: '',
          description: '',
          order: prev.steps.length + 1,
          status: 'pending',
          is_delegatable: true,
          assignment_type: 'user',
          assigned_to_user: undefined,
          assigned_to_role: undefined,
          assigned_to_service: undefined,
          assigned_to_department: undefined,
          assigned_to_function: undefined,
          requires_documents: false,
          auto_notify: true,
          estimated_duration: '',
          deadline: undefined,
          depends_on: [],
          is_rejection_task: false,
          requires_all_approvals: false,
          auto_assign_next: false,
          is_final_step: false,
          assignment_value: ''
        }
      ]
    }));
  };

  // Suppression d'étape (inchangée)
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
          order: i + 1,
          is_final_step: i === prev.steps.length - 2
        }))
    }));
  };

  // Soumission du formulaire (simulée) (inchangée)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!accessToken) {
        throw new Error("Non authentifié");
      }

      let token = accessToken;
      const decodedToken: JwtPayload = jwtDecode(token);
      
      if (decodedToken.exp * 1000 < Date.now()) {
        const newToken = await refreshAccessToken();
        if (!newToken) return;
        token = newToken;
      }

      // Format des étapes
      const formattedSteps = formData.steps.map(step => {
        const formattedStep = {
          name: step.name,
          description: step.description,
          order: step.order,
          status: step.status,
          is_delegatable: step.is_delegatable,
          assignment_type: step.assignment_type,
          requires_documents: step.requires_documents,
          auto_notify: step.auto_notify,
          estimated_duration: step.estimated_duration,
          deadline: step.deadline,
          depends_on: step.depends_on,
          is_rejection_task: step.is_rejection_task,
        };

        // Ajouter le bon champ d'assignation selon le type
        const assignmentField = `assigned_to_${step.assignment_type}`;
        return {
          ...formattedStep,
          [assignmentField]: step.assignment_value
        };
      });

      // Données du workflow
      const workflowData = {
        name: formData.name,
        description: formData.description,
        [formData.assignation_type]: formData.assignation_type === 'service' ? formData.service : formData.department,
        is_active: formData.is_active,
        steps: formattedSteps
      };

      const response = await fetch('https://www.backend.lnb-intranet.globalitnet.org/workflows/api/workflows/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflowData)
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de la création: ${response.statusText}`);
      }

      setNotification({
        type: 'success',
        message: 'Workflow créé avec succès!'
      });

      setTimeout(() => router.push("/workflows"), 1500);

    } catch (error) {
      console.error("Erreur:", error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : "Erreur lors de la création du workflow"
      });
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
                  value={formData.assignation_type}
                  onChange={(e) => {
                    const type = e.target.value as 'service' | 'department';
                    setFormData({
                      ...formData,
                      assignation_type: type,
                      service: type === 'service' ? formData.service : null,
                      department: type === 'department' ? formData.department : null
                    });
                  }}
                  className="block w-full rounded-md border-emerald-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                >
                  <option value="service">Service</option>
                  <option value="department">Département</option>
                </select>
              </div>

              {/* Sélection du service ou département */}
              <div>
                <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-1">
                  {formData.assignation_type === 'service' ? 'Service' : 'Département'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.assignation_type === 'service' ? formData.service ?? '' : formData.department ?? ''}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setFormData({
                      ...formData,
                      service: formData.assignation_type === 'service' ? value : null,
                      department: formData.assignation_type === 'department' ? value : null
                    });
                  }}
                  className="block w-full rounded-md border-emerald-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                >
                  <option value="">Sélectionner...</option>
                  {formData.assignation_type === 'service' 
                    ? entities.services.map(service => (
                        <option key={service.id} value={service.id}>{service.name}</option>
                      ))
                    : entities.departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))
                  }
                </select>
              </div>

              {/* Activation du workflow */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 dark:border-emerald-600 dark:bg-gray-800"
                  />
                  <span className="ml-2 text-sm text-emerald-800 dark:text-emerald-200">
                    Activer le workflow
                  </span>
                </label>
              </div>

              {/* Autorisations */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-1">
                    Type d&apos;autorisation <span className="text-red-500">*</span>
                  </label>
                  <select 
                    className="block w-full rounded-md border-emerald-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                    value={formData.authorization_type}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      authorization_type: e.target.value as 'user' | 'role' | 'service' | 'department',
                      authorized_entity: null
                    }))}
                  >
                    <option value="user">Par utilisateur</option>
                    <option value="role">Par rôle</option>
                    <option value="service">Par service</option>
                    <option value="department">Par département</option>
                  </select>
                </div>

                {/* Liste des entités selon le type sélectionné */}
                <div>
                  <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-1">
                    {formData.authorization_type === 'user' ? 'Sélectionner un utilisateur' :
                    formData.authorization_type === 'role' ? 'Sélectionner un rôle' :
                    formData.authorization_type === 'service' ? 'Sélectionner un service' :
                    'Sélectionner un département'}
                    <span className="text-red-500">*</span>
                  </label>
                  <select 
                    className="block w-full rounded-md border-emerald-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                    value={formData.authorized_entity || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      authorized_entity: e.target.value ? Number(e.target.value) : null
                    }))}
                  >
                    <option value="">Sélectionner...</option>
                    {formData.authorization_type === 'user' && entities.users.map(user => (
                      <option key={user.id} value={user.id}>
                        {`${user.name || ''} ${user.email ? `(${user.email})` : ''}`}
                      </option>
                    ))}
                    {formData.authorization_type === 'role' && entities.roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                    {formData.authorization_type === 'service' && entities.services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                    {formData.authorization_type === 'department' && entities.departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section Étapes - Supprimer l'ancienne section Configuration du Workflow */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">Étapes du workflow</h2>
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
            
            <div className="space-y-6">
              {formData.steps.map((step, index) => (
                <StepComponent
                  key={index}
                  step={step}
                  index={index}
                  entities={entities}
                  onStepChange={(field, value) => handleStepChange(index, field, value)}
                  onAssignmentChange={(value) => handleAssignmentValueChange(index, value)}
                  onRemove={() => removeStep(index)}
                  _isLast={index === formData.steps.length - 1} // Préfixé avec _ car non utilisé
                  canRemove={formData.steps.length > 1}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push("/workflows")}
              className="px-4 py-2 text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-800/30"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Créer le workflow
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Composants réutilisables avec couleur verte
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

const _FormSelect = ({ label, value, options, onChange, required, className = '' }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  className?: string;
}) => (
  <div>
    <label className="block text-sm font-medium mb-1 text-emerald-800 dark:text-emerald-200">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value}
      onChange={onChange}
      className={`w-full p-2 border ${className} rounded-md focus:ring-2 dark:bg-gray-800 dark:text-white`}
      required={required}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
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
  step: WorkflowStep;
  index: number;
  entities: {
    users: AssignableEntity[];
    services: AssignableEntity[];
    functions: AssignableEntity[];
    departments: AssignableEntity[];
    roles: AssignableEntity[];
  };
  onStepChange: (field: keyof WorkflowStep, value: string | number | boolean | HierarchyConfig | null) => void;
  onAssignmentChange: (value: string) => void;
  onRemove: () => void;
  _isLast?: boolean;
  canRemove: boolean;
}

const StepComponent = ({ 
  step, 
  index, 
  entities, 
  onStepChange, 
  onAssignmentChange, 
  onRemove, 
  _isLast, // Préfixé avec _ car non utilisé
  canRemove 
}: StepComponentProps) => {
  const getAssignmentOptions = () => {
    switch (step.assignment_type) {
      case 'user':
        return entities.users.map(user => ({
          id: user.id,
          displayName: `${user.name} ${user.email ? `(${user.email})` : ''}`
        }));
      case 'role':
        return entities.roles.map(role => ({
          id: role.id,
          displayName: role.name
        }));
      case 'service':
        return entities.services.map(service => ({
          id: service.id,
          displayName: service.name
        }));
      case 'department':
        return entities.departments.map(dept => ({
          id: dept.id,
          displayName: dept.name
        }));
      case 'function':
        return entities.functions.map(func => ({
          id: func.id,
          displayName: func.name
        }));
      default:
        return [];
    }
  };

  return (
    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-6 border border-emerald-200 dark:border-emerald-800 relative">
      <div className="absolute -top-3 left-4 px-2 py-1 bg-emerald-600 text-white text-xs rounded-full">
        Étape {index + 1}
      </div>
      
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-4 right-4 text-red-500 hover:text-red-700"
          aria-label={`Supprimer l'étape ${index + 1}`}
        >
          <TrashBinIcon className="h-5 w-5" />
        </button>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <FormInput
          label="Nom de l'étape"
          value={step.name}
          onChange={(e) => onStepChange('name', e.target.value)}
          required
          className="border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {/* Sélecteur de type d'assignation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-emerald-800 dark:text-emerald-200">
            Type d&apos;assignation <span className="text-red-500">*</span>
          </label>
          <select
            value={step.assignment_type}
            onChange={(e) => onStepChange('assignment_type', e.target.value)}
            className="w-full p-2 border border-emerald-300 dark:border-emerald-600 rounded-md focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white"
            required
          >
            <option value="">Sélectionner le type...</option>
            <option value="user">Utilisateur</option>
            <option value="role">Rôle</option>
            <option value="service">Service</option>
            <option value="department">Département</option>
            <option value="function">Fonction</option>
          </select>
        </div>

        {/* Sélecteur d'entité */}
        <div>
          <label className="block text-sm font-medium mb-1 text-emerald-800 dark:text-emerald-200">
            Assigné à <span className="text-red-500">*</span>
          </label>
          <select
            value={step.assignment_value || ''}
            onChange={(e) => onAssignmentChange(e.target.value)}
            className="w-full p-2 border border-emerald-300 dark:border-emerald-600 rounded-md focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white"
            required
            disabled={!step.assignment_type} // Désactivé si aucun type n'est sélectionné
          >
            <option value="">Sélectionner...</option>
            {getAssignmentOptions().map(option => (
              <option key={option.id} value={option.id}>
                {option.displayName}
              </option>
            ))}
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

      {/* Configuration hiérarchique - uniquement visible si assignment_type est 'role' */}
      {step.assignment_type === 'role' && (
        <div className="mt-6 border-t border-emerald-200 pt-6">
          <h3 className="text-md font-medium mb-4 text-emerald-800 dark:text-emerald-200">
            Configuration de la hiérarchie
          </h3>
          
          <div className="space-y-4">
            <FormCheckbox
              label="Activer la validation hiérarchique"
              checked={step.hierarchy_config?.use_hierarchy || false}
              onChange={(e) => {
                // Créer une nouvelle configuration complète
                const newConfig: HierarchyConfig = createCompleteHierarchyConfig({
                  ...step.hierarchy_config,
                  use_hierarchy: e.target.checked
                });
                onStepChange('hierarchy_config', newConfig);
              }}
            />

            {step.hierarchy_config?.use_hierarchy && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    type="number"
                    label="Niveau minimum"
                    value={String(step.hierarchy_config.min_level)}
                    onChange={(e) => {
                      const updatedConfig: HierarchyConfig = {
                        use_hierarchy: step.hierarchy_config?.use_hierarchy ?? false,
                        min_level: parseInt(e.target.value) || 1,
                        max_level: step.hierarchy_config?.max_level ?? 5,
                        require_all_levels: step.hierarchy_config?.require_all_levels ?? true,
                        approval_sequence: step.hierarchy_config?.approval_sequence ?? 'ascending',
                        minimum_approvals_required: step.hierarchy_config?.minimum_approvals_required ?? 1,
                        allow_skip_levels: step.hierarchy_config?.allow_skip_levels ?? false,
                        require_sequential_approval: step.hierarchy_config?.require_sequential_approval ?? true,
                        notifications: {
                          notify_on_approval: step.hierarchy_config?.notifications?.notify_on_approval ?? true,
                          notify_on_rejection: step.hierarchy_config?.notifications?.notify_on_rejection ?? true,
                          notify_next_level: step.hierarchy_config?.notifications?.notify_next_level ?? true,
                          escalation_delay: step.hierarchy_config?.notifications?.escalation_delay ?? 48
                        }
                      };
                      onStepChange('hierarchy_config', updatedConfig);
                    }}
                    required
                  />
                  
                  {/* Les autres champs avec le même pattern */}
                </div>

                <div className="space-y-2">
                  {/* Notifications */}
                  <FormCheckbox
                    label="Notifier lors de l'approbation"
                    checked={step.hierarchy_config.notifications.notify_on_approval}
                    onChange={(e) => {
                      const updatedConfig: HierarchyConfig = {
                        use_hierarchy: step.hierarchy_config?.use_hierarchy ?? true,
                        min_level: step.hierarchy_config?.min_level ?? 1,
                        max_level: step.hierarchy_config?.max_level ?? 5,
                        require_all_levels: step.hierarchy_config?.require_all_levels ?? true,
                        approval_sequence: step.hierarchy_config?.approval_sequence ?? 'ascending',
                        minimum_approvals_required: step.hierarchy_config?.minimum_approvals_required ?? 1,
                        allow_skip_levels: step.hierarchy_config?.allow_skip_levels ?? false,
                        require_sequential_approval: step.hierarchy_config?.require_sequential_approval ?? true,
                        notifications: {
                          notify_on_approval: e.target.checked,
                          notify_on_rejection: step.hierarchy_config?.notifications?.notify_on_rejection ?? true,
                          notify_next_level: step.hierarchy_config?.notifications?.notify_next_level ?? true,
                          escalation_delay: step.hierarchy_config?.notifications?.escalation_delay ?? 48
                        }
                      };
                      onStepChange('hierarchy_config', updatedConfig);
                    }}
                  />
                  
                  {/* Autres notifications avec le même pattern */}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface MultiSelectProps {
  label: string;
  options: AssignableEntity[];
  value: number[];
  onChange: (values: number[]) => void;
}

// Préfixer le composant MultiSelect non utilisé
const _MultiSelect = ({ label, options, value, onChange }: MultiSelectProps) => {
  return (
    <div>
      <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-1">
        {label}
      </label>
      <select
        multiple
        value={value.map(String)}
        onChange={(e) => {
          const values = Array.from(e.target.selectedOptions, option => Number(option.value));
          onChange(values);
        }}
        className="block w-full rounded-md border-emerald-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
      >
        {options.map(option => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
};

const createCompleteHierarchyConfig = (partial?: Partial<HierarchyConfig>): HierarchyConfig => {
  return {
    use_hierarchy: partial?.use_hierarchy || false,
    min_level: partial?.min_level || 1,
    max_level: partial?.max_level || 5,
    require_all_levels: partial?.require_all_levels || true,
    approval_sequence: partial?.approval_sequence || 'ascending',
    minimum_approvals_required: partial?.minimum_approvals_required || 1,
    allow_skip_levels: partial?.allow_skip_levels || false,
    require_sequential_approval: partial?.require_sequential_approval || true,
    notifications: {
      notify_on_approval: partial?.notifications?.notify_on_approval || true,
      notify_on_rejection: partial?.notifications?.notify_on_rejection || true,
      notify_next_level: partial?.notifications?.notify_next_level || true,
      escalation_delay: partial?.notifications?.escalation_delay || 48
    }
  };
};