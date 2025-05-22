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
import { FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaShare } from "react-icons/fa";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation"; // Assurez-vous d'importer useRouter
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons"; // Ensure these icons exist

// Ajouter les types de documents supportés
const DOCUMENT_TYPES = [
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "Word (DOCX)" },
  { value: "doc", label: "Word (DOC)" },
  { value: "xlsx", label: "Excel (XLSX)" },
  { value: "xls", label: "Excel (XLS)" },
  { value: "pptx", label: "PowerPoint (PPTX)" },
  { value: "ppt", label: "PowerPoint (PPT)" },
  { value: "txt", label: "Texte (TXT)" },
  { value: "other", label: "Autre format" }
];

// Modifier l'interface Document pour refléter tous les champs du backend
interface Document {
  id: number;
  title: string;
  description: string;
  file_type: string;
  file: string;
  uploaded_by_id: number; // Corriger le nom du champ pour correspondre aux données réelles
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

// Ajouter ces interfaces pour le partage de document
interface ShareDocumentForm {
  shared_with_type: 'user' | 'department' | 'service' | 'role';
  shared_with_id: number;
  permissions: 'read' | 'edit' | 'full'; // Définir les types de permissions possibles
}

// Modifions d'abord l'interface User pour mieux refléter la structure réelle des données
interface User {
  id: number;
  username: string;
  email?: string;
  nom?: string;
  prenom?: string;
  full_name?: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    file: File | null;
    file_type: string; // Ajouter le type de document
  }>({
    title: "",
    description: "",
    file: null,
    file_type: ""
  });
  const [userId, setUserId] = useState<number | null>(null); // Garder userId
  const router = useRouter(); // Utilisez useRouter pour la navigation

