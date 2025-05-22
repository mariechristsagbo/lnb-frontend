import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  Stack,
  CircularProgress,
  SelectChangeEvent, // Import SelectChangeEvent
} from "@mui/material";

interface Department {
  id: number;
  name: string;
  [key: string]: unknown; // Correction: Remplacer any par unknown
}

interface Permission {
  id: number;
  name: string;
  description?: string;
  level?: string;
}

// Définir un type plus précis pour le formulaire
interface RoleFormData {
  id?: number;
  name?: string;
  description?: string;
  department?: number | { id: number; name: string } | null; // Peut être un ID ou un objet Department
  hierarchy_level?: number | string | null; // Peut être un nombre ou une chaîne
  weight?: number | null;
  permissions?: number[]; // Tableau d'IDs de permission
  [key: string]: unknown; // <-- AJOUTER CETTE LIGNE
}

interface RoleFormProps {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (form: RoleFormData) => void; // Correction: Utiliser RoleFormData
  form: RoleFormData; // Correction: Utiliser RoleFormData
  setForm: React.Dispatch<React.SetStateAction<RoleFormData>>; // Correction: Utiliser le type spécifique
  departments: Department[];
  permissions: Permission[];
  isEdit?: boolean;
}

const poidsOptions = Array.from({ length: 11 }, (_, i) => i * 10);
const hierarchyLevels = [
  { value: 1, label: "1 (Plus haut)" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5 (Plus bas)" },
];

export default function RoleForm({
  open,
  loading,
  onClose,
  onSubmit,
  form,
  setForm,
  departments,
  permissions,
  isEdit = false,
}: RoleFormProps) {

  // Handler générique pour les changements de TextField
  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Handler pour le changement de département
  const handleDepartmentChange = (e: SelectChangeEvent<number | string>) => { // Utiliser SelectChangeEvent
    const selectedId = Number(e.target.value);
    setForm((f) => ({ ...f, department: selectedId }));
  };

  // Handler pour le changement de niveau hiérarchique
  const handleHierarchyChange = (e: SelectChangeEvent<number | string>) => { // Utiliser SelectChangeEvent
    const value = e.target.value;
    // Convertir en nombre si possible, sinon garder la chaîne (ou null si vide)
    const numericValue = Number(value);
    setForm((f) => ({ ...f, hierarchy_level: isNaN(numericValue) ? (value === "" ? null : value) : numericValue }));
  };

  // Handler pour le changement de poids
  const handleWeightChange = (e: SelectChangeEvent<number | string>) => { // Utiliser SelectChangeEvent
    const value = e.target.value;
    setForm((f) => ({ ...f, weight: value === "" ? null : Number(value) }));
  };

  // Handler pour le changement de permissions
  const handlePermissionsChange = (e: SelectChangeEvent<number[]>) => { // Utiliser SelectChangeEvent<number[]>
    const value = e.target.value as number[]; // Assurer que la valeur est un tableau de nombres
    setForm((f) => ({ ...f, permissions: value }));
  };


  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isEdit ? "Modifier le rôle" : "Créer un rôle"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Nom"
            name="name"
            value={form.name || ""}
            onChange={handleTextFieldChange} // Utiliser le handler générique
            fullWidth
            required
          />
          <TextField
            label="Description"
            name="description"
            value={form.description || ""}
            onChange={handleTextFieldChange} // Utiliser le handler générique
            fullWidth
          />
          <Select
            label="Département"
            name="department"
            value={
              form.department && typeof form.department === "object"
                ? form.department.id // Si c'est un objet, prendre l'ID
                : form.department ?? "" // Sinon, prendre la valeur (qui devrait être un ID ou null/undefined)
            }
            onChange={handleDepartmentChange} // Utiliser le handler spécifique
            fullWidth
            displayEmpty
            renderValue={(selected) => {
              if (!selected) return <span style={{ color: "#bdbdbd" }}>Sélectionner un département</span>;
              const dept = departments.find(dep => dep.id === Number(selected));
              return dept ? dept.name : selected; // Afficher le nom si trouvé, sinon l'ID
            }}
          >
            <MenuItem value="">
              <em>Sélectionner un département</em>
            </MenuItem>
            {departments.length === 0 ? (
              <MenuItem disabled value="">
                <em>Aucun département disponible</em>
              </MenuItem>
            ) : (
              departments.map(dep => (
                <MenuItem key={dep.id} value={dep.id}>{dep.name}</MenuItem>
              ))
            )}
          </Select>
          <Select
            label="Niveau hiérarchique"
            name="hierarchy_level"
            value={form.hierarchy_level ?? ""} // Utiliser ?? "" pour gérer null/undefined
            onChange={handleHierarchyChange} // Utiliser le handler spécifique
            fullWidth
            displayEmpty
            renderValue={(selected) => {
                if (selected === "" || selected === null || selected === undefined) return <span style={{ color: "#bdbdbd" }}>Sélectionner un niveau</span>;
                const level = hierarchyLevels.find(l => l.value === Number(selected));
                return level ? level.label : selected; // Afficher le label si trouvé, sinon la valeur
              }
            }
          >
            <MenuItem value="">
              <em>Sélectionner un niveau</em>
            </MenuItem>
            {hierarchyLevels.map(level => (
              <MenuItem key={level.value} value={level.value}>{level.label}</MenuItem>
            ))}
          </Select>
          <Select
            label="Poids"
            name="weight"
            value={form.weight ?? ""} // Utiliser ?? "" pour gérer null/undefined
            onChange={handleWeightChange} // Utiliser le handler spécifique
            fullWidth
            displayEmpty
            renderValue={(selected) => {
              if (
                selected === null ||
                selected === undefined ||
                (typeof selected === "string" && selected === "")
              )
                return (
                  <span style={{ color: "#bdbdbd" }}>
                    Sélectionner un poids
                  </span>
                );
              const val = Number(selected);
              return (
                <span>
                  {val}
                  <span style={{
                    marginLeft: 8,
                    color: val >= 80 ? "#d32f2f" : val >= 50 ? "#fbc02d" : "#388e3c",
                    fontWeight: "bold"
                  }}>
                    {val === 100 ? " (Max)" : val === 0 ? " (Min)" : val > 50 ? " (Élevé)" : " (Faible)"}
                  </span>
                </span>
              );
            }}
          >
            <MenuItem value="">
              <em>Sélectionner un poids</em>
            </MenuItem>
            {poidsOptions.map(val => (
              <MenuItem key={val} value={val}>
                <span style={{
                  fontWeight: val === 100 ? "bold" : undefined,
                  color: val >= 80 ? "#d32f2f" : val >= 50 ? "#fbc02d" : "#388e3c"
                }}>
                  {val}
                  {val === 100 ? " (Max)" : val === 0 ? " (Min)" : val > 50 ? " (Élevé)" : " (Faible)"}
                </span>
              </MenuItem>
            ))}
          </Select>
          <Select
            label="Permissions"
            multiple
            value={form.permissions || []} // Assurer que c'est toujours un tableau
            onChange={handlePermissionsChange} // Utiliser le handler spécifique
            fullWidth
            displayEmpty
            renderValue={(selected) => {
                // selected est déjà number[] grâce à l'onChange typé
                if (!selected || selected.length === 0) return <span style={{ color: "#bdbdbd" }}>Aucune permission</span>;
                return permissions
                  .filter((perm) => selected.includes(perm.id))
                  .map((perm) => perm.name)
                  .join(', ');
              }
            }
            sx={{ mt: 1 }}
          >
             <MenuItem disabled value="">
                <em>Sélectionner des permissions</em>
            </MenuItem>
            {permissions.map((perm) => (
              <MenuItem key={perm.id} value={perm.id}>
                 {perm.name} {/* Afficher juste le nom, le Chip est redondant ici */}
              </MenuItem>
            ))}
          </Select>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" variant="outlined">
          Annuler
        </Button>
        <Button onClick={() => onSubmit(form)} variant="contained" color="primary" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : isEdit ? "Modifier" : "Créer"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}