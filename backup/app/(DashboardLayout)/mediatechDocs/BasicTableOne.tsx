"use client"; // Assurez-vous que cette directive est présente

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { fetchUserProfile } from "@/services/userService";
//import Button from "@/components/ui/button/Button";
import { FaFilePdf, FaFileWord, FaFileExcel, FaFileImage } from "react-icons/fa";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation"; // Assurez-vous d'importer useRouter
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons"; // Ensure these icons exist

interface Document {
  id: number;
  title: string;
  description: string;
  file_type: string;
  file: string;
  uploaded_by_id: number;
  created_at: string;
  updated_at: string;
  category_id: number | null;
}

interface ButtonProps {
  // Ajoutez ces props
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export const Button = ({
  onClick,
  //className = "",
  children,
  type = "button",
  //variant = "primary",
  //size = "md",
  disabled = false,
  ...props
}: ButtonProps) => {
  // ...votre implémentation existante
  return (
    <button
      type={type}
      onClick={onClick}
      //className={/* vos classes */}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};


const fileTypeIcons: Record<string, React.ComponentType> = {
  PDF: FaFilePdf,
  docx: FaFileWord,
  xlsx: FaFileExcel,
  jpg: FaFileImage,
  png: FaFileImage,
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file_type: "",
    uploaded_by: 1,
  });
  const [setUserId] = useState<number | null>(null);
  const router = useRouter(); // Utilisez useRouter pour la navigation

  const handleSelectDocument = (id: number) => {
    setSelectedDocuments((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((docId) => docId !== id)
        : [...prevSelected, id]
    );
  };

  const isDocumentSelected = (id: number) => selectedDocuments.includes(id);

  const handleDownloadDocument = async (id: number) => {
    const token = Cookies.get("authTokens");
    if (!token) {
      console.error("Token d'accès introuvable");
      setError("Non authentifié");
      return;
    }
    const accessToken = JSON.parse(token).access;
    try {
      const response = await fetch(
        "https://www.backend.lnb-intranet.globalitnet.org/documents/download/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ document_id: id }),
        }
      );
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `document_${id}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur lors du téléchargement du document:", error);
      setError(error instanceof Error ? error.message : "Une erreur est survenue");
    }
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      const token = Cookies.get("authTokens");
      if (!token) {
        console.error("Token d'accès introuvable");
        setError("Non authentifié");
        return;
      }
      const accessToken = JSON.parse(token).access;
      try {
        const response = await fetch(
          "https://www.backend.lnb-intranet.globalitnet.org/documents/lists_docs/",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const data = await response.json();
        setDocuments(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des documents:", error);
        setError(error instanceof Error ? error.message : "Une erreur est survenue");
      }
    };
    fetchDocuments();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await fetchUserProfile();
        console.log("Données utilisateur :", userData);

        if (userData && userData.utilisateur.id) {
          // Ajout d'un commentaire expliquant pourquoi le bloc est vide
          // ou suppression du bloc if s'il n'est pas nécessaire
          console.log("ID utilisateur récupéré:", userData.utilisateur.id);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du profil utilisateur :", error);
      }
    };

    fetchData();
  }, [setUserId]);

  const handleEditDocument = async (updatedData: typeof formData) => {
    if (selectedDocuments.length !== 1) return;
    const docId = selectedDocuments[0];
    const token = Cookies.get("authTokens");
    if (!token) {
      console.error("Token d'accès introuvable");
      setError("Non authentifié");
      return;
    }
    const accessToken = JSON.parse(token).access;
    try {
      const response = await fetch(
        `https://www.backend.lnb-intranet.globalitnet.org/documents/doc_update/${docId}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(updatedData),
        }
      );
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      setDocuments((prevDocs) =>
        prevDocs.map((doc) =>
          doc.id === docId ? { ...doc, ...updatedData } : doc
        )
      );
      setNotification({ type: "success", message: `Document "${updatedData.title}" modifié avec succès` });
    } catch (error) {
      console.error("Erreur lors de la modification du document:", error);
      setNotification({ type: "error", message: "Impossible de modifier le document" });
    }
    setShowEditModal(false);
    setSelectedDocuments([]);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDeleteDocuments = async () => {
    if (selectedDocuments.length === 0) return;
    const token = Cookies.get("authTokens");
    if (!token) {
      console.error("Token d'accès introuvable");
      setError("Non authentifié");
      return;
    }
    const accessToken = JSON.parse(token).access;
    let allSucceeded = true;
    const deletedTitles: string[] = [];
    for (const docId of selectedDocuments) {
      try {
        const response = await fetch(
          `https://www.backend.lnb-intranet.globalitnet.org/documents/doc_delete/${docId}/`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (!response.ok) {
          allSucceeded = false;
          continue;
        }
        const doc = documents.find((d) => d.id === docId);
        if (doc) deletedTitles.push(doc.title);
      } catch (error) {
        console.error("Erreur lors de la suppression du document:", error);
        allSucceeded = false;
      }
    }
    setDocuments((prevDocs) =>
      prevDocs.filter((doc) => !selectedDocuments.includes(doc.id))
    );
    if (allSucceeded) {
      const msg = deletedTitles.length === 1
        ? `Document "${deletedTitles[0]}" supprimé avec succès`
        : `Documents supprimés avec succès`;
      setNotification({ type: "success", message: msg });
    } else {
      setNotification({ type: "error", message: "Erreur lors de la suppression de certains documents" });
    }
    setSelectedDocuments([]);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    // Pour l'exemple, on log juste les données
    console.log("Nouveau document:", formData);
    setShowAddModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="w-full max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        {/* Barre d'actions */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Documents
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Ajouter un document
            </button>
            
            {selectedDocuments.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  disabled={selectedDocuments.length !== 1}
                  className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors
                    ${selectedDocuments.length === 1 
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                  <PencilIcon className="w-5 h-5 mr-2" />
                  Modifier
                </button>
                
                <button
                  onClick={handleDeleteDocuments}
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <TrashBinIcon className="w-5 h-5 mr-2" />
                  Supprimer ({selectedDocuments.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal d'ajout */}
        {showAddModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Ajouter un nouveau document</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleAddDocument} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Titre du document
                  </label>
                  <input
                    type="text"
                    name="title"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Fichier
                  </label>
                  <input
                    type="file"
                    name="file"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Ajouter
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 text-white bg-red-600 rounded-md text-center">
            {error}
          </div>
        )}
        {notification && (
          <div
            className={`mb-4 p-4 rounded-md text-center ${
              notification.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
            }`}
          >
            {notification.message}
          </div>
        )}

        <div className="mb-4 flex gap-2">
          {selectedDocuments.length > 0 && (
            <>
              <Button
                onClick={handleDeleteDocuments}
                className="flex items-center gap-2"
              >
                Supprimer les documents sélectionnés ({selectedDocuments.length})
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowEditModal(true)}
                disabled={selectedDocuments.length !== 1}
              >
                Modifier le document sélectionné
              </Button>
            </>
          )}
        </div>

        {showEditModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-md w-96">
              <h2 className="text-lg font-bold mb-4">Modifier le document</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEditDocument(formData);
                }}
              >
                <input
                  type="text"
                  placeholder="Titre"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full p-2 mb-2 border rounded"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full p-2 mb-2 border rounded"
                  required
                />
                <input
                  type="text"
                  placeholder="Type de fichier (ex. pdf, docx)"
                  value={formData.file_type}
                  onChange={(e) =>
                    setFormData({ ...formData, file_type: e.target.value })
                  }
                  className="w-full p-2 mb-4 border rounded"
                  required
                />
                <div className="flex justify-end gap-2">
                  <Button type="submit" size="sm">
                    Valider
                  </Button>
                  <Button
                    type="button" // Utilisez 'type' au lieu de 'htmlType'
                    size="sm"
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <Table className="w-full">
            <TableHeader className="bg-gray-100 dark:bg-gray-700">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-sm font-medium text-gray-500">
                  Sélectionner
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-sm font-medium text-gray-500">
                  ID
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-sm font-medium text-gray-500">
                  Titre
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-sm font-medium text-gray-500">
                  Description
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-sm font-medium text-gray-500">
                  Type de fichier
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-sm font-medium text-gray-500">
                  Date de création
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-sm font-medium text-gray-500">
                  Télécharger
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
              {documents.map((document) => {
                const Icon = fileTypeIcons[document.file_type] ?? FaFilePdf;
                return (
                  <TableRow
                    key={document.id}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300 cursor-pointer"
                  >
                    <TableCell className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={isDocumentSelected(document.id)}
                        onChange={() => handleSelectDocument(document.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-700">
                      {document.id}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-700">
                      <div
                        className="max-w-[150px] truncate flex items-center gap-2"
                        title={document.title}
                      >
                        <Icon /> {/* Utilisation de l'icône ici */}
                        <span
                          onClick={() => router.push(`/applications/${document.id}`)}
                          className="cursor-pointer"
                        >
                          {document.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-700">
                      <div className="max-w-[250px] truncate" title={document.description}>
                        {document.description}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Badge size="sm" color="info">
                          {document.file_type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-700">
                      {new Date(document.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadDocument(document.id)}
                      >
                        Télécharger
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
