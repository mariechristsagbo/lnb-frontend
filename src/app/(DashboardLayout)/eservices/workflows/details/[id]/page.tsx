"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation"; // Importer useRouter
import axios from "axios";
import Cookies from "js-cookie";
import { FaCheck, FaTimes, FaUser, FaUsers, FaBuilding, FaCogs, FaCode, FaTag, FaShieldAlt, FaSitemap, FaEdit, FaTrash, FaListOl } from "react-icons/fa"; // Ajout d'icônes pour les boutons
import { handleAxiosError } from "../../../../../../services/workflows_endpoints"; // Importer la gestion d'erreur

// Interfaces
interface Entity {
  id: number;
  name?: string;
  username?: string;
}

interface Workflow {
  id: number;
  name: string;
  description: string;
  code: string;
  status: string;
  public_access: boolean; // Ajouter la propriété public_access
  services: Entity[];
  departments: Entity[];
  authorized_roles: Entity[];
  authorized_services: Entity[];
  authorized_departments: Entity[];
  authorized_functions: Entity[];
  authorized_users: Entity[];
}

interface AssignedUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
}
interface AssignedRole {
  id: number;
  name: string;
}
interface AssignedDepartment {
  id: number;
  name: string;
  code: string;
}
interface AssignedService {
  id: number;
  name: string;
  code: string;
}

interface WorkflowStep {
  id: number;
  workflow: number;
  name: string;
  description: string;
  order: number;
  status: string;
  is_validation_required: boolean;
  use_hierarchy: boolean;
  hierarchy_min_level: number;
  hierarchy_max_level: number;
  assigned_users: AssignedUser[];
  assigned_roles: AssignedRole[];
  assigned_departments: AssignedDepartment[];
  assigned_services: AssignedService[];
  allow_reassignment: boolean;
  send_notification_on_assignment: boolean;
  hierarchy_type: string | null;
  hierarchy_direction: string | null;
  hierarchy_level: number | null;
  target_function: string | null;
  target_function_details: unknown;
  default_assignee: number | null;
  default_assignee_details: unknown;
}

