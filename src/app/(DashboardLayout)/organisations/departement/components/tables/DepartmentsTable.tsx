import React from 'react';
import { Department } from '../../types';
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { PencilIcon, TrashBinIcon, EyeIcon } from "@/icons";
import { Tooltip } from 'react-tooltip';

interface DepartmentsTableProps {
  departments: Department[];
  selectedDepartments: number[];
  onSelectDepartment: (id: number) => void;
  onSelectAllDepartments: (ids: number[]) => void;
  onViewDetails: (id: number) => void;
  onEdit: () => void;
  onDelete: (ids: number[]) => void;
  searchQuery: string;
}

const NOT_AVAILABLE = "Non renseigné";

export const DepartmentsTable = ({
  departments,
  selectedDepartments,
  onSelectDepartment,
  onSelectAllDepartments,
  onViewDetails,
  onEdit,
  onDelete,
  searchQuery,
}: DepartmentsTableProps) => {
  const allIds = departments.map(d => d.id);
  const allSelected = selectedDepartments.length > 0 && 
                     selectedDepartments.length === departments.length;

  if (departments.length === 0) {
    return (
      <div className="text-center py-10 px-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
          {searchQuery ? "Aucun département ne correspond à votre recherche" : "Aucun département trouvé"}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {searchQuery ? "Essayez d'autres termes de recherche." : "Vous pouvez ajouter un nouveau département."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] w-full">
      <div className="w-full overflow-x-auto">
        <Table className="w-full">
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50 dark:bg-gray-800">
            <TableRow>
              <TableCell isHeader className="w-10 px-5 py-3">
                <input
                  type="checkbox"
                  onChange={() => onSelectAllDepartments(allSelected ? [] : allIds)}
                  checked={allSelected}
                  className="rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  aria-label="Sélectionner tous les départements visibles"
                />
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm">
                Nom
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm">
                Description
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm">
                Responsable
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm">
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {departments.map((department) => (
              <TableRow key={department.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <TableCell className="px-5 py-4">
                  <input
                    type="checkbox"
                    checked={selectedDepartments.includes(department.id)}
                    onChange={() => onSelectDepartment(department.id)}
                    className="rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                    aria-label={`Sélectionner le département ${department.name || ''}`}
                  />
                </TableCell>
                <TableCell className="px-5 py-4 text-start text-sm font-medium text-gray-800 dark:text-gray-100">
                  {department.name || NOT_AVAILABLE}
                </TableCell>
                <TableCell 
                  className="px-5 py-4 text-start text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate"
                  data-tooltip-id={`tooltip-${department.id}`}
                  data-tooltip-content={department.description || NOT_AVAILABLE}
                >
                  {department.description || NOT_AVAILABLE}
                  <Tooltip id={`tooltip-${department.id}`} />
                </TableCell>
                <TableCell className="px-5 py-4 text-start text-sm text-gray-600 dark:text-gray-400">
                  {typeof department.responsable === "object" && department.responsable !== null ? (
                    <div className="flex items-center gap-2">
                      <span>{department.responsable.username}</span>
                    </div>
                  ) : (
                    NOT_AVAILABLE
                  )}
                </TableCell>
                <TableCell className="px-5 py-4 text-start">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewDetails(department.id)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                      data-tooltip-id={`tooltip-view-${department.id}`}
                      data-tooltip-content="Voir les détails"
                    >
                      <EyeIcon className="w-5 h-5" />
                      <Tooltip id={`tooltip-view-${department.id}`} />
                    </button>
                    <button
                      onClick={onEdit}
                      disabled={selectedDepartments.length !== 1 || !selectedDepartments.includes(department.id)}
                      className={`p-1.5 rounded-md transition-colors ${
                        selectedDepartments.length === 1 && selectedDepartments.includes(department.id)
                          ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/20'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                      data-tooltip-id={`tooltip-edit-${department.id}`}
                      data-tooltip-content={
                        selectedDepartments.length === 1 && selectedDepartments.includes(department.id)
                          ? "Modifier"
                          : "Sélectionnez ce département pour modifier"
                      }
                    >
                      <PencilIcon className="w-5 h-5" />
                      <Tooltip id={`tooltip-edit-${department.id}`} />
                    </button>
                    <button
                      onClick={() => onDelete([department.id])}
                      className="p-1.5 text-red-600 hover:text-red-800 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                      data-tooltip-id={`tooltip-delete-${department.id}`}
                      data-tooltip-content="Supprimer"
                    >
                      <TrashBinIcon className="w-5 h-5" />
                      <Tooltip id={`tooltip-delete-${department.id}`} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
