'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { 
  getAvailableWorkflows, 
  retrieveWorkflow, 
  createEServiceRequest, 
  addDocumentToEServiceRequest,
  Workflow,
  EServiceRequest,
  handleAxiosError
} from "../../../../services/workflows_endpoints";

// Structure du token JWT décodé
interface DecodedToken {
  user_id: number;
  exp: number;
  // autres champs possibles...
}

interface FormData {
  workflow: number;
  requester: number;
  title: string; // <-- Ajoute ce champ
  description: string;
  priority?: 'high' | 'medium' | 'normal';
  files: File[];
}

export default function RequestSubmissionPage() {
  const router = useRouter();
  
  // États
  const [loading, setLoading] = useState(false);
  const [_currentUserId, setCurrentUserId] = useState<number>(0);
  const [formData, setFormData] = useState<FormData>({
    workflow: 0,
    requester: 0,
    title: '', // <-- Ajoute ce champ
    description: '',
    priority: 'normal',
    files: [],
  });

  // Workflows disponibles
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [selectedWorkflowDetails, setSelectedWorkflowDetails] = useState<Workflow | null>(null);

  // Récupération du token d'authentification et de l'ID utilisateur
  const getAuthTokenAndUserId = () => {
    const token = Cookies.get('authTokens');
    if (!token) {
      throw new Error("Token d'accès introuvable. Veuillez vous reconnecter.");
    }
    
    const parsedToken = JSON.parse(token);
    const accessToken = parsedToken.access;
    
    try {
      // Décoder le token pour obtenir l'ID utilisateur
      const decoded = jwtDecode<DecodedToken>(accessToken);
      return { accessToken, userId: decoded.user_id };
    } catch (error) {
      console.error("Erreur lors du décodage du token:", error);
      throw new Error("Token d'accès invalide. Veuillez vous reconnecter.");
    }
  };

  // Récupération de l'ID utilisateur au chargement
  useEffect(() => {
    try {
      const { userId } = getAuthTokenAndUserId();
      setCurrentUserId(userId);
      
      // Mettre à jour le formData avec l'ID utilisateur
      setFormData(prev => ({
        ...prev,
        requester: userId
      }));
    } catch (error) {
      console.error("Erreur d'authentification:", error);
      setNotification({
        type: 'error',
        message: "Erreur d'authentification. Veuillez vous reconnecter."
      });
      
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    }
  }, [router]);

  // Récupération des workflows disponibles - utilisation de la fonction getAvailableWorkflows
  useEffect(() => {
    const fetchWorkflows = async () => {
      setWorkflowsLoading(true);
      try {
        // Utiliser la fonction d'API prédéfinie
        const response = await getAvailableWorkflows();
        console.log("Workflows disponibles :", response.data); // ← Ajoute ce log
        
        interface PaginatedResponse {
          results: Workflow[];
        }
        
        if (Array.isArray(response.data)) {
          setWorkflows(response.data);
        } else if (response.data && (response.data as PaginatedResponse).results) {
          setWorkflows((response.data as PaginatedResponse).results);
        } else {
          console.error('Format de données de workflows inattendu:', response.data);
          setWorkflows([]);
        }
      } catch (error) {
        console.error('Erreur:', error);
        // Utiliser handleAxiosError pour le traitement standardisé
        const errorMessage = handleAxiosError(error);
        setNotification({
          type: 'error',
          message: errorMessage
        });
        
        if (errorMessage.includes('reconnecter')) {
          setTimeout(() => {
            router.push('/auth/login');
          }, 2000);
        }
      } finally {
        setWorkflowsLoading(false);
      }
    };

    fetchWorkflows();
  }, [router]);

  // Récupération des détails d'un workflow - utilisation de retrieveWorkflow
  const fetchWorkflowDetails = async (workflowId: number) => {
    if (workflowId <= 0) return;
    
    try {
      // Utiliser la fonction d'API prédéfinie
      const response = await retrieveWorkflow(workflowId);
      setSelectedWorkflowDetails(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      const errorMessage = handleAxiosError(error);
      setNotification({
        type: 'error',
        message: errorMessage
      });
    }
  };

  // Mise à jour du workflow sélectionné
  const handleWorkflowChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const workflowId = parseInt(e.target.value);
    setFormData({...formData, workflow: workflowId});
    
    // Récupérer les détails du workflow sélectionné
    if (workflowId > 0) {
      fetchWorkflowDetails(workflowId);
    } else {
      setSelectedWorkflowDetails(null);
    }
  };

  // Gestion des fichiers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const maxSize = 10 * 1024 * 1024; // 10MB

      const oversizedFiles = newFiles.filter(file => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        setNotification({
          type: 'error',
          message: 'Un ou plusieurs fichiers dépassent la limite de 10MB'
        });
        return;
      }

      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...newFiles]
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  // Soumission du formulaire - utilisant createEServiceRequest et addDocumentToEServiceRequest
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.workflow) {
        throw new Error('Veuillez sélectionner un e-service');
      }
      
      if (!formData.description) {
        throw new Error('Veuillez ajouter une description');
      }

      // S'assurer que l'ID utilisateur est bien défini
      if (!formData.requester) {
        throw new Error("Impossible d'identifier l'utilisateur. Veuillez vous reconnecter.");
      }

      // Préparation des données pour l'API (avec tous les champs obligatoires)
      const serviceRequestData = {
        workflow_id: formData.workflow,
        requester: formData.requester,
        title: formData.title, // <-- Ajoute ce champ
        description: formData.description,
        status: "pending" as EServiceRequest["status"],
        priority: formData.priority
      };

      console.log("Données envoyées:", serviceRequestData);

      // Création de la demande de service en utilisant la fonction d'API prédéfinie
      console.log("Appel à createEServiceRequest avec :", serviceRequestData);
      const response = await createEServiceRequest(serviceRequestData);
      console.log("Réponse de createEServiceRequest :", response);

      const newRequest = response.data;
      console.log("Nouvelle demande créée :", newRequest);

      // Si des fichiers sont présents, les ajouter à la demande
      if (formData.files.length > 0 && newRequest.id) {
        console.log("Ajout de fichiers à la demande :", formData.files);
        await Promise.all(formData.files.map(async (file) => {
          // Conversion du fichier en base64
          const toBase64 = (file: File) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => {
                // On retire le préfixe "data:...;base64,"
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
              };
              reader.onerror = error => reject(error);
            });

          try {
            const base64File = await toBase64(file);
            const formData = new FormData();
            formData.append('title', file.name);
            formData.append('file', base64File);
            formData.append('description', 'Pièce jointe pour la demande');
            formData.append('step_instance_id', '0'); // ou l’ID réel si tu en as un
            const docResponse = await addDocumentToEServiceRequest(newRequest.id, formData);
            console.log(`Fichier ${file.name} ajouté avec succès :`, docResponse);
          } catch (fileError) {
            console.error(`Erreur lors de l'ajout du fichier ${file.name} :`, fileError);
          }
        }));
      }

      setNotification({
        type: 'success',
        message: `Demande créée avec succès !\n
          Référence : ${newRequest.request_code || newRequest.reference_number || newRequest.id}\n
          Statut : ${newRequest.status}\n
          Workflow : ${
            typeof newRequest.workflow === 'object' && newRequest.workflow !== null
              ? newRequest.workflow.name
              : ''
          }`
      });

      // Redirection vers la liste des demandes
      setTimeout(() => {
        router.push('/demandes/listes');
      }, 2000);
      
    } catch (error) {
      console.error("Erreur lors de la soumission du formulaire :", error);
      const errorMessage = handleAxiosError(error);
      setNotification({
        type: 'error',
        message: errorMessage
      });
      
      if (errorMessage.includes('reconnecter')) {
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    } finally {
      setLoading(false);
      console.log("Fin du handleSubmit, loading:", loading);
    }
  };

  return (
    // Le reste du JSX reste identique
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-700 shadow rounded-lg overflow-hidden border dark:border-emerald-600">
        {/* En-tête */}
        <div className="p-6 border-b dark:border-emerald-600">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvelle demande d&apos;e-service</h1>
              <nav className="flex mt-2">
                <ol className="flex items-center space-x-2 text-sm dark:text-white">
                  <li className="text-gray-500 dark:text-gray-300">Sélectionnez un e-service et fournissez les informations nécessaires</li>
                </ol>
              </nav>
            </div>
            <Link 
              href="/demandes/listes" 
              className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Voir mes demandes
            </Link>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`p-4 ${
            notification.type === 'success' 
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
          }`}>
            <div className="flex justify-between items-center dark:text-white">
              <p>{notification.message}</p>
              <button onClick={() => setNotification(null)} className="font-bold">×</button>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 dark:text-white">
          {/* Sélection du workflow */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
              E-service <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.workflow || ''}
              onChange={handleWorkflowChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
              disabled={workflowsLoading}
              required
            >
              <option value="">Sélectionnez un e-service</option>
              {Array.isArray(workflows) && workflows.map((workflow) => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </option>
              ))}
            </select>
            {workflowsLoading && (
              <p className="mt-1 text-sm text-emerald-500">Chargement des e-services...</p>
            )}
          </div>

          {/* Détails du workflow sélectionné */}
          {selectedWorkflowDetails && (
            <div className="bg-gray-50 p-4 rounded-md dark:bg-gray-600">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-700 dark:text-white">Détails de l&apos;e-service</h3>
                <Link 
                  href={`/workflows/details/${selectedWorkflowDetails.id}`} 
                  className="text-emerald-600 hover:text-emerald-800 text-sm font-medium dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center"
                >
                  <span>Voir détails complets</span>
                  <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-200">{selectedWorkflowDetails.description}</p>
              {selectedWorkflowDetails.departments && selectedWorkflowDetails.departments.length > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">
                  Département(s): {selectedWorkflowDetails.departments.map(dept => dept.name).join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Titre de la demande */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Objets de la demande <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
              required
              placeholder="Titre court de la demande"
            />
          </div>

          {/* Description (champ principal traité par le backend) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Description détaillée <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
              required
              placeholder="Veuillez décrire votre demande en détail..."
            />
          </div>

          {/* Fichiers joints */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
              Pièces jointes
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md dark:border-emerald-600">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div className="flex text-sm text-gray-600 dark:text-gray-300">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300">
                    <span>Téléverser un fichier</span>
                    <input
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      multiple
                    />
                  </label>
                  <p className="pl-1">ou glisser-déposer</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PDF, DOCX, JPEG jusqu&apos;à 10MB
                </p>
              </div>
            </div>

            {/* Liste des fichiers */}
            {formData.files.length > 0 && (
              <div className="mt-4 space-y-2">
                {formData.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded dark:bg-gray-600 dark:border-emerald-600">
                    <div className="flex items-center dark:text-white">
                      <svg className="h-4 w-4 text-gray-500 dark:text-gray-300 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-white">
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-emerald-600">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-600 dark:text-white dark:border-emerald-600"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800"
              disabled={loading}
            >
              {loading ? 'Envoi en cours...' : 'Soumettre la demande'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}