// Composants Réutilisables
const Badge: React.FC<{ text: string, shade?: string }> = ({ text, shade = "green" }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-1 mb-1 bg-${shade}-100 text-${shade}-800 border border-${shade}-200`} style={{ minWidth: 48, textAlign: "center" }}>
    {text}
  </span>
);

const StepCard: React.FC<{ step: WorkflowStep }> = ({ step }) => (
  <div className="bg-white rounded-lg shadow-md p-6 mb-4 border border-green-100">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-green-900">Étape {step.order}: {step.name}</h3>
      <Badge text={step.status} shade="green" />
    </div>
    <p className="text-green-800 mb-4">{step.description}</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div className="flex items-center mb-2">
          <FaCheck className={`mr-2 text-${step.is_validation_required ? 'emerald' : 'gray'}-500`} />
          <span className="text-green-900 font-semibold">Validation requise :</span>
          <span className="ml-2">{step.is_validation_required ? "Oui" : "Non"}</span>
        </div>
        <div className="flex items-center mb-2">
          <FaSitemap className={`mr-2 text-${step.use_hierarchy ? 'emerald' : 'gray'}-500`} />
          <span className="text-green-900 font-semibold">Hiérarchie :</span>
          <span className="ml-2">{step.use_hierarchy ? "Oui" : "Non"}</span>
        </div>
        {step.use_hierarchy && (
          <div className="text-xs text-green-800 ml-6">
            <span>Type: {step.hierarchy_type || "-"}</span>
            <span className="ml-2">Dir: {step.hierarchy_direction || "-"}</span>
            <span className="ml-2">Niveau: {step.hierarchy_level ?? "-"}</span>
            <span className="ml-2">Min: {step.hierarchy_min_level} / Max: {step.hierarchy_max_level}</span>
          </div>
        )}
      </div>
      <div>
        {/* Condition pour afficher la section Utilisateurs assignés */}
        {step.assigned_users.length > 0 && (
          <div className="flex items-center mb-2">
            <FaUser className="mr-2 text-green-500" />
            <span className="text-green-900 font-semibold">Utilisateurs :</span>
            <div className="ml-2 flex flex-wrap">
              {step.assigned_users.map(u => <Badge key={u.id} text={u.full_name || u.username} shade="green" />)}
            </div>
          </div>
        )}
        {/* Condition pour afficher la section Rôles assignés */}
        {step.assigned_roles.length > 0 && (
          <div className="flex items-center mb-2">
            <FaUsers className="mr-2 text-lime-500" />
            <span className="text-green-900 font-semibold">Rôles :</span>
            <div className="ml-2 flex flex-wrap">
              {step.assigned_roles.map(r => <Badge key={r.id} text={r.name} shade="lime" />)}
            </div>
          </div>
        )}
        {/* Condition pour afficher la section Départements assignés */}
        {step.assigned_departments.length > 0 && (
          <div className="flex items-center mb-2">
            <FaBuilding className="mr-2 text-emerald-500" />
            <span className="text-green-900 font-semibold">Départements :</span>
            <div className="ml-2 flex flex-wrap">
              {step.assigned_departments.map(d => <Badge key={d.id} text={d.name} shade="emerald" />)}
            </div>
          </div>
        )}
        {/* Condition pour afficher la section Services assignés */}
        {step.assigned_services.length > 0 && (
          <div className="flex items-center mb-2">
            <FaCogs className="mr-2 text-teal-500" />
            <span className="text-green-900 font-semibold">Services :</span>
            <div className="ml-2 flex flex-wrap">
              {step.assigned_services.map(s => <Badge key={s.id} text={s.name} shade="teal" />)}
            </div>
          </div>
        )}
        {/* Afficher un message si aucune assignation spécifique */}
        {step.assigned_users.length === 0 &&
         step.assigned_roles.length === 0 &&
         step.assigned_departments.length === 0 &&
         step.assigned_services.length === 0 && (
            <span className="text-gray-400 text-sm">Aucune assignation spécifique (peut utiliser la hiérarchie).</span>
        )}
      </div>
    </div>
    <div className="flex items-center mt-4">
      <FaTimes className={`mr-2 text-${step.allow_reassignment ? 'emerald' : 'gray'}-500`} />
      <span className="text-green-900 font-semibold">Réaffectation autorisée :</span>
      <span className="ml-2">{step.allow_reassignment ? "Oui" : "Non"}</span>
    </div>
  </div>
);

// --- AJOUT: Composant Notification (inspiré de EditWorkflowClient) ---
const Notification = ({ type, message, onClose }: {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}) => (
  <div className={`fixed top-5 right-5 z-50 mb-4 p-4 rounded-md shadow-lg flex justify-between items-center ${
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
    <button onClick={onClose} aria-label="Fermer la notification" className="ml-4">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);
// --- FIN AJOUT ---

const WorkflowDetailsPage = () => {
  const { id } = useParams();
  const router = useRouter(); // Initialiser useRouter
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // État pour le chargement de la suppression
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null); // État pour les notifications

  // --- MODIFICATION: Gestionnaires d'événements des boutons ---
  const handleEditWorkflow = () => {
    console.log("Naviguer vers l'édition du workflow:", id);
    router.push(`/workflows/edit/${id}`); // Navigue vers la page d'édition
  };

  const handleDeleteWorkflow = async () => {
    if (!workflow) return;

    console.log("Tentative de suppression du workflow:", id);
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le workflow "${workflow.name}" ? Cette action est irréversible.`)) {
      setIsDeleting(true);
      setNotification(null); // Réinitialiser la notification
      const authTokens = Cookies.get('authTokens');
      if (!authTokens) {
        setNotification({ type: 'error', message: "Non authentifié" });
        setIsDeleting(false);
        return;
      }
      let tokens;
      try { tokens = JSON.parse(authTokens); } catch {
        setNotification({ type: 'error', message: "Session invalide." });
        setIsDeleting(false);
        return;
      }
      const accessToken = tokens.access;

      try {
        await axios.delete(
          `https://www.backend.lnb-intranet.globalitnet.org/workflows/workflows/${id}/`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        setNotification({ type: 'success', message: "Workflow supprimé avec succès." });
        // Rediriger après un court délai pour que l'utilisateur voie la notification
        setTimeout(() => {
            router.push('/workflows');
        }, 1500);
      } catch (err: unknown) {
         console.error("Erreur lors de la suppression:", err);
         const message = handleAxiosError(err); // Utiliser le gestionnaire d'erreur importé
         setNotification({ type: 'error', message: `Impossible de supprimer le workflow: ${message}` });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleManageSteps = () => {
    // La page d'édition gère aussi les étapes
    console.log("Naviguer vers la gestion des étapes (via édition) pour le workflow:", id);
    router.push(`/workflows/edit/${id}`); // Navigue vers la page d'édition
  };
  // --- FIN MODIFICATION ---

  useEffect(() => {
    const fetchWorkflowDetails = async () => {
      const authTokens = Cookies.get('authTokens');
      if (!authTokens) {
        setError("Non authentifié");
        setLoading(false);
        return;
      }
      let tokens;
      try {
          tokens = JSON.parse(authTokens);
      } catch {
          setError("Session invalide. Veuillez vous reconnecter.");
          setLoading(false);
          return;
      }
      const accessToken = tokens.access;

      setLoading(true); // Reset loading state for fetch
      setError(null); // Reset error state

      try {
        const workflowRes = await axios.get(
          `https://www.backend.lnb-intranet.globalitnet.org/workflows/workflows/${id}/`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setWorkflow(workflowRes.data);

        const stepsRes = await axios.get(
          `https://www.backend.lnb-intranet.globalitnet.org/workflows/workflows/${id}/steps/`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        // S'assurer que steps est toujours un tableau, même si l'API renvoie null ou autre chose
        setSteps(Array.isArray(stepsRes.data) ? stepsRes.data : []);

      } catch (err: unknown) { // Utiliser unknown pour le type d'erreur
        console.error("Erreur API:", err); // Log l'erreur complète
        if (axios.isAxiosError(err)) {
            // Gérer les erreurs Axios spécifiquement
            if (err.response) {
                // L'API a répondu avec un statut hors 2xx
                setError(`Erreur ${err.response.status}: ${JSON.stringify(err.response.data) || err.message}`);
            } else if (err.request) {
                // La requête a été faite mais aucune réponse n'a été reçue
                setError("Aucune réponse du serveur. Vérifiez votre connexion ou l'état du serveur.");
            } else {
                // Une erreur s'est produite lors de la configuration de la requête
                setError(`Erreur de configuration: ${err.message}`);
            }
        } else {
            // Erreur non-Axios
            setError(`Erreur lors du chargement des données: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflowDetails();
  }, [id]);

  if (loading) return <div className="text-center py-10 text-lg font-semibold text-green-700">Chargement...</div>;
  if (error) return <div className="text-center py-10 text-red-600 bg-red-50 border border-red-200 rounded p-4 max-w-2xl mx-auto">{error}</div>;
  if (!workflow) return <div className="text-center py-10 text-gray-500">Aucun workflow trouvé.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 relative"> {/* Ajout de relative pour le positionnement de la notification */}
      {/* Afficher la notification si elle existe */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <h1 className="text-3xl font-bold mb-6 text-green-900">Détails du workflow</h1>

      {/* Carte des détails du Workflow */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-4 border border-green-100"> {/* mb-4 au lieu de mb-8 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-green-900">{workflow.name}</h2>
          <Badge text={workflow.status} shade="green" />
        </div>
        <p className="text-green-800 mb-4">{workflow.description}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Colonne 1: Infos générales & Applicabilité */}
          <div>
            <div className="flex items-center mb-2">
              <FaCode className="mr-2 text-green-500" />
              <span className="text-green-900 font-semibold">Code :</span>
              <span className="ml-2 text-green-800">{workflow.code}</span>
            </div>
            {/* --- MODIFICATION: Changement de label --- */}
            {workflow.departments.length > 0 && (
              <div className="flex items-center mb-2">
                <FaBuilding className="mr-2 text-emerald-500" />
                <span className="text-green-900 font-semibold">Départements associés :</span>
                <div className="ml-2 flex flex-wrap">
                  {workflow.departments.map(d => <Badge key={d.id} text={d.name || ""} shade="emerald" />)}
                </div>
              </div>
            )}
            {workflow.services.length > 0 && (
              <div className="flex items-center mb-2">
                <FaCogs className="mr-2 text-teal-500" />
                <span className="text-green-900 font-semibold">Services applicables :</span>
                <div className="ml-2 flex flex-wrap">
                  {workflow.services.map(s => <Badge key={s.id} text={s.name || ""} shade="teal" />)}
                </div>
              </div>
            )}
          </div>

          {/* Colonne 2: Autorisations (Conditionnelles) */}
          <div>
            {/* Afficher l'indicateur d'accès public */}
            {workflow.public_access ? (
              <div className="flex items-center mb-2 bg-blue-50 p-2 rounded-md border border-blue-200">
                <FaShieldAlt className="mr-2 text-blue-500" />
                <span className="text-blue-900 font-semibold">Accès public :</span>
                <span className="ml-2 text-blue-800">Accessible à tous les utilisateurs du système</span>
              </div>
            ) : (
              <>
                {workflow.authorized_roles.length > 0 && (
                  <div className="flex items-center mb-2">
                    <FaUsers className="mr-2 text-lime-500" />
                    <span className="text-green-900 font-semibold">Rôles autorisés :</span>
                    <div className="ml-2 flex flex-wrap">
                      {workflow.authorized_roles.map(r => <Badge key={r.id} text={r.name || ""} shade="lime" />)}
                    </div>
                  </div>
                )}
                {workflow.authorized_departments.length > 0 && (
                  <div className="flex items-center mb-2">
                    <FaBuilding className="mr-2 text-emerald-500" />
                    <span className="text-green-900 font-semibold">Départements autorisés :</span>
                    <div className="ml-2 flex flex-wrap">
                      {workflow.authorized_departments.map(d => <Badge key={d.id} text={d.name || ""} shade="emerald" />)}
                    </div>
                  </div>
                )}
                {workflow.authorized_services.length > 0 && (
                  <div className="flex items-center mb-2">
                    <FaCogs className="mr-2 text-teal-500" />
                    <span className="text-green-900 font-semibold">Services autorisés :</span>
                    <div className="ml-2 flex flex-wrap">
                      {workflow.authorized_services.map(s => <Badge key={s.id} text={s.name || ""} shade="teal" />)}
                    </div>
                  </div>
                )}
                {workflow.authorized_functions.length > 0 && (
                  <div className="flex items-center mb-2">
                    <FaTag className="mr-2 text-cyan-500" />
                    <span className="text-green-900 font-semibold">Fonctions autorisées :</span>
                    <div className="ml-2 flex flex-wrap">
                      {workflow.authorized_functions.map(f => <Badge key={f.id} text={f.name || ""} shade="cyan" />)}
                    </div>
                  </div>
                )}
                {workflow.authorized_users.length > 0 && (
                  <div className="flex items-center mb-2">
                    <FaUser className="mr-2 text-green-500" />
                    <span className="text-green-900 font-semibold">Utilisateurs autorisés :</span>
                    <div className="ml-2 flex flex-wrap">
                      {workflow.authorized_users.map(u => <Badge key={u.id} text={u.username || ""} shade="green" />)}
                    </div>
                  </div>
                )}
                {/* Afficher un message si aucune autorisation spécifique */}
                {workflow.authorized_roles.length === 0 &&
                 workflow.authorized_departments.length === 0 &&
                 workflow.authorized_services.length === 0 &&
                 workflow.authorized_functions.length === 0 &&
                 workflow.authorized_users.length === 0 && (
                    <span className="text-gray-400 text-sm">Aucune autorisation spécifique définie.</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- AJOUT: Section des boutons d'action --- */}
      <div className="flex justify-end space-x-3 mb-8">
        <button
          onClick={handleEditWorkflow}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isDeleting} // Désactiver pendant la suppression
        >
          <FaEdit className="mr-2 -ml-1 h-5 w-5" />
          Modifier
        </button>
        <button
          onClick={handleManageSteps}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={isDeleting} // Désactiver pendant la suppression
        >
          <FaListOl className="mr-2 -ml-1 h-5 w-5" />
          Gérer les étapes
        </button>
        <button
          onClick={handleDeleteWorkflow}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          disabled={isDeleting} // Désactiver si déjà en cours de suppression
        >
          {isDeleting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Suppression...
            </>
          ) : (
            <>
              <FaTrash className="mr-2 -ml-1 h-5 w-5" />
              Supprimer
            </>
          )}
        </button>
      </div>
      {/* --- FIN AJOUT --- */}


      {/* --- MODIFICATION: Ajout du décompte des étapes --- */}
      <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold text-green-800">Étapes du workflow</h2>
          {steps.length > 0 && (
              <span className="text-sm font-medium text-green-700">
                  Nombre total d&apos;étapes : {steps.length}
              </span>
          )}
      </div>
      {/* --- FIN MODIFICATION --- */}

      {steps.length === 0 ? (
        <div className="text-center text-gray-400 py-6">Aucune étape trouvée.</div>
      ) : (
        steps.map(step => <StepCard key={step.id} step={step} />)
      )}
    </div>
  );
};

export default WorkflowDetailsPage;
