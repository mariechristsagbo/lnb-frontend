"use client";
import React, { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import {
  Box, Button, Typography, Paper, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Stack, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

// Palette verte LNB
const LNB_GREEN = "#059669";
const LNB_GREEN_LIGHT = "#34d399";
const LNB_BG = "#f0fdf4";
const LNB_BG_TABLE = "#ecfdf5";
const LNB_ACCENT = "#047857";
const LNB_ERROR = "#ef4444";

const API_BASE = 'https://www.backend.lnb-intranet.globalitnet.org';
const API_URLS = {
  LIST_PERMISSIONS: `${API_BASE}/roles/list-permissions/`,
  CREATE_PERMISSION: `${API_BASE}/roles/create-permission/`,
  UPDATE_PERMISSION: `${API_BASE}/roles/update-permission/`,
  DELETE_PERMISSION: `${API_BASE}/roles/delete-permission/`,
};

interface Permission {
  id: number;
  name: string;
  codename?: string;
  description?: string;
  level?: string | number;
  order?: number;
}

export default function PermissionsTable() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [openPermissionDialog, setOpenPermissionDialog] = useState(false);
  const [editPermission, setEditPermission] = useState<Permission | null>(null);
  const [permissionForm, setPermissionForm] = useState<{ name: string; description?: string; level?: string | number }>({ name: "", description: "", level: "" });
  const [error, setError] = useState<string | null>(null);

  const getAccessToken = useCallback(() => {
    const token = Cookies.get('authTokens');
    if (!token) return null;
    try {
      return JSON.parse(token).access;
    } catch {
      return null;
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    setPermissionsLoading(true);
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("Non authentifié");
      setPermissionsLoading(false);
      return;
    }
    try {
      const res = await fetch(API_URLS.LIST_PERMISSIONS, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      const data = await res.json();
      let permsArray: Permission[] = [];
      if (Array.isArray(data)) {
        permsArray = data;
      } else if (data && typeof data === 'object' && 'permissions' in data && Array.isArray((data as { permissions: unknown }).permissions)) {
        permsArray = (data as { permissions: Permission[] }).permissions;
      }
      setPermissions(Array.isArray(permsArray) ? permsArray : []);
    } catch {
      setError("Impossible de charger les permissions.");
      setPermissions([]);
    } finally {
      setPermissionsLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handleOpenPermissionDialog = useCallback((permission?: Permission) => {
    if (permission) {
      setEditPermission(permission);
      setPermissionForm({
        name: permission.name ?? "",
        description: permission.description ?? "",
        level: permission.level ?? "",
      });
    } else {
      setPermissionForm({ name: "", description: "", level: "" });
    }
    setOpenPermissionDialog(true);
  }, []);

  const handleClosePermissionDialog = useCallback(() => {
    setOpenPermissionDialog(false);
    setEditPermission(null);
    setPermissionForm({ name: "", description: "", level: "" });
  }, []);

  const handlePermissionFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPermissionForm((f) => ({ ...f, [name]: value }));
  }, []);

  const createPermission = useCallback(async (permissionData: { name: string; description?: string; level?: string | number }) => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("Non authentifié");
      toast.error("Non authentifié");
      return;
    }
    try {
      const res = await fetch(API_URLS.CREATE_PERMISSION, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(permissionData),
      });
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      toast.success("Permission créée !");
      fetchPermissions();
      handleClosePermissionDialog();
    } catch {
      setError("Erreur lors de la création de la permission");
      toast.error("Erreur lors de la création de la permission");
    }
  }, [getAccessToken, fetchPermissions, handleClosePermissionDialog]);

  const updatePermission = useCallback(async (id: number, permissionData: { name: string; description?: string; level?: string | number }) => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("Non authentifié");
      toast.error("Non authentifié");
      return;
    }
    try {
      const res = await fetch(`${API_URLS.UPDATE_PERMISSION}${id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(permissionData),
      });
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      toast.success("Permission modifiée !");
      fetchPermissions();
      handleClosePermissionDialog();
    } catch {
      setError("Erreur lors de la modification de la permission");
      toast.error("Erreur lors de la modification de la permission");
    }
  }, [getAccessToken, fetchPermissions, handleClosePermissionDialog]);

  const deletePermission = useCallback(async (id: number) => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("Non authentifié");
      toast.error("Non authentifié");
      return;
    }
    if (!window.confirm("Supprimer cette permission ?")) return;
    try {
      const res = await fetch(`${API_URLS.DELETE_PERMISSION}${id}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
        },
      });
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      toast.success("Permission supprimée !");
      fetchPermissions();
    } catch {
      setError("Erreur lors de la suppression de la permission");
      toast.error("Erreur lors de la suppression de la permission");
    }
  }, [getAccessToken, fetchPermissions]);

  const handleSubmitPermission = useCallback(async () => {
    if (!permissionForm.name) {
      toast.error("Le nom est requis");
      return;
    }
    const dataToSubmit = { ...permissionForm };
    if (editPermission) {
      await updatePermission(editPermission.id, dataToSubmit);
    } else {
      await createPermission(dataToSubmit);
    }
  }, [permissionForm, editPermission, updatePermission, createPermission]);

  return (
    <Box sx={{ p: { xs: 1, md: 4 }, bgcolor: LNB_BG, minHeight: "100vh" }}>
      <ToastContainer />
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" fontWeight={700} color={LNB_ACCENT} gutterBottom>
          Gestion des permissions
        </Typography>
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
          onClick={() => handleOpenPermissionDialog()}
        >
          Nouvelle permission
        </Button>
      </Box>
      <Typography variant="subtitle2" color="text.secondary" mb={2}>
        {permissionsLoading ? 'Chargement des permissions...' : `${permissions.length} permission${permissions.length > 1 ? "s" : ""} trouvée${permissions.length > 1 ? "s" : ""}`}
      </Typography>
      {error && (
        <Box mb={2}>
          <Paper sx={{ p: 2, bgcolor: "#fef2f2", color: LNB_ERROR, border: "1px solid #fecaca" }}>
            {error}
          </Paper>
        </Box>
      )}
      <Paper elevation={2} sx={{ p: 0, borderRadius: 3, overflow: "auto", bgcolor: "#fff" }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: LNB_BG_TABLE }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: LNB_ACCENT }}>Nom</TableCell>
                <TableCell sx={{ fontWeight: 700, color: LNB_ACCENT }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700, color: LNB_ACCENT }}>Niveau</TableCell>
                <TableCell sx={{ fontWeight: 700, color: LNB_ACCENT }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {permissionsLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <CircularProgress sx={{ color: LNB_GREEN }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      En cours de chargement...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : permissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Aucune permission trouvée.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                permissions.map((perm) => (
                  <TableRow
                    key={perm.id}
                    hover
                    sx={{
                      "&:hover": { bgcolor: LNB_GREEN_LIGHT + "22" }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>{perm.name}</TableCell>
                    <TableCell>{perm.description || <span style={{ color: "#bdbdbd" }}>-</span>}</TableCell>
                    <TableCell>{perm.level ?? <span style={{ color: "#bdbdbd" }}>-</span>}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Modifier">
                          <IconButton
                            sx={{
                              bgcolor: LNB_BG_TABLE,
                              color: LNB_ACCENT,
                              borderRadius: 2,
                              "&:hover": { bgcolor: LNB_GREEN, color: "#fff" }
                            }}
                            size="small"
                            onClick={() => handleOpenPermissionDialog(perm)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton
                            sx={{
                              bgcolor: "#fef2f2",
                              color: LNB_ERROR,
                              borderRadius: 2,
                              "&:hover": { bgcolor: LNB_ERROR, color: "#fff" }
                            }}
                            size="small"
                            onClick={() => deletePermission(perm.id)}
                          >
                            <DeleteIcon fontSize="small" />
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

      {/* Permission Create/Edit Modal */}
      <Dialog open={openPermissionDialog} onClose={handleClosePermissionDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: LNB_ACCENT, fontWeight: 700 }}>
          {editPermission ? "Modifier la permission" : "Nouvelle permission"}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }} noValidate autoComplete="off">
            <TextField
              label="Nom"
              name="name"
              value={permissionForm.name}
              onChange={handlePermissionFormChange}
              fullWidth
              required
              margin="normal"
              autoFocus
              InputLabelProps={{ style: { color: LNB_ACCENT } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: LNB_ACCENT },
                  "&:hover fieldset": { borderColor: LNB_GREEN },
                  "&.Mui-focused fieldset": { borderColor: LNB_ACCENT }
                }
              }}
            />
            <TextField
              label="Description"
              name="description"
              value={permissionForm.description ?? ""}
              onChange={handlePermissionFormChange}
              fullWidth
              margin="normal"
              InputLabelProps={{ style: { color: LNB_ACCENT } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: LNB_ACCENT },
                  "&:hover fieldset": { borderColor: LNB_GREEN },
                  "&.Mui-focused fieldset": { borderColor: LNB_ACCENT }
                }
              }}
            />
            <TextField
              label="Niveau"
              name="level"
              value={permissionForm.level ?? ""}
              onChange={handlePermissionFormChange}
              fullWidth
              margin="normal"
              InputLabelProps={{ style: { color: LNB_ACCENT } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: LNB_ACCENT },
                  "&:hover fieldset": { borderColor: LNB_GREEN },
                  "&.Mui-focused fieldset": { borderColor: LNB_ACCENT }
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePermissionDialog} sx={{ color: LNB_ACCENT, fontWeight: 600 }}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmitPermission}
            variant="contained"
            sx={{
              bgcolor: LNB_ACCENT,
              color: "#fff",
              fontWeight: 700,
              borderRadius: 2,
              "&:hover": { bgcolor: LNB_GREEN }
            }}
          >
            {editPermission ? "Enregistrer" : "Créer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}