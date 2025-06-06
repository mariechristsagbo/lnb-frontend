import React from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from "@/components/ui/modal";
import { Department } from '../../types';

interface DepartmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
  isLoading: boolean;
  error: string | null;
}

export const DepartmentDetailModal = ({
  isOpen,
  onClose,
  department,
  isLoading,
  error,
}: DepartmentDetailModalProps) => {
  const NOT_AVAILABLE = "Non renseigné";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Détails du Département
        </h2>

        {isLoading && (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md text-sm">
            {error}
          </div>
        )}

        {!isLoading && !error && department && (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p><strong>ID :</strong> {department.id}</p>
            <p><strong>Nom :</strong> {department.name || NOT_AVAILABLE}</p>
            <p><strong>Code :</strong> {department.code || NOT_AVAILABLE}</p>
            <p><strong>Description :</strong> {department.description || NOT_AVAILABLE}</p>
            <p>
              <strong>Statut :</strong>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                department.is_active
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {department.is_active ? 'Actif' : 'Inactif'}
              </span>
            </p>
            <p>
              <strong>Responsable :</strong>
              {typeof department.responsable === "object" && department.responsable !== null
                ? department.responsable.username
                : NOT_AVAILABLE}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
};