  // États pour le partage de document
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareFormData, setShareFormData] = useState<ShareDocumentForm>({
    shared_with_type: 'user',
    shared_with_id: 0,
    permissions: 'read'
  });

  // Ajouter des états pour suivre les opérations en cours
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [isSharingDocument, setIsSharingDocument] = useState(false);
  const [_isDeletingDocuments, setIsDeletingDocuments] = useState(false);

  // Ajouter un état pour la liste des utilisateurs
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

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

  // Améliorer la fonction fetchDocuments avec des logs détaillés
  const fetchDocuments = async () => {
    const token = Cookies.get("authTokens");
    if (!token) {
      console.error("Token d'accès introuvable");
      setError("Non authentifié");
      return;
    }
    const accessToken = JSON.parse(token).access;
    try {
      console.log("Tentative de récupération des documents...");
      
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
      
      console.log("Statut de la réponse:", response.status);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Documents récupérés (brut):", data);
      console.log("Nombre de documents récupérés:", Array.isArray(data) ? data.length : "Non disponible (pas un tableau)");
      console.log("Structure du premier document:", Array.isArray(data) && data.length > 0 ? data[0] : "Aucun document");
      
      setDocuments(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des documents:", error);
      setError(error instanceof Error ? error.message : "Une erreur est survenue");
    }
  };

  // useEffect for fetching user profile
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await fetchUserProfile();
        console.log("Données utilisateur :", userData);

        if (userData && userData.utilisateur.id) {
          setUserId(userData.utilisateur.id); // Stocker l'ID utilisateur
          console.log("ID utilisateur récupéré:", userData.utilisateur.id);
        } else {
          setError("Impossible de récupérer l'ID utilisateur.");
        }
      } catch (error) {
        setError("Erreur lors de la récupération du profil utilisateur.");
        console.error("Erreur lors de la récupération du profil utilisateur :", error);
      }
    };

    fetchData();
  }, []); // Dépendance vide pour exécuter une seule fois

  // Fonction d'ajout de document avec indicateur de chargement
  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !userId) {
      setNotification({ type: "error", message: "Veuillez sélectionner un fichier et vous assurer d'être connecté." });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    setIsAddingDocument(true);
    const token = Cookies.get("authTokens");
    if (!token) {
      setError("Non authentifié");
      setIsAddingDocument(false);
      return;
    }
    const accessToken = JSON.parse(token).access;

    // Créer un objet FormData
    const dataToSend = new FormData();
    dataToSend.append("title", formData.title);
    dataToSend.append("description", formData.description);
    dataToSend.append("file", formData.file);
    dataToSend.append("user_id", userId.toString());
    
    // Utiliser le type sélectionné par l'utilisateur ou déduire de l'extension
    if (formData.file_type) {
      dataToSend.append("file_type", formData.file_type);
    } else {
      const fileExtension = formData.file.name.split('.').pop()?.toLowerCase() || '';
      if (fileExtension) {
        dataToSend.append("file_type", fileExtension);
      }
    }

    try {
      const response = await fetch(
        "https://www.backend.lnb-intranet.globalitnet.org/documents/create_docs/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: dataToSend,
        }
      );

      if (!response.ok) {
        const responseText = await response.text();
        let errorMsg = `Erreur HTTP: ${response.status}`;
        
        try {
          const errorData = JSON.parse(responseText);
          errorMsg = errorData.detail || errorData.message || JSON.stringify(errorData);
        } catch {
          console.warn("Réponse non-JSON:", responseText.substring(0, 100) + "...");
          errorMsg = responseText.includes('<!DOCTYPE') 
            ? `Page non trouvée (404) - L'endpoint n'existe pas ou URL incorrecte` 
            : responseText || errorMsg;
        }
        
        throw new Error(errorMsg);
      }

      const newDocument = await response.json();
      
      setDocuments((prevDocs) => [...prevDocs, newDocument]);
      setNotification({ type: "success", message: `Document "${newDocument.title}" ajouté avec succès` });
      
      setFormData({ title: "", description: "", file: null, file_type: "" });
      setShowAddModal(false);
      
    } catch (error) {
      console.error("Erreur lors de l'ajout du document:", error);
      setNotification({ 
        type: "error", 
        message: `Impossible d'ajouter le document: ${error instanceof Error ? error.message : 'Erreur inconnue'}` 
      });
    } finally {
      setIsAddingDocument(false); // Désactiver l'indicateur de chargement
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Fonction pour partager un document
  const handleShareDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedDocuments.length !== 1) {
      setNotification({ type: "error", message: "Veuillez sélectionner un seul document à partager" });
      setTimeout(() => setNotification(null), 4000);
      return;
    }
    
    setIsSharingDocument(true); // Activer l'indicateur de chargement
    
    const docId = selectedDocuments[0];
    const token = Cookies.get("authTokens");
    if (!token) {
      setError("Non authentifié");
      setIsSharingDocument(false); // Désactiver l'indicateur de chargement
      return;
    }
    const accessToken = JSON.parse(token).access;
    
    try {
      const response = await fetch(
        `https://www.backend.lnb-intranet.globalitnet.org/documents/doc_share/${docId}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(shareFormData),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Erreur HTTP: ${response.status}`);
      }
      
      setNotification({ 
        type: "success", 
        message: `Document partagé avec succès` 
      });
      setShowShareModal(false);
      
    } catch (error) {
      console.error("Erreur lors du partage du document:", error);
      setNotification({ 
        type: "error", 
        message: `Impossible de partager le document: ${error instanceof Error ? error.message : 'Erreur inconnue'}` 
      });
    } finally {
      setIsSharingDocument(false); // Désactiver l'indicateur de chargement
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Fonction pour supprimer les documents sélectionnés
  const handleDeleteDocuments = async () => {
    if (selectedDocuments.length === 0) {
      setNotification({ type: "error", message: "Veuillez sélectionner au moins un document à supprimer." });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    const token = Cookies.get("authTokens");
    if (!token) {
      setError("Non authentifié");
      return;
    }
    const accessToken = JSON.parse(token).access;

    // Confirmation avant suppression (optionnel mais recommandé)
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedDocuments.length} document(s) ? Cette action est irréversible.`)) {
      return;
    }

    setIsDeletingDocuments(true); // Activer l'indicateur de chargement

    try {
      // L'API semble attendre un ID unique pour la suppression, ou une liste d'IDs dans le corps.
      // S'il faut supprimer un par un :
      /*
      for (const docId of selectedDocuments) {
        const response = await fetch(
          `https://www.backend.lnb-intranet.globalitnet.org/documents/doc_delete/${docId}/`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: `Erreur HTTP: ${response.status}` }));
          throw new Error(`Impossible de supprimer le document ${docId}: ${errorData.detail || response.statusText}`);
        }
      }
      */

      // Si l'API supporte la suppression en masse (plus efficace) :
      // Adapter l'URL et le corps si nécessaire selon la spécification de l'API
      const response = await fetch(
        `https://www.backend.lnb-intranet.globalitnet.org/documents/doc_delete_bulk/`, // URL hypothétique pour suppression en masse
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ document_ids: selectedDocuments }), // Envoyer les IDs dans le corps
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Erreur HTTP: ${response.status}` }));
        throw new Error(`Erreur lors de la suppression: ${errorData.detail || response.statusText}`);
      }

      // Mettre à jour l'état local après suppression réussie
      setDocuments((prevDocs) =>
        prevDocs.filter((doc) => !selectedDocuments.includes(doc.id))
      );
      setSelectedDocuments([]); // Vider la sélection
      setNotification({ type: "success", message: `${selectedDocuments.length} document(s) supprimé(s) avec succès.` });

    } catch (error) {
      console.error("Erreur lors de la suppression des documents:", error);
      setNotification({
        type: "error",
        message: `Impossible de supprimer les documents: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    } finally {
      setIsDeletingDocuments(false); // Désactiver l'indicateur de chargement
      setTimeout(() => setNotification(null), 4000);
    }
  };


  // Améliorer la fonction de modification pour utiliser le format JSON attendu par l'API
  const handleEditDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedDocuments.length !== 1) return;
    const docId = selectedDocuments[0];
    const token = Cookies.get("authTokens");
    if (!token) {
      console.error("Token d'accès introuvable");
      setError("Non authentifié");
      return;
    }
    
    setIsEditingDocument(true); // Activer l'indicateur de chargement
    const accessToken = JSON.parse(token).access;
    
    try {
      // Si un fichier est sélectionné, nous devrons d'abord l'uploader séparément
      // car l'API doc_update semble attendre des données JSON
      const fileUrl = null;
      
      if (formData.file) {
        // Log pour débogage
        console.log("Fichier sélectionné pour modification:", formData.file.name);
        
        // Vous devrez implémenter cette partie si l'API a besoin d'un upload séparé
        // pour les fichiers avant la mise à jour du document
        const fileFormData = new FormData();
        fileFormData.append("file", formData.file);
        
        // Exemple d'endpoint d'upload de fichier (à adapter selon votre API)
        // const fileUploadResponse = await fetch("URL_UPLOAD_FICHIER", {...});
        // fileUrl = await fileUploadResponse.json().file_url;
      }
      
      // Préparer le payload JSON comme indiqué dans le curl
      const updatePayload = {
        "title": formData.title,
        "description": formData.description,
        "file_type": formData.file_type || "",
        "file": fileUrl || "", // Si un nouveau fichier a été uploadé
        "uploaded_by": userId || 0
      };
      
      console.log("Payload de mise à jour:", updatePayload);
      
      const response = await fetch(
        `https://www.backend.lnb-intranet.globalitnet.org/documents/doc_update/${docId}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json", // Important: utiliser JSON
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify(updatePayload),
        }
      );
      
      console.log("Statut de la réponse de mise à jour:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Texte d'erreur:", errorText);
        
        let errorMsg = `Erreur HTTP: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMsg = errorData.detail || errorData.message || JSON.stringify(errorData);
        } catch {
          errorMsg = errorText || errorMsg;
        }
        
        throw new Error(errorMsg);
      }
      
      const updatedDocument = await response.json();
      console.log("Document mis à jour avec succès:", updatedDocument);
      
      // Mettre à jour l'état local
      setDocuments((prevDocs) =>
        prevDocs.map((doc) =>
          doc.id === docId ? updatedDocument : doc
        )
      );
      
      setNotification({ type: "success", message: `Document "${updatedDocument.title}" modifié avec succès` });
      setShowEditModal(false);
      setFormData({ title: "", description: "", file: null, file_type: "" });
      setSelectedDocuments([]);
      
    } catch (error) {
      console.error("Erreur lors de la modification du document:", error);
      setNotification({ 
        type: "error", 
        message: `Impossible de modifier le document: ${error instanceof Error ? error.message : 'Erreur inconnue'}` 
      });
    } finally {
      setIsEditingDocument(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Ajouter une fonction utilitaire pour chercher un utilisateur par ID
  const _getUserById = (userId: number, usersList: User[]): User | undefined => {
    if (!Array.isArray(usersList)) return undefined;
    return usersList.find(user => user.id === userId);
  };

  // Optimiser la fonction fetchUsers
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      console.log("Tentative de récupération des utilisateurs...");
      
      const token = Cookies.get("authTokens");
      if (!token) {
        setError("Non authentifié");
        return;
      }
      const accessToken = JSON.parse(token).access;
      
      const response = await fetch(
        "https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/list-all-users/",
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
      console.log("Données utilisateurs reçues:", data);
      
      // La structure semble être { utilisateurs: Array(13) }
      if (data && data.utilisateurs && Array.isArray(data.utilisateurs)) {
        setUsers(data.utilisateurs);
      } else {
        setUsers([]); // Fallback si la structure attendue n'est pas présente
      }
      
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Charger les utilisateurs au démarrage
  // Charger les documents et les utilisateurs au démarrage
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchDocuments(), fetchUsers()]);
    };
    
    loadData();
  }, []);

  // Fonction pour ouvrir la modal de partage
  const openShareModal = () => {
    console.log("Ouverture de la modal de partage");
    console.log("État actuel des utilisateurs:", users);
    console.log("Nombre d'utilisateurs disponibles:", Array.isArray(users) ? users.length : "Non disponible");
    
    if (!Array.isArray(users) || users.length === 0) {
      console.log("Rafraîchissement de la liste des utilisateurs...");
      fetchUsers(); // Rafraîchir la liste des utilisateurs si vide
    }
    
    setShowShareModal(true);
  };

  const renderTableBody = () => (
    <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
      {documents.map((document) => {
        const Icon = fileTypeIcons[document.file_type] ?? FaFilePdf;
        
        // Déterminer la référence à afficher
        let referenceText = "";
        
        // Vérifier si le document a été créé par l'utilisateur connecté
        if (document.uploaded_by_id === userId) {
          referenceText = "Créé par vous";
        } else {
          // Chercher les informations de l'utilisateur qui a créé le document
          const creator = users.length > 0 && Array.isArray(users) 
            ? users.find(user => user.id === document.uploaded_by_id) 
            : undefined;
            
          if (creator && creator.nom && creator.prenom) {
            referenceText = `Reçu de: ${creator.nom} ${creator.prenom}`;
          } else {
            // Fallback si on ne trouve pas l'utilisateur ou s'il manque nom/prénom
            referenceText = `Reçu de: Utilisateur #${document.uploaded_by_id}`;
          }
        }
        
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
              <div
                className="max-w-[150px] truncate flex items-center gap-2"
                title={document.title}
              >
                <Icon />
                <span
                  onClick={() => router.push(`/mediatechDocs/view/${document.id}`)}
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
              {referenceText}
            </TableCell>
            <TableCell className="px-5 py-4 text-sm text-gray-700">
              {new Date(document.created_at).toLocaleString()}
            </TableCell>
            <TableCell className="px-5 py-4 text-sm text-gray-700">
              {new Date(document.updated_at).toLocaleString()}
            </TableCell>
            <TableCell className="px-5 py-4">
              <div className="flex space-x-2">
                {/* Vérifier si le document a été créé par l'utilisateur connecté */}
                {document.uploaded_by_id === userId ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadDocument(document.id)}
                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                  >
                    Télécharger
                  </Button>
                ) : (
                  <div className="flex flex-col">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadDocument(document.id)}
                      className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 mb-1"
                    >
                      Télécharger
                    </Button>
                    <span className="text-xs text-amber-600 italic">
                      Pour le moment, aucune autre action n&apos;est possible sur les documents reçus
                    </span>
                  </div>
                )}
              </div>
            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
  );

  // Remplacez le code où le bouton "Modifier" est cliqué par cette fonction
  const handleEditButtonClick = () => {
    if (selectedDocuments.length !== 1) return;
    
    // Trouver le document sélectionné
    const selectedDoc = documents.find(doc => doc.id === selectedDocuments[0]);
    
    if (selectedDoc) {
      // Pré-remplir le formulaire avec les données existantes
      setFormData({
        title: selectedDoc.title || "",
        description: selectedDoc.description || "",
        file: null, // On ne peut pas récupérer le fichier existant sous forme de File
        file_type: selectedDoc.file_type || ""
      });
      
      console.log("Chargement des données pour édition:", selectedDoc);
      
      // Ouvrir la modal d'édition
      setShowEditModal(true);
    } else {
      setNotification({
        type: "error",
        message: "Impossible de trouver le document sélectionné"
      });
      setTimeout(() => setNotification(null), 4000);
    }
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
                  onClick={handleEditButtonClick}
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
                  <label htmlFor="add-title" className="block text-sm font-medium mb-1">
                    Titre du document <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="add-title"
                    type="text"
                    name="title"
                    value={formData.title} // Lier à l'état
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })} // Mettre à jour l'état
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="add-description" className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    id="add-description"
                    name="description"
                    rows={3}
                    value={formData.description} // Lier à l'état
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} // Mettre à jour l'état
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    // required // La description n'est pas marquée comme requise dans l'API
                  />
                </div>
                <div>
                  <label htmlFor="add-file" className="block text-sm font-medium mb-1">
                    Fichier <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="add-file"
                    type="file"
                    name="file"
                    onChange={(e) => setFormData({ ...formData, file: e.target.files ? e.target.files[0] : null })} // Mettre à jour l'état avec le fichier
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required
                  />
                   {/* Afficher le nom du fichier sélectionné */}
                   {formData.file && (
                    <p className="text-xs text-gray-500 mt-1">Fichier sélectionné : {formData.file.name}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="add-file-type" className="block text-sm font-medium mb-1">
                    Type de document <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="add-file-type"
                    value={formData.file_type}
                    onChange={(e) => setFormData({ ...formData, file_type: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    required
                  >
                    <option value="">Sélectionner un type</option>
                    {DOCUMENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Si non spécifié, le type sera détecté à partir de l&apos;extension du fichier.
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                        setShowAddModal(false);
                        setFormData({ title: "", description: "", file: null, file_type: "" }); // Réinitialiser en annulant
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
                    disabled={!formData.file || !formData.title || isAddingDocument}
                  >
                    {isAddingDocument ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        En cours de traitement...
                      </>
                    ) : "Ajouter"}
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
                onClick={handleEditButtonClick}
                disabled={selectedDocuments.length !== 1}
              >
                Modifier le document sélectionné
              </Button>
            </>
          )}
        </div>

        {/* Bouton Partager */}
        {selectedDocuments.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={openShareModal}
              disabled={selectedDocuments.length !== 1}
              className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors
                ${selectedDocuments.length === 1 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              <FaShare className="w-5 h-5 mr-2" />
              Partager
            </button>
          </div>
        )}

        {/* Modal de partage simplifiée avec liste d'utilisateurs */}
        {showShareModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Partager le document avec un utilisateur</h2>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleShareDocument} className="space-y-4">
                <div>
                  <label htmlFor="shared-with-user" className="block text-sm font-medium mb-1">
                    Sélectionner un utilisateur <span className="text-red-500">*</span>
                  </label>
                  {isLoadingUsers ? (
                    <div className="flex items-center justify-center p-4">
                      <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="ml-2">Chargement des utilisateurs...</span>
                    </div>
                  ) : (
                    <select
                      id="shared-with-user"
                      value={shareFormData.shared_with_id || ''}
                      onChange={(e) => setShareFormData({
                        ...shareFormData,
                        shared_with_type: "user",
                        shared_with_id: parseInt(e.target.value) || 0
                      })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                      required
                    >
                      <option value="">Sélectionner un utilisateur</option>
                      {users.map(user => {
                        // Créer un nom d'affichage complet avec le nom et prénom s'ils sont disponibles
                        const displayName = user.nom && user.prenom 
                          ? `${user.nom} ${user.prenom}`
                          : user.full_name || user.username;
                          
                        return (
                          <option key={user.id} value={user.id}>
                            {displayName} {user.email ? `(${user.email})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  )}
                  {users.length === 0 && !isLoadingUsers && (
                    <p className="text-xs text-red-500 mt-1">
                      Aucun utilisateur disponible. Veuillez réessayer.
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="permissions" className="block text-sm font-medium mb-1">
                    Permissions <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="permissions"
                    value={shareFormData.permissions}
                    onChange={(e) => setShareFormData({
                      ...shareFormData, 
                      permissions: e.target.value as ShareDocumentForm['permissions']
                    })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    required
                  >
                    <option value="read">Lecture seule</option>
                    <option value="edit">Modification</option>
                    <option value="full">Contrôle total</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowShareModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
                    disabled={isSharingDocument || !shareFormData.shared_with_id}
                  >
                    {isSharingDocument ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        En cours de traitement...
                      </>
                    ) : "Partager"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal d'édition */}
        {showEditModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Modifier le document</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleEditDocument} className="space-y-4">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium mb-1">
                    Titre du document <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="edit-file" className="block text-sm font-medium mb-1">
                    Remplacer le fichier (optionnel)
                  </label>
                  <input
                    id="edit-file"
                    type="file"
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      file: e.target.files ? e.target.files[0] : null 
                    })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {formData.file && (
                    <p className="text-xs text-gray-500 mt-1">Nouveau fichier : {formData.file.name}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="add-file-type" className="block text-sm font-medium mb-1">
                    Type de document <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="add-file-type"
                    value={formData.file_type}
                    onChange={(e) => setFormData({ ...formData, file_type: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    required
                  >
                    <option value="">Sélectionner un type</option>
                    {DOCUMENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Si non spécifié, le type sera détecté à partir de l&apos;extension du fichier.
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setFormData({ title: "", description: "", file: null, file_type: "" });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg flex items-center"
                    disabled={!formData.title || isEditingDocument}
                  >
                    {isEditingDocument ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        En cours de traitement...
                      </>
                    ) : "Mettre à jour"}
                  </button>
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
                  Titre
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-sm font-medium text-gray-500">
                  Description
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-sm font-medium text-gray-500">
                  Type de fichier
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-sm font-medium text-gray-500">
                  Référence
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-sm font-medium text-gray-500">
                  Date de création
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-sm font-medium text-gray-500">
                  Dernière modification
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-sm font-medium text-gray-500">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            {renderTableBody()}
          </Table>
        </div>
      </div>
    </div>
  );
}
