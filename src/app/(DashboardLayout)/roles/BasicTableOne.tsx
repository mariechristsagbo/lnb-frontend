"use client";
import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import Cookies from 'js-cookie';
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RoleForm from "./RoleForm";

export type RoleFormData = Partial<Omit<Role, "permissions"> & { permissions?: number[] }> & { [key: string]: unknown };

const LNB_GREEN = "#059669";
const LNB_GREEN_LIGHT = "#34d399";
const LNB_BG = "#f0fdf4";
const LNB_BG_TABLE = "#ecfdf5";
const LNB_ACCENT = "#047857";
const LNB_ERROR = "#ef4444";
const LNB_SUCCESS = "#22c55e";

const API_BASE = 'https://www.backend.lnb-intranet.globalitnet.org';
const API_URLS = {
  LIST_ROLES: `${API_BASE}/roles/list-roles/`,
  GET_ROLE_DETAILS: `${API_BASE}/roles/list-roles/`,
  CREATE_ROLE: `${API_BASE}/roles/create-role/`,
  UPDATE_ROLE: `${API_BASE}/roles/update-role/`,
  DELETE_ROLE: `${API_BASE}/roles/delete-role/`,
  ADD_PARENT: `${API_BASE}/roles/add-parent-role/`,
  REMOVE_PARENT: `${API_BASE}/roles/remove-parent-role/`,
  ASSIGN_TO_GROUP: `${API_BASE}/roles/assign-role-to-group/`,
  CLONE_ROLE: `${API_BASE}/roles/clone-role/`,
  LIST_PERMISSIONS: `${API_BASE}/roles/list-permissions/`,
  LIST_DEPARTMENTS: `${API_BASE}/services/departments/`,
  CREATE_PERMISSION: `${API_BASE}/roles/create-permission/`,
  UPDATE_PERMISSION: `${API_BASE}/roles/update-permission/`,
  DELETE_PERMISSION: `${API_BASE}/roles/delete-permission/`,
};

interface Role {
  id: number;
  name: string;
  description?: string;
  department?: Department | number | null;
  hierarchy_level?: { name: string } | number | string | null;
  weight?: number;
  permissions?: Permission[];
  [key: string]: unknown;
}

interface Permission {
  id: number;
  name: string;
  codename?: string;
  description?: string;
  level?: string | number;
  order?: number;
}

interface Department {
  id: number;
  name: string;
  [key: string]: unknown;
}

