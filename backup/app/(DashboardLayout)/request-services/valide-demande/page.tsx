'use client';

import React, { useState } from "react";
// Préfixe la variable router avec _ car non utilisée
import { useRouter } from "next/navigation";

export default function RequestValidationPage() {
  const _router = useRouter();  // Renommé router en _router
  
  // Types
  type RequestStatus = 'pending' | 'approved' | 'rejected' | 'forwarded';
  type Request = {
    id: string;
    employee: string;
    type: string;
    dates?: string;
    description: string;
    status: RequestStatus;
    submittedAt: string;
    files: { name: string; size: number }[];
  };

  // État des demandes
  const [requests, setRequests] = useState<Request[]>([
    {
      id: 'DEM-2023-001',
      employee: 'Jean Dupont',
      type: 'Congé payé',
      dates: '15/06/2023 - 20/06/2023',
      description: 'Demande de congés pour vacances familiales',
      status: 'pending',
      submittedAt: '10/06/2023 09:30',
      files: []
    },
    {
      id: 'DEM-2023-002',
      employee: 'Marie Martin',
      type: 'Document administratif',
      description: 'Demande de fiche de paie pour prêt bancaire',
      status: 'pending',
      submittedAt: '09/06/2023 14:15',
      files: [{ name: 'contrat.pdf', size: 2.5 }]
    }
  ]);

  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [comment, setComment] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Gestion des fichiers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Actions sur les demandes
  const approveRequest = () => {
    if (!selectedRequest) return;
    
    setRequests(prev => prev.map(req => 
      req.id === selectedRequest.id ? { ...req, status: 'approved' } : req
    ));
    setNotification({ type: 'success', message: 'Demande approuvée avec succès' });
    setSelectedRequest(null);
  };

  const rejectRequest = () => {
    if (!selectedRequest || !comment) {
      setNotification({ type: 'error', message: 'Un commentaire est obligatoire pour le rejet' });
      return;
    }
    
    setRequests(prev => prev.map(req => 
      req.id === selectedRequest.id ? { ...req, status: 'rejected' } : req
    ));
    setNotification({ type: 'success', message: 'Demande rejetée avec succès' });
    setSelectedRequest(null);
    setComment('');
  };

  const forwardRequest = () => {
    if (!selectedRequest) return;
    
    setRequests(prev => prev.map(req => 
      req.id === selectedRequest.id ? { ...req, status: 'forwarded' } : req
    ));
    setNotification({ type: 'success', message: 'Demande transmise au service concerné' });
    setSelectedRequest(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Validation des demandes</h1>
          <p className="text-gray-600 dark:text-gray-300">Interface de validation pour managers et supérieurs hiérarchiques</p>
        </div>

        {notification && (
          <div className={`mb-6 p-4 rounded-md ${
            notification.type === 'success' 
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
          }`}>
            <div className="flex justify-between items-center">
              <p>{notification.message}</p>
              <button onClick={() => setNotification(null)} className="font-bold">×</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des demandes */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-700 shadow rounded-lg overflow-hidden border dark:border-emerald-600">
            <div className="p-4 border-b dark:border-emerald-600">
              <h2 className="font-semibold text-lg text-gray-800 dark:text-white">Demandes en attente</h2>
              <div className="mt-2 relative">
                <input
                  type="text"
                  placeholder="Rechercher une demande..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                />
                <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-emerald-600">
              {requests.filter(r => r.status === 'pending').map(request => (
                <div 
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer ${
                    selectedRequest?.id === request.id ? 'bg-gray-100 dark:bg-gray-600' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{request.employee}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-300">{request.type}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                      En attente
                    </span>
                  </div>
                  {request.dates && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <svg className="inline mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {request.dates}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{request.description}</p>
                  <p className="mt-2 text-xs text-gray-400">Soumis le {request.submittedAt}</p>
                </div>
              ))}
              {requests.filter(r => r.status === 'pending').length === 0 && (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Aucune demande en attente
                </div>
              )}
            </div>
          </div>

          {/* Détail de la demande */}
          {selectedRequest ? (
            <div className="lg:col-span-2 bg-white dark:bg-gray-700 shadow rounded-lg overflow-hidden border dark:border-emerald-600">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Détail de la demande</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">ID: {selectedRequest.id}</p>
                  </div>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Informations</h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Employé</p>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedRequest.employee}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Type de demande</p>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedRequest.type}</p>
                      </div>
                      {selectedRequest.dates && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Dates</p>
                          <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedRequest.dates}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Soumis le</p>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedRequest.submittedAt}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Description</h3>
                    <div className="mt-4 p-4 bg-gray-50 rounded-md dark:bg-gray-600">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{selectedRequest.description}</p>
                    </div>

                    {selectedRequest.files.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Fichiers joints</h3>
                        <div className="mt-2 space-y-2">
                          {selectedRequest.files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md dark:bg-gray-600">
                              <div className="flex items-center">
                                <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {file.name} ({file.size} MB)
                                </span>
                              </div>
                              <a 
                                href="#" 
                                className="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
                              >
                                Télécharger
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Commentaire et validation */}
                <div className="mt-8 border-t border-gray-200 dark:border-emerald-600 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Validation</h3>
                  
                  <div className="mt-4">
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-white">
                      Commentaire (obligatoire pour le rejet)
                    </label>
                    <textarea
                      id="comment"
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                      placeholder="Ajoutez un commentaire si nécessaire..."
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-white">
                      Ajouter des documents
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

                    {/* Liste des fichiers ajoutés */}
                    {attachments.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md dark:bg-gray-600">
                            <div className="flex items-center">
                              <svg className="h-4 w-4 text-gray-500 dark:text-gray-300 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
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

                  {/* Boutons d'action */}
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={rejectRequest}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                    >
                      Rejeter
                    </button>
                    <button
                      type="button"
                      onClick={forwardRequest}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-600 dark:text-white dark:border-emerald-600"
                    >
                      Transmettre
                    </button>
                    <button
                      type="button"
                      onClick={approveRequest}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800"
                    >
                      Approuver
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 flex items-center justify-center bg-white dark:bg-gray-700 shadow rounded-lg border dark:border-emerald-600">
              <div className="text-center p-8">
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Aucune demande sélectionnée</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Sélectionnez une demande dans la liste pour voir les détails et effectuer une action.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}