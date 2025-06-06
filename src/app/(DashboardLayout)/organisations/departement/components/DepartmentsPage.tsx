"use client";

import { useRouter } from 'next/navigation';
import { PlusIcon } from "@/icons";
import { Tooltip } from 'react-tooltip';
import { Loader2 } from 'lucide-react';
import { DepartmentsTable } from './tables/DepartmentsTable';
import { DepartmentDetailModal } from './modals/DepartmentDetailModal';
import { EditDepartmentModal } from './modals/EditDepartmentModal';
import { useDepartments } from '../hooks/useDepartement';

export function DepartmentsPage() {
    const {
      // État
      departments,
      selectedDepartments,
      searchQuery,
      notification,
      isLoading,
      error,
      isDetailModalOpen,
      selectedDepartmentDetails,
      isDetailLoading,
      detailError,
      isEditModalOpen,
      editDepartment,
      isEditLoading,
      editError,
      users,
      
      // fonctions
      setSearchQuery,
      handleSelectDepartment,
      handleSelectAllDepartments,
      handleViewDetails,
      handleOpenEdit,
      handleEditSubmit,
      handleDeleteDepartments,
      closeDetailModal,
      closeEditModal,
      refreshDepartments,
      loadDepartments,
      filteredDepartments,
      
    } = useDepartments();

    const router = useRouter();
  return (
    <div>
      <Tooltip id="tooltip-departments" />
      
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full">
          {/* Barre d'actions */}
          <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Départements
              </h1>

              {/* Barre de recherche */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <svg 
                  className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push('/organisations/departement/adddepartement')}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                <span>Nouveau</span>
              </button>

              {selectedDepartments.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleOpenEdit}
                    disabled={selectedDepartments.length !== 1}
                    className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors
                      ${selectedDepartments.length === 1
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    data-tooltip-id="tooltip-departments"
                    data-tooltip-content={
                      selectedDepartments.length === 1 
                        ? "Modifier le département sélectionné" 
                        : "Sélectionnez un seul département pour modifier"
                    }
                  >
                    <span>Modifier</span>
                  </button>

                  <button
                    onClick={() => handleDeleteDepartments(selectedDepartments)}
                    className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    data-tooltip-id="tooltip-departments"
                    data-tooltip-content={`Supprimer ${selectedDepartments.length} département(s) sélectionné(s)`}
                  >
                    <span>Supprimer ({selectedDepartments.length})</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          {notification && (
            <div
              className={`mb-4 p-4 rounded-md text-center ${
                notification.type === "success" 
                  ? "bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200"
                  : notification.type === "error"
                  ? "bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200"
                  : "bg-blue-100 dark:bg-blue-900 border border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-200"
              }`}
            >
              {notification.message}
            </div>
          )}

          {/* Chargement */}
          {isLoading && !error && (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">Chargement des départements...</p>
              <Loader2 className="h-8 w-8 text-blue-600 mx-auto mt-4 animate-spin" />
            </div>
          )}

          {/* Erreur */}
          {error && !isLoading && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md flex items-center gap-3">
              <p>{error}</p>
              <button 
                onClick={loadDepartments}
                className="text-sm underline hover:text-red-900 dark:hover:text-red-300"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Tableau des départements */}
          {!isLoading && !error && (
            <DepartmentsTable
              departments={departments}
              selectedDepartments={selectedDepartments}
              onSelectDepartment={handleSelectDepartment}
              onSelectAllDepartments={handleSelectAllDepartments}
              onViewDetails={handleViewDetails}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteDepartments}
              searchQuery={searchQuery}
            />
          )}
        </div>
      </div>

      {/* Modales */}
      <DepartmentDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        department={selectedDepartmentDetails}
        isLoading={isDetailLoading}
        error={detailError}
      />

      <EditDepartmentModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        department={editDepartment}
        users={users}
        isLoading={isEditLoading && !editDepartment}
        isSubmitting={isEditLoading}
        error={editError}
        onSave={handleEditSubmit}
      />
    </div>
  );
}