const _hierarchyLevels = [
  { value: 1, label: "1 (Plus haut)" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5 (Plus bas)" },
];

const NOT_AVAILABLE = <span style={{ color: "#bdbdbd" }}>Non renseigné</span>;

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [form, setForm] = useState<RoleFormData>({});
  const [error, setError] = useState<string | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRoleDetails, setSelectedRoleDetails] = useState<Role | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const getAccessToken = useCallback(() => { // Wrap in useCallback as it's used in dependencies
    const token = Cookies.get('authTokens');
    if (!token) return null;
    try {
      return JSON.parse(token).access;
    } catch {
      return null;
    }
  }, []); // No dependencies for getAccessToken itself

  const fetchRoles = useCallback(async () => { // Wrap in useCallback
    setLoading(true);
    setError(null);
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("Non authentifié");
      setLoading(false);
      console.error("[fetchRoles] Token d'accès introuvable");
      return;
    }
    try {
      const res = await fetch(API_URLS.LIST_ROLES, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        throw new Error(`Erreur HTTP: ${res.status}`);
      }
      const data = await res.json();
      console.log("[fetchRoles] Données reçues du backend :", data);
      let rolesArray: Role[] = [];
      // Type assertion for data structure check
      if (data && typeof data === 'object' && 'roles' in data && Array.isArray((data as { roles: unknown }).roles)) {
        rolesArray = (data as { roles: Role[] }).roles;
      } else if (Array.isArray(data)) {
        rolesArray = data;
      } else {
        setError("Format de données incorrect");
        console.error("[fetchRoles] Format de données incorrect :", data);
      }
      setRoles(Array.isArray(rolesArray) ? rolesArray : []);
    } catch (err: unknown) { // Type catch error as unknown
      const message = err instanceof Error ? err.message : "Impossible de charger les rôles.";
      setError(message);
      setRoles([]);
      console.error("[fetchRoles] Erreur lors de la récupération des rôles :", err);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]); // Add getAccessToken as dependency

  const _fetchDepartments = useCallback(async () => { // Wrap in useCallback
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("Non authentifié");
      return;
    }
    try {
      const res = await fetch(API_URLS.LIST_DEPARTMENTS, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      const data = await res.json();
      console.log("Réponse API départements :", data);
       // Type assertion for data structure check
      if (data && typeof data === 'object' && 'departments' in data && Array.isArray((data as { departments: unknown }).departments)) {
        setDepartments((data as { departments: Department[] }).departments);
      } else {
         setDepartments([]);
         console.error("Format de départements incorrect :", data);
      }
    } catch (err: unknown) { // Type catch error as unknown
      const message = err instanceof Error ? err.message : "Impossible de charger les départements.";
      setError(message);
      setDepartments([]);
      console.error("Erreur lors du chargement des départements :", err);
    }
  }, [getAccessToken]); // Add getAccessToken as dependency


  useEffect(() => {
    fetchRoles();
    _fetchDepartments();
  }, [fetchRoles, _fetchDepartments]); // Add dependencies

  const fetchRoleDetails = useCallback(async (roleId: number) => { // Wrap in useCallback
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setSelectedRoleDetails(null);

    const accessToken = getAccessToken();
    if (!accessToken) {
      setDetailError("Non authentifié.");
      setDetailLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URLS.GET_ROLE_DETAILS}${roleId}/`, {
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
          // Type assertion for errorData structure
          if (errorData && typeof errorData === 'object' && 'detail' in errorData) {
             errorMsg = String(errorData.detail) || errorMsg;
          }
        } catch (e: unknown) { // Type catch error as unknown
          console.error("Erreur lors de la récupération des détails du rôle (parsing error):", e);
        }
        throw new Error(errorMsg);
      }

      const data: Role = await response.json();
      if (data.permissions && !Array.isArray(data.permissions)) {
          console.warn("Permissions non reçues comme tableau dans les détails:", data.permissions);
          data.permissions = [];
      }
      setSelectedRoleDetails(data);

    } catch (error: unknown) { // Type catch error as unknown
      console.error("Erreur lors de la récupération des détails du rôle:", error);
      const message = error instanceof Error ? error.message : "Impossible de charger les détails.";
      setDetailError(message);
    } finally {
      setDetailLoading(false);
    }
  }, [getAccessToken]); // Add getAccessToken as dependency

  const handleOpenDialog = (role?: Role) => {
    setEditRole(role || null);
    // Initialiser le formulaire avec des valeurs primitives pour les Selects
    const initialFormState: RoleFormData = role
      ? {
          ...role, // Copier les autres propriétés
          // S'assurer que department est un ID (number) ou null/undefined
          department: typeof role.department === 'object' && role.department !== null ? role.department.id : role.department,
          // S'assurer que hierarchy_level est la valeur primitive (number/string) ou undefined
          hierarchy_level: typeof role.hierarchy_level === 'object' && role.hierarchy_level !== null && 'name' in role.hierarchy_level
              // Essayer de trouver la valeur correspondante dans _hierarchyLevels par le nom (si l'API renvoie l'objet {name: ...})
              ? _hierarchyLevels.find(lvl => lvl.label === (role.hierarchy_level as { name: string }).name)?.value
              // Sinon, utiliser la valeur si elle est déjà primitive
              : (typeof role.hierarchy_level === 'number' || typeof role.hierarchy_level === 'string' ? role.hierarchy_level : undefined),
          // Garder les permissions comme un tableau d'IDs
          permissions: role.permissions?.map((p: Permission) => p.id) || [],
        }
      : { permissions: [] }; // Pour un nouveau rôle, initialiser permissions comme tableau vide
    setForm(initialFormState);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditRole(null);
    setForm({}); // Réinitialiser le formulaire
  };

  const _handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    // Assurez-vous que la valeur pour 'department' et 'hierarchy_level' est bien une primitive si elle vient d'un Select
    setForm(f => ({ ...f, [name!]: value }));
  };

  const _handlePermissionsChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    // Ceci devrait déjà être correct si RoleForm passe un tableau de nombres
    setForm(f => ({ ...f, permissions: event.target.value as number[] }));
  };

  const handleSubmit = useCallback(async () => { // Wrap in useCallback
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("Non authentifié");
      toast.error("Non authentifié");
      return;
    }

    // Préparer le payload avec les IDs/valeurs primitives attendues par le backend
    const payload: {
        name?: string;
        description?: string;
        department_id?: number | null; // Envoyer l'ID du département
        hierarchy_level?: number | string | null; // Envoyer la valeur primitive
        weight?: number;
        permissions?: number[]; // Envoyer le tableau d'IDs
        // Ajouter d'autres champs si nécessaire selon l'API
    } = {
      name: form.name as string | undefined,
      description: form.description as string | undefined,
      // Assurer que department est bien un nombre avant de l'envoyer
      department_id: typeof form.department === "number" ? form.department : null,
      // Assurer que hierarchy_level est un nombre ou une chaîne
      hierarchy_level: typeof form.hierarchy_level === "number" || typeof form.hierarchy_level === "string"
          ? form.hierarchy_level
          : null,
      weight: typeof form.weight === "number" ? form.weight : undefined,
      permissions: Array.isArray(form.permissions) ? form.permissions : [],
    };

    // Nettoyer le payload (enlever undefined, null, "", mais garder 0 pour weight/level)
    Object.keys(payload).forEach(key => {
      const k = key as keyof typeof payload;
      const value = payload[k];
      if (value === undefined || value === null || value === "") {
        // Garder la valeur si c'est 0 et que la clé est 'weight' ou 'hierarchy_level'
        if (!((k === 'weight' || k === 'hierarchy_level') && typeof value === "number" && value === 0)) {
          delete payload[k];
        }
      }
    });

    // Si permissions est un tableau vide, l'API l'attend peut-être quand même
    if (!payload.permissions) {
        payload.permissions = [];
    }


    try {
      const url = editRole
        ? `${API_URLS.UPDATE_ROLE}${editRole.id}/`
        : API_URLS.CREATE_ROLE;
      // Utiliser PUT pour la mise à jour (REST standard), POST pour la création
      const method = editRole ? "PUT" : "POST";

      console.log(`[handleSubmit] ${method} ${url} Payload:`, JSON.stringify(payload)); // Log du payload

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json", // Ajouter Accept header
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMsg = `Erreur ${method === 'PUT' ? 'de modification' : 'de création'} : ${res.status}`;
        try {
          const errorData = await res.json();
          // Type assertion for errorData structure
          if (errorData && typeof errorData === 'object') {
             const detail = 'detail' in errorData ? String(errorData.detail) : null;
             const message = 'message' in errorData ? String(errorData.message) : null;
             errorMsg = detail || message || (typeof errorData === 'string' ? errorData : JSON.stringify(errorData)) || errorMsg;
          } else if (typeof errorData === 'string') {
             errorMsg = errorData || errorMsg;
          }
          console.error("[handleSubmit] API Error Response:", errorData); // Log de la réponse d'erreur API
        } catch { // Type catch error as unknown
          try {
             const textResponse = await res.text();
             console.error("[handleSubmit] Failed to parse error response:", textResponse);
          } catch {
             console.error("[handleSubmit] Failed to parse error response and failed to get text response.");
          }
        }
        throw new Error(errorMsg);
      }

      // Optionnel: traiter la réponse en cas de succès si nécessaire
      // const responseData = await res.json();
      // console.log("[handleSubmit] Success Response:", responseData);

      toast.success(editRole ? "Rôle modifié avec succès !" : "Rôle créé avec succès !");
      handleCloseDialog();
      fetchRoles(); // fetchRoles is now stable due to useCallback
    } catch (err: unknown) { // Type catch error as unknown
      const errorMessage = err instanceof Error ? err.message : "Une erreur inconnue est survenue lors de la sauvegarde.";
      setError(errorMessage); // Afficher l'erreur dans l'UI
      toast.error(errorMessage); // Afficher une notification d'erreur
      console.error("[handleSubmit] Error:", err); // Log complet de l'erreur
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAccessToken, editRole, form, fetchRoles]); // Add dependencies (handleCloseDialog is stable if defined outside or wrapped)

  const handleDelete = useCallback(async (role_id: number) => { // Wrap in useCallback
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("Non authentifié");
      toast.error("Non authentifié");
      return;
    }
    if (!window.confirm("Supprimer ce rôle ?")) return;
    try {
      const res = await fetch(`${API_URLS.DELETE_ROLE}${role_id}/`, {
        method: "DELETE",
        headers: {
          // "Content-Type": "application/json", // Often not needed for DELETE
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      toast.success("Rôle supprimé !");
      fetchRoles(); // fetchRoles is stable
    } catch (err: unknown) { // Type catch error as unknown
      const message = err instanceof Error ? err.message : "Erreur lors de la suppression";
      setError(message);
      toast.error(message);
      console.error("[handleDelete] Error:", err);
    }
  }, [getAccessToken, fetchRoles]); // Add dependencies

  const addParentRole = useCallback(async (role_id: number) => { // Wrap in useCallback
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("Non authentifié");
      toast.error("Non authentifié");
      return;
    }
    const parent_id_str = prompt("ID du rôle parent à définir pour ce rôle :");
    if (!parent_id_str) return;
    const parent_id = Number(parent_id_str);
     if (isNaN(parent_id) || parent_id <= 0) {
        toast.error("ID du parent invalide.");
        return;
    }
    try {
      const res = await fetch(`${API_URLS.ADD_PARENT}${role_id}/${parent_id}/`, {
        method: "POST", // Assuming POST, adjust if needed
        headers: {
          "Content-Type": "application/json", // May not be needed if no body
          "Authorization": `Bearer ${accessToken}`,
        },
        // body: JSON.stringify({}) // Add empty body if required by backend
      });
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      toast.success("Parent ajouté");
      fetchRoles(); // fetchRoles is stable
    } catch (err: unknown) { // Type catch error as unknown
      const message = err instanceof Error ? err.message : "Erreur lors de l'ajout du parent";
      setError(message);
      toast.error(message);
      console.error("[addParentRole] Error:", err);
    }
  }, [getAccessToken, fetchRoles]); // Add dependencies

  const _removeParentRole = useCallback(async (role_id: number) => { // Wrap in useCallback
    // Similar implementation to addParentRole, using REMOVE_PARENT URL and DELETE/POST method
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("Non authentifié");
      toast.error("Non authentifié");
      return;
    }
    const parent_id_str = prompt("ID du parent à retirer de ce rôle :");
     if (!parent_id_str) return;
    const parent_id = Number(parent_id_str);
     if (isNaN(parent_id) || parent_id <= 0) {
        toast.error("ID du parent invalide.");
        return;
    }
    try {
      // Adjust method (DELETE or POST) based on your API
      const res = await fetch(`${API_URLS.REMOVE_PARENT}${role_id}/${parent_id}/`, {
        method: "DELETE", // Or "POST"
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      toast.success("Parent retiré");
      fetchRoles(); // fetchRoles is stable
    } catch (err: unknown) { // Type catch error as unknown
      const message = err instanceof Error ? err.message : "Erreur lors du retrait du parent";
      setError(message);
      toast.error(message);
      console.error("[_removeParentRole] Error:", err);
    }
  }, [getAccessToken, fetchRoles]); // Add dependencies

  const assignRoleToGroup = useCallback(async (role_id: number) => { // Wrap in useCallback
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("Non authentifié");
      toast.error("Non authentifié");
      return;
    }
    const group_id_str = prompt("ID du groupe auquel assigner ce rôle :");
     if (!group_id_str) return;
    const group_id = Number(group_id_str);
     if (isNaN(group_id) || group_id <= 0) {
        toast.error("ID du groupe invalide.");
        return;
    }
    try {
      // Adjust URL structure and method (POST/PUT) based on your API
      const res = await fetch(`${API_URLS.ASSIGN_TO_GROUP}${group_id}/${role_id}/`, {
        method: "POST", // Or "PUT"
        headers: {
          "Content-Type": "application/json", // May not be needed if no body
          "Authorization": `Bearer ${accessToken}`,
        },
         // body: JSON.stringify({}) // Add empty body if required by backend
      });
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      toast.success("Rôle assigné au groupe !");
      // Optionally refresh roles or groups list if needed
    } catch (err: unknown) { // Type catch error as unknown
      const message = err instanceof Error ? err.message : "Erreur lors de l'assignation";
      setError(message);
      toast.error(message);
      console.error("[assignRoleToGroup] Error:", err);
    }
  }, [getAccessToken]); // Add dependencies

  const handleClone = useCallback(async (role: Role) => { // Wrap in useCallback
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("Non authentifié");
      toast.error("Non authentifié");
      return;
    }
    const name = prompt("Nom du nouveau rôle cloné :", `${role.name}_clone`);
    if (!name) return;
    try {
      const res = await fetch(`${API_URLS.CLONE_ROLE}${role.id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      toast.success("Rôle cloné !");
      fetchRoles(); // fetchRoles is stable
    } catch (err: unknown) { // Type catch error as unknown
      const message = err instanceof Error ? err.message : "Erreur lors du clonage";
      setError(message);
      toast.error(message);
      console.error("[handleClone] Error:", err);
    }
  }, [getAccessToken, fetchRoles]); // Add dependencies

  const renderDetailModal = () => (
    <Dialog
      open={isDetailModalOpen}
      onClose={() => setIsDetailModalOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 600, borderBottom: '1px solid #e0e0e0', color: LNB_ACCENT }}>
        Détails du Rôle
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {detailLoading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={150}>
            <CircularProgress sx={{ color: LNB_GREEN }} />
          </Box>
        )}
        {detailError && (
          <Typography color="error" sx={{ p: 2, bgcolor: '#ffeaea', borderRadius: 1 }}>
            {detailError}
          </Typography>
        )}
        {!detailLoading && !detailError && selectedRoleDetails && (
          <Stack spacing={2}>
            <Typography><strong>ID :</strong> {selectedRoleDetails.id}</Typography>
            <Typography><strong>Nom :</strong> {selectedRoleDetails.name || NOT_AVAILABLE}</Typography>
            <Typography><strong>Description :</strong> {selectedRoleDetails.description || NOT_AVAILABLE}</Typography>
            <Typography>
              <strong>Département :</strong>{" "}
              {typeof selectedRoleDetails.department === "object" && selectedRoleDetails.department !== null
                ? selectedRoleDetails.department.name || NOT_AVAILABLE
                : selectedRoleDetails.department ?? NOT_AVAILABLE}
            </Typography>
            <Typography>
              <strong>Niveau Hiérarchique :</strong>{" "}
              {typeof selectedRoleDetails.hierarchy_level === "object" && selectedRoleDetails.hierarchy_level !== null
                ? selectedRoleDetails.hierarchy_level.name || NOT_AVAILABLE
                : selectedRoleDetails.hierarchy_level ?? NOT_AVAILABLE}
            </Typography>
            <Typography><strong>Poids :</strong> {selectedRoleDetails.weight ?? NOT_AVAILABLE}</Typography>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid #e0e0e0', p: 2 }}>
        <Button onClick={() => setIsDetailModalOpen(false)} sx={{ color: LNB_ACCENT, fontWeight: 600 }}>
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ p: { xs: 1, md: 4 }, bgcolor: LNB_BG, minHeight: "100vh" }}>
      <ToastContainer />
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" fontWeight={700} color={LNB_ACCENT} gutterBottom>
          Gestion des rôles
        </Typography>
      </Box>
      <Typography variant="subtitle2" color="text.secondary" mb={2}>
        {loading ? 'Chargement des rôles...' : `${roles.length} rôle${roles.length > 1 ? "s" : ""} trouvé${roles.length > 1 ? "s" : ""}`}
      </Typography>
      {error && (
        <Box mb={2}>
          <Paper sx={{ p: 2, bgcolor: "#fef2f2", color: LNB_ERROR, border: "1px solid #fecaca" }}>
            {error}
          </Paper>
        </Box>
      )}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button
          variant="contained"
          sx={{
            bgcolor: LNB_GREEN,
            color: "#fff",
            borderRadius: 3,
            fontWeight: 600,
            px: 2.5,
            py: 1,
            boxShadow: "none",
            "&:hover": { bgcolor: LNB_ACCENT }
          }}
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouveau rôle
        </Button>
      </Box>
      <Paper elevation={2} sx={{ p: 0, borderRadius: 3, overflow: "auto" }}>
        <TableContainer sx={{ minWidth: 900 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: LNB_BG_TABLE }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: LNB_ACCENT, textAlign: "left", py: 2 }}>Nom</TableCell>
                <TableCell sx={{ fontWeight: 700, color: LNB_ACCENT, textAlign: "left", py: 2 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700, color: LNB_ACCENT, textAlign: "left", py: 2 }}>Département</TableCell>
                <TableCell sx={{ fontWeight: 700, color: LNB_ACCENT, textAlign: "center", py: 2 }}>Niveau hiérarchique</TableCell>
                <TableCell sx={{ fontWeight: 700, color: LNB_ACCENT, textAlign: "center", py: 2 }}>Poids</TableCell>
                <TableCell sx={{ fontWeight: 700, color: LNB_ACCENT, textAlign: "center", minWidth: 220, py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress sx={{ color: LNB_GREEN }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      En cours de chargement...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Aucun rôle trouvé.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role, idx) => (
                  <TableRow
                    key={role.id}
                    hover
                    sx={{
                      bgcolor: idx % 2 === 0 ? "#fff" : LNB_BG_TABLE,
                      transition: "background 0.2s",
                      "&:hover": { bgcolor: LNB_GREEN_LIGHT + "22" },
                      height: 60
                    }}
                  >
                    <TableCell sx={{ verticalAlign: "middle", fontWeight: 600 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {role.name}
                        {role.weight && role.weight > 50 && (
                          <Chip label="Important" sx={{ bgcolor: LNB_GREEN_LIGHT, color: "#fff" }} size="small" />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: "middle" }}>
                      <Typography color="text.secondary" fontSize={15}>
                        {role.description || <span style={{ color: "#bdbdbd" }}>-</span>}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: "middle" }}>
                      <Typography fontSize={15}>
                        {typeof role.department === "object" && role.department !== null
                          ? (role.department as Department).name || NOT_AVAILABLE
                          : role.department ?? NOT_AVAILABLE}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: "middle", textAlign: "center" }}>
                      <Typography fontSize={15}>
                        {typeof role.hierarchy_level === "object" && role.hierarchy_level !== null
                          ? (role.hierarchy_level as { name?: string }).name || <span style={{ color: "#bdbdbd" }}>-</span>
                          : role.hierarchy_level ?? <span style={{ color: "#bdbdbd" }}>-</span>}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: "middle", textAlign: "center" }}>
                      <Typography fontSize={15}>
                        {role.weight ?? <span style={{ color: "#bdbdbd" }}>-</span>}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: "middle", textAlign: "center", minWidth: 220 }}>
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Voir Détails">
                          <IconButton sx={{ color: LNB_ACCENT }} size="small" onClick={() => fetchRoleDetails(role.id)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifier">
                          <IconButton sx={{ color: LNB_GREEN }} size="small" onClick={() => handleOpenDialog(role)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton sx={{ color: LNB_ERROR }} size="small" onClick={() => handleDelete(role.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ajouter parent">
                          <IconButton sx={{ color: LNB_ACCENT }} size="small" onClick={() => addParentRole(role.id)}>
                            <ArrowUpwardIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cloner">
                          <IconButton sx={{ color: LNB_GREEN_LIGHT }} size="small" onClick={() => handleClone(role)}>
                            <FileCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Assigner à un groupe">
                          <IconButton sx={{ color: LNB_SUCCESS }} size="small" onClick={() => assignRoleToGroup(role.id)}>
                            <GroupAddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Role Form Modal */}
      <RoleForm
        open={openDialog}
        loading={loading}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        form={form}
        setForm={setForm}
        departments={departments}
        permissions={[]} // Permissions supprimées ici
        isEdit={!!editRole}
      />

      {/* Role Detail Modal */}
      {renderDetailModal()}
    </Box>
  );
}