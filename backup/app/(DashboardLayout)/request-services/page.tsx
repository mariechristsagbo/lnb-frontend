'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function RequestSubmissionPage() {
  const router = useRouter();
  
  // Types
  type RequestType = 'leave' | 'document' | 'support' | 'other';
  type UrgencyLevel = 'low' | 'medium' | 'high';
  type RequestStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected';

  // État du formulaire
  const [formData, setFormData] = useState({
    requestType: 'leave' as RequestType,
    startDate: '',
    endDate: '',
    reason: '',
    description: '',
    urgency: 'medium' as UrgencyLevel,
    files: [] as File[],
    assignedTo: '',
    status: 'draft' as RequestStatus,
    requestId: ''
  });

  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Gestion des fichiers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (newFiles.some(file => file.size > 10 * 1024 * 1024)) {
        setNotification({ type: 'error', message: 'Un ou plusieurs fichiers dépassent 10MB' });
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

  // Soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description) {
      setNotification({ type: 'error', message: 'La description est obligatoire' });
      return;
    }

    const requestId = `DEM-${Date.now()}`;
    
    setFormData(prev => ({
      ...prev,
      status: 'submitted',
      requestId
    }));

    setNotification({ 
      type: 'success', 
      message: `Votre demande ${requestId} a été envoyée.` 
    });
  };

  // Sauvegarde comme brouillon
  const saveDraft = () => {
    setNotification({ type: 'success', message: 'Brouillon enregistré' });
  };

  // Options pour les selects
  const requestOptions = {
    leave: [
      { value: 'vacation', label: 'Congés payés' },
      { value: 'sickness', label: 'Maladie' },
      { value: 'training', label: 'Formation' }
    ],
    document: [
      { value: 'pay_slip', label: 'Fiche de paie' },
      { value: 'certificate', label: 'Attestation' }
    ],
    support: [
      { value: 'technical', label: 'Problème technique' },
      { value: 'access', label: "Demande d'accès" }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-700 shadow rounded-lg overflow-hidden border dark:border-emerald-600">
        {/* En-tête */}
        <div className="p-6 border-b dark:border-emerald-600">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Soumettre une demande</h1>
          <nav className="flex mt-2">
            <ol className="flex items-center space-x-2 text-sm dark:text-white">
              <li className="text-emerald-600 dark:text-emerald-400">Accueil</li>
              <li>/</li>
              <li className="text-emerald-600 dark:text-emerald-400">RH</li>
              <li>/</li>
              <li className="text-gray-500 dark:text-gray-300">Nouvelle demande</li>
            </ol>
          </nav>
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
          {/* Type de demande */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
              Type de demande <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['leave', 'document', 'support', 'other'] as RequestType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({...formData, requestType: type})}
                  className={`p-3 rounded-md border flex flex-col items-center ${
                    formData.requestType === type
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200'
                      : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-emerald-600'
                  }`}
                >
                  <span className="text-xl mb-1">
                    {type === 'leave' ? '🏖️' : 
                     type === 'document' ? '📄' : 
                     type === 'support' ? '🛠️' : '❓'}
                  </span>
                  <span className="text-sm">
                    {type === 'leave' ? 'Congés' : 
                     type === 'document' ? 'Documents' : 
                     type === 'support' ? 'Support' : 'Autre'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Champs dynamiques */}
          {formData.requestType === 'leave' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                  Date de début <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                  Date de fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                  Motif <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                  required
                >
                  <option value="">Sélectionner...</option>
                  {requestOptions.leave.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {formData.requestType === 'document' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                Type de document <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                required
              >
                <option value="">Sélectionner...</option>
                {requestOptions.document.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          )}

          {formData.requestType === 'support' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                Type de support <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                required
              >
                <option value="">Sélectionner...</option>
                <option value="access">Demande d&apos;accès</option>
                {requestOptions.support.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
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
            />
          </div>

          {/* Urgence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
              Niveau d&apos;urgence
            </label>
            <div className="flex space-x-4">
              {(['low', 'medium', 'high'] as UrgencyLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({...formData, urgency: level})}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium ${
                    formData.urgency === level
                      ? level === 'low' 
                        ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-600'
                        : level === 'medium'
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-600'
                          : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-600 dark:text-white dark:border-gray-500'
                  }`}
                >
                  {level === 'low' ? 'Faible' : level === 'medium' ? 'Moyenne' : 'Haute'}
                </button>
              ))}
            </div>
          </div>

          {/* Fichiers joints */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
              Fichiers justificatifs
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

          {/* Destinataire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Assigner à
            </label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
            >
              <option value="">Sélectionner...</option>
              <option value="rh">Service RH</option>
              <option value="manager">Manager direct</option>
              <option value="dsi">Service IT</option>
              <option value="finance">Service Financier</option>
            </select>
          </div>

          {/* Suivi en temps réel */}
          {formData.status !== 'draft' && (
            <div className="border-t border-gray-200 dark:border-emerald-600 pt-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Suivi de votre demande</h3>
              
              <div className="flex items-center mb-2">
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className={`h-2.5 w-2.5 rounded-full ${
                      formData.status === 'submitted' ? 'bg-yellow-500' : 
                      formData.status === 'in_review' ? 'bg-blue-500' : 
                      formData.status === 'approved' ? 'bg-emerald-500' : 
                      'bg-red-500'
                    } mr-2`}></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-white">
                      {formData.status === 'submitted' ? 'Envoyée' : 
                       formData.status === 'in_review' ? 'En cours de validation' : 
                       formData.status === 'approved' ? 'Demande approuvée' : 'Demande rejetée'}
                    </span>
                  </div>
                  <div className="ml-4.5 text-xs text-gray-500 dark:text-gray-400">
                    {formData.status === 'submitted' ? 'En attente de traitement' : 
                     formData.status === 'in_review' ? 'En cours de validation' : 
                     formData.status === 'approved' ? 'Demande approuvée' : 'Demande rejetée'}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date().toLocaleString()}
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
                <div 
                  className={`h-2.5 rounded-full ${
                    formData.status === 'submitted' ? 'bg-yellow-500 w-1/3' : 
                    formData.status === 'in_review' ? 'bg-blue-500 w-2/3' : 
                    formData.status === 'approved' ? 'bg-emerald-500 w-full' : 
                    'bg-red-500 w-full'
                  }`}
                ></div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-emerald-600">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-600 dark:text-white dark:border-emerald-600"
            >
              Annuler
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={saveDraft}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-600 dark:text-white dark:border-emerald-600"
              >
                Enregistrer comme brouillon
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800"
              >
                Soumettre la demande
              </button>
            </div>
          </div>
        </form>

        {/* Pied de page */}
        <div className="p-6 border-t dark:border-emerald-600 text-center text-sm text-gray-500 dark:text-gray-400">
          <div className="flex justify-center space-x-4">
            <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400">FAQ</a>
            <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400">Support</a>
          </div>
          {formData.requestId && (
            <div className="mt-2">
              Référence: <span className="font-mono dark:text-white">{formData.requestId}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